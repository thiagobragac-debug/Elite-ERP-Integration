/**
 * Image Optimization Script
 * Converts PNG/JPG images to WebP format for better performance
 * Part of Task 26.2 - Fix Lighthouse recommendations
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const imageExtensions = ['.png', '.jpg', '.jpeg'];

async function optimizeImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (!imageExtensions.includes(ext)) {
    return;
  }

  const fileName = path.basename(filePath, ext);
  const dirName = path.dirname(filePath);
  const webpPath = path.join(dirName, `${fileName}.webp`);

  // Skip if WebP already exists and is newer
  if (fs.existsSync(webpPath)) {
    const originalStats = fs.statSync(filePath);
    const webpStats = fs.statSync(webpPath);
    if (webpStats.mtime > originalStats.mtime) {
      console.log(`✓ Skipping ${path.relative(publicDir, filePath)} (WebP already exists)`);
      return;
    }
  }

  try {
    const info = await sharp(filePath)
      .webp({ quality: 85 })
      .toFile(webpPath);

    const originalSize = fs.statSync(filePath).size;
    const savings = ((originalSize - info.size) / originalSize * 100).toFixed(1);

    console.log(`✓ Optimized ${path.relative(publicDir, filePath)}`);
    console.log(`  Original: ${(originalSize / 1024).toFixed(2)} KB → WebP: ${(info.size / 1024).toFixed(2)} KB (${savings}% smaller)`);
  } catch (error) {
    console.error(`✗ Failed to optimize ${path.relative(publicDir, filePath)}:`, error.message);
  }
}

async function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.isFile()) {
      await optimizeImage(fullPath);
    }
  }
}

async function main() {
  console.log('🖼️  Starting image optimization...\n');
  
  if (!fs.existsSync(publicDir)) {
    console.error(`Error: Public directory not found at ${publicDir}`);
    process.exit(1);
  }

  await processDirectory(publicDir);
  
  console.log('\n✅ Image optimization complete!');
  console.log('\n💡 Note: Update your <img> tags to use WebP with PNG fallback:');
  console.log('   <img src="image.webp" alt="Description" loading="lazy" />');
}

main().catch(console.error);
