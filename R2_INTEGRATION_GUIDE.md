# Cloudflare R2 Integration Guide

This guide explains how to use the Cloudflare R2 integration in your Next.js application.

## 🚀 Setup

### 1. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Cloudflare R2 credentials:

```bash
cp .env.local.example .env.local
```

Update the following variables in `.env.local`:

```env
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_ACCOUNT_ID=your_account_id
R2_BUCKET_NAME=your_bucket_name
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
```

### 2. Get Your Cloudflare R2 Credentials

1. Log in to your Cloudflare dashboard
2. Go to **R2** → **Overview**
3. Click **"Manage R2 API Tokens"**
4. Click **"Create API Token"**
5. Give it a name (e.g., "Next.js App")
6. Select permissions: **Read** and **Write**
7. Copy the `Access Key ID` and `Secret Access Key`
8. Your `Account ID` is visible in the R2 overview page
9. Create or select your bucket name

### 3. Configure Your R2 Bucket for Public Access (Optional)

If you want direct public URLs to work:

1. Go to your R2 bucket settings
2. Click **"Settings"** → **"Public Access"**
3. Enable **"Allow Access"**
4. Optionally, set up a custom domain for better URLs

**Note:** If you don't enable public access, use the `getPresignedUrl()` function instead of `getPublicFileUrl()`.

## 📁 Project Structure

```
/lib/r2.ts                          # R2 client and utility functions
/app/api/samples/upload/route.ts    # Upload endpoint
/app/api/samples/list/route.ts      # List files endpoint
/app/api/samples/delete/route.ts    # Delete file endpoint
/hooks/useR2Samples.ts              # React hook for R2 operations
/components/R2SampleManager.tsx     # Example UI component
/app/r2-demo/page.tsx               # Demo page
```

## 🔧 Usage

### Using the R2 Client Library (`/lib/r2.ts`)

#### Upload a File

```typescript
import { uploadFile } from '@/lib/r2';

const buffer = Buffer.from(fileData);
const result = await uploadFile(buffer, 'myfile.mp3', 'audio/mpeg');
console.log(result.url); // Public URL to the file
```

#### List Files

```typescript
import { listFiles } from '@/lib/r2';

const result = await listFiles();
console.log(result.files); // Array of file objects
```

#### Delete a File

```typescript
import { deleteFile } from '@/lib/r2';

await deleteFile('myfile.mp3');
```

#### Get a Presigned URL (for private files)

```typescript
import { getPresignedUrl } from '@/lib/r2';

const url = await getPresignedUrl('myfile.mp3', 3600); // Valid for 1 hour
```

### Using the API Routes

#### Upload via API

```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/samples/upload', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(result.data.url);
```

#### List Files via API

```typescript
const response = await fetch('/api/samples/list?prefix=audio&maxKeys=50');
const result = await response.json();
console.log(result.data.files);
```

#### Delete File via API

```typescript
const response = await fetch('/api/samples/delete', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fileName: 'myfile.mp3' }),
});

const result = await response.json();
console.log(result.success);
```

### Using the React Hook (`useR2Samples`)

```typescript
'use client';

import { useR2Samples } from '@/hooks/useR2Samples';

export default function MyComponent() {
  const { files, loading, error, uploadFile, deleteFile, refetch } = useR2Samples({
    autoFetch: true,
    maxKeys: 100,
  });

  const handleUpload = async (file: File) => {
    const result = await uploadFile(file);
    if (result) {
      console.log('Uploaded:', result.url);
    }
  };

  const handleDelete = async (fileName: string) => {
    const success = await deleteFile(fileName);
    console.log('Deleted:', success);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Files: {files.length}</h1>
      <ul>
        {files.map((file) => (
          <li key={file.key}>
            <a href={file.url}>{file.key}</a>
            <button onClick={() => handleDelete(file.key)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 🎨 Example UI Component

A full-featured UI component is available at `/components/R2SampleManager.tsx`.

View the demo at: **http://localhost:3000/r2-demo**

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **File Validation**: The upload endpoint validates:
   - File type (audio files only)
   - File size (max 50MB)
   - Filename sanitization
3. **Path Traversal**: All filenames are sanitized to prevent directory traversal attacks
4. **Public vs Private**: Choose between public URLs or presigned URLs based on your security needs

## 📊 Supported Audio Formats

- MP3 (audio/mpeg)
- WAV (audio/wav, audio/wave, audio/x-wav)
- OGG (audio/ogg)
- FLAC (audio/flac)
- AAC (audio/aac)
- M4A (audio/mp4, audio/x-m4a)
- WebM (audio/webm)

## 🚨 Error Handling

All API routes and functions include comprehensive error handling:

```typescript
try {
  const result = await uploadFile(buffer, fileName, contentType);
  // Success
} catch (error) {
  console.error('Upload failed:', error.message);
  // Handle error
}
```

## 📝 API Response Format

All API endpoints return JSON in this format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

## 🔄 Migrating Existing Samples

To migrate existing samples from local storage or another provider to R2:

```typescript
import { uploadFile } from '@/lib/r2';
import fs from 'fs';

// Example migration script
const files = fs.readdirSync('./public/audio');

for (const file of files) {
  const buffer = fs.readFileSync(`./public/audio/${file}`);
  const contentType = 'audio/wav'; // Adjust based on file type
  
  await uploadFile(buffer, file, contentType);
  console.log(`Migrated: ${file}`);
}
```

## 📈 Performance Tips

1. **Caching**: The list endpoint caches responses for 1 minute
2. **Parallel Uploads**: Upload multiple files in parallel using `Promise.all()`
3. **Lazy Loading**: Use pagination with the `maxKeys` parameter
4. **CDN**: Consider setting up a custom domain with Cloudflare CDN for faster delivery

## 🆘 Troubleshooting

### "Access Denied" Error
- Check your R2 API token permissions
- Verify your environment variables are correct
- Ensure your bucket exists

### "File Not Found" (404)
- Make sure public access is enabled on your bucket
- Or use `getPresignedUrl()` instead of `getPublicFileUrl()`

### CORS Issues
- Configure CORS settings in your R2 bucket settings
- Add allowed origins in Cloudflare dashboard

## 📚 Additional Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS S3 SDK Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## 🎯 Next Steps

1. Set up environment variables
2. Test the upload endpoint with a sample file
3. Integrate the `useR2Samples` hook into your existing components
4. Configure a custom domain for production
5. Set up monitoring and logging

