# Cloudflare R2 Quick Start Guide

## ✅ Installation Complete

The Cloudflare R2 integration has been successfully set up in your Next.js project!

## 📋 What Was Created

### Core Files
- ✅ `/lib/r2.ts` - R2 client and utility functions
- ✅ `/app/api/samples/upload/route.ts` - Upload API endpoint
- ✅ `/app/api/samples/list/route.ts` - List files API endpoint
- ✅ `/app/api/samples/delete/route.ts` - Delete file API endpoint
- ✅ `/hooks/useR2Samples.ts` - React hook for R2 operations
- ✅ `/components/R2SampleManager.tsx` - Example UI component
- ✅ `/app/r2-demo/page.tsx` - Demo page

### Documentation
- ✅ `R2_INTEGRATION_GUIDE.md` - Complete integration guide
- ✅ `env.local.example` - Environment variables template

## 🚀 Quick Setup (3 Steps)

### Step 1: Add Environment Variables

Create a `.env.local` file in your project root:

```bash
# Create the file
touch .env.local
```

Add your R2 credentials (replace with your actual values):

```env
R2_ACCESS_KEY_ID=540e4a7bdeafc2b289d609de1cad59b9
R2_SECRET_ACCESS_KEY=586563e7680102c3576c8422375cb60852c300bda402d9c93e9f92fc3de4d7b8
R2_ACCOUNT_ID=175367b0a4073c8d283294a8a4612373
R2_BUCKET_NAME=roots-samples
R2_ENDPOINT=https://175367b0a4073c8d283294a8a4612373.r2.cloudflarestorage.com
```

### Step 2: Restart Your Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

### Step 3: Test the Integration

Visit: **http://localhost:3000/r2-demo**

## 💻 Code Examples

### Example 1: Simple File Upload Component

```typescript
'use client';

import { useR2Samples } from '@/hooks/useR2Samples';

export default function SimpleUpload() {
  const { uploadFile, files } = useR2Samples();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadFile(file);
    if (result) {
      alert(`Uploaded! URL: ${result.url}`);
    }
  };

  return (
    <div>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <div>Total files: {files.length}</div>
    </div>
  );
}
```

### Example 2: File List with Download Links

```typescript
'use client';

import { useR2Samples } from '@/hooks/useR2Samples';

export default function FileList() {
  const { files, loading, deleteFile } = useR2Samples({ autoFetch: true });

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {files.map((file) => (
        <li key={file.key}>
          <a href={file.url} download>
            {file.key}
          </a>
          <button onClick={() => deleteFile(file.key)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

### Example 3: Direct API Usage (Without Hook)

```typescript
// Upload
async function uploadSample(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/samples/upload', {
    method: 'POST',
    body: formData,
  });

  return await response.json();
}

// List
async function listSamples() {
  const response = await fetch('/api/samples/list');
  return await response.json();
}

// Delete
async function deleteSample(fileName: string) {
  const response = await fetch('/api/samples/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName }),
  });

  return await response.json();
}
```

### Example 4: Server-Side Upload (in API Route)

```typescript
import { uploadFile } from '@/lib/r2';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadFile(buffer, file.name, file.type);
  
  return NextResponse.json({ success: true, url: result.url });
}
```

### Example 5: Batch Upload Multiple Files

```typescript
'use client';

import { useR2Samples } from '@/hooks/useR2Samples';

export default function BatchUpload() {
  const { uploadFile } = useR2Samples();

  const handleMultipleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const results = await Promise.all(
      files.map((file) => uploadFile(file))
    );
    
    console.log('Uploaded:', results.filter(Boolean).length, 'files');
  };

  return (
    <input
      type="file"
      multiple
      accept="audio/*"
      onChange={handleMultipleFiles}
    />
  );
}
```

## 🎯 Integration with Existing Components

### Adding R2 Upload to Your Sample Card

```typescript
// In your existing SampleCard component
import { uploadFile } from '@/lib/r2';

const handleUploadToR2 = async (audioBuffer: ArrayBuffer, fileName: string) => {
  const buffer = Buffer.from(audioBuffer);
  const result = await uploadFile(buffer, fileName, 'audio/wav');
  
  // Update your sample with the R2 URL
  updateSampleUrl(result.url);
};
```

### Fetching R2 Samples in Browse Page

```typescript
// In /app/browse/page.tsx
'use client';

import { useR2Samples } from '@/hooks/useR2Samples';
import SampleGrid from '@/components/SampleGrid';

export default function BrowsePage() {
  const { files, loading } = useR2Samples();
  
  // Convert R2 files to your sample format
  const samples = files.map((file) => ({
    id: file.key,
    name: file.key,
    url: file.url,
    // ... other properties
  }));

  return <SampleGrid samples={samples} loading={loading} />;
}
```

## 🔒 Security Checklist

- ✅ Environment variables are not hardcoded
- ✅ File type validation (audio files only)
- ✅ File size limit (50MB max)
- ✅ Filename sanitization (prevents path traversal)
- ✅ Proper error handling
- ✅ CORS headers configured
- ✅ Non-blocking async operations

## 📊 Features Included

### `/lib/r2.ts` Functions
- `uploadFile(file, fileName, contentType)` - Upload a file
- `getPublicFileUrl(fileName)` - Get public URL
- `getPresignedUrl(fileName, expiresIn)` - Get temporary private URL
- `listFiles(prefix, maxKeys)` - List all files
- `deleteFile(fileName)` - Delete a file
- `fileExists(fileName)` - Check if file exists

### API Endpoints
- `POST /api/samples/upload` - Upload with validation
- `GET /api/samples/list` - List with filtering
- `DELETE /api/samples/delete` - Delete with confirmation

### React Hook Features
- Auto-fetch on mount
- Loading states
- Error handling
- Optimistic updates
- Automatic refetch after mutations

## 🧪 Testing

### Test Upload via cURL

```bash
curl -X POST http://localhost:3000/api/samples/upload \
  -F "file=@/path/to/your/audio.mp3"
```

### Test List

```bash
curl http://localhost:3000/api/samples/list
```

### Test Delete

```bash
curl -X DELETE http://localhost:3000/api/samples/delete \
  -H "Content-Type: application/json" \
  -d '{"fileName":"your-file.mp3"}'
```

## 🐛 Common Issues & Solutions

### Issue: "Missing environment variable"
**Solution:** Make sure `.env.local` exists and contains all required variables. Restart your dev server.

### Issue: "Access Denied"
**Solution:** Verify your R2 API token has both Read and Write permissions.

### Issue: "File URL returns 404"
**Solution:** Enable public access on your R2 bucket, or use `getPresignedUrl()` instead.

### Issue: "CORS error"
**Solution:** Configure CORS in your R2 bucket settings in Cloudflare dashboard.

## 📚 Next Steps

1. ✅ Environment variables configured
2. ⏭️ Test upload at `/r2-demo`
3. ⏭️ Configure R2 bucket for public access (if needed)
4. ⏭️ Integrate with your existing browse/sample pages
5. ⏭️ Set up custom domain for production
6. ⏭️ Configure CDN caching

## 🆘 Need Help?

- Read the full guide: `R2_INTEGRATION_GUIDE.md`
- Check Cloudflare R2 docs: https://developers.cloudflare.com/r2/
- AWS S3 SDK docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/

---

**🎉 You're all set! Start uploading samples to Cloudflare R2.**

