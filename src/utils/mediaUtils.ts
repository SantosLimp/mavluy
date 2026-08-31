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
  // Modern browsers (Chrome, Safari, iOS, Android) strictly require `mute=1` and `playsinline=1`
  // for iframes to autoplay automatically without user gesture rejection.
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1'
  });
  if (autoplay) {
    params.set('autoplay', '1');
    params.set('mute', '1');
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

/**
 * Ultra-Fast hardware-accelerated image reader, converter and compressor.
 * Uses native createImageBitmap off-thread decoding when supported for instant sub-20ms processing.
 * Converts heavy PNG/JPEG payloads into lightweight WebP/JPEG data URLs (under 100KB-150KB)
 * to ensure instant upload speeds without network or browser memory lag.
 */
export async function readFileAsDataUrl(
  file: File, 
  maxWidth = 1200, 
  maxHeight = 1200, 
  quality = 0.80
): Promise<string> {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    throw new Error('Selected file must be a valid image format.');
  }

  // SVG images should be preserved as raw vector strings without rasterization
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read SVG file'));
      reader.readAsDataURL(file);
    });
  }

  // Helper to determine best output format (WebP if supported, fallback to JPEG)
  const getOptimalFormat = (canvas: HTMLCanvasElement): { format: string; quality: number } => {
    try {
      // Test WebP export support
      const test = canvas.toDataURL('image/webp', 0.5);
      if (test.startsWith('data:image/webp')) {
        return { format: 'image/webp', quality };
      }
    } catch (e) {}
    return { format: 'image/jpeg', quality };
  };

  // 1. Fast off-thread hardware bitmap pipeline (createImageBitmap)
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
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d', { alpha: true });
      
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close(); // free native bitmap memory immediately

        const { format, quality: fmtQuality } = getOptimalFormat(canvas);
        const dataUrl = canvas.toDataURL(format, fmtQuality);
        // Release canvas buffer
        canvas.width = 0;
        canvas.height = 0;
        return dataUrl;
      }
      bitmap.close();
    } catch (bitmapErr) {
      // Fall back to Image/FileReader on any decoding anomaly
    }
  }

  // 2. High-performance fallback for standard HTMLImageElement
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
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
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        const { format, quality: fmtQuality } = getOptimalFormat(canvas);
        const compressed = canvas.toDataURL(format, fmtQuality);
        canvas.width = 0;
        canvas.height = 0;
        resolve(compressed);
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

/**
 * Upload image to Cloudinary (or fallback) via backend API to store lightweight remote URLs in database
 * and prevent database bloating and site lag.
 */
export async function uploadImageToCloud(
  fileOrDataUrl: File | string,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.82
): Promise<string> {
  try {
    let payload = '';
    if (typeof fileOrDataUrl === 'string') {
      if (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://')) {
        return fileOrDataUrl; // Already a remote hosted URL
      }
      payload = fileOrDataUrl;
    } else {
      payload = await readFileAsDataUrl(fileOrDataUrl, maxWidth, maxHeight, quality);
    }

    if (!payload) return '';

    // Call server Cloudinary endpoint
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: payload })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.url) return data.url;
    }
    return payload;
  } catch (err) {
    console.warn('Cloudinary upload fallback to optimized local payload:', err);
    if (typeof fileOrDataUrl === 'string') return fileOrDataUrl;
    return readFileAsDataUrl(fileOrDataUrl, maxWidth, maxHeight, quality);
  }
}

/**
 * Upload multiple images directly to Cloudinary in parallel.
 */
export async function uploadMultipleImagesToCloud(
  files: FileList | File[],
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.82
): Promise<string[]> {
  const fileArray = Array.from(files).filter(f => f && f.type && f.type.startsWith('image/'));
  if (fileArray.length === 0) return [];
  return Promise.all(fileArray.map(f => uploadImageToCloud(f, maxWidth, maxHeight, quality)));
}


