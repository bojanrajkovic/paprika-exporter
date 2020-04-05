export interface MarkdownRecipe {
    layout: "recipe"
    uid: string
    hash: string
    name: string
    image_url: string
    ingredients: string[]
    servings: string
    nutritional_info: string
    rating: number
    cook_time: string
    prep_time: string
    total_time: string
    // ISO8601 durations
    iso_cook_time?: string
    iso_prep_time?: string
    iso_total_time?: string
    source_url: string
    difficulty: string
    tags: string[]
    description: string
}
