import React, { useState } from 'react';

const FALLBACK_SVG =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e293b"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><g fill="none" stroke="#f59e0b" stroke-width="6" opacity="0.7"><circle cx="200" cy="130" r="34"/><path d="M170 210c20-22 80-22 100 0"/></g></svg>`
  );

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackSrc?: string;
}

/**
 * Offline-safe image: lazy + async decode by default, hides broken
 * remote (Unsplash) images behind a local placeholder instead of a
 * broken-image icon. No layout shift when width/height come from className.
 */
export const SmartImage: React.FC<Props> = ({ src, fallbackSrc, alt = '', loading, decoding, referrerPolicy, onError, ...rest }) => {
  const [failed, setFailed] = useState(false);
  const effectiveSrc = failed || !src ? fallbackSrc || FALLBACK_SVG : src;
  return (
    <img
      src={effectiveSrc}
      alt={alt}
      loading={loading ?? 'lazy'}
      decoding={decoding ?? 'async'}
      referrerPolicy={referrerPolicy ?? 'no-referrer'}
      draggable={false}
      onError={(e) => {
        setFailed(true);
        onError?.(e as unknown as React.SyntheticEvent<HTMLImageElement, Event>);
      }}
      {...rest}
    />
  );
};
