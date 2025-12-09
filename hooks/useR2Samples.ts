import { useState, useEffect, useCallback } from 'react';

export interface R2FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  url: string;
}

export interface UseR2SamplesOptions {
  prefix?: string;
  maxKeys?: number;
  autoFetch?: boolean;
}

export interface UseR2SamplesResult {
  files: R2FileInfo[];
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

/**
 * React hook for fetching and managing R2 samples
 * @param options - Configuration options
 * @returns Files, loading state, and utility functions
 */
export function useR2Samples(options: UseR2SamplesOptions = {}): UseR2SamplesResult {
  const { prefix, maxKeys = 1000, autoFetch = true } = options;

  const [files, setFiles] = useState<R2FileInfo[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch files from R2
   */
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (prefix) params.append('prefix', prefix);
      if (maxKeys) params.append('maxKeys', maxKeys.toString());

      const response = await fetch(`/api/samples/list?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch files');
      }

      // Convert lastModified strings to Date objects
      const filesWithDates = result.data.files.map((file: any) => ({
        ...file,
        lastModified: new Date(file.lastModified),
      }));

      setFiles(filesWithDates);
      setCount(result.data.count);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching R2 files:', err);
    } finally {
      setLoading(false);
    }
  }, [prefix, maxKeys]);

  /**
   * Upload a file to R2
   */
  const uploadFile = useCallback(async (file: File): Promise<UploadResult | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/samples/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Refetch the list after successful upload
      await fetchFiles();

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      console.error('Error uploading file:', err);
      return null;
    }
  }, [fetchFiles]);

  /**
   * Delete a file from R2
   */
  const deleteFile = useCallback(async (fileName: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/samples/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName }),
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Delete failed');
      }

      // Refetch the list after successful deletion
      await fetchFiles();

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      setError(errorMessage);
      console.error('Error deleting file:', err);
      return false;
    }
  }, [fetchFiles]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchFiles();
    }
  }, [autoFetch, fetchFiles]);

  return {
    files,
    count,
    loading,
    error,
    refetch: fetchFiles,
    uploadFile,
    deleteFile,
  };
}

