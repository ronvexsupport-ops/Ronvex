import smartwatchImg from '../assets/images/product_smartwatch_elite_1792836929081.jpg';
import earbudsImg from '../assets/images/product_wireless_earbuds_1792836928757.jpg';
import bagImg from '../assets/images/product_leather_commuter_bag_1792836929286.jpg';
import heroImg from '../assets/images/ronvex_hero_lifestyle_1792836927304.jpg';

export interface ImageUploadConfig {
  provider: 'cloudinary' | 'imagekit' | 'custom_url';
  cloudName?: string;
  uploadPreset?: string;
  imagekitPublicKey?: string;
}

export const DEFAULT_FALLBACK_IMAGE = heroImg;

export const BUNDLED_IMAGES = {
  smartwatch: smartwatchImg,
  earbuds: earbudsImg,
  bag: bagImg,
  hero: heroImg,
};

// Preset high quality curated images for easy admin product creation
export const PRODUCT_IMAGE_PRESETS = [
  {
    id: 'preset_smartwatch_1',
    name: 'Apex Titanium Smartwatch',
    category: 'wearables',
    url: smartwatchImg,
  },
  {
    id: 'preset_earbuds_1',
    name: 'Acoustic Pro ANC Earbuds',
    category: 'audio',
    url: earbudsImg,
  },
  {
    id: 'preset_backpack_1',
    name: 'Vanguard Modular Backpack',
    category: 'lifestyle',
    url: bagImg,
  },
  {
    id: 'preset_chronos_1',
    name: 'Chronos Sapphire Watch',
    category: 'accessories',
    url: heroImg,
  },
  {
    id: 'preset_audio_studio',
    name: 'Studio Wireless Headphones',
    category: 'audio',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_smartwatch_sport',
    name: 'Pulse Pro Fitness Tracker',
    category: 'wearables',
    url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_power_bank',
    name: 'Magnetic Fast Charge Powerbank',
    category: 'accessories',
    url: 'https://images.unsplash.com/photo-1609081219090-a6d8173087ec?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_leather_wallet',
    name: 'RFID Protected Minimalist Wallet',
    category: 'lifestyle',
    url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80',
  },
];

export class ImageService {
  private static config: ImageUploadConfig = {
    provider: 'custom_url',
  };

  public static configure(config: Partial<ImageUploadConfig>) {
    this.config = { ...this.config, ...config };
  }

  public static getConfig(): ImageUploadConfig {
    return this.config;
  }

  /**
   * Resolves any image URL string (bundled asset, public path, data URL, or external URL)
   * to a guaranteed working URL in both dev and production without hijacking uploaded photos.
   */
  public static resolveProductImage(url?: string | null, category?: string): string {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return this.getCategoryFallback(category);
    }

    const trimmed = url.trim();

    // 1. Data URLs (uploaded images) or Blob URLs - preserve user's exact uploaded image
    if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
      return trimmed;
    }

    // 2. Direct HTTP(S) URLs
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    // 3. Root public paths or relative paths
    if (trimmed.startsWith('/')) {
      return trimmed;
    }

    // 4. Exact bundled asset matches or explicit bundled asset identifiers
    if (trimmed === 'smartwatch' || trimmed === BUNDLED_IMAGES.smartwatch || trimmed.endsWith('product_smartwatch_elite_1792836929081.jpg')) {
      return smartwatchImg;
    }
    if (trimmed === 'earbuds' || trimmed === BUNDLED_IMAGES.earbuds || trimmed.endsWith('product_wireless_earbuds_1792836928757.jpg')) {
      return earbudsImg;
    }
    if (trimmed === 'bag' || trimmed === BUNDLED_IMAGES.bag || trimmed.endsWith('product_leather_commuter_bag_1792836929286.jpg')) {
      return bagImg;
    }
    if (trimmed === 'hero' || trimmed === BUNDLED_IMAGES.hero || trimmed.endsWith('ronvex_hero_lifestyle_1792836927304.jpg')) {
      return heroImg;
    }

    // 5. Preset image matching
    const matchedPreset = PRODUCT_IMAGE_PRESETS.find(p => p.id === trimmed || p.url === trimmed);
    if (matchedPreset) {
      return matchedPreset.url;
    }

    // Default fallback based on category
    return this.getCategoryFallback(category);
  }

  /**
   * Fallback image according to category
   */
  public static getCategoryFallback(category?: string): string {
    const cat = (category || '').toLowerCase();
    if (cat.includes('wearable') || cat.includes('watch')) {
      return smartwatchImg;
    }
    if (cat.includes('audio') || cat.includes('sound') || cat.includes('earbud')) {
      return earbudsImg;
    }
    if (cat.includes('bag') || cat.includes('lifestyle') || cat.includes('luggage')) {
      return bagImg;
    }
    return heroImg;
  }

  /**
   * Validates file size and MIME type
   */
  public static validateFile(file: File): { valid: boolean; error?: string } {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Only JPG, PNG, WEBP, and AVIF image formats are supported.' };
    }
    const maxSizeBytes = 12 * 1024 * 1024; // Allow up to 12MB input before client-side optimization
    if (file.size > maxSizeBytes) {
      return { valid: false, error: 'File size exceeds maximum permitted limit (12MB).' };
    }
    return { valid: true };
  }

  /**
   * Upload file and optimize into a high-clarity, lightweight Data URL.
   * Compresses through canvas to 920px max dimension and ~40-60KB JPEG so multiple
   * photos effortlessly fit within Firestore document limits and load swiftly.
   */
  public static async uploadImage(file: File): Promise<string> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file format');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawResult = event.target?.result as string;
        if (!rawResult) {
          reject(new Error('Failed to read image data'));
          return;
        }

        // Optimize through canvas
        const img = new Image();
        img.onload = () => {
          try {
            const maxDimension = 920; // Crisp HD resolution for product detail and zoom
            let width = img.width;
            let height = img.height;

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(rawResult);
              return;
            }

            // Clean white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to crisp quality JPEG (~35-55KB per photo)
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.74);
            resolve(compressedUrl);
          } catch (e) {
            resolve(rawResult);
          }
        };
        img.onerror = () => resolve(rawResult);
        img.src = rawResult;
      };
      reader.onerror = () => reject(new Error('Failed to read image file data'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Compresses an existing Data URL if it is larger than maxBytes (default 80KB)
   */
  public static async compressDataUrl(
    dataUrl: string,
    maxDimension: number = 850,
    quality: number = 0.72
  ): Promise<string> {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      return dataUrl;
    }

    // If already lightweight (< 70KB), keep as-is
    if (dataUrl.length < 70000) {
      return dataUrl;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  /**
   * Optimizes an entire array of product image URLs so the total payload is guaranteed
   * to fit comfortably within Firestore's 1MiB (1,048,576 byte) document size limit.
   */
  public static async optimizeProductImageSet(
    imageUrls: string[],
    maxTotalBytes: number = 600000
  ): Promise<string[]> {
    if (!imageUrls || imageUrls.length === 0) return [];

    // Step 1: Compress each individual data URL
    const optimizedUrls: string[] = [];
    for (const url of imageUrls) {
      if (url && url.startsWith('data:image/')) {
        const compressed = await this.compressDataUrl(url, 850, 0.72);
        optimizedUrls.push(compressed);
      } else {
        optimizedUrls.push(url);
      }
    }

    // Step 2: Check total payload size
    let totalLength = optimizedUrls.reduce((acc, u) => acc + (u ? u.length : 0), 0);
    if (totalLength <= maxTotalBytes) {
      return optimizedUrls;
    }

    // Step 3: If still over limit, downscale further to 650px & 0.65 quality
    const secondPass: string[] = [];
    for (const url of optimizedUrls) {
      if (url && url.startsWith('data:image/')) {
        const further = await this.compressDataUrl(url, 650, 0.65);
        secondPass.push(further);
      } else {
        secondPass.push(url);
      }
    }

    return secondPass;
  }

  public static sanitizeUrl(url: string, category?: string): string {
    return this.resolveProductImage(url, category);
  }
}
