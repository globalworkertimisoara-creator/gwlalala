/**
 * src/components/upload/FileUploader.tsx
 *
 * Drag-and-drop file uploader with:
 * - Automatic video compression (browser-side via FFmpeg)
 * - Upload progress tracking
 * - Google Drive integration
 * - Support for single or multiple files
 */

import React, { useCallback, useState } from 'react';
import { Upload, FileVideo, File, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { uploadFile, UploadState } from '@/utils/uploadService';
import { isGoogleDriveConnected } from '@/utils/googleDriveService';
import { isVideoFile, formatFileSize } from '@/utils/videoCompressor';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
  /** Called when all uploads complete successfully */
  onUploadComplete?: (results: UploadResult[]) => void;
  /** Override the default Drive folder ID */
  folderId?: string;
  /** Allow multiple files */
  multiple?: boolean;
  /** Accepted file types (default: all) */
  accept?: Record<string, string[]>;
  /** Compression quality profile */
  compressionProfile?: 'high' | 'medium' | 'low';
}

interface UploadResult {
  driveFileId: string;
  fileName: string;
  driveUrl: string;
  wasCompressed: boolean;
  originalSize: number;
  finalSize: number;
}

interface FileUploadItem {
  file: File;
  state: UploadState;
}

export default function FileUploader({
  onUploadComplete,
  folderId,
  multiple = true,
  accept,
  compressionProfile = 'medium',
}: FileUploaderProps) {
  const [uploads, setUploads] = useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!isGoogleDriveConnected()) {
        toast({
          title: 'Google Drive not connected',
          description: 'Please connect Google Drive in Settings first.',
          variant: 'destructive',
        });
        return;
      }

      if (acceptedFiles.length === 0) return;

      // Initialize upload items
      const newUploads: FileUploadItem[] = acceptedFiles.map((file) => ({
        file,
        state: { status: 'idle', progress: 0, phase: '' },
      }));

      setUploads(newUploads);
      setIsUploading(true);

      const results: UploadResult[] = [];

      // Upload files sequentially (could be parallelized if needed)
      for (let i = 0; i < newUploads.length; i++) {
        const item = newUploads[i];

        try {
          const result = await uploadFile(
            item.file,
            { folderId, compressionProfile },
            (state) => {
              setUploads((prev) =>
                prev.map((u, idx) => (idx === i ? { ...u, state } : u))
              );
            }
          );

          results.push({
            driveFileId: result.driveFile.id,
            fileName: item.file.name,
            driveUrl: result.driveFile.webViewLink || '',
            wasCompressed: result.wasCompressed,
            originalSize: result.originalSize,
            finalSize: result.finalSize,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Upload failed';
          setUploads((prev) =>
            prev.map((u, idx) =>
              idx === i
                ? { ...u, state: { status: 'error', progress: 0, phase: msg, error: msg } }
                : u
            )
          );
        }
      }

      setIsUploading(false);

      if (results.length > 0) {
        toast({
          title: 'Upload complete',
          description: `${results.length} file(s) uploaded to Google Drive`,
        });
        onUploadComplete?.(results);
      }
    },
    [folderId, compressionProfile, toast, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple,
    accept,
    disabled: isUploading,
  });

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`
          relative overflow-hidden rounded-xl border-2 border-dashed p-8 text-center transition-all
          ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }
          ${isUploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        `}
      >
        <input {...getInputProps()} />
        <Upload
          className={`mx-auto h-12 w-12 mb-4 transition-colors ${
            isDragActive ? 'text-blue-600' : 'text-gray-400'
          }`}
        />
        <p className="text-base font-medium text-gray-700 mb-1">
          {isDragActive ? 'Drop files here' : 'Drag and drop files here'}
        </p>
        <p className="text-sm text-gray-500">
          or click to browse • Videos are compressed automatically
        </p>
      </div>

      {/* Upload progress list */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((item, idx) => (
            <UploadProgressItem key={idx} file={item.file} state={item.state} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Progress Item ────────────────────────────────────────────────────────────

interface UploadProgressItemProps {
  file: File;
  state: UploadState;
}

function UploadProgressItem({ file, state }: UploadProgressItemProps) {
  const isVideo = isVideoFile(file);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-0.5 flex-shrink-0">
          {state.status === 'complete' ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : state.status === 'error' ? (
            <XCircle className="h-5 w-5 text-red-600" />
          ) : isVideo ? (
            <FileVideo className="h-5 w-5 text-blue-600" />
          ) : (
            <File className="h-5 w-5 text-gray-600" />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatFileSize(file.size)}
            {state.compressedFile && state.compressedFile !== file && (
              <> → {formatFileSize(state.compressedFile.size)}</>
            )}
          </p>

          {/* Progress bar */}
          {state.status !== 'idle' && state.status !== 'complete' && state.status !== 'error' && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>{state.phase}</span>
                <span>{state.progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${state.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Status messages */}
          {state.status === 'complete' && state.result && (
            <p className="mt-2 text-xs text-green-600">
              ✓ Uploaded to Google Drive
              {state.result.wasCompressed &&
                ` • Compressed ${((1 - state.result.compressionRatio!) * 100).toFixed(0)}%`}
            </p>
          )}

          {state.status === 'error' && (
            <p className="mt-2 text-xs text-red-600">{state.error}</p>
          )}
        </div>

        {/* Spinner for active uploads */}
        {(state.status === 'compressing' || state.status === 'uploading') && (
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
        )}
      </div>
    </div>
  );
}
