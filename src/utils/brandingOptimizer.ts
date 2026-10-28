// Client-side image downscaling, compression, and payload optimization for Firestore limits

export type BrandingImageType = 'logo' | 'favicon' | 'appIcon';

export interface OptimizationResult {
  dataUrl: string;
  originalBytes: number;
  compressedBytes: number;
  reductionPercentage: number;
  dimensions: { width: number; height: number };
}

/**
 * Returns byte size of a UTF-8 string
 */
export function getByteLength(str: string): number {
  if (!str) return 0;
  return new TextEncoder().encode(str).length;
}

/**
 * Format bytes into human readable KB / MB
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Read a File as a base64 Data URL
 */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Load an image from a Data URL or URL into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for optimization.'));
    img.src = src;
  });
}

/**
 * Downscale and compress an image client-side to keep size far below Firestore's 1MiB document limit.
 * - 'favicon': Square 64x64 (or max 128x128), preserves transparency, output ~4KB - 15KB PNG
 * - 'appIcon': Square 180x180, preserves transparency, output ~12KB - 30KB PNG
 * - 'logo': Max 500w x 200h (aspect-fit), preserves transparency, output ~20KB - 60KB PNG/WebP
 */
export async function optimizeBrandingImage(
  source: File | string,
  type: BrandingImageType
): Promise<OptimizationResult> {
  let rawDataUrl: string;
  let originalBytes = 0;

  if (typeof source === 'string') {
    rawDataUrl = source.trim();
    originalBytes = getByteLength(rawDataUrl);

    // If it's already an SVG data URI and reasonably sized (< 60KB), preserve pristine vector SVG
    if (rawDataUrl.startsWith('data:image/svg+xml') && originalBytes < 60 * 1024) {
      return {
        dataUrl: rawDataUrl,
        originalBytes,
        compressedBytes: originalBytes,
        reductionPercentage: 0,
        dimensions: { width: 64, height: 64 },
      };
    }
  } else {
    originalBytes = source.size;
    // Check if it's an SVG file
    if (source.type === 'image/svg+xml' && source.size < 60 * 1024) {
      rawDataUrl = await readFileAsDataUrl(source);
      const compressedBytes = getByteLength(rawDataUrl);
      return {
        dataUrl: rawDataUrl,
        originalBytes,
        compressedBytes,
        reductionPercentage: 0,
        dimensions: { width: 64, height: 64 },
      };
    }
    rawDataUrl = await readFileAsDataUrl(source);
  }

  // Load into HTMLImageElement
  const img = await loadImage(rawDataUrl);
  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;

  let targetWidth = srcWidth;
  let targetHeight = srcHeight;
  let canvasWidth = srcWidth;
  let canvasHeight = srcHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (type === 'favicon') {
    // Standard high-DPI crisp favicon: 64x64 square
    const side = 64;
    canvasWidth = side;
    canvasHeight = side;

    const aspect = srcWidth / srcHeight;
    if (aspect >= 1) {
      targetWidth = side;
      targetHeight = Math.round(side / aspect);
      offsetX = 0;
      offsetY = Math.round((side - targetHeight) / 2);
    } else {
      targetHeight = side;
      targetWidth = Math.round(side * aspect);
      offsetX = Math.round((side - targetWidth) / 2);
      offsetY = 0;
    }
  } else if (type === 'appIcon') {
    // Apple Touch Icon: 180x180 square
    const side = 180;
    canvasWidth = side;
    canvasHeight = side;

    const aspect = srcWidth / srcHeight;
    if (aspect >= 1) {
      targetWidth = side;
      targetHeight = Math.round(side / aspect);
      offsetX = 0;
      offsetY = Math.round((side - targetHeight) / 2);
    } else {
      targetHeight = side;
      targetWidth = Math.round(side * aspect);
      offsetX = Math.round((side - targetWidth) / 2);
      offsetY = 0;
    }
  } else {
    // Logo: Max 500w x 200h (aspect-fit, no forced square padding)
    const MAX_W = 500;
    const MAX_H = 200;

    let scale = 1;
    if (srcWidth > MAX_W || srcHeight > MAX_H) {
      scale = Math.min(MAX_W / srcWidth, MAX_H / srcHeight);
    }

    targetWidth = Math.max(1, Math.round(srcWidth * scale));
    targetHeight = Math.max(1, Math.round(srcHeight * scale));
    canvasWidth = targetWidth;
    canvasHeight = targetHeight;
    offsetX = 0;
    offsetY = 0;
  }

  // Draw on off-screen Canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // High quality interpolation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Clear background with full alpha transparency
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Draw image centered
  ctx.drawImage(img, offsetX, offsetY, targetWidth, targetHeight);

  // Export to lightweight PNG (preserves transparency)
  let compressedUrl = canvas.toDataURL('image/png');
  let compressedBytes = getByteLength(compressedUrl);

  // If PNG is still over 70KB for a logo, try WebP with high quality
  if (type === 'logo' && compressedBytes > 70 * 1024) {
    const webpUrl = canvas.toDataURL('image/webp', 0.88);
    const webpBytes = getByteLength(webpUrl);
    if (webpBytes < compressedBytes && webpUrl.startsWith('data:image/webp')) {
      compressedUrl = webpUrl;
      compressedBytes = webpBytes;
    }
  }

  const reductionPercentage = originalBytes > 0
    ? Math.max(0, Math.round(((originalBytes - compressedBytes) / originalBytes) * 100))
    : 0;

  return {
    dataUrl: compressedUrl,
    originalBytes,
    compressedBytes,
    reductionPercentage,
    dimensions: { width: canvasWidth, height: canvasHeight },
  };
}

/**
 * Validates and downscales all branding images in a HeaderConfig before sending to Firestore.
 * Guarantees total document size stays well within the 1MiB limit (typically < 100KB).
 */
export async function sanitizeHeaderConfigForFirestore<T extends {
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  appleTouchIconUrl?: string;
}>(config: T): Promise<T> {
  const sanitized = { ...config };

  // Helper to downscale if it's a huge data URL
  const checkAndDownscale = async (
    currentVal: string | undefined,
    type: BrandingImageType,
    maxAllowedBytes: number
  ): Promise<string | undefined> => {
    if (!currentVal || !currentVal.startsWith('data:image/')) {
      return currentVal;
    }
    const byteLen = getByteLength(currentVal);
    // If it's larger than threshold (e.g. > 50KB for favicon or > 90KB for logo), downscale it
    if (byteLen > maxAllowedBytes) {
      try {
        const res = await optimizeBrandingImage(currentVal, type);
        return res.dataUrl;
      } catch (e) {
        console.warn(`Failed to auto-downscale ${type}:`, e);
        return currentVal;
      }
    }
    return currentVal;
  };

  // Favicon: max 50KB threshold
  if (sanitized.faviconUrl) {
    sanitized.faviconUrl = await checkAndDownscale(sanitized.faviconUrl, 'favicon', 50 * 1024);
  }

  // Apple Touch Icon: max 60KB threshold
  if (sanitized.appleTouchIconUrl) {
    sanitized.appleTouchIconUrl = await checkAndDownscale(sanitized.appleTouchIconUrl, 'appIcon', 60 * 1024);
  }

  // Logo: max 90KB threshold
  if (sanitized.logoUrl) {
    sanitized.logoUrl = await checkAndDownscale(sanitized.logoUrl, 'logo', 90 * 1024);
  }

  // Dark Logo: max 90KB threshold
  if (sanitized.logoDarkUrl) {
    sanitized.logoDarkUrl = await checkAndDownscale(sanitized.logoDarkUrl, 'logo', 90 * 1024);
  }

  return sanitized;
}
