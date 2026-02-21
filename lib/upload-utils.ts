
import { supabase } from './supabase'

/**
 * Uploads a file directly to Supabase Storage and returns the public URL.
 * Uses a signed upload URL to bypass RLS policies.
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
        console.log(`[UploadUtils] Requesting upload token for ${bucket}/${path}...`)

        // 1. Get Signed Upload URL from API (Bypasses RLS)
        // This is necessary because RLS policies might block direct uploads from anon users
        const response = await fetch('/api/admin/get-upload-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bucket, path })
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to get upload token')
        }

        const { data } = await response.json()
        const { token } = data

        console.log(`[UploadUtils] Uploading ${file.name} using signed token...`)

        // 2. Upload using the signed token
        const { error: uploadError } = await supabase
            .storage
            .from(bucket)
            .uploadToSignedUrl(path, token, file, {
                contentType: file.type || 'application/octet-stream',
                upsert: true
            })

        if (uploadError) {
            console.error(`[UploadUtils] Upload failed for ${path}. Error details:`, uploadError)
            console.error(`[UploadUtils] File info - Name: ${file.name}, Type: ${file.type}, Size: ${file.size}`)
            throw uploadError
        }

        // 3. Get Public URL (Assuming the bucket is public)
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
