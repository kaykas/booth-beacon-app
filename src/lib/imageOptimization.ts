/**
 * Image optimization utilities for Booth Beacon
 * Handles image resizing, compression, and optimization
 */

export interface OptimizedImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Generate optimized image URL using Next.js Image Optimization API
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options: OptimizedImageOptions = {}
): string {
  if (!originalUrl) return '';

  const { width, height, quality = 75, format } = options;

  // If it's a Supabase Storage URL, we can optimize it
  if (originalUrl.includes('supabase.co/storage')) {
    const url = new URL(originalUrl);
    const searchParams = new URLSearchParams();

    if (width) searchParams.set('width', width.toString());
    if (height) searchParams.set('height', height.toString());
    if (quality) searchParams.set('quality', quality.toString());
    if (format) searchParams.set('format', format);

    const queryString = searchParams.toString();
    return queryString ? `${originalUrl}?${queryString}` : originalUrl;
  }

  // Return original URL if we can't optimize
  return originalUrl;
}

/**
 * Get image srcset for responsive images
 */
export function getImageSrcSet(originalUrl: string, widths: number[] = [640, 750, 828, 1080, 1200]): string {
  if (!originalUrl) return '';

  return widths
    .map((width) => {
      const optimizedUrl = getOptimizedImageUrl(originalUrl, { width, quality: 75 });
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
}

/**
 * Compress image file before upload
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not compress image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Could not load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Get blurhash or placeholder for image
 */
export function getImagePlaceholder(width: number = 400, height: number = 300): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Crect fill='%23f5f5f5' width='${width}' height='${height}'/%3E%3C/svg%3E`;
}
