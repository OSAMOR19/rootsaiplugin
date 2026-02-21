import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/r2';

// Maximum file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed audio file types
const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
  'audio/webm',
];

export async function POST(request: NextRequest) {
  try {
    // Check if request has form data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content-Type must be multipart/form-data',
        },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate a unique filename with timestamp to prevent conflicts
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;

    // Upload to R2
    const result = await uploadFile(buffer, fileName, file.type);

    return NextResponse.json(
      {
        success: true,
        data: {
          fileName: result.fileName,
          url: result.url,
          size: result.size,
          contentType: result.contentType,
          originalName: file.name,
        },
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file',
      },
      { status: 500 }
    );
  }
}

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

