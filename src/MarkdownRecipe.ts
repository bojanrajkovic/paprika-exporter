export interface MarkdownRecipe {
    layout: "recipe"
    uid: string
    hash: string
    name: string
    ingredients: string[]
    servings: string
    nutritional_info: string
    rating: number
    cook_time: string
    prep_time: string
    total_time: string
    source_url: string
    difficulty: "Easy" | "Medium" | "Hard"
    tags: string[]
}
