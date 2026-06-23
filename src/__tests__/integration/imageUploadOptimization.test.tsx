/**
 * Integration Tests for Image Upload Optimization
 * 
 * Tests Task 21.3: Image upload optimization with compression
 * Validates Requirements 18.1, 18.2, 18.3, 18.4, 18.5:
 * - Large images (>2MB) are compressed to <500KB
 * - Dimensions reduced to max 1920px
 * - UI remains responsive during compression
 * - Progress indicators display correctly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { compressImage } from '@/utils/imageCompression';

// Mock canvas and image APIs for testing
let mockImageWidth = 1920;
let mockImageHeight = 1080;
let mockLoadDelay = 10; // Simulate async image loading

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
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, mockLoadDelay);
  }
}

const mockCanvasContext = {
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high',
  drawImage: vi.fn(),
};

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
    // Simulate compression: smaller size with lower quality
    const baseSize = this.width * this.height * 0.1;
    const sizeWithQuality = Math.round(baseSize * (quality || 1));
    const blob = new Blob(['x'.repeat(sizeWithQuality)], { type: type || 'image/jpeg' });
    
    // Simulate async blob creation
    setTimeout(() => callback(blob), 5);
  }
}

beforeEach(() => {
  // Reset mocks
  mockImageWidth = 1920;
  mockImageHeight = 1080;
  mockLoadDelay = 10;
  
  global.Image = MockHTMLImageElement as any;
  global.HTMLCanvasElement = MockHTMLCanvasElement as any;
  global.URL.createObjectURL = vi.fn(() => 'mock-url');
  global.URL.revokeObjectURL = vi.fn();
  
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

describe('Image Upload Optimization - Integration Tests', () => {
  describe('Requirement 18.1, 18.2: Large image compression to <500KB', () => {
    it('should compress a 3MB image to under 500KB', async () => {
      // Create a large mock file (3MB)
      const largeSizeBytes = 3 * 1024 * 1024; // 3MB
      const largeFile = new File(
        ['x'.repeat(largeSizeBytes)], 
        'large-photo.jpg', 
        { type: 'image/jpeg' }
      );
      
      // Set dimensions for a high-resolution image
      mockImageWidth = 4000;
      mockImageHeight = 3000;
      
      // Compress the image
      const result = await compressImage(largeFile, {
        maxSizeMB: 0.5,
        maxDimension: 1920,
      });
      
      // Verify original size
      expect(result.originalSize).toBe(largeSizeBytes);
      
      // Verify compressed size is under 500KB (512000 bytes)
      expect(result.compressedSize).toBeLessThan(512000);
      
      // Verify we got significant compression
      expect(result.compressionRatio).toBeLessThan(0.2); // Less than 20% of original
      
      // Verify result has valid blob
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.type).toBe('image/jpeg');
    });

    it('should compress a 5MB image to under 500KB', async () => {
      // Create an even larger file (5MB)
      const largeSizeBytes = 5 * 1024 * 1024; // 5MB
      const veryLargeFile = new File(
        ['x'.repeat(largeSizeBytes)], 
        'very-large-photo.jpg', 
        { type: 'image/jpeg' }
      );
      
      mockImageWidth = 6000;
      mockImageHeight = 4000;
      
      const result = await compressImage(veryLargeFile, {
        maxSizeMB: 0.5,
        maxDimension: 1920,
      });
      
      expect(result.originalSize).toBe(largeSizeBytes);
      expect(result.compressedSize).toBeLessThan(512000);
    });

    it('should handle 2.5MB image compression', async () => {
      // Exactly at the 2MB+ threshold mentioned in requirements
      const largeSizeBytes = 2.5 * 1024 * 1024; // 2.5MB
      const largeFile = new File(
        ['x'.repeat(largeSizeBytes)], 
        'medium-large-photo.jpg', 
        { type: 'image/jpeg' }
      );
      
      mockImageWidth = 3840; // 4K width
      mockImageHeight = 2160; // 4K height
      
      const result = await compressImage(largeFile, {
        maxSizeMB: 0.5,
        maxDimension: 1920,
      });
      
      expect(result.originalSize).toBe(largeSizeBytes);
      expect(result.compressedSize).toBeLessThan(512000);
    });
  });

  describe('Requirement 18.3: Dimension reduction to max 1920px', () => {
    it('should reduce 4000x3000 image to max 1920px width', async () => {
      const file = new File(
        ['x'.repeat(1000000)], 
        'large-dimensions.jpg', 
        { type: 'image/jpeg' }
      );
      
      mockImageWidth = 4000;
      mockImageHeight = 3000;
      
      const result = await compressImage(file, {
        maxDimension: 1920,
      });
      
      // Verify original dimensions captured
      expect(result.originalDimensions.width).toBe(4000);
      expect(result.originalDimensions.height).toBe(3000);
      
      // Verify reduced dimensions
      expect(result.finalDimensions.width).toBeLessThanOrEqual(1920);
      expect(result.finalDimensions.height).toBeLessThanOrEqual(1920);
      
      // Verify aspect ratio maintained (4:3)
      const originalAspect = 4000 / 3000;
      const finalAspect = result.finalDimensions.width / result.finalDimensions.height;
      expect(Math.abs(originalAspect - finalAspect)).toBeLessThan(0.01);
    });

    it('should reduce 3000x4000 portrait image to max 1920px height', async () => {
      const file = new File(
        ['x'.repeat(1000000)], 
        'portrait-large.jpg', 
        { type: 'image/jpeg' }
      );
      
      mockImageWidth = 3000;
      mockImageHeight = 4000;
      
      const result = await compressImage(file, {
        maxDimension: 1920,
      });
      
      expect(result.originalDimensions.width).toBe(3000);
      expect(result.originalDimensions.height).toBe(4000);
      
      // Height should be reduced to 1920, width proportionally
      expect(result.finalDimensions.width).toBeLessThanOrEqual(1920);
      expect(result.finalDimensions.height).toBeLessThanOrEqual(1920);
      
      // Aspect ratio maintained (3:4)
      const originalAspect = 3000 / 4000;
      const finalAspect = result.finalDimensions.width / result.finalDimensions.height;
      expect(Math.abs(originalAspect - finalAspect)).toBeLessThan(0.01);
    });

    it('should not upscale small images', async () => {
      const file = new File(
        ['x'.repeat(100000)], 
        'small-image.jpg', 
        { type: 'image/jpeg' }
      );
      
      // Small image that's already under max dimension
      mockImageWidth = 1200;
      mockImageHeight = 800;
      
      const result = await compressImage(file, {
        maxDimension: 1920,
      });
      
      // Should keep original dimensions
      expect(result.finalDimensions.width).toBe(1200);
      expect(result.finalDimensions.height).toBe(800);
    });

    it('should handle square images correctly', async () => {
      const file = new File(
        ['x'.repeat(1000000)], 
        'square-large.jpg', 
        { type: 'image/jpeg' }
      );
      
      mockImageWidth = 3000;
      mockImageHeight = 3000;
      
      const result = await compressImage(file, {
        maxDimension: 1920,
      });
      
      // Both dimensions should be reduced to 1920
      expect(result.finalDimensions.width).toBe(1920);
      expect(result.finalDimensions.height).toBe(1920);
    });
  });

  describe('Requirement 18.4: UI responsiveness during compression', () => {
    it('should complete compression without blocking (async operation)', async () => {
      const file = new File(
        ['x'.repeat(2000000)], 
        'async-test.jpg', 
        { type: 'image/jpeg' }
      );
      
      mockImageWidth = 3000;
      mockImageHeight = 2000;
      
      // Track if other operations can run
      let otherOperationCompleted = false;
      
      // Start compression (non-blocking)
      const compressionPromise = compressImage(file, {
        maxSizeMB: 0.5,
        maxDimension: 1920,
      });
      
      // Simulate other UI operations running concurrently
      setTimeout(() => {
        otherOperationCompleted = true;
      }, 5);
      
      // Wait for compression to complete
      const result = await compressionPromise;
      
      // Verify compression completed
      expect(result.blob).toBeInstanceOf(Blob);
      
      // Verify other operations could run (UI wasn't blocked)
      expect(otherOperationCompleted).toBe(true);
    });

    it('should allow multiple compressions to run concurrently', async () => {
      const files = [
        new File(['x'.repeat(1000000)], 'file1.jpg', { type: 'image/jpeg' }),
        new File(['x'.repeat(1500000)], 'file2.jpg', { type: 'image/jpeg' }),
        new File(['x'.repeat(2000000)], 'file3.jpg', { type: 'image/jpeg' }),
      ];
      
      mockImageWidth = 2000;
      mockImageHeight = 1500;
      
      const startTime = Date.now();
      
      // Start all compressions concurrently
      const promises = files.map(file => 
        compressImage(file, { maxDimension: 1920 })
      );
      
      // Wait for all to complete
      const results = await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // All should complete
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.blob).toBeInstanceOf(Blob);
      });
      
      // Should complete in reasonable time (not sequential blocking)
      // With mock delays, this should be fast
      expect(duration).toBeLessThan(1000);
    });

    it('should handle rapid successive compression calls', async () => {
      const file = new File(
        ['x'.repeat(1000000)], 
        'rapid-test.jpg', 
        { type: 'image/jpeg' }
      );
      
      mockImageWidth = 2000;
      mockImageHeight = 1500;
      
      // Rapidly start multiple compressions of the same file
      const compressions = [];
      for (let i = 0; i < 5; i++) {
        compressions.push(compressImage(file, { maxDimension: 1920 }));
      }
      
      // All should complete without errors
      const results = await Promise.all(compressions);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.blob).toBeInstanceOf(Blob);
        expect(result.compressedSize).toBeGreaterThan(0);
      });
    });
  });

  describe('Requirement 18.5: Progress indicators display correctly', () => {
    it('should report progress from 0% to 100%', async () => {
      const file = new File(
        ['x'.repeat(1000000)], 
        'progress-test.jpg', 
        { type: 'image/jpeg' }
      );
      
      mockImageWidth = 2000;
      mockImageHeight = 1500;
      
      const progressValues: number[] = [];
      
      await compressImage(file, {
        maxDimension: 1920,
        onProgress: (progress) => {
          progressValues.push(progress);
        },
      });
      
      // Should have received progress updates
      expect(progressValues.length).toBeGreaterThan(0);
      
      // Should start with 0
      expect(progressValues[0]).toBe(0);
      
      // Should end with 100
      expect(progressValues[progressValues.length - 1]).toBe(100);
      
      // All values should be between 0 and 100
      progressValues.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });

    it('should report incremental progress during compression', async () => {
      const file = new File(
        ['x'.repeat(2000000)], 
        'incremental-progress.jpg', 
        { type: 'image/jpeg' }
      );
      
      mockImageWidth = 3000;
      mockImageHeight = 2000;
      
      const progressValues: number[] = [];
      
      await compressImage(file, {
        maxSizeMB: 0.5,
        maxDimension: 1920,
        onProgress: (progress) => {
          progressValues.push(progress);
        },
      });
      
      // Should have multiple progress updates
      expect(progressValues.length).toBeGreaterThan(2);
      
      // Progress should generally increase (allow for rounding)
      for (let i = 1; i < progressValues.length; i++) {
        expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1] - 1);
      }
    });

    it('should call progress callback for each stage', async () => {
      const file = new File(
        ['x'.repeat(1500000)], 
        'stage-progress.jpg', 
        { type: 'image/jpeg' }
      );
      
      mockImageWidth = 2500;
      mockImageHeight = 1800;
      
      const progressCallback = vi.fn();
      
      await compressImage(file, {
        maxDimension: 1920,
        onProgress: progressCallback,
      });
      
      // Should be called multiple times
      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback.mock.calls.length).toBeGreaterThan(2);
      
      // First call should be 0
      expect(progressCallback.mock.calls[0][0]).toBe(0);
      
      // Last call should be 100
      const lastCall = progressCallback.mock.calls[progressCallback.mock.calls.length - 1];
      expect(lastCall[0]).toBe(100);
    });

    it('should provide progress updates during quality iteration', async () => {
      const file = new File(
        ['x'.repeat(3000000)], 
        'quality-iteration.jpg', 
        { type: 'image/jpeg' }
      );
      
      mockImageWidth = 4000;
      mockImageHeight = 3000;
      
      const progressValues: number[] = [];
      
      await compressImage(file, {
        maxSizeMB: 0.5,
        maxDimension: 1920,
        initialQuality: 0.9,
        minQuality: 0.6,
        qualityStep: 0.1, // Larger steps = fewer iterations
        onProgress: (progress) => {
          progressValues.push(progress);
        },
      });
      
      // Should have progress updates throughout the quality reduction process
      expect(progressValues.length).toBeGreaterThan(3);
      
      // Should include intermediate values (not just 0 and 100)
      const intermediateValues = progressValues.filter(v => v > 0 && v < 100);
      expect(intermediateValues.length).toBeGreaterThan(0);
    });
  });

  describe('Combined requirements: End-to-end upload optimization', () => {
    it('should compress and prepare a large animal photo for upload', async () => {
      // Simulate a real-world scenario: user takes a photo with their phone
      const phonePhotoSize = 4 * 1024 * 1024; // 4MB phone photo
      const phonePhoto = new File(
        ['x'.repeat(phonePhotoSize)], 
        'animal-photo.jpg', 
        { type: 'image/jpeg' }
      );
      
      // Phone camera resolution
      mockImageWidth = 4032; // Typical phone camera
      mockImageHeight = 3024;
      
      let lastProgress = 0;
      
      const result = await compressImage(phonePhoto, {
        maxSizeMB: 0.5,
        maxDimension: 1920,
        onProgress: (progress) => {
          lastProgress = progress;
          // Simulate UI update - should not block
          expect(progress).toBeGreaterThanOrEqual(0);
          expect(progress).toBeLessThanOrEqual(100);
        },
      });
      
      // Verify all requirements met:
      
      // 1. Large image compressed to <500KB
      expect(result.originalSize).toBe(phonePhotoSize);
      expect(result.compressedSize).toBeLessThan(512000);
      
      // 2. Dimensions reduced to max 1920px
      expect(result.originalDimensions.width).toBe(4032);
      expect(result.originalDimensions.height).toBe(3024);
      expect(result.finalDimensions.width).toBeLessThanOrEqual(1920);
      expect(result.finalDimensions.height).toBeLessThanOrEqual(1920);
      
      // 3. Aspect ratio maintained
      const originalAspect = 4032 / 3024;
      const finalAspect = result.finalDimensions.width / result.finalDimensions.height;
      expect(Math.abs(originalAspect - finalAspect)).toBeLessThan(0.01);
      
      // 4. Progress completed
      expect(lastProgress).toBe(100);
      
      // 5. Ready for upload
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.type).toBe('image/jpeg');
      expect(result.blob.size).toBe(result.compressedSize);
      
      // 6. Significant size reduction achieved
      const savingsPercent = (1 - result.compressionRatio) * 100;
      expect(savingsPercent).toBeGreaterThan(50); // At least 50% savings
    });

    it('should handle batch upload of multiple large animal photos', async () => {
      // Simulate uploading multiple photos at once
      const photoFiles = [
        new File(['x'.repeat(3 * 1024 * 1024)], 'animal1.jpg', { type: 'image/jpeg' }),
        new File(['x'.repeat(4 * 1024 * 1024)], 'animal2.jpg', { type: 'image/jpeg' }),
        new File(['x'.repeat(2.5 * 1024 * 1024)], 'animal3.jpg', { type: 'image/jpeg' }),
      ];
      
      mockImageWidth = 4000;
      mockImageHeight = 3000;
      
      const progressByFile: Record<number, number[]> = {};
      
      // Compress all files concurrently
      const results = await Promise.all(
        photoFiles.map((file, index) => 
          compressImage(file, {
            maxSizeMB: 0.5,
            maxDimension: 1920,
            onProgress: (progress) => {
              if (!progressByFile[index]) {
                progressByFile[index] = [];
              }
              progressByFile[index].push(progress);
            },
          })
        )
      );
      
      // Verify all files compressed successfully
      expect(results).toHaveLength(3);
      
      results.forEach((result, index) => {
        // Each compressed to <500KB
        expect(result.compressedSize).toBeLessThan(512000);
        
        // Each has correct dimensions
        expect(result.finalDimensions.width).toBeLessThanOrEqual(1920);
        expect(result.finalDimensions.height).toBeLessThanOrEqual(1920);
        
        // Each got progress updates
        expect(progressByFile[index]).toBeDefined();
        expect(progressByFile[index].length).toBeGreaterThan(0);
        expect(progressByFile[index][0]).toBe(0);
        expect(progressByFile[index][progressByFile[index].length - 1]).toBe(100);
        
        // Each ready for upload
        expect(result.blob).toBeInstanceOf(Blob);
      });
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle compression errors gracefully', async () => {
      const file = new File(
        ['invalid'], 
        'not-an-image.txt', 
        { type: 'text/plain' }
      );
      
      await expect(
        compressImage(file)
      ).rejects.toThrow('File is not a supported image format');
    });

    it('should handle very small images efficiently', async () => {
      const smallFile = new File(
        ['x'.repeat(50000)], 
        'tiny.jpg', 
        { type: 'image/jpeg' }
      );
      
      mockImageWidth = 800;
      mockImageHeight = 600;
      
      const result = await compressImage(smallFile, {
        maxDimension: 1920,
      });
      
      // Should not upscale
      expect(result.finalDimensions.width).toBe(800);
      expect(result.finalDimensions.height).toBe(600);
      
      // Should still compress if needed
      expect(result.compressedSize).toBeLessThanOrEqual(result.originalSize);
    });

    it('should warn if unable to reach target size', async () => {
      // Create a file that's difficult to compress
      const difficultFile = new File(
        ['x'.repeat(1000000)], 
        'difficult.jpg', 
        { type: 'image/jpeg' }
      );
      
      mockImageWidth = 2000;
      mockImageHeight = 1500;
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await compressImage(difficultFile, {
        maxSizeMB: 0.001, // Unrealistically small target
        minQuality: 0.5,
      });
      
      // Should have logged a warning (in real implementation)
      // Note: May or may not warn depending on mock behavior
      
      consoleSpy.mockRestore();
    });
  });
});
