import { createHash } from "crypto"
import { readdirSync, writeFileSync } from "fs"
import * as matter from "gray-matter"
import fetch from "node-fetch"
import { basename, extname, join } from "path"
import slugify from "slugify"
import { info, warn } from "winston"
import { gzipSync } from "zlib"
import { ImportableRecipe } from "./ImportableRecipe"
import { MarkdownRecipe } from "./MarkdownRecipe"
import { PaprikaApi } from "./PaprikaApi"
import { Recipe } from "./Recipe"
import { pairWise } from "./Util"
import { duration, DurationInputObject } from "moment"
import _ from "lodash"

export class PaprikaExporter {
    private readonly api: PaprikaApi
    private readonly markdownTargetDirectory: string
    private readonly importableTargetDirectory: string

    constructor(api: PaprikaApi, markdownTargetDirectory: string, importableTargetDirectory: string) {
        this.api = api
        this.markdownTargetDirectory = markdownTargetDirectory
        this.importableTargetDirectory = importableTargetDirectory
    }

    async export(skipCacheCheck: boolean) {
        info(`Reading existing recipes from ${this.markdownTargetDirectory}`)
        const existingRecipes = this.readExistingRecipes(this.markdownTargetDirectory)

        info("Fetching recipe list from Paprika API")
        const recipeList = await this.api.getRecipesList()

        info("Fetching recipe categories from Paprika API")
        const categories = await this.api.getCategories()

        let recipesNeedingUpdate: string[]

        if (skipCacheCheck) {
            recipesNeedingUpdate = recipeList.map(rle => rle.uid)
        } else {
            info("Computing list of recipes needing update")
            recipesNeedingUpdate = recipeList.filter(rle => {
                const { uid, hash } = rle
                const recipe = existingRecipes.get(uid)

                return !recipe || hash != recipe.hash
            }).map(rle => rle.uid)

            info(`Found ${recipesNeedingUpdate.length} recipes needing update`)
            if (recipesNeedingUpdate.length === 0) {
                return
            }
        }

        for (const recipeNeedingUpdate of recipesNeedingUpdate) {
            const existingRecipe = existingRecipes.get(recipeNeedingUpdate)
            if (existingRecipe) {
                info(`Recipe "${existingRecipe.name}" needs update`)
            } else {
                info(`New recipe with ID ${recipeNeedingUpdate}`)
            }
        }

        info(`Fetching recipes that need update`)
        const recipesToUpdate = await Promise.all(recipesNeedingUpdate.map(this.api.getRecipe.bind(this.api)))

        info(`Updating recipe categories`)
        for (const recipe of recipesToUpdate) {
            recipe.categories = recipe.categories.map(cat => categories[cat])
        }

        info(`Writing recipe Markdown`)
        for (const recipe of recipesToUpdate) {
            await this.writeRecipe(this.markdownTargetDirectory, recipe)
        }

        info(`Writing .paprikarecipe file`)
        for (const recipe of recipesToUpdate) {
            await this.writePaprikaRecipeFile(this.importableTargetDirectory, recipe)
        }
    }

    private async writePaprikaRecipeFile(importableTargetDirectory: string, recipe: Recipe) {
        const recipeBasename = basename(recipe.name)
        const paprikaRecipePath = join(importableTargetDirectory, `${recipeBasename}.paprikarecipe`)

        let photoData: string | undefined
        let photoHash: string | undefined

        if (recipe.image_url && recipe.image_url.trim()) {
            try {
                photoData = (await (await fetch(recipe.image_url)).blob()).toString("base64")
                photoHash = createHash("sha256").update(Buffer.from(photoData, "base64")).digest().toString("hex").toUpperCase()
            } catch (e) {
                if (e instanceof Error) {
                    warn('Failed to download photo data for recipe', {
                        stack: e.stack,
                        message: e.message
                    })
                } else [
                    warn('Something went wrong, but could not find error', { error: e })
                ]
            }
        }

        info(`Writing importable recipe ${recipe.name} to ${paprikaRecipePath}`)
        const importableRecipe: ImportableRecipe = {
            photos: [],
            photo_large: null,
            created: recipe.created,
            categories: recipe.categories,
            cook_time: recipe.cook_time,
            description: recipe.description,
            difficulty: recipe.difficulty,
            directions: recipe.directions,
            hash: recipe.hash,
            image_url: recipe.image_url,
            ingredients: recipe.ingredients,
            name: recipe.name,
            notes: recipe.notes,
            nutritional_info: recipe.nutritional_info,
            prep_time: recipe.prep_time,
            rating: recipe.rating,
            servings: recipe.servings,
            source: recipe.source,
            source_url: recipe.source_url,
            total_time: recipe.total_time,
            uid: recipe.uid,
            photo: recipe.photo_url && recipe.photo_url.trim() ? basename(recipe.photo_url) : undefined,
            photo_data: photoData,
            photo_hash: photoHash
        }


        const content = JSON.stringify(importableRecipe)
        const gzip = gzipSync(content, { level: 9 })

        writeFileSync(paprikaRecipePath, gzip)
    }

    private getISO8601Duration(durationString: string) {
        if (!durationString && !durationString.trim()) {
            return undefined
        }

        // Parse the duration.
        const pieces = pairWise(durationString.split(" "));
        let durationValues: any = {}
        for (const piece of pieces) {
            durationValues[piece[1]] = piece[0]
        }
        const dur = duration(<DurationInputObject>durationValues)

        return dur.isValid() ? dur.toISOString() : undefined
    }

    private async writeRecipe(markdownTargetDirectory: string, recipe: Recipe) {
        const recipePath = join(markdownTargetDirectory, `${slugify(recipe.name, { lower: true, strict: true })}.md`)

        info(`Writing recipe ${recipe.name} to ${recipePath}`)
        const frontmatter: MarkdownRecipe = {
            layout: "recipe",
            uid: recipe.uid,
            hash: recipe.hash,
            name: recipe.name,
            image_url: recipe.image_url,
            ingredients: recipe.ingredients.split(/\n+/),
            servings: recipe.servings,
            nutritional_info: recipe.nutritional_info,
            cook_time: recipe.cook_time,
            iso_cook_time: this.getISO8601Duration(recipe.cook_time),
            prep_time: recipe.prep_time,
            iso_prep_time: this.getISO8601Duration(recipe.prep_time),
            total_time: recipe.total_time,
            iso_total_time: this.getISO8601Duration(recipe.total_time),
            source_url: recipe.source_url,
            difficulty: <"Easy"|"Medium"|"Hard">recipe.difficulty,
            rating: recipe.rating,
            tags: recipe.categories,
            description: recipe.description.trim()
        }

        const { directions, notes } = recipe
        let content = ""

        content += `## Directions

${directions}
        `.trimEnd()

        if (notes && notes.trim()) {
            content += `
## Notes

${notes}
            `.trimEnd()
        }

        content = matter.stringify(content, _(frontmatter).omitBy(_.isNil).value())
        writeFileSync(recipePath, content)
    }

    private readExistingRecipes(markdownTargetDirectory: string): Map<string, MarkdownRecipe> {
        const map = new Map<string, MarkdownRecipe>()
        const recipeFiles = readdirSync(markdownTargetDirectory).filter(val => extname(val) == ".md").map(val => join(markdownTargetDirectory, val))

        for (const recipeFile of recipeFiles) {
            const recipe = <MarkdownRecipe>matter.read(recipeFile).data
            map.set(recipe.uid, recipe)
        }

        return map
    }
}