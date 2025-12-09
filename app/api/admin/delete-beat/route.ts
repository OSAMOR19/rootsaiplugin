import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { deleteFile } from '@/lib/r2'

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'No ID provided' },
        { status: 400 }
      )
    }

    // Read metadata
    const metadataPath = path.join(process.cwd(), 'public', 'audio', 'metadata.json')
    
    if (!existsSync(metadataPath)) {
      return NextResponse.json(
        { success: false, error: 'Metadata file not found' },
        { status: 404 }
      )
    }

    const metadataContent = await readFile(metadataPath, 'utf-8')
    const metadata = JSON.parse(metadataContent)

    // Find the entry to delete
    const entryToDelete = metadata.find((item: any) => item.id === id)
    
    if (!entryToDelete) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      )
    }

    // Check if file is stored in R2 (either has storage: 'r2' flag or URL contains r2)
    const isR2Storage = entryToDelete.storage === 'r2' || 
                        (entryToDelete.audioUrl && entryToDelete.audioUrl.includes('r2.cloudflarestorage.com'))

    if (isR2Storage) {
      // Delete from R2
      console.log('Deleting from R2:', entryToDelete.filename)
      
      // Delete audio file from R2
      if (entryToDelete.filename) {
        try {
          await deleteFile(entryToDelete.filename)
          console.log('✅ Deleted audio from R2')
        } catch (error) {
          console.error('Error deleting audio from R2:', error)
        }
      }

      // Delete image from R2 if it's stored there
      if (entryToDelete.imageUrl && entryToDelete.imageUrl.includes('r2.cloudflarestorage.com')) {
        try {
          // Extract filename from R2 URL
          const imageFileName = entryToDelete.imageUrl.split('.com/')[1]
          if (imageFileName) {
            await deleteFile(imageFileName)
            console.log('✅ Deleted image from R2')
          }
        } catch (error) {
          console.error('Error deleting image from R2:', error)
        }
      }
    } else {
      // Delete from local file system (legacy support)
      if (entryToDelete.audioUrl) {
        const audioPath = path.join(process.cwd(), 'public', entryToDelete.audioUrl)
        if (existsSync(audioPath)) {
          await unlink(audioPath)
          console.log('✅ Deleted audio from local storage')
        }
      }

      // Delete image file if it exists and it's an uploaded image
      if (entryToDelete.imageUrl && entryToDelete.imageUrl.includes('/images/uploads/')) {
        const imagePath = path.join(process.cwd(), 'public', entryToDelete.imageUrl)
        if (existsSync(imagePath)) {
          await unlink(imagePath)
          console.log('✅ Deleted image from local storage')
        }
      }
    }

    // Remove from metadata
    const updatedMetadata = metadata.filter((item: any) => item.id !== id)

    // Save updated metadata
    await writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Beat deleted successfully'
    })

  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Delete failed' },
      { status: 500 }
    )
  }
}

