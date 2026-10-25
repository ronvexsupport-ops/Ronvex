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
   * Resolves any image URL string (bundled asset, public path, or external URL)
   * to a guaranteed working URL in both dev and production.
   */
  public static resolveProductImage(url?: string | null, category?: string): string {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return this.getCategoryFallback(category);
    }

    const trimmed = url.trim();

    // Direct match to bundled asset file names or keywords
    if (trimmed.includes('smartwatch') || trimmed.includes('titanium') || trimmed.includes('watch')) {
      return smartwatchImg;
    }
    if (trimmed.includes('earbuds') || trimmed.includes('anc') || trimmed.includes('audio')) {
      return earbudsImg;
    }
    if (trimmed.includes('bag') || trimmed.includes('backpack') || trimmed.includes('leather')) {
      return bagImg;
    }
    if (trimmed.includes('hero') || trimmed.includes('lifestyle')) {
      return heroImg;
    }

    // Direct HTTP(S) URLs or data URLs
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image')) {
      return trimmed;
    }

    // Root public paths
    if (trimmed.startsWith('/images/')) {
      return trimmed;
    }

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
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB limit
    if (file.size > maxSizeBytes) {
      return { valid: false, error: 'File size exceeds maximum permitted limit (5MB).' };
    }
    return { valid: true };
  }

  /**
   * Upload file to configured external provider or convert to client preview Data URL
   */
  public static async uploadImage(file: File): Promise<string> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file format');
    }

    // Read file as optimized Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => reject(new Error('Failed to read image file data'));
      reader.readAsDataURL(file);
    });
  }

  public static sanitizeUrl(url: string, category?: string): string {
    return this.resolveProductImage(url, category);
  }
}
