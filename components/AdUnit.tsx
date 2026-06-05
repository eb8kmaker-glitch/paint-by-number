'use client';
import Script from 'next/script';
import AdFit from './AdFit';

export type AdPosition = 'in-article' | 'display' | 'generate';

interface AdUnitProps {
  position: AdPosition;
  className?: string;
  label?: string;
}

// AdFit unit IDs
const ADFIT_UNITS: Record<AdPosition, { unit: string; width: number; height: number }> = {
  'in-article': { unit: 'DAN-vNGt8FIEDKVCjuqY', width: 320, height: 100 },
  'display':    { unit: 'DAN-YYSQB5cbm3kGoFp9', width: 320, height: 50  },
  'generate':   { unit: 'DAN-vNGt8FIEDKVCjuqY', width: 320, height: 100 },
};

// Reserved height per position to prevent CLS
const MIN_HEIGHT: Record<AdPosition, number> = {
  'in-article': 100,
  'display':    50,
  'generate':   100,
};

export default function AdUnit({ position, className, label = 'Advertisement' }: AdUnitProps) {
  const ad = ADFIT_UNITS[position];
  if (!ad) return null;

  return (
    <div className={className} aria-label="advertisement">
      <p style={{
        fontSize: '0.55rem',
        color: 'var(--color-muted)',
        opacity: 0.5,
        textAlign: 'center',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '3px',
        userSelect: 'none',
      }}>
        {label}
      </p>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
        minHeight: MIN_HEIGHT[position],
      }}>
        {/* KAS loader — loaded once, strategy="lazyOnload" */}
        <Script
          id="adfit-kas"
          src="//t1.kakaocdn.net/kas/static/ba.min.js"
          strategy="lazyOnload"
        />
        <AdFit adUnit={ad.unit} width={ad.width} height={ad.height} />
      </div>
    </div>
  );
}
