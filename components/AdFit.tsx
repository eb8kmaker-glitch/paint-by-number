'use client';
import { useEffect, useRef } from 'react';

interface AdFitProps {
  adUnit: string;
  width: number;
  height: number;
}

// Renders a single Kakao AdFit <ins> unit.
// The KAS loader script is injected once per page via AdFitScript (see below).
export default function AdFit({ adUnit, width, height }: AdFitProps) {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // Re-trigger AdFit scan after mount (needed for SPA navigation)
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).kakao_ad) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).kakao_ad?.run?.();
      } catch (_) { /* ignore */ }
    }
  }, [adUnit]);

  return (
    <ins
      ref={insRef}
      className="kakao_ad_area"
      style={{ display: 'none' }}
      data-ad-unit={adUnit}
      data-ad-width={String(width)}
      data-ad-height={String(height)}
    />
  );
}
