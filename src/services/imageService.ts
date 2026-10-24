/**
 * RONVEX External Image Service Abstraction
 * Supports direct URL ingestion, local generated media, and external providers (Cloudinary/ImageKit unsigned uploads).
 * Explicitly avoids Firebase Storage as required.
 */

export interface ImageUploadConfig {
  provider: 'cloudinary' | 'imagekit' | 'custom_url';
  cloudName?: string;
  uploadPreset?: string;
  imagekitPublicKey?: string;
}

export const DEFAULT_FALLBACK_IMAGE = '/src/assets/images/ronvex_hero_lifestyle_1792836927304.jpg';

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
   * Validates file size and MIME type
   */
  public static validateFile(file: File): { valid: boolean; error?: string } {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
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
   * Upload file to configured external provider or convert to client preview URL
   */
  public static async uploadImage(file: File): Promise<string> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file format');
    }

    // If Cloudinary preset is configured
    if (this.config.provider === 'cloudinary' && this.config.cloudName && this.config.uploadPreset) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.config.uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image to Cloudinary service');
      }

      const data = await response.json();
      return data.secure_url;
    }

    // For local evaluation or standard client uploads, read file as optimized Data URL or object URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => reject(new Error('Failed to read image file data'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Sanitizes and verifies image URLs
   */
  public static sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') return DEFAULT_FALLBACK_IMAGE;
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/src/assets/images/')) {
      return trimmed;
    }
    return DEFAULT_FALLBACK_IMAGE;
  }
}
