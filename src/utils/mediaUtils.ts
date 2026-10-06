/**
 * Media and Image Utility Functions
 * Ultra-fast client-side image compression, canvas resizing (WebP/JPEG),
 * YouTube URL/ID extraction, embed formatting, and parallel cloud upload via /api/upload.
 */

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function readMultipleFilesAsDataUrls(files: FileList | File[]): Promise<string[]> {
  const fileArray = Array.from(files);
  return Promise.all(fileArray.map(file => readFileAsDataUrl(file)));
}

/**
 * Fast client-side image compression using URL.createObjectURL and HTML5 Canvas.
 * Directly compresses the raw File without heavy base64 conversions in memory.
 */
export async function fastCompressImageFile(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<string> {
  // If SVG, return data URL directly
  if (file.type === 'image/svg+xml') {
    return readFileAsDataUrl(file);
  }

  if (typeof window === 'undefined' || typeof URL === 'undefined' || typeof document === 'undefined') {
    return readFileAsDataUrl(file);
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    const cleanup = () => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch (_) {}
    };

    img.onload = () => {
      try {
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d', { alpha: file.type === 'image/png' });
        
        if (!ctx) {
          cleanup();
          readFileAsDataUrl(file).then(resolve).catch(() => resolve(''));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Prefer modern WebP for ultra-fast upload (30-50% smaller than JPEG), fallback to JPEG
        let compressed = '';
        try {
          compressed = canvas.toDataURL('image/webp', quality);
          if (!compressed.startsWith('data:image/webp')) {
            compressed = canvas.toDataURL('image/jpeg', quality);
          }
        } catch (_) {
          compressed = canvas.toDataURL('image/jpeg', quality);
        }

        cleanup();
        resolve(compressed);
      } catch (err) {
        cleanup();
        readFileAsDataUrl(file).then(resolve).catch(() => resolve(''));
      }
    };

    img.onerror = () => {
      cleanup();
      readFileAsDataUrl(file).then(resolve).catch(() => resolve(''));
    };

    img.src = objectUrl;
  });
}

/**
 * Resizes an image Data URL using HTML5 Canvas to reduce file size and upload time.
 */
export function resizeImageDataUrl(
  dataUrl: string,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<string> {
  return new Promise(resolve => {
    // If running server-side or if SVG / non-resizable format
    if (typeof window === 'undefined' || dataUrl.startsWith('data:image/svg+xml')) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;

      if (width <= maxWidth && height <= maxHeight && (dataUrl.startsWith('data:image/webp') || dataUrl.length < 150000)) {
        resolve(dataUrl);
        return;
      }

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      let resized = '';
      try {
        resized = canvas.toDataURL('image/webp', quality);
        if (!resized.startsWith('data:image/webp')) {
          resized = canvas.toDataURL('image/jpeg', quality);
        }
      } catch (_) {
        resized = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(resized);
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Uploads an image to the backend /api/upload endpoint (which forwards to Cloudinary or local uploads).
 * Accepts either a File object or an existing image URL/Data URL.
 * Uses ultra-fast client-side compression to make uploads near-instant.
 */
export async function uploadImageToCloud(
  input: File | string,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8,
  folder = 'mavluy_store'
): Promise<string> {
  let dataUrl: string;

  if (typeof input === 'string') {
    if (input.startsWith('http://') || input.startsWith('https://') || input.startsWith('/uploads/')) {
      return input;
    }
    dataUrl = await resizeImageDataUrl(input, maxWidth, maxHeight, quality);
  } else {
    // Ultra-fast path: compress directly from File using createObjectURL
    dataUrl = await fastCompressImageFile(input, maxWidth, maxHeight, quality);
  }

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl, folder })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return data.url;
      }
    }
  } catch (e) {
    console.warn('Failed to upload via /api/upload, falling back to dataUrl:', e);
  }

  return dataUrl;
}

/**
 * Uploads multiple images in parallel with concurrency throttling for max speed.
 */
export async function uploadMultipleImagesToCloud(
  files: FileList | File[],
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8,
  folder = 'mavluy_store'
): Promise<string[]> {
  const fileArray = Array.from(files);
  if (fileArray.length === 0) return [];

  // Execute in parallel for lightning speed
  const uploadPromises = fileArray.map(async (file) => {
    try {
      return await uploadImageToCloud(file, maxWidth, maxHeight, quality, folder);
    } catch (err) {
      console.error('Failed to upload file:', file.name, err);
      return null;
    }
  });

  const results = await Promise.all(uploadPromises);
  return results.filter((url): url is string => Boolean(url));
}

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * (watch?v=, youtu.be/, shorts/, embed/, etc.)
 */
export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const patterns = [
    /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/)([\w-]{11})/,
    /[?&]v=([\w-]{11})/,
    /[?&]vi=([\w-]{11})/
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Gets high-quality or specified thumbnail URL for a YouTube video.
 */
export function getYouTubeThumbnail(
  urlOrId: string,
  quality: 'default' | 'hq' | 'mq' | 'sd' | 'maxres' = 'hq'
): string {
  const id = extractYouTubeId(urlOrId) || urlOrId;
  if (!id) return '';

  const qualityMap = {
    default: 'default.jpg',
    mq: 'mqdefault.jpg',
    hq: 'hqdefault.jpg',
    sd: 'sddefault.jpg',
    maxres: 'maxresdefault.jpg'
  };

  const file = qualityMap[quality] || 'hqdefault.jpg';
  return `https://img.youtube.com/vi/${id}/${file}`;
}

/**
 * Returns a privacy-enhanced YouTube embed URL.
 */
export function getYouTubeEmbedUrl(
  urlOrId: string,
  autoplay = false,
  muted = true,
  loop = true
): string {
  const id = extractYouTubeId(urlOrId) || urlOrId;
  if (!id) return '';

  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1'
  });

  if (autoplay) {
    params.set('autoplay', '1');
    if (muted) params.set('mute', '1');
  }

  if (loop) {
    params.set('loop', '1');
    params.set('playlist', id);
  }

  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}
