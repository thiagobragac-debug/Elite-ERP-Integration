/**
 * OptimizedImage Component
 * Automatically uses WebP with fallback, lazy loading, and responsive sizing
 * Part of Task 26.2 - Fix Lighthouse recommendations
 */

import React from 'react';
import { getWebPPath, type OptimizedImageProps } from '@/utils/imageOptimization';

/**
 * Optimized image component that:
 * - Uses WebP format with PNG/JPG fallback
 * - Enables lazy loading by default
 * - Sets explicit width/height to prevent layout shift (CLS)
 * - Supports responsive sizing
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  fetchPriority = 'auto',
}) => {
  const webpSrc = getWebPPath(src);
  const hasWebP = src !== webpSrc;

  // If WebP is available, use picture element with fallback
  if (hasWebP) {
    return (
      <picture>
        <source srcSet={webpSrc} type="image/webp" />
        <source srcSet={src} type={`image/${src.match(/\.(png|jpg|jpeg)$/i)?.[1] || 'jpeg'}`} />
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
          loading={loading}
          // @ts-ignore - fetchpriority is valid but not in types yet
          fetchpriority={fetchPriority}
          decoding="async"
        />
      </picture>
    );
  }

  // Fallback to regular img if no WebP available
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={loading}
      // @ts-ignore - fetchpriority is valid but not in types yet
      fetchpriority={fetchPriority}
      decoding="async"
    />
  );
};

/**
 * Background image with WebP support
 * Use for hero sections and decorative backgrounds
 */
interface OptimizedBackgroundProps {
  src: string;
  className?: string;
  children?: React.ReactNode;
}

export const OptimizedBackground: React.FC<OptimizedBackgroundProps> = ({
  src,
  className = '',
  children,
}) => {
  const webpSrc = getWebPPath(src);
  const hasWebP = src !== webpSrc;

  const style: React.CSSProperties = {
    backgroundImage: hasWebP
      ? `url('${webpSrc}'), url('${src}')`
      : `url('${src}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
};
