'use client';

import { useState, useRef } from 'react';
import { useR2Samples } from '@/hooks/useR2Samples';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Example React component that demonstrates how to use the useR2Samples hook
 * This component allows users to view, upload, and delete audio samples from R2
 */
export default function R2SampleManager() {
  const { files, count, loading, error, refetch, uploadFile, deleteFile } = useR2Samples({
    autoFetch: true,
    maxKeys: 100,
  });

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadFile(file);
      if (result) {
        console.log('File uploaded successfully:', result);
        alert(`File uploaded: ${result.fileName}`);
      } else {
        alert('Upload failed. Check console for details.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Delete ${fileName}?`)) return;

    const success = await deleteFile(fileName);
    if (success) {
      alert('File deleted successfully');
    } else {
      alert('Delete failed');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">R2 Sample Manager</h1>
        <p className="text-gray-600">
          Manage your audio samples stored in Cloudflare R2
        </p>
      </div>

      {/* Upload Section */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload New Sample</h2>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="flex-1"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Select File'}
          </Button>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Files List */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Samples ({count})
          </h2>
          <Button onClick={refetch} disabled={loading} variant="outline">
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {loading && files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Loading samples...
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No samples found. Upload your first sample to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">File Name</th>
                  <th className="text-left py-3 px-4">Size</th>
                  <th className="text-left py-3 px-4">Last Modified</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.key} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {file.key}
                      </a>
                    </td>
                    <td className="py-3 px-4">{formatFileSize(file.size)}</td>
                    <td className="py-3 px-4">
                      {new Date(file.lastModified).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(file.url, '_blank')}
                        >
                          Play
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(file.key)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

