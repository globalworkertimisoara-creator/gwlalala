/**
 * src/pages/Upload.tsx
 *
 * Example page showing how to use the FileUploader component.
 * This can be added as a new page in your app, or the FileUploader
 * can be embedded anywhere (e.g., in a modal, candidate form, etc.)
 */

import React from 'react';
import FileUploader from '@/components/upload/FileUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Upload() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">File Upload</h1>
        <p className="text-gray-600 mt-1">
          Upload files and videos to Google Drive. Videos are compressed automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Drag and drop files or click to browse. Large videos will be compressed before upload.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploader
            multiple={true}
            onUploadComplete={(results) => {
              console.log('Upload complete:', results);
              // Here you can:
              // - Save the Drive file IDs to your database
              // - Update UI
              // - Navigate somewhere else
              // - etc.
            }}
          />
        </CardContent>
      </Card>

      {/* Instructions */}
      <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">How it works</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Videos &gt; 5 MB are compressed in your browser (no server cost)</li>
          <li>• Compression uses FFmpeg WASM — maintains quality while reducing size</li>
          <li>• Files upload directly to your Google Drive</li>
          <li>• Progress is shown for each file</li>
          <li>• Multiple files can be uploaded at once</li>
        </ul>
      </div>
    </div>
  );
}
