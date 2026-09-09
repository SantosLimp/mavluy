import fs from 'fs';
import path from 'path';

function sanitizeCloudinaryEnvironment() {
  try {
    const rawUrl = process.env.CLOUDINARY_URL;
    if (typeof rawUrl === 'string') {
      const trimmed = rawUrl.trim();
      if (!trimmed || trimmed === 'undefined' || trimmed === 'null' || trimmed === '""' || trimmed === "''") {
        delete process.env.CLOUDINARY_URL;
      } else if (!trimmed.toLowerCase().startsWith('cloudinary://')) {
        if (trimmed.includes('@') && trimmed.includes(':')) {
          process.env.CLOUDINARY_URL = `cloudinary://${trimmed}`;
        } else {
          delete process.env.CLOUDINARY_URL;
        }
      }
    }

    const rawAccountUrl = process.env.CLOUDINARY_ACCOUNT_URL;
    if (typeof rawAccountUrl === 'string') {
      const trimmed = rawAccountUrl.trim();
      if (!trimmed || !trimmed.toLowerCase().startsWith('account://')) {
        delete process.env.CLOUDINARY_ACCOUNT_URL;
      }
    }
  } catch (err) {
  }
}

sanitizeCloudinaryEnvironment();

import { v2 as cloudinary } from 'cloudinary';

export const CLOUDINARY_CONFIG_FILE = path.join(process.cwd(), 'cloudinary_config.json');

export interface CloudinaryConfigData {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
}

let activeConfig: CloudinaryConfigData = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  apiKey: process.env.CLOUDINARY_API_KEY || '',
  apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  folder: 'mavluy_store'
};

export function initCloudinaryConfig(): void {
  sanitizeCloudinaryEnvironment();

  try {
    if (fs.existsSync(CLOUDINARY_CONFIG_FILE)) {
      const saved = JSON.parse(fs.readFileSync(CLOUDINARY_CONFIG_FILE, 'utf-8'));
      if (saved && saved.cloudName && saved.apiKey && saved.apiSecret) {
        activeConfig = {
          cloudName: String(saved.cloudName).trim(),
          apiKey: String(saved.apiKey).trim(),
          apiSecret: String(saved.apiSecret).trim(),
          folder: (saved.folder && String(saved.folder).trim()) || 'mavluy_store'
        };
      }
    }
  } catch (e) {
  }

  try {
    if (activeConfig.cloudName && activeConfig.apiKey && activeConfig.apiSecret) {
      cloudinary.config({
        cloud_name: activeConfig.cloudName,
        api_key: activeConfig.apiKey,
        api_secret: activeConfig.apiSecret,
        secure: true
      });
    } else if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.toLowerCase().startsWith('cloudinary://')) {
      cloudinary.config(true);
    }
  } catch (err) {
    console.error('[Cloudinary] Safe config notice:', err);
  }
}

initCloudinaryConfig();

export function isCloudinaryReady(): boolean {
  sanitizeCloudinaryEnvironment();
  const hasConfig = !!(activeConfig.cloudName && activeConfig.apiKey && activeConfig.apiSecret);
  const hasEnvUrl = !!(process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.toLowerCase().startsWith('cloudinary://'));
  return hasConfig || hasEnvUrl;
}

export function getCloudinaryStatus() {
  const ready = isCloudinaryReady();
  const apiKeyMasked = activeConfig.apiKey
    ? `${activeConfig.apiKey.slice(0, 4)}••••${activeConfig.apiKey.slice(-3)}`
    : '';

  return {
    connected: ready,
    cloudName: activeConfig.cloudName || '',
    apiKeyMasked,
    folder: activeConfig.folder || 'mavluy_store',
    hasEnv: !!(process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_URL)
  };
}

export async function uploadToCloudinary(image: string, folder?: string) {
  if (!isCloudinaryReady()) {
    throw new Error('Cloudinary is not configured yet.');
  }

  initCloudinaryConfig();

  const targetFolder = folder || activeConfig.folder || 'mavluy_store';
  const uploadRes = await cloudinary.uploader.upload(image, {
    folder: targetFolder,
    resource_type: 'image',
    format: 'webp',
    quality: 'auto:good'
  });

  return {
    url: uploadRes.secure_url,
    publicId: uploadRes.public_id,
    provider: 'cloudinary'
  };
}

export async function testAndSaveCloudinaryConfig(params: {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder?: string;
}) {
  const { cloudName, apiKey, apiSecret, folder } = params;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloud Name, API Key, and API Secret are required.');
  }

  sanitizeCloudinaryEnvironment();

  cloudinary.config({
    cloud_name: cloudName.trim(),
    api_key: apiKey.trim(),
    api_secret: apiSecret.trim(),
    secure: true
  });

  await cloudinary.api.ping();

  activeConfig = {
    cloudName: cloudName.trim(),
    apiKey: apiKey.trim(),
    apiSecret: apiSecret.trim(),
    folder: (folder && folder.trim()) || 'mavluy_store'
  };

  fs.writeFileSync(CLOUDINARY_CONFIG_FILE, JSON.stringify(activeConfig, null, 2), 'utf-8');
  initCloudinaryConfig();

  return activeConfig;
}

export function disconnectCloudinary() {
  try {
    if (fs.existsSync(CLOUDINARY_CONFIG_FILE)) {
      fs.unlinkSync(CLOUDINARY_CONFIG_FILE);
    }
  } catch (e) {}

  activeConfig = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: 'mavluy_store'
  };

  initCloudinaryConfig();
}

export { cloudinary };
