/**
 * Unit Tests for Image Compression Utility
 * 
 * Tests Requirement 18 (Image Optimization):
 * - Image type validation
 * - Dimension calculations
 * - Compression size limits
 * - Quality reduction iterations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isImageFile,
  compressImage,
  compressImages,
  formatFileSize,
  type CompressionResult,
} from './imageCompression';

// Store image dimensions for mocking
let mockImageWidth = 1920;
let mockImageHeight = 1080;

// Mock canvas and image APIs
class MockHTMLImageElement {
  src = '';
  get naturalWidth() {
    return mockImageWidth;
  }
  get naturalHeight() {
    return mockImageHeight;
  }
  onload: (() => void) | null = null;
  onerror: ((error: Error) => void) | null = null;

  constructor() {
    // Simulate async image loading
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
}

// Mock canvas context
const mockCanvasContext = {
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high',
  drawImage: vi.fn(),
};

// Mock canvas
class MockHTMLCanvasElement {
  width = 0;
  height = 0;

  getContext(contextId: string) {
    if (contextId === '2d') {
      return mockCanvasContext;
    }
    return null;
  }

  toBlob(
    callback: (blob: Blob | null) => void,
    type?: string,
    quality?: number
  ) {
    // Create a mock blob with size based on quality
    const baseSize = this.width * this.height * 0.1; // Base size calculation
    const sizeWithQuality = Math.round(baseSize * (quality || 1));
    const blob = new Blob(['x'.repeat(sizeWithQuality)], { type: type || 'image/jpeg' });
    
    setTimeout(() => callback(blob), 0);
  }
}

// Setup global mocks
beforeEach(() => {
  // Reset to default dimensions
  mockImageWidth = 1920;
  mockImageHeight = 1080;
  
  global.Image = MockHTMLImageElement as any;
  global.HTMLCanvasElement = MockHTMLCanvasElement as any;
  global.URL.createObjectURL = vi.fn(() => 'mock-url');
  global.URL.revokeObjectURL = vi.fn();
  
  // Mock document.createElement for canvas
  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName === 'canvas') {
      return new MockHTMLCanvasElement() as any;
    }
    return originalCreateElement(tagName);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('isImageFile', () => {
  it('should return true for JPEG files', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    expect(isImageFile(file)).toBe(true);
  });

  it('should return true for PNG files', () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    expect(isImageFile(file)).toBe(true);
  });

  it('should return true for WebP files', () => {
    const file = new File([''], 'test.webp', { type: 'image/webp' });
    expect(isImageFile(file)).toBe(true);
  });

  it('should return false for non-image files', () => {
    const file = new File([''], 'test.pdf', { type: 'application/pdf' });
    expect(isImageFile(file)).toBe(false);
  });

  it('should return false for text files', () => {
    const file = new File([''], 'test.txt', { type: 'text/plain' });
    expect(isImageFile(file)).toBe(false);
  });

  it('should return false for unsupported image types', () => {
    const file = new File([''], 'test.gif', { type: 'image/gif' });
    expect(isImageFile(file)).toBe(false);
  });
});

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('should format kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.00 KB');
  });

  it('should format megabytes', () => {
    expect(formatFileSize(5242880)).toBe('5.00 MB');
  });

  it('should handle zero bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('should format fractional KB correctly', () => {
    expect(formatFileSize(1536)).toBe('1.50 KB');
  });

  it('should format fractional MB correctly', () => {
    expect(formatFileSize(524288)).toBe('512.00 KB');
  });
});

describe('compressImage', () => {
  it('should reject non-image files', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    await expect(compressImage(file)).rejects.toThrow(
      'File is not a supported image format'
    );
  });

  it('should compress an image and return result with metadata', async () => {
    const file = new File(['x'.repeat(1000000)], 'test.jpg', { type: 'image/jpeg' });
    
    // Set mock dimensions for large image
    mockImageWidth = 3000;
    mockImageHeight = 2000;
    
    const result = await compressImage(file, {
      maxSizeMB: 0.5,
      maxDimension: 1920,
    });
    
    expect(result).toHaveProperty('blob');
    expect(result).toHaveProperty('originalSize');
    expect(result).toHaveProperty('compressedSize');
    expect(result).toHaveProperty('compressionRatio');
    expect(result).toHaveProperty('originalDimensions');
    expect(result).toHaveProperty('finalDimensions');
    expect(result).toHaveProperty('quality');
    
    expect(result.originalSize).toBe(1000000);
    expect(result.blob).toBeInstanceOf(Blob);
  });

  it('should resize images exceeding max dimensions', async () => {
    const file = new File(['x'.repeat(100000)], 'large.jpg', { type: 'image/jpeg' });
    
    // Set mock dimensions for large image
    mockImageWidth = 4000;
    mockImageHeight = 3000;
    
    const result = await compressImage(file, {
      maxDimension: 1920,
    });
    
    expect(result.originalDimensions.width).toBe(4000);
    expect(result.originalDimensions.height).toBe(3000);
    
    // Should scale down to max 1920px (maintaining aspect ratio)
    expect(result.finalDimensions.width).toBeLessThanOrEqual(1920);
    expect(result.finalDimensions.height).toBeLessThanOrEqual(1920);
    
    // Check aspect ratio is maintained
    const originalAspect = 4000 / 3000;
    const finalAspect = result.finalDimensions.width / result.finalDimensions.height;
    expect(Math.abs(originalAspect - finalAspect)).toBeLessThan(0.01);
  });

  it('should not upscale small images', async () => {
    const file = new File(['x'.repeat(50000)], 'small.jpg', { type: 'image/jpeg' });
    
    // Set mock dimensions for small image
    mockImageWidth = 800;
    mockImageHeight = 600;
    
    const result = await compressImage(file, {
      maxDimension: 1920,
    });
    
    expect(result.finalDimensions.width).toBe(800);
    expect(result.finalDimensions.height).toBe(600);
  });

  it('should call progress callback', async () => {
    const file = new File(['x'.repeat(100000)], 'test.jpg', { type: 'image/jpeg' });
    const onProgress = vi.fn();
    
    // Use default dimensions
    mockImageWidth = 1920;
    mockImageHeight = 1080;
    
    await compressImage(file, {
      onProgress,
    });
    
    expect(onProgress).toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalledWith(0); // Initial
    expect(onProgress).toHaveBeenCalledWith(100); // Final
  });

  it('should use custom quality settings', async () => {
    const file = new File(['x'.repeat(100000)], 'test.jpg', { type: 'image/jpeg' });
    
    // Use default dimensions
    mockImageWidth = 1920;
    mockImageHeight = 1080;
    
    const result = await compressImage(file, {
      initialQuality: 0.8,
      minQuality: 0.5,
      qualityStep: 0.1,
    });
    
    expect(result.quality).toBeGreaterThanOrEqual(0.5);
    expect(result.quality).toBeLessThanOrEqual(0.8);
  });

  it('should calculate compression ratio correctly', async () => {
    const originalSize = 1000000;
    const file = new File(['x'.repeat(originalSize)], 'test.jpg', { type: 'image/jpeg' });
    
    // Use default dimensions
    mockImageWidth = 1920;
    mockImageHeight = 1080;
    
    const result = await compressImage(file);
    
    expect(result.compressionRatio).toBe(result.compressedSize / result.originalSize);
    expect(result.compressionRatio).toBeGreaterThan(0);
    expect(result.compressionRatio).toBeLessThanOrEqual(1);
  });

  it('should handle portrait orientation', async () => {
    const file = new File(['x'.repeat(100000)], 'portrait.jpg', { type: 'image/jpeg' });
    
    // Set mock dimensions for portrait image
    mockImageWidth = 1080;
    mockImageHeight = 1920;
    
    const result = await compressImage(file, {
      maxDimension: 1920,
    });
    
    expect(result.finalDimensions.width).toBe(1080);
    expect(result.finalDimensions.height).toBe(1920);
  });

  it('should handle landscape orientation', async () => {
    const file = new File(['x'.repeat(100000)], 'landscape.jpg', { type: 'image/jpeg' });
    
    // Use default landscape dimensions
    mockImageWidth = 1920;
    mockImageHeight = 1080;
    
    const result = await compressImage(file, {
      maxDimension: 1920,
    });
    
    expect(result.finalDimensions.width).toBe(1920);
    expect(result.finalDimensions.height).toBe(1080);
  });
});

describe('compressImages', () => {
  it('should compress multiple images', async () => {
    const files = [
      new File(['x'.repeat(100000)], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['x'.repeat(150000)], 'test2.jpg', { type: 'image/jpeg' }),
    ];
    
    // Use default dimensions
    mockImageWidth = 1920;
    mockImageHeight = 1080;
    
    const results = await compressImages(files);
    
    expect(results).toHaveLength(2);
    expect(results[0]).toHaveProperty('blob');
    expect(results[1]).toHaveProperty('blob');
  });

  it('should call file progress callback for each file', async () => {
    const files = [
      new File(['x'.repeat(100000)], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['x'.repeat(100000)], 'test2.jpg', { type: 'image/jpeg' }),
    ];
    
    // Use default dimensions
    mockImageWidth = 1920;
    mockImageHeight = 1080;
    
    const onFileProgress = vi.fn();
    
    await compressImages(files, {}, onFileProgress);
    
    // Should be called for both files
    expect(onFileProgress).toHaveBeenCalledWith(0, expect.any(Number));
    expect(onFileProgress).toHaveBeenCalledWith(1, expect.any(Number));
  });

  it('should handle empty array', async () => {
    const results = await compressImages([]);
    expect(results).toEqual([]);
  });
});

describe('Edge Cases', () => {
  it('should handle very small images', async () => {
    const file = new File(['x'.repeat(1000)], 'tiny.jpg', { type: 'image/jpeg' });
    
    // Set mock dimensions for tiny image
    mockImageWidth = 100;
    mockImageHeight = 100;
    
    const result = await compressImage(file);
    
    expect(result.finalDimensions.width).toBe(100);
    expect(result.finalDimensions.height).toBe(100);
  });

  it('should handle square images', async () => {
    const file = new File(['x'.repeat(100000)], 'square.jpg', { type: 'image/jpeg' });
    
    // Set mock dimensions for square image
    mockImageWidth = 2000;
    mockImageHeight = 2000;
    
    const result = await compressImage(file, {
      maxDimension: 1920,
    });
    
    expect(result.finalDimensions.width).toBe(1920);
    expect(result.finalDimensions.height).toBe(1920);
  });

  it('should handle blob input (not just File)', async () => {
    const blob = new Blob(['x'.repeat(100000)], { type: 'image/jpeg' });
    
    // Use default dimensions
    mockImageWidth = 1920;
    mockImageHeight = 1080;
    
    const result = await compressImage(blob);
    
    expect(result).toHaveProperty('blob');
    expect(result.blob).toBeInstanceOf(Blob);
  });
});
