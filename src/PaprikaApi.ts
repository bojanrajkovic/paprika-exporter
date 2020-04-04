import { prompt } from "inquirer"
import fetch, { RequestInit } from "node-fetch"
import { URLSearchParams } from "url"
import { warn } from "winston"
import { Recipe } from "./Recipe"
import { RecipeList } from "./RecipeList"

export type CategoryMapping = { [key: string]: string }

export class PaprikaApi {
    private static readonly PAPRIKA_STATUS_URL: string = "https://www.paprikaapp.com/api/v2/sync/status/"
    private static readonly PAPRIKA_LOGIN_URL: string = "https://www.paprikaapp.com/api/v2/account/login/"
    private static readonly PAPRIKA_RECIPES_LIST_URL: string = "https://www.paprikaapp.com/api/v2/sync/recipes/"
    private static readonly PAPRIKA_RECIPE_URL: string = "https://www.paprikaapp.com/api/v2/sync/recipe/"
    private static readonly PAPRIKA_CATEGORIES_URL: string = "https://www.paprikaapp.com/api/v2/sync/categories/"

    readonly token: string
    private readonly fetchConfig: RequestInit

    private constructor(token: string) {
        this.token = token
        this.fetchConfig = {
            headers: {
                "Authorization": `Bearer ${token}`
            },
            compress: true
        }
    }

    async getCategories(): Promise<CategoryMapping> {
        const resp = await fetch(PaprikaApi.PAPRIKA_CATEGORIES_URL, this.fetchConfig)
        
        if (!resp.ok) {
            throw new Error(`Got ${resp.status} from Paprika API when fetching categories`)
        }

        const json = await resp.json()
        const raw = <{ uid: string, name: string }[]>json["result"]

        const mapping: CategoryMapping = {}
        raw.forEach(val => mapping[val.uid] = val.name)
        return mapping
    }

    async getRecipe(uid: string): Promise<Recipe> {
        const resp = await fetch(PaprikaApi.PAPRIKA_RECIPE_URL + uid + "/", this.fetchConfig)
        
        if (!resp.ok) {
            throw new Error(`Got ${resp.status} from Paprika API when fetching recipe`)
        }
        
        const json = await resp.json()
        return <Recipe>json["result"]
    }

    async getRecipesList(): Promise<RecipeList> {
        const resp = await fetch(PaprikaApi.PAPRIKA_RECIPES_LIST_URL, this.fetchConfig)

        if (!resp.ok) {
            throw new Error(`Got ${resp.status} from Paprika API when fetching recipes list`)
        }

        const json = await resp.json()
        return <RecipeList>json['result']
    }

    static async login(token: string): Promise<PaprikaApi> {
        const isTokenOk = await PaprikaApi.testToken(token)

        if (!isTokenOk) {
            // Don't emit the warning if the passed token is empty.
            if (token && token.trim()) {
                warn("Passed in token no longer valid, getting new token via credentials")
            }
            const { login, password } = await PaprikaApi.getPaprikaSyncLogin()
            token = await PaprikaApi.loginWithCredentials(login, password)
        }
        
        return new PaprikaApi(token)
    }

    private static async loginWithCredentials(login: string, password: string): Promise<string> {
        const resp = await fetch(this.PAPRIKA_LOGIN_URL, {
            method: "post",
            body: new URLSearchParams({
                "email": login,
                "password": password
            }),
            compress: true
        })

        if (!resp.ok) {
            throw new Error(`Got ${resp.status} from PaprikaApi API when trying to log in`)
        } else {
            const json = await resp.json()
            return <string>json['result']['token']
        }
    }

    private static async getPaprikaSyncLogin(): Promise<{ login: string, password: string }> {
        const questions = [
            {
                type: "input",
                name: "login",
                message: "PaprikaApi sync email:"
            },
            {
                type: "password",
                name: "password",
                message: "PaprikaApi sync password:",
                mask: "*"
            }
        ]
        const answers = await prompt(questions)

        return {
            login: <string>answers["login"],
            password: <string>answers["password"]
        }
    }

    private static async testToken(token: string): Promise<boolean> {
        return (await fetch(this.PAPRIKA_STATUS_URL, {
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            compress: true
        })).ok
    }
}