/**
 * Client-side file compression utility.
 * - Images: re-encodes via canvas at high quality, strips EXIF, caps max dimensions
 * - PDFs & Word docs: already compressed internally; passed through as-is
 */

const MAX_IMAGE_DIMENSION = 4096; // cap very large photos
const JPEG_QUALITY = 0.92; // high quality, still saves space vs raw camera output
const WEBP_QUALITY = 0.92;

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

function isPdfOrDoc(file: File): boolean {
  return (
    file.type === 'application/pdf' ||
    file.type === 'application/msword' ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    const url = URL.createObjectURL(file);
    img.src = url;
  });
}

async function compressImage(file: File): Promise<File> {
  const img = await loadImage(file);

  let { width, height } = img;

  // Down-scale only if exceeding max dimension (preserves quality for normal-sized images)
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return file; // fallback to original

  // Use high-quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Clean up the source object URL
  URL.revokeObjectURL(img.src);

  // Choose output format: keep PNG for PNGs (lossless), use JPEG for others
  let outputType: string;
  let quality: number;

  if (file.type === 'image/png') {
    // PNG → re-encode as PNG (lossless, but strips metadata)
    outputType = 'image/png';
    quality = 1;
  } else if (file.type === 'image/webp') {
    outputType = 'image/webp';
    quality = WEBP_QUALITY;
  } else {
    // JPEG and other formats → high-quality JPEG
    outputType = 'image/jpeg';
    quality = JPEG_QUALITY;
  }

  return new Promise<File>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.size >= file.size) {
          // If compressed is larger or equal, use original
          resolve(file);
          return;
        }
        const compressed = new File([blob], file.name, {
          type: outputType,
          lastModified: Date.now(),
        });
        // Compression stats logged silently
        resolve(compressed);
      },
      outputType,
      quality
    );
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Compress a file before upload.
 * - Images are re-encoded at high quality with EXIF stripping and optional downscale.
 * - PDFs and Word docs pass through unchanged (already compressed internally).
 * - Returns the original file if compression doesn't reduce size.
 */
export async function compressFileForUpload(file: File): Promise<File> {
  if (isImageFile(file)) {
    try {
      return await compressImage(file);
    } catch (err) {
      // Compression failed — returning original file
      return file;
    }
  }

  // PDFs and Word docs are already compressed internally
  if (isPdfOrDoc(file)) {
    return file;
  }

  // Unknown types: pass through
  return file;
}
