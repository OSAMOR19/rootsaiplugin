/**
 * Type definitions for Cloudflare R2 integration
 */

// API Response Types
export interface R2ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// File Upload Types
export interface UploadFileResult {
  success: boolean;
  fileName: string;
  url: string;
  size: number;
  contentType: string;
}

export interface UploadApiResponse {
  success: boolean;
  data?: {
    fileName: string;
    url: string;
    size: number;
    contentType: string;
    originalName: string;
  };
  error?: string;
}

// File Info Types
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

export interface ListApiResponse {
  success: boolean;
  data?: {
    files: FileInfo[];
    count: number;
    prefix: string | null;
  };
  error?: string;
}

// Delete Types
export interface DeleteFileResult {
  success: boolean;
  fileName: string;
}

export interface DeleteApiResponse {
  success: boolean;
  data?: {
    fileName: string;
    message: string;
  };
  error?: string;
}

// Hook Types
export interface UseR2SamplesOptions {
  prefix?: string;
  maxKeys?: number;
  autoFetch?: boolean;
}

export interface UseR2SamplesResult {
  files: FileInfo[];
  count: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  uploadFile: (file: File) => Promise<UploadResult | null>;
  deleteFile: (fileName: string) => Promise<boolean>;
}

export interface UploadResult {
  fileName: string;
  url: string;
  size: number;
  contentType: string;
  originalName: string;
}

// Environment Variables Type
export interface R2Config {
  accessKeyId: string;
  secretAccessKey: string;
  accountId: string;
  bucketName: string;
  endpoint: string;
}

// Allowed Audio MIME Types
export type AudioMimeType =
  | 'audio/mpeg'
  | 'audio/wav'
  | 'audio/wave'
  | 'audio/x-wav'
  | 'audio/ogg'
  | 'audio/flac'
  | 'audio/aac'
  | 'audio/mp4'
  | 'audio/x-m4a'
  | 'audio/webm';

// Error Types
export interface R2Error extends Error {
  code?: string;
  statusCode?: number;
}

// Sample Integration Types (for your existing app)
export interface R2Sample {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: Date;
  contentType: string;
  key: string;
}

export interface R2SampleMetadata {
  duration?: number;
  bpm?: number;
  key?: string;
  tags?: string[];
}

