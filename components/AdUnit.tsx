'use client';
import Script from 'next/script';
import AdFit from './AdFit';

export type AdPosition = 'in-article' | 'display';

interface AdUnitProps {
  position: AdPosition;
  className?: string;
}

// AdFit unit IDs
const ADFIT_UNITS: Record<AdPosition, { unit: string; width: number; height: number }> = {
  'in-article': { unit: 'DAN-vNGt8FIEDKVCjuqY', width: 320, height: 100 },
  'display':    { unit: 'DAN-YYSQB5cbm3kGoFp9', width: 320, height: 50  },
};

export default function AdUnit({ position, className }: AdUnitProps) {
  const ad = ADFIT_UNITS[position];
  if (!ad) return null;

  return (
    <div
      className={className}
      style={{ display: 'flex', justifyContent: 'center', overflow: 'hidden' }}
      aria-label="광고"
    >
      {/* KAS loader — loaded once, strategy="lazyOnload" */}
      <Script
        id="adfit-kas"
        src="//t1.kakaocdn.net/kas/static/ba.min.js"
        strategy="lazyOnload"
      />
      <AdFit adUnit={ad.unit} width={ad.width} height={ad.height} />
    </div>
  );
}
