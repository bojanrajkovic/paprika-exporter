export interface Recipe {
    uid: string
    hash: string
    name: string
    ingredients: string
    servings: string
    nutritional_info: string
    rating: number
    prep_time: string
    cook_time: string
    total_time: string
    source_url: string
    difficulty: string
    categories: string[]
    description: string
    directions: string
    notes: string
    source: string
    photo_url: string
    created: string
    image_url: string
}
