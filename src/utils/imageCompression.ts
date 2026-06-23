/**
 * Image Compression Utility
 * 
 * Compresses images client-side to optimize upload performance.
 * Implements Requirement 18 (Image Optimization):
 * - Max file size: 0.5MB (500KB)
 * - Max dimensions: 1920px (width or height)
 * - Quality reduction to meet size target
 * - Progress callback support
 */

export interface ImageCompressionOptions {
  /**
   * Maximum file size in bytes
   * @default 512000 (0.5MB)
   */
  maxSizeMB?: number;
  
  /**
   * Maximum width or height in pixels
   * @default 1920
   */
  maxDimension?: number;
  
  /**
   * Initial quality (0-1)
   * @default 0.9
   */
  initialQuality?: number;
  
  /**
   * Minimum quality to try (0-1)
   * @default 0.6
   */
  minQuality?: number;
  
  /**
   * Quality reduction step per iteration
   * @default 0.05
   */
  qualityStep?: number;
  
  /**
   * Progress callback
   */
  onProgress?: (progress: number) => void;
}

export interface CompressionResult {
  /**
   * Compressed image as Blob
   */
  blob: Blob;
  
  /**
   * Original file size in bytes
   */
  originalSize: number;
  
  /**
   * Compressed file size in bytes
   */
  compressedSize: number;
  
  /**
   * Compression ratio (0-1)
   */
  compressionRatio: number;
  
  /**
   * Original image dimensions
   */
  originalDimensions: { width: number; height: number };
  
  /**
   * Final image dimensions
   */
  finalDimensions: { width: number; height: number };
  
  /**
   * Quality used for final compression
   */
  quality: number;
}

const DEFAULT_OPTIONS: Required<Omit<ImageCompressionOptions, 'onProgress'>> = {
  maxSizeMB: 0.5,
  maxDimension: 1920,
  initialQuality: 0.9,
  minQuality: 0.6,
  qualityStep: 0.05,
};

/**
 * Check if a file is an image
 */
export function isImageFile(file: File | Blob): boolean {
  const type = file.type;
  return type.startsWith('image/') && 
         (type.includes('jpeg') || 
          type.includes('jpg') || 
          type.includes('png') || 
          type.includes('webp'));
}

/**
 * Load image from File/Blob
 */
function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Calculate resize dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxDimension: number
): { width: number; height: number } {
  // If image is already smaller, keep original size
  if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
    return { width: originalWidth, height: originalHeight };
  }
  
  // Calculate scale factor
  const scale = Math.min(
    maxDimension / originalWidth,
    maxDimension / originalHeight
  );
  
  return {
    width: Math.round(originalWidth * scale),
    height: Math.round(originalHeight * scale),
  };
}

/**
 * Compress image using canvas API
 */
function compressImageOnCanvas(
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }
    
    // Draw image with high quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);
    
    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Compress an image file
 * 
 * @param file - Image file to compress
 * @param options - Compression options
 * @returns Compression result with compressed blob and metadata
 * 
 * @example
 * ```typescript
 * const result = await compressImage(imageFile, {
 *   maxSizeMB: 0.5,
 *   maxDimension: 1920,
 *   onProgress: (progress) => console.log(`${progress}%`)
 * });
 * 
 * console.log(`Reduced from ${result.originalSize} to ${result.compressedSize}`);
 * // Upload result.blob
 * ```
 */
export async function compressImage(
  file: File | Blob,
  options: ImageCompressionOptions = {}
): Promise<CompressionResult> {
  // Validate input
  if (!isImageFile(file)) {
    throw new Error('File is not a supported image format (JPEG, PNG, WebP)');
  }
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const maxSizeBytes = opts.maxSizeMB * 1024 * 1024;
  const originalSize = file.size;
  
  // Report initial progress
  opts.onProgress?.(0);
  
  // Load image
  const img = await loadImage(file);
  const originalDimensions = {
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
  
  // Calculate target dimensions
  const finalDimensions = calculateDimensions(
    originalDimensions.width,
    originalDimensions.height,
    opts.maxDimension
  );
  
  opts.onProgress?.(25);
  
  // Try compression with iteratively reduced quality
  let quality = opts.initialQuality;
  let compressedBlob: Blob | null = null;
  let attempts = 0;
  const maxAttempts = Math.ceil((opts.initialQuality - opts.minQuality) / opts.qualityStep) + 1;
  
  while (quality >= opts.minQuality) {
    attempts++;
    
    // Compress with current quality
    compressedBlob = await compressImageOnCanvas(
      img,
      finalDimensions.width,
      finalDimensions.height,
      quality
    );
    
    // Update progress
    const progress = 25 + (attempts / maxAttempts) * 65;
    opts.onProgress?.(Math.round(progress));
    
    // Check if size is acceptable
    if (compressedBlob.size <= maxSizeBytes) {
      break;
    }
    
    // Reduce quality for next attempt
    quality -= opts.qualityStep;
  }
  
  if (!compressedBlob) {
    throw new Error('Failed to compress image');
  }
  
  // If still too large after min quality, warn but return result
  if (compressedBlob.size > maxSizeBytes) {
    console.warn(
      `Image could not be compressed below ${opts.maxSizeMB}MB. ` +
      `Final size: ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB`
    );
  }
  
  opts.onProgress?.(100);
  
  return {
    blob: compressedBlob,
    originalSize,
    compressedSize: compressedBlob.size,
    compressionRatio: compressedBlob.size / originalSize,
    originalDimensions,
    finalDimensions,
    quality: Math.max(quality, opts.minQuality),
  };
}

/**
 * Batch compress multiple images
 * 
 * @param files - Array of image files
 * @param options - Compression options
 * @param onFileProgress - Callback for individual file progress
 * @returns Array of compression results
 */
export async function compressImages(
  files: (File | Blob)[],
  options: ImageCompressionOptions = {},
  onFileProgress?: (fileIndex: number, progress: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const result = await compressImage(files[i], {
      ...options,
      onProgress: (progress) => {
        onFileProgress?.(i, progress);
      },
    });
    results.push(result);
  }
  
  return results;
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
}
