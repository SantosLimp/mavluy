/**
 * Media and Image Utility Functions
 * Handles client-side image reading, canvas compression/resizing,
 * YouTube URL/ID extraction, embed formatting, and cloud upload via /api/upload.
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
 * Resizes an image Data URL using HTML5 Canvas to reduce file size and upload time.
 */
export function resizeImageDataUrl(
  dataUrl: string,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.85
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

      if (width <= maxWidth && height <= maxHeight) {
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
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const format = dataUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      const resized = canvas.toDataURL(format, quality);
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
 */
export async function uploadImageToCloud(
  input: File | string,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.85,
  folder = 'mavluy_store'
): Promise<string> {
  let dataUrl: string;

  if (typeof input === 'string') {
    if (input.startsWith('http://') || input.startsWith('https://') || input.startsWith('/uploads/')) {
      return input;
    }
    dataUrl = input;
  } else {
    dataUrl = await readFileAsDataUrl(input);
  }

  // Optimize before uploading
  try {
    dataUrl = await resizeImageDataUrl(dataUrl, maxWidth, maxHeight, quality);
  } catch (e) {
    console.warn('Image optimization skipped:', e);
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
 * Uploads multiple images in parallel with concurrency throttling.
 */
export async function uploadMultipleImagesToCloud(
  files: FileList | File[],
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.85,
  folder = 'mavluy_store'
): Promise<string[]> {
  const fileArray = Array.from(files);
  const results: string[] = [];

  for (const file of fileArray) {
    try {
      const url = await uploadImageToCloud(file, maxWidth, maxHeight, quality, folder);
      results.push(url);
    } catch (err) {
      console.error('Failed to upload file:', file.name, err);
    }
  }

  return results;
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
