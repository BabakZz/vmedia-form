'use client';
import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

type Props = Omit<ImageProps, 'onError'> & { fallbackClassName?: string };

export default function SafeImage({ fallbackClassName, ...props }: Props) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    // fallback ساده؛ اگر fill بود، از absolute/cover استفاده کن
    if ('fill' in props && props.fill) {
      return (
        <img
          src={typeof props.src === 'string' ? props.src : ''}
          alt={props.alt || ''}
          className={`${fallbackClassName || ''} absolute inset-0 w-full h-full object-cover`}
        />
      );
    }
    return (
      <img
        src={typeof props.src === 'string' ? props.src : ''}
        alt={props.alt || ''}
        className={fallbackClassName}
        width={(props as any).width}
        height={(props as any).height}
      />
    );
  }

  return (
    <Image
      {...props}
      onError={() => setBroken(true)}
      // برای تصاویر fill پیشنهاد میشه
      sizes={('fill' in props && props.fill) ? '100vw' : undefined}
      priority={props.priority}
    />
  );
}
