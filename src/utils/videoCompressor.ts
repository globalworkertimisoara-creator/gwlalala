/**
 * src/utils/videoCompressor.ts
 *
 * Browser-side video compression using FFmpeg.wasm.
 * Runs entirely in the user's browser — no server needed.
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// ─── Profiles ─────────────────────────────────────────────────────────────────
// CRF scale: 18 = visually lossless | 23 = default | 28 = smaller, visible loss
// Preset: slow = best ratio | medium = balanced | fast = quick encode

export const COMPRESSION_PROFILES = {
  high: {
    crf: '18',
    preset: 'slow',
    audioBitrate: '192k',
    label: 'High Quality',
    description: 'Near-lossless. Best for client-facing material.',
  },
  medium: {
    crf: '23',
    preset: 'medium',
    audioBitrate: '128k',
    label: 'Balanced',
    description: 'Good quality with big size reduction. Recommended.',
  },
  low: {
    crf: '28',
    preset: 'fast',
    audioBitrate: '96k',
    label: 'Small File',
    description: 'Noticeably smaller. Fine for internal previews.',
  },
} as const;

export type CompressionProfile = keyof typeof COMPRESSION_PROFILES;

// ─── Singleton FFmpeg instance (loaded once per session) ─────────────────────

let ffmpegInstance: FFmpeg | null = null;
let isLoading = false;

const FFMPEG_CDN = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (isLoading) {
    while (isLoading) await new Promise((r) => setTimeout(r, 100));
    return ffmpegInstance!;
  }

  isLoading = true;
  const ffmpeg = new FFmpeg();

  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${FFMPEG_CDN}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${FFMPEG_CDN}/ffmpeg-core.wasm`, 'application/wasm'),
    });
  } catch (e) {
    isLoading = false;
    throw new Error(
      'Failed to load video compressor. Check your internet connection and try again.'
    );
  }

  ffmpegInstance = ffmpeg;
  isLoading = false;
  return ffmpeg;
}

/**
 * Call this on app startup to pre-load the WASM binary in the background.
 * By the time the user picks a video, compression starts instantly.
 */
export function preloadCompressor(): void {
  getFFmpeg().catch(() => {
    // Silent — will retry on actual compress call
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompressionOptions {
  profile?: CompressionProfile;
  /** Skip compression if file is already under this size (bytes). Default: 5 MB */
  minSizeToCompress?: number;
  /** Progress callback: 0–100 */
  onProgress?: (progress: number) => void;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  /** e.g. 0.35 means the compressed file is 35% of the original */
  compressionRatio: number;
  /** true if compression was skipped (file too small) */
  skipped: boolean;
  profile: CompressionProfile;
}

// ─── Compress ─────────────────────────────────────────────────────────────────

export async function compressVideo(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    profile = 'medium',
    minSizeToCompress = 5 * 1024 * 1024, // 5 MB default threshold
    onProgress,
  } = options;

  // Skip tiny files — compression overhead isn't worth it
  if (file.size < minSizeToCompress) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
      skipped: true,
      profile,
    };
  }

  const config = COMPRESSION_PROFILES[profile];
  const ffmpeg = await getFFmpeg();

  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(Math.min(Math.round(progress * 100), 99));
    });
  }

  const ext = getExtension(file.name);
  const inputName = `input${ext}`;
  const outputName = 'output.mp4';

  // Write → encode → read
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  await ffmpeg.exec([
    '-i', inputName,
    '-c:v', 'libx264',
    '-crf', config.crf,
    '-preset', config.preset,
    '-c:a', 'aac',
    '-b:a', config.audioBitrate,
    '-movflags', '+faststart',
    '-y',
    outputName,
  ]);

  const rawData = await ffmpeg.readFile(outputName);
  // Handle FileData type which can be Uint8Array or string
  let blob: Blob;
  if (typeof rawData === 'string') {
    blob = new Blob([rawData], { type: 'video/mp4' });
  } else {
    // Create a new ArrayBuffer copy to avoid SharedArrayBuffer type issues
    const uint8 = rawData as Uint8Array;
    const copy = new Uint8Array(uint8.length);
    copy.set(uint8);
    blob = new Blob([copy], { type: 'video/mp4' });
  }
  
  const compressedFile = new File(
    [blob],
    file.name.replace(/\.[^.]+$/i, '.mp4'),
    { type: 'video/mp4' }
  );

  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  ffmpeg.off('progress', () => {});
  onProgress?.(100);

  return {
    file: compressedFile,
    originalSize: file.size,
    compressedSize: compressedFile.size,
    compressionRatio: compressedFile.size / file.size,
    skipped: false,
    profile,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getExtension(filename: string): string {
  const match = filename.match(/\.[^.]+$/i);
  return match ? match[0] : '.mp4';
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[i]}`;
}
