import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

export const CLOUDINARY_CONFIG_FILE = path.join(process.cwd(), 'cloudinary.config.json');

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder?: string;
}

let activeConfig: CloudinaryConfig | null = null;

function loadStoredConfig(): CloudinaryConfig | null {
  if (activeConfig) return activeConfig;

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    activeConfig = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      folder: process.env.CLOUDINARY_FOLDER || 'mavluy_store'
    };
    configureCloudinary(activeConfig);
    return activeConfig;
  }

  if (fs.existsSync(CLOUDINARY_CONFIG_FILE)) {
    try {
      const raw = fs.readFileSync(CLOUDINARY_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.cloudName && parsed.apiKey && parsed.apiSecret) {
        activeConfig = parsed;
        configureCloudinary(activeConfig!);
        return activeConfig;
      }
    } catch (e) {
      console.error('Error loading cloudinary.config.json:', e);
    }
  }

  return null;
}

function configureCloudinary(config: CloudinaryConfig) {
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true
  });
}

// Initial check
loadStoredConfig();

export function isCloudinaryReady(): boolean {
  const config = loadStoredConfig();
  return !!(config && config.cloudName && config.apiKey && config.apiSecret);
}

export function getCloudinaryStatus() {
  const config = loadStoredConfig();
  const hasEnv = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY);
  if (!config) {
    return {
      connected: false,
      cloudName: '',
      apiKeyMasked: '',
      folder: 'mavluy_store',
      hasEnv
    };
  }

  const maskedKey = config.apiKey.length > 4
    ? `${config.apiKey.slice(0, 2)}****${config.apiKey.slice(-2)}`
    : '****';

  return {
    connected: true,
    cloudName: config.cloudName,
    apiKeyMasked: maskedKey,
    folder: config.folder || 'mavluy_store',
    hasEnv
  };
}

export async function testAndSaveCloudinaryConfig(newConfig: CloudinaryConfig): Promise<CloudinaryConfig> {
  configureCloudinary(newConfig);

  // Test credentials by making a lightweight API call or ping
  await cloudinary.api.ping();

  activeConfig = newConfig;
  fs.writeFileSync(CLOUDINARY_CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf-8');
  return newConfig;
}

export function disconnectCloudinary(): void {
  activeConfig = null;
  if (fs.existsSync(CLOUDINARY_CONFIG_FILE)) {
    try {
      fs.unlinkSync(CLOUDINARY_CONFIG_FILE);
    } catch (e) {}
  }
}

export async function uploadToCloudinary(image: string, folder?: string): Promise<{ url: string; publicId: string }> {
  if (!isCloudinaryReady()) {
    throw new Error('Cloudinary is not configured');
  }

  const targetFolder = folder || activeConfig?.folder || 'mavluy_store';
  const result = await cloudinary.uploader.upload(image, {
    folder: targetFolder,
    resource_type: 'auto'
  });

  return {
    url: result.secure_url || result.url,
    publicId: result.public_id
  };
}
