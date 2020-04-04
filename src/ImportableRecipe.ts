export interface ImportableRecipe {
    photos: any[];
    created: string;
    photo_large: string | null;
    notes: string;
    cook_time: string;
    photo_data?: string; // Base64 of downloaded photo
    hash: string;
    description: string;
    nutritional_info: string;
    photo_hash?: string;
    categories: string[];
    rating: number;
    uid: string;
    difficulty: string;
    source: string;
    source_url: string;
    image_url: string;
    directions: string;
    photo?: string;
    ingredients: string;
    prep_time: string;
    servings: string;
    total_time: string;
    name: string;
}
