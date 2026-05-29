'use client';

export type AdPosition = 'in-article' | 'multiplex' | 'display';

interface AdUnitProps {
  position: AdPosition;
  adsenseSlot?: string;
  adFitUnit?: string;
  className?: string;
}

// Placeholder — replace with real ad code after AdSense/AdFit approval
export default function AdUnit({ position, className }: AdUnitProps) {
  if (!process.env.NEXT_PUBLIC_ADS_ENABLED) return null;
  return (
    <div
      className={className}
      data-ad-position={position}
      style={{ minHeight: position === 'multiplex' ? 280 : 90 }}
      aria-hidden="true"
    />
  );
}
