import { NextRequest, NextResponse } from 'next/server';
import { listFiles } from '@/lib/r2';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const prefix = searchParams.get('prefix') || undefined;
    const maxKeys = parseInt(searchParams.get('maxKeys') || '5000', 10);

    // Validate maxKeys — allow up to 10,000 to support large sample libraries
    if (isNaN(maxKeys) || maxKeys < 1 || maxKeys > 10000) {
      return NextResponse.json(
        {
          success: false,
          error: 'maxKeys must be between 1 and 10000',
        },
        { status: 400 }
      );
    }

    // List files from R2
    const result = await listFiles(prefix, maxKeys);

    return NextResponse.json(
      {
        success: true,
        data: {
          files: result.files,
          count: result.count,
          prefix: prefix || null,
        },
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60', // Cache for 1 minute
        },
      }
    );
  } catch (error) {
    console.error('List files error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list files',
      },
      { status: 500 }
    );
  }
}

