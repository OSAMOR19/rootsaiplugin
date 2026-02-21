import { DRUM_TYPE_OPTIONS, INSTRUMENT_OPTIONS, GENRE_OPTIONS, KEYWORD_OPTIONS, KEY_OPTIONS } from './constants'

export interface ExtractedFilters {
    loopType?: string
    instrument?: string
    genre?: string
    keyword?: string
    key?: string
    timeSignature?: string
}

/**
 * Extracts filter values from a search query string
 * Maps natural language keywords to filter options
 */
export function extractFiltersFromQuery(query: string): ExtractedFilters {
    const lowerQuery = query.toLowerCase().trim()
    const filters: ExtractedFilters = {}

    // Loop Type Mappings (renamed from Drum Type, most specific first)
    const loopTypeMap: Record<string, string> = {
        'full drum loop': 'Full Drum Loop',
        'full drum': 'Full Drum Loop',
        'full loop': 'Full Drum Loop',
        'full drums': 'Full Drum Loop',
        'complete drum': 'Full Drum Loop',
        'kick loop': 'Kick Loop',
        'kicks loop': 'Kick Loop',
        'snare loop': 'Snare Loop',
        'snares loop': 'Snare Loop',
        'hat loop': 'Hat Loop',
        'hi-hat loop': 'Hat Loop',
        'hihat loop': 'Hat Loop',
        'hats loop': 'Hat Loop',
        'percussion loop': 'Percussion Loop',
        'perc loop': 'Percussion Loop',
        'shaker loop': 'Shaker Loop',
        'shakers loop': 'Shaker Loop',
        'top loop': 'Top Loop',
        'drum fill': 'Fill',
        'fills': 'Fill',
        'fill': 'Fill',
        'one-shot': 'Drum One-Shot',
        'oneshot': 'Drum One-Shot',
        'one shot': 'Drum One-Shot',
    }

    // Check for loop type matches (longest match first)
    for (const [keyword, loopType] of Object.entries(loopTypeMap)) {
        if (lowerQuery.includes(keyword)) {
            filters.loopType = loopType
            break
        }
    }

    // African Instrument Mappings
    const instrumentMap: Record<string, string> = {
        'djembe': 'Djembe',
        'talking drum': 'Talking Drum',
        'talkingdrum': 'Talking Drum',
        'shekere': 'Shekere',
        'udu': 'Udu',
        'bata': 'Bata',
        'conga': 'Conga',
        'congas': 'Conga',
        'bongo': 'Bongo',
        'bongos': 'Bongo',
        'kpanlogo': 'Kpanlogo',
        'dunun': 'Dunun',
        'bougarabou': 'Bougarabou',
        'tama': 'Tama',
        'sabar': 'Sabar',
        'ashiko': 'Ashiko',
        'kenkeni': 'Kenkeni',
        'sangban': 'Sangban',
    }

    for (const [keyword, instrument] of Object.entries(instrumentMap)) {
        if (lowerQuery.includes(keyword) && INSTRUMENT_OPTIONS.includes(instrument)) {
            filters.instrument = instrument
            break
        }
    }

    // Genre Mappings
    const genreMap: Record<string, string> = {
        'afrobeats': 'Afrobeats',
        'afrobeat': 'Afrobeats',
        'afro': 'Afrobeats',
        'african': 'Afrobeats',
        'amapiano': 'Amapiano',
        'afrohouse': 'Afrohouse',
        'afro house': 'Afrohouse',
        'hip hop': 'Hip Hop',
        'hiphop': 'Hip Hop',
        'trap': 'Trap',
        'house': 'House',
        'tech house': 'Tech House',
        'deep house': 'Deep House',
        'drill': 'Drill',
        'r&b': 'R&B',
        'rnb': 'R&B',
        'soul': 'Soul',
        'funk': 'Funk',
        'jazz': 'Jazz',
        'pop': 'Pop',
        'electronic': 'Electronic',
        'techno': 'Techno',
        'trance': 'Trance',
        'edm': 'EDM',
        'dancehall': 'Dancehall',
        'reggae': 'Reggae',
        'world': 'World',
    }

    for (const [keyword, genre] of Object.entries(genreMap)) {
        if (lowerQuery.includes(keyword) && GENRE_OPTIONS.includes(genre)) {
            filters.genre = genre
            break
        }
    }

    // Style/Keyword Mappings
    const keywordMap: Record<string, string> = {
        'acoustic': 'Acoustic',
        'chill': 'Chill',
        'mellow': 'Chill',
        'relaxed': 'Chill',
        'calm': 'Chill',
        'epic': 'Epic',
        'energetic': 'Energetic',
        'energy': 'Energetic',
        'upbeat': 'Energetic',
        'fast': 'Energetic',
        'dynamic': 'Energetic',
        'powerful': 'Energetic',
        'experimental': 'Experimental',
        'groovy': 'Groovy',
        'groove': 'Groovy',
        'percussive': 'Percussive',
    }

    for (const [word, style] of Object.entries(keywordMap)) {
        if (lowerQuery.includes(word) && KEYWORD_OPTIONS.includes(style)) {
            filters.keyword = style
            break
        }
    }

    // Key Mappings (musical keys)
    const keyPatterns = [
        { pattern: /c\s*major|c\s*maj/i, value: 'C Major' },
        { pattern: /c\s*minor|c\s*min/i, value: 'C Minor' },
        { pattern: /c#\s*major|c#\s*maj|c\s*sharp\s*major/i, value: 'C# Major' },
        { pattern: /c#\s*minor|c#\s*min|c\s*sharp\s*minor/i, value: 'C# Minor' },
        { pattern: /d\s*major|d\s*maj/i, value: 'D Major' },
        { pattern: /d\s*minor|d\s*min/i, value: 'D Minor' },
        { pattern: /eb\s*major|eb\s*maj|e\s*flat\s*major/i, value: 'Eb Major' },
        { pattern: /eb\s*minor|eb\s*min|e\s*flat\s*minor/i, value: 'Eb Minor' },
        { pattern: /e\s*major|e\s*maj/i, value: 'E Major' },
        { pattern: /e\s*minor|e\s*min/i, value: 'E Minor' },
        { pattern: /f\s*major|f\s*maj/i, value: 'F Major' },
        { pattern: /f\s*minor|f\s*min/i, value: 'F Minor' },
        { pattern: /f#\s*major|f#\s*maj|f\s*sharp\s*major/i, value: 'F# Major' },
        { pattern: /f#\s*minor|f#\s*min|f\s*sharp\s*minor/i, value: 'F# Minor' },
        { pattern: /g\s*major|g\s*maj/i, value: 'G Major' },
        { pattern: /g\s*minor|g\s*min/i, value: 'G Minor' },
        { pattern: /ab\s*major|ab\s*maj|a\s*flat\s*major/i, value: 'Ab Major' },
        { pattern: /ab\s*minor|ab\s*min|a\s*flat\s*minor/i, value: 'Ab Minor' },
        { pattern: /a\s*major|a\s*maj/i, value: 'A Major' },
        { pattern: /a\s*minor|a\s*min/i, value: 'A Minor' },
        { pattern: /bb\s*major|bb\s*maj|b\s*flat\s*major/i, value: 'Bb Major' },
        { pattern: /bb\s*minor|bb\s*min|b\s*flat\s*minor/i, value: 'Bb Minor' },
        { pattern: /b\s*major|b\s*maj/i, value: 'B Major' },
        { pattern: /b\s*minor|b\s*min/i, value: 'B Minor' },
    ]

    for (const { pattern, value } of keyPatterns) {
        if (pattern.test(query)) {
            filters.key = value
            break
        }
    }

    // Time Signature Detection
    const timeSignaturePatterns = [
        { pattern: /4\/4|four four|common time/i, value: '4/4' },
        { pattern: /3\/4|three four|waltz time/i, value: '3/4' },
        { pattern: /6\/8|six eight/i, value: '6/8' },
        { pattern: /5\/4|five four/i, value: '5/4' },
        { pattern: /7\/8|seven eight/i, value: '7/8' },
    ]

    for (const { pattern, value } of timeSignaturePatterns) {
        if (pattern.test(query)) {
            filters.timeSignature = value
            break
        }
    }

    return filters
}

/**
 * Builds URL search params from extracted filters
 */
export function buildFilterParams(filters: ExtractedFilters, query?: string): URLSearchParams {
    const params = new URLSearchParams()

    if (query) params.set('query', query)
    if (filters.loopType) params.set('loopType', filters.loopType)
    if (filters.instrument) params.set('instrument', filters.instrument)
    if (filters.genre) params.set('genre', filters.genre)
    if (filters.keyword) params.set('keyword', filters.keyword)
    if (filters.key) params.set('key', filters.key)
    if (filters.timeSignature) params.set('timeSignature', filters.timeSignature)

    return params
}

/**
 * Shuffles an array using Fisher-Yates algorithm for dynamic result variation
 */
export function shuffleArray<T>(array: T[], seed?: number): T[] {
    const shuffled = [...array]

    // Use seed for consistent randomization if provided
    const random = seed ? seededRandom(seed) : Math.random

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    return shuffled
}

/**
 * Simple seeded random number generator
 */
function seededRandom(seed: number): () => number {
    return function () {
        seed = (seed * 9301 + 49297) % 233280
        return seed / 233280
    }
}
