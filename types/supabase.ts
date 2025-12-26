
interface Pack {
    id: string
    title: string
    genre: string
    description: string
    cover_image: string
    allow_cash: boolean
    created_at: string
}

interface Sample {
    id: string
    filename: string
    name: string
    bpm: number
    key: string
    time_signature: string
    genres: string[]
    instruments: string[]
    drum_type: string
    keywords: string[]
    category: string // Pack title
    audio_url: string
    image_url: string
    duration: string
    is_featured: boolean
    created_at: string
}
