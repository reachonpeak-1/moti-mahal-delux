/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Optimizes Unsplash image URLs to request lower resolution and quality,
 * reducing page payload by up to 90% and speeding up image rendering.
 */
export function getOptimizedImageUrl(url: string, width: number = 400, quality: number = 60): string {
  if (!url || typeof url !== 'string') return url;

  // Local assets (like our luxury generated PNGs) do not need unsplash optimization
  if (!url.includes('images.unsplash.com')) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('w', width.toString());
    urlObj.searchParams.set('q', quality.toString());
    urlObj.searchParams.set('auto', 'format');
    urlObj.searchParams.set('fit', 'crop');
    return urlObj.toString();
  } catch (e) {
    // Regular expression fallback if URL constructor fails
    let optimized = url;
    if (optimized.includes('w=')) {
      optimized = optimized.replace(/w=\d+/, `w=${width}`);
    } else {
      optimized += `&w=${width}`;
    }
    if (optimized.includes('q=')) {
      optimized = optimized.replace(/q=\d+/, `q=${quality}`);
    } else {
      optimized += `&q=${quality}`;
    }
    if (!optimized.includes('fit=')) {
      optimized += '&fit=crop';
    }
    if (!optimized.includes('auto=')) {
      optimized += '&auto=format';
    }
    return optimized;
  }
}
