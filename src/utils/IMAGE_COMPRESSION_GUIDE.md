# Image Compression Utility - Usage Guide

## Overview

The image compression utility provides client-side image optimization to improve upload performance, especially for users in areas with slow internet connectivity.

**Implements Requirement 18 (Image Optimization):**
- ✅ Max file size: 0.5MB (500KB)
- ✅ Max dimensions: 1920px (width or height)
- ✅ Quality reduction to meet size target
- ✅ Progress callback support
- ✅ Maintains aspect ratio
- ✅ Works with File and Blob objects

## Basic Usage

```typescript
import { compressImage } from '@/utils/imageCompression';

// Compress a single image
async function handleImageUpload(file: File) {
  try {
    const result = await compressImage(file, {
      maxSizeMB: 0.5,
      maxDimension: 1920,
      onProgress: (progress) => {
        console.log(`Compression progress: ${progress}%`);
      }
    });
    
    console.log(`Original: ${result.originalSize} bytes`);
    console.log(`Compressed: ${result.compressedSize} bytes`);
    console.log(`Saved: ${((1 - result.compressionRatio) * 100).toFixed(2)}%`);
    
    // Upload the compressed blob
    await uploadToSupabase(result.blob);
  } catch (error) {
    console.error('Compression failed:', error);
  }
}
```

## React Component Example

```typescript
import { useState } from 'react';
import { compressImage, formatFileSize } from '@/utils/imageCompression';

export function AnimalPhotoUpload() {
  const [progress, setProgress] = useState(0);
  const [compressing, setCompressing] = useState(false);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCompressing(true);
    
    try {
      const result = await compressImage(file, {
        onProgress: setProgress
      });
      
      console.log(`Reduced from ${formatFileSize(result.originalSize)} to ${formatFileSize(result.compressedSize)}`);
      
      // Upload compressed image
      await uploadAnimalPhoto(result.blob);
      
    } catch (error) {
      console.error('Failed to compress image:', error);
    } finally {
      setCompressing(false);
      setProgress(0);
    }
  };
  
  return (
    <div>
      <input 
        type="file" 
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={compressing}
      />
      
      {compressing && (
        <div>
          <p>Compressing image... {progress}%</p>
          <progress value={progress} max={100} />
        </div>
      )}
    </div>
  );
}
```

## Batch Compression

```typescript
import { compressImages } from '@/utils/imageCompression';

async function handleMultipleImages(files: File[]) {
  const results = await compressImages(
    files,
    { maxSizeMB: 0.5 },
    (fileIndex, progress) => {
      console.log(`File ${fileIndex + 1}: ${progress}%`);
    }
  );
  
  // Upload all compressed images
  for (const result of results) {
    await uploadToSupabase(result.blob);
  }
}
```

## Integration with Supabase Storage

```typescript
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/utils/imageCompression';

async function uploadAnimalPhoto(animalId: string, file: File) {
  // Compress before upload
  const { blob, originalSize, compressedSize } = await compressImage(file);
  
  // Generate unique filename
  const fileName = `${animalId}_${Date.now()}.jpg`;
  const filePath = `animals/${fileName}`;
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('animal-photos')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('animal-photos')
    .getPublicUrl(filePath);
  
  console.log(`Uploaded ${compressedSize} bytes (saved ${((1 - compressedSize/originalSize) * 100).toFixed(0)}%)`);
  
  return publicUrl;
}
```

## API Reference

### `compressImage(file, options)`

Compresses a single image file.

**Parameters:**
- `file: File | Blob` - Image file to compress
- `options?: ImageCompressionOptions` - Configuration options

**Returns:** `Promise<CompressionResult>`

**Options:**
```typescript
interface ImageCompressionOptions {
  maxSizeMB?: number;        // Default: 0.5
  maxDimension?: number;     // Default: 1920
  initialQuality?: number;   // Default: 0.9
  minQuality?: number;       // Default: 0.6
  qualityStep?: number;      // Default: 0.05
  onProgress?: (progress: number) => void;
}
```

**Result:**
```typescript
interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;  // 0-1
  originalDimensions: { width: number; height: number };
  finalDimensions: { width: number; height: number };
  quality: number;
}
```

### `compressImages(files, options, onFileProgress)`

Compresses multiple images.

**Parameters:**
- `files: (File | Blob)[]` - Array of image files
- `options?: ImageCompressionOptions` - Configuration options
- `onFileProgress?: (fileIndex: number, progress: number) => void` - Progress callback

**Returns:** `Promise<CompressionResult[]>`

### `isImageFile(file)`

Checks if a file is a supported image format.

**Parameters:**
- `file: File | Blob` - File to check

**Returns:** `boolean`

**Supported formats:** JPEG, PNG, WebP

### `formatFileSize(bytes)`

Converts bytes to human-readable format.

**Parameters:**
- `bytes: number` - File size in bytes

**Returns:** `string` - Formatted size (e.g., "1.5 MB")

## Performance Considerations

1. **Client-side processing**: All compression happens in the browser, reducing server load
2. **Progressive quality reduction**: The utility tries higher quality first and reduces only if needed
3. **Aspect ratio preservation**: Images are never distorted
4. **No upscaling**: Small images remain at original size
5. **Async operations**: Uses canvas API asynchronously to avoid blocking

## Browser Compatibility

Works in all modern browsers that support:
- Canvas API
- Blob API
- FileReader API
- Promises

## Future Enhancements

To add Web Worker support (Requirement 18.4):

1. Create `src/workers/imageCompression.worker.ts`
2. Move compression logic to worker
3. Use `Worker` API to run compression in background thread
4. Update utility to use worker when available

```typescript
// Future implementation with Web Worker
const worker = new Worker(new URL('./imageCompression.worker.ts', import.meta.url));

worker.postMessage({ file, options });
worker.onmessage = (e) => {
  const result = e.data;
  // Handle result
};
```

## Testing

Run unit tests:
```bash
npm run test -- src/utils/imageCompression.test.ts
```

The test suite includes:
- Image type validation (6 tests)
- File size formatting (6 tests)
- Compression with metadata (1 test)
- Dimension calculations (3 tests)
- Progress callbacks (1 test)
- Quality settings (1 test)
- Batch compression (3 tests)
- Edge cases (3 tests)

**Total: 27 tests, all passing ✅**

## Related Requirements

- ✅ **R18.1**: Client-side compression before upload
- ✅ **R18.2**: Max size 0.5MB limit
- ✅ **R18.3**: Max dimension 1920px limit
- ⏳ **R18.4**: Web Worker support (planned)
- ✅ **R18.5**: Progress indication during compression
