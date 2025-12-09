import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Validate environment variables
const requiredEnvVars = [
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_ACCOUNT_ID',
  'R2_BUCKET_NAME',
  'R2_ENDPOINT',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Initialize R2 client using AWS S3 SDK
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  signatureVersion: 'v4',
  forcePathStyle: true, // Required for R2
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

export interface UploadFileResult {
  success: boolean;
  fileName: string;
  url: string;
  size: number;
  contentType: string;
}

export interface FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  url: string;
}

export interface ListFilesResult {
  success: boolean;
  files: FileInfo[];
  count: number;
}

export interface DeleteFileResult {
  success: boolean;
  fileName: string;
}

/**
 * Upload a file to Cloudflare R2
 * @param file - File buffer to upload
 * @param fileName - Name of the file (will be used as the key)
 * @param contentType - MIME type of the file
 * @returns Upload result with public URL
 */
export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<UploadFileResult> {
  try {
    // Sanitize filename to prevent path traversal
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: sanitizedFileName,
      Body: file,
      ContentType: contentType,
      // Make the file publicly accessible
      // Note: You need to configure your R2 bucket to allow public access
      CacheControl: 'public, max-age=31536000',
    });

    await r2Client.send(command);

    const publicUrl = getPublicFileUrl(sanitizedFileName);

    return {
      success: true,
      fileName: sanitizedFileName,
      url: publicUrl,
      size: file.length,
      contentType,
    };
  } catch (error) {
    console.error('Error uploading file to R2:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get a public URL for a file in R2
 * @param fileName - Name of the file
 * @returns Public URL to access the file
 */
export function getPublicFileUrl(fileName: string): string {
  // For public R2 buckets with custom domain or R2.dev subdomain
  // Format: https://{bucket-name}.{account-id}.r2.cloudflarestorage.com/{fileName}
  // OR if you have a custom domain: https://your-domain.com/{fileName}
  
  const accountId = process.env.R2_ACCOUNT_ID!;
  const bucketName = BUCKET_NAME;
  
  // Using the direct R2 endpoint (this requires the bucket to be publicly accessible)
  return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${fileName}`;
}

/**
 * Get a presigned URL for private file access
 * @param fileName - Name of the file
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Presigned URL
 */
export async function getPresignedUrl(
  fileName: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * List all files in the R2 bucket
 * @param prefix - Optional prefix to filter files
 * @param maxKeys - Maximum number of files to return (default: 1000)
 * @returns List of files with metadata
 */
export async function listFiles(
  prefix?: string,
  maxKeys: number = 1000
): Promise<ListFilesResult> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await r2Client.send(command);

    const files: FileInfo[] = (response.Contents || []).map((item) => ({
      key: item.Key!,
      size: item.Size || 0,
      lastModified: item.LastModified || new Date(),
      url: getPublicFileUrl(item.Key!),
    }));

    return {
      success: true,
      files,
      count: files.length,
    };
  } catch (error) {
    console.error('Error listing files from R2:', error);
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a file from R2
 * @param fileName - Name of the file to delete
 * @returns Delete result
 */
export async function deleteFile(fileName: string): Promise<DeleteFileResult> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    await r2Client.send(command);

    return {
      success: true,
      fileName,
    };
  } catch (error) {
    console.error('Error deleting file from R2:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a file exists in R2
 * @param fileName - Name of the file
 * @returns True if file exists
 */
export async function fileExists(fileName: string): Promise<boolean> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    await r2Client.send(command);
    return true;
  } catch (error: any) {
    if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

// Export the client for advanced usage
export { r2Client };

