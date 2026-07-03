/**
 * processLogo.js
 * Crops whitespace and converts white background to transparent for the header logo.
 */

import { Jimp } from 'jimp';
import path from 'path';

const inputPath = 'C:\\Users\\Kamalpreet\\.gemini\\antigravity\\brain\\ea7c7498-4407-423b-8a33-f09a594f35da\\media__1782989951151.png';
const outputPath1 = 'c:\\Users\\Kamalpreet\\Downloads\\moti-mahal-delux\\src\\assets\\logo.png';
const outputPath2 = 'c:\\Users\\Kamalpreet\\Downloads\\moti-mahal-delux\\src\\assets\\gk_regency_logo.png';

async function processImage() {
  try {
    console.log('📖 Reading input logo image...');
    const image = await Jimp.read(inputPath);
    
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    console.log(`Original dimensions: ${width}x${height}`);

    // Scan pixels and convert white to transparent
    console.log('🔄 Converting white pixels to transparent...');
    image.scan(0, 0, width, height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // If color is very close to white, make it transparent
      if (r > 240 && g > 240 && b > 240) {
        this.bitmap.data[idx + 3] = 0; // Alpha
      }
    });

    // Find bounding box of transparent content (alpha > 0)
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    image.scan(0, 0, width, height, function(x, y, idx) {
      const alpha = this.bitmap.data[idx + 3];
      if (alpha > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    });

    console.log(`Bounding Box found: X(${minX} to ${maxX}), Y(${minY} to ${maxY})`);

    if (maxX >= minX && maxY >= minY) {
      const boxWidth = maxX - minX + 1;
      const boxHeight = maxY - minY + 1;
      
      // Add a small safety padding
      const padding = 10;
      const cropX = Math.max(0, minX - padding);
      const cropY = Math.max(0, minY - padding);
      const cropW = Math.min(width - cropX, boxWidth + padding * 2);
      const cropH = Math.min(height - cropY, boxHeight + padding * 2);

      console.log(`Cropping to: ${cropW}x${cropH} at (${cropX}, ${cropY})`);
      image.crop({ x: cropX, y: cropY, w: cropW, h: cropH });
    } else {
      console.warn('⚠️ No content found! Saving transparent full image.');
    }

    console.log('💾 Writing outputs...');
    await image.write(outputPath1);
    await image.write(outputPath2);
    console.log('✅ Logo processing completed successfully!');
  } catch (err) {
    console.error('❌ Failed processing logo:', err);
  }
}

processImage();
