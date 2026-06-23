/**
 * Image Optimization Utilities
 * Helpers for responsive images with WebP fallback and lazy loading
 * Part of Task 26.2 - Fix Lighthouse recommendations
 */

/**
 * Props for the optimized image component
 */
export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
}

/**
 * Get the WebP version of an image path
 * Converts /image.png to /image.webp
 */
export function getWebPPath(src: string): string {
  return src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
}

/**
 * Generate srcset for responsive images
 * Creates multiple sizes for different screen densities
 */
export function generateSrcSet(baseSrc: string, sizes: number[] = [1, 2, 3]): string {
  const ext = baseSrc.match(/\.(png|jpg|jpeg|webp)$/i)?.[0] || '';
  const base = baseSrc.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  
  return sizes
    .map(size => `${base}@${size}x${ext} ${size}x`)
    .join(', ');
}

/**
 * Preload critical images
 * Use this for above-the-fold images that need to load immediately
 */
export function preloadImage(src: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  
  // Also preload WebP if available
  const webpSrc = getWebPPath(src);
  if (webpSrc !== src) {
    link.type = 'image/webp';
  }
  
  document.head.appendChild(link);
}

/**
 * Lazy load images with Intersection Observer
 * More efficient than native lazy loading for complex scenarios
 */
export function setupLazyLoading(): void {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach((img) => imageObserver.observe(img));
  }
}

/**
 * Compress image client-side before upload
 * Used in file upload flows to reduce bandwidth
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 0.5,
  maxWidthOrHeight: number = 1920
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > maxWidthOrHeight) {
          height = (height * maxWidthOrHeight) / width;
          width = maxWidthOrHeight;
        }
      } else {
        if (height > maxWidthOrHeight) {
          width = (width * maxWidthOrHeight) / height;
          height = maxWidthOrHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to blob with quality adjustment
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Check if we need to reduce quality further
            if (blob.size > maxSizeMB * 1024 * 1024 && ctx) {
              // Reduce quality
              canvas.toBlob(
                (compressedBlob) => {
                  resolve(compressedBlob || blob);
                },
                'image/jpeg',
                0.7
              );
            } else {
              resolve(blob);
            }
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get the optimal image format based on browser support
 */
export function getSupportedImageFormat(): 'webp' | 'jpeg' {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  // Check WebP support
  const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  
  return supportsWebP ? 'webp' : 'jpeg';
}
