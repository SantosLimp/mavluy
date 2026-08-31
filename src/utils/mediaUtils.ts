/**
 * Media Utilities for YouTube Extraction, Ultra-Fast Image Compression & Batch File Upload
 */

export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  const trimmed = url.trim();
  
  // Handle shorts: https://youtube.com/shorts/VIDEO_ID
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch && shortsMatch[1]) return shortsMatch[1];
  
  // Handle youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
  if (shortMatch && shortMatch[1]) return shortMatch[1];
  
  // Handle youtube.com/watch?v=VIDEO_ID
  const standardMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
  if (standardMatch && standardMatch[1]) return standardMatch[1];
  
  // Handle youtube.com/embed/VIDEO_ID
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i);
  if (embedMatch && embedMatch[1]) return embedMatch[1];
  
  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  
  return null;
}

export function getYouTubeThumbnail(urlOrId: string): string {
  const id = extractYouTubeId(urlOrId) || urlOrId;
  if (!id) return '';
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export function getYouTubeEmbedUrl(urlOrId: string, autoplay = false): string {
  const id = extractYouTubeId(urlOrId) || urlOrId;
  if (!id) return '';
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1${autoplay ? '&autoplay=1' : ''}`;
}

/**
 * Ultra-Fast hardware-accelerated image reader and compressor.
 * Uses native createImageBitmap off-thread decoding when supported for instant sub-20ms processing.
 */
export async function readFileAsDataUrl(
  file: File, 
  maxWidth = 1200, 
  maxHeight = 1200, 
  quality = 0.82
): Promise<string> {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    throw new Error('Selected file must be a valid image format.');
  }

  // If SVG or very tiny image (< 100KB), read directly with FileReader
  if (file.type === 'image/svg+xml' || (file.size < 100 * 1024 && file.type === 'image/webp')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // Fast off-thread bitmap pipeline
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file);
      let { width, height } = bitmap;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: file.type === 'image/png' });
      
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close(); // free memory immediately
        const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        return canvas.toDataURL(format, quality);
      }
    } catch (bitmapErr) {
      // Fall back to FileReader on any bitmap error
    }
  }

  // Fallback for browsers without createImageBitmap
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onerror = () => resolve(result);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(format, quality));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Parallel batch upload helper for multiple images at once.
 */
export async function readMultipleFilesAsDataUrls(
  files: FileList | File[],
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string[]> {
  const fileArray = Array.from(files).filter(f => f && f.type && f.type.startsWith('image/'));
  if (fileArray.length === 0) return [];
  
  return Promise.all(fileArray.map(f => readFileAsDataUrl(f, maxWidth, maxHeight, quality)));
}

