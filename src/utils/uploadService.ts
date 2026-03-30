/**
 * src/utils/uploadService.ts
 *
 * Orchestrates the full upload pipeline:
 *   1. Is it a video?  → compress first (browser-side, via videoCompressor)
 *   2. Upload the (possibly compressed) file to Google Drive
 *   3. Return metadata (Drive ID, URL, sizes)
 *
 * Non-video files skip straight to step 2.
 */

import { compressVideo, isVideoFile, CompressionProfile, formatFileSize } from './videoCompressor';
import { uploadToDrive, DriveFile } from './googleDriveService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UploadStatus = 'idle' | 'compressing' | 'uploading' | 'complete' | 'error';

export interface UploadState {
  status: UploadStatus;
  /** 0–100 for the current phase */
  progress: number;
  /** Human-readable label shown in the UI */
  phase: string;
  originalFile?: File;
  compressedFile?: File;
  result?: UploadResult;
  error?: string;
}

export interface UploadResult {
  driveFile: DriveFile;
  originalSize: number;
  finalSize: number;
  wasCompressed: boolean;
  /** Only present when a video was compressed */
  compressionRatio?: number;
}

export interface UploadOptions {
  /** Override the default Drive folder ID for this upload */
  folderId?: string | null;
  /** Quality profile for video compression. Default: 'medium' */
  compressionProfile?: CompressionProfile;
  /** Set to true to upload videos without compressing */
  skipCompression?: boolean;
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

/**
 * Main entry point.  Call this when a file is selected.
 *
 * @param file            - The file the user picked.
 * @param options         - Compression / folder overrides.
 * @param onStateChange   - React-friendly progress callback.  Update your
 *                          component state here so the UI reflects what's happening.
 */
export async function uploadFile(
  file: File,
  options: UploadOptions = {},
  onStateChange?: (state: UploadState) => void
): Promise<UploadResult> {
  const { folderId, compressionProfile = 'medium', skipCompression = false } = options;

  let fileToUpload: File = file;
  let compressionRatio: number | undefined;

  // ── 1. Compress video (if applicable) ─────────────────────────────────────
  if (isVideoFile(file) && !skipCompression) {
    onStateChange?.({
      status: 'compressing',
      progress: 0,
      phase: 'Preparing video compressor…',
      originalFile: file,
    });

    try {
      const result = await compressVideo(file, {
        profile: compressionProfile,
        onProgress: (pct) => {
          onStateChange?.({
            status: 'compressing',
            progress: pct,
            phase: `Compressing video… ${pct}%`,
            originalFile: file,
          });
        },
      });

      if (!result.skipped) {
        fileToUpload = result.file;
        compressionRatio = result.compressionRatio;
        // Compression stats logged silently
      } else {
        console.log('[uploadService] File under threshold — skipped compression.');
      }
    } catch (err) {
      // Compression failure is non-fatal — upload the original
      console.warn('[uploadService] Compression failed, uploading original:', err);
    }
  }

  // ── 2. Upload to Google Drive ──────────────────────────────────────────────
  onStateChange?.({
    status: 'uploading',
    progress: 0,
    phase: 'Uploading to Google Drive…',
    originalFile: file,
    compressedFile: fileToUpload !== file ? fileToUpload : undefined,
  });

  let driveFile: DriveFile;
  try {
    driveFile = await uploadToDrive(fileToUpload, folderId, (uploadProg) => {
      onStateChange?.({
        status: 'uploading',
        progress: uploadProg.percentage,
        phase: `Uploading… ${uploadProg.percentage}%`,
        originalFile: file,
        compressedFile: fileToUpload !== file ? fileToUpload : undefined,
      });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload failed';
    onStateChange?.({ status: 'error', progress: 0, phase: msg, originalFile: file, error: msg });
    throw err;
  }

  // ── 3. Done ────────────────────────────────────────────────────────────────
  const result: UploadResult = {
    driveFile,
    originalSize: file.size,
    finalSize: fileToUpload.size,
    wasCompressed: fileToUpload !== file,
    compressionRatio,
  };

  onStateChange?.({
    status: 'complete',
    progress: 100,
    phase: 'Upload complete!',
    originalFile: file,
    compressedFile: fileToUpload !== file ? fileToUpload : undefined,
    result,
  });

  return result;
}
