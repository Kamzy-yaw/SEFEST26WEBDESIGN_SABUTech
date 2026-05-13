"use client";

import { useState } from "react";

type SafeImageProps = {
  src?: string | null;
  fallbackSrc: string;
  alt?: string;
  className?: string;
};

export function SafeImage({ src, fallbackSrc, alt = "", className }: SafeImageProps) {
  const [imageSrc, setImageSrc] = useState(src || fallbackSrc);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => setImageSrc(fallbackSrc)}
    />
  );
}
