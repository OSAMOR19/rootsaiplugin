
import { supabase } from './supabase'

/**
 * Uploads a file directly to Supabase Storage and returns the public URL.
 * @param file The file to upload
 * @param path The storage path (e.g. 'packs/cover.jpg')
 * @param bucket The bucket name (default: 'audio')
 */
export async function uploadFileToSupabase(
    file: File,
    path: string,
    bucket: string = 'audio'
): Promise<string> {
    try {
        console.log(`[UploadUtils] Uploading ${file.name} to ${bucket}/${path}...`)

        const { error: uploadError } = await supabase
            .storage
            .from(bucket)
            .upload(path, file, {
                contentType: file.type || 'application/octet-stream',
                upsert: true
            })

        if (uploadError) {
            console.error(`[UploadUtils] Upload failed for ${path}. Error details:`, uploadError)
            console.error(`[UploadUtils] File info - Name: ${file.name}, Type: ${file.type}, Size: ${file.size}`)
            throw uploadError
        }

        const { data: publicUrlData } = supabase
            .storage
            .from(bucket)
            .getPublicUrl(path)

        console.log(`[UploadUtils] Upload successful: ${publicUrlData.publicUrl}`)
        return publicUrlData.publicUrl

    } catch (error) {
        console.error(`[UploadUtils] Error in uploadFileToSupabase:`, error)
        throw error
    }
}
