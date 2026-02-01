/**
 * src/hooks/useGoogleDriveUpload.ts
 *
 * React hook for uploading files (with automatic video compression).
 */

import { useState, useCallback } from 'react';
import { uploadFile, UploadState, UploadOptions, UploadResult } from '@/utils/uploadService';
import { isGoogleDriveConnected } from '@/utils/googleDriveService';

export interface UseUploadReturn {
  /** Current upload state (status, progress, phase label, result, error) */
  state: UploadState;
  /**
   * Upload a single file.
   * Videos are automatically compressed first (unless skipCompression is set).
   * Returns null if Drive isn't connected or an error occurs.
   */
  upload: (file: File, options?: UploadOptions) => Promise<UploadResult | null>;
  /**
   * Upload multiple files one after another.
   * Each file goes through the full pipeline independently.
   */
  uploadMultiple: (files: File[], options?: UploadOptions) => Promise<UploadResult[]>;
  /** Reset state back to idle */
  reset: () => void;
  /** Whether Google Drive is currently connected */
  isConnected: boolean;
}

export function useGoogleDriveUpload(): UseUploadReturn {
  const [state, setState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    phase: '',
  });

  const isConnected = isGoogleDriveConnected();

  const upload = useCallback(async (file: File, options: UploadOptions = {}): Promise<UploadResult | null> => {
    if (!isConnected) {
      setState({
        status: 'error',
        progress: 0,
        phase: 'Google Drive is not connected.',
        error: 'Go to Settings and connect Google Drive first.',
      });
      return null;
    }

    try {
      return await uploadFile(file, options, setState);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setState({ status: 'error', progress: 0, phase: msg, error: msg });
      return null;
    }
  }, [isConnected]);

  const uploadMultiple = useCallback(async (
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    for (const file of files) {
      const result = await upload(file, options);
      if (result) results.push(result);
    }
    return results;
  }, [upload]);

  const reset = useCallback(() => {
    setState({ status: 'idle', progress: 0, phase: '' });
  }, []);

  return { state, upload, uploadMultiple, reset, isConnected };
}
