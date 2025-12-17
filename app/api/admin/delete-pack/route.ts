import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { id } = body // pack category ID

        if (!id) {
            return NextResponse.json({ error: 'Missing pack ID' }, { status: 400 })
        }

        const categoryName = decodeURIComponent(id)

        // Path to metadata.json
        const metadataPath = path.join(process.cwd(), 'public', 'audio', 'metadata.json')

        // Read existing 
        let existingData: any[] = []
        try {
            const fileContent = await fs.readFile(metadataPath, 'utf8')
            existingData = JSON.parse(fileContent)
        } catch (error) {
            return NextResponse.json({ error: 'Failed to read metadata file' }, { status: 500 })
        }

        // Filter out samples belonging to this category
        const newData = existingData.filter((sample: any) => {
            if (categoryName === 'Uncategorized') {
                // Remove entries where category is explicitly "Uncategorized" OR missing/empty
                return sample.category && sample.category !== 'Uncategorized'
            }
            return sample.category !== categoryName
        })

        // Write back
        await fs.writeFile(metadataPath, JSON.stringify(newData, null, 2))

        return NextResponse.json({ success: true, removedCount: existingData.length - newData.length })

    } catch (error) {
        console.error('Delete pack error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
