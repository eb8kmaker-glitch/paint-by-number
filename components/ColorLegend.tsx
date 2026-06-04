'use client';
import { ColorInfo } from '@/lib/diagramRenderer';

type Lang = 'en' | 'ko' | 'ja';

interface Props {
  colorMap:           Map<number, ColorInfo>;
  labeledRegionCount?: number;
  totalRegionCount?:   number;
  lang?:              Lang;
}

const LEGEND_TEXT: Record<Lang, {
  title: string;
  symbol: string;
  color: string;
  paint: string;
  zones: string;
  summary: (colors: number, zones: number, shown: number, total: number) => string;
}> = {
  ko: {
    title: '색상 범례',
    symbol: '기호',
    color: '색상',
    paint: '물감',
    zones: '구역',
    summary: (colors, zones, shown, total) => `총 ${colors}색 · ${zones}구역 · 번호 표시 ${shown}/${total}`,
  },
  en: {
    title: 'Color Legend',
    symbol: 'Sym',
    color: 'Color',
    paint: 'Paint',
    zones: 'Zones',
    summary: (colors, zones, shown, total) => `${colors} colors · ${zones} zones · ${shown}/${total} labeled`,
  },
  ja: {
    title: 'カラー凡例',
    symbol: '記号',
    color: '色',
    paint: '絵具',
    zones: '区域',
    summary: (colors, zones, shown, total) => `全${colors}色 · ${zones}区域 · 番号表示 ${shown}/${total}`,
  },
};

export default function ColorLegend({ colorMap, labeledRegionCount, totalRegionCount, lang = 'ko' }: Props) {
  const t = LEGEND_TEXT[lang];
  const entries = Array.from(colorMap.values())
    .filter(e => e.regionCount > 0)
    .sort((a, b) => a.symbol.localeCompare(b.symbol, undefined, { numeric: true }));

  if (entries.length === 0) return null;

  const totalZones = entries.reduce((s, e) => s + e.regionCount, 0);

  return (
    <div className="w-full">
      <h3 style={{
        fontFamily: 'var(--font-playfair), Georgia, serif',
        fontSize: '0.9rem',
        fontWeight: 600,
        color: 'var(--color-ink)',
        marginBottom: '6px',
      }}>
        {t.title}
      </h3>
      <div style={{ height: '1px', background: 'var(--color-frame)', opacity: 0.35, marginBottom: '10px' }} />

      <div className="overflow-auto pr-1" style={{ maxHeight: '520px' }}>
        <table className="w-full text-xs border-collapse">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#FDFAF5' }}>
            <tr style={{ borderBottom: '1px solid #DDD0BC' }}>
              <th className="py-1.5 px-1 text-center font-medium w-8 section-label">{t.symbol}</th>
              <th className="py-1.5 px-1 text-center font-medium w-8 section-label">{t.color}</th>
              <th className="py-1.5 px-1 text-left font-medium section-label">{t.paint}</th>
              <th className="py-1.5 px-1 text-left font-medium hidden sm:table-cell section-label">HEX</th>
              <th className="py-1.5 px-1 text-center font-medium w-10 section-label">{t.zones}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.symbol}
                className="transition-colors"
                style={{ borderBottom: '1px solid #F0E8DC' }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#FBF6EF'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
              >
                {/* Symbol badge */}
                <td className="py-1.5 px-1 text-center">
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '3px',
                    background: '#EDE5D8',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    color: 'var(--color-ink)',
                  }}>
                    {entry.symbol}
                  </span>
                </td>

                {/* Color circle */}
                <td className="py-1.5 px-1 text-center">
                  <span
                    style={{
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '1px solid rgba(44, 34, 24, 0.15)',
                      backgroundColor: entry.paintColor.hex,
                    }}
                    title={entry.paintColor.hex}
                  />
                </td>

                {/* Paint name */}
                <td className="py-1.5 px-2">
                  <p style={{
                    fontFamily: 'var(--font-playfair), Georgia, serif',
                    fontWeight: 500,
                    color: 'var(--color-ink)',
                    fontSize: '0.75rem',
                    lineHeight: 1.2,
                  }}>
                    {lang === 'en' ? entry.paintColor.name : lang === 'ja' ? entry.paintColor.nameJa : entry.paintColor.nameKo}
                  </p>
                  <p style={{ fontSize: '0.6rem', color: 'var(--color-muted)', lineHeight: 1.2 }}>
                    {lang === 'ko' ? entry.paintColor.name : entry.paintColor.nameKo}
                  </p>
                </td>

                {/* Hex code */}
                <td className="py-1.5 px-1 hidden sm:table-cell">
                  <span style={{ fontFamily: 'monospace', fontSize: '0.625rem', color: 'var(--color-muted)' }}>
                    {entry.paintColor.hex}
                  </span>
                </td>

                {/* Region count */}
                <td className="py-1.5 px-1 text-center">
                  <span style={{ color: 'var(--color-muted)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                    {entry.regionCount}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: '0.625rem', color: 'var(--color-muted)', marginTop: '8px', textAlign: 'right', opacity: 0.8 }}>
        {labeledRegionCount !== undefined && totalRegionCount !== undefined
          ? t.summary(entries.length, totalZones, labeledRegionCount, totalRegionCount)
          : `${entries.length} · ${totalZones}`}
      </p>
    </div>
  );
}
