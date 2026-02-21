import { NextRequest, NextResponse } from 'next/server';
import { deleteFile } from '@/lib/r2';

export async function DELETE(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { fileName } = body;

    if (!fileName) {
      return NextResponse.json(
        {
          success: false,
          error: 'fileName is required',
        },
        { status: 400 }
      );
    }

    // Validate fileName (prevent path traversal)
    if (fileName.includes('..') || fileName.includes('/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid fileName',
        },
        { status: 400 }
      );
    }

    // Delete file from R2
    const result = await deleteFile(fileName);

    return NextResponse.json(
      {
        success: true,
        data: {
          fileName: result.fileName,
          message: 'File deleted successfully',
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
    console.error('Delete file error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file',
      },
      { status: 500 }
    );
  }
}

