'use client';
import { ColorInfo } from '@/lib/diagramRenderer';

interface Props {
  colorMap:           Map<number, ColorInfo>;
  labeledRegionCount?: number;
  totalRegionCount?:   number;
}

export default function ColorLegend({ colorMap, labeledRegionCount, totalRegionCount }: Props) {
  const entries = Array.from(colorMap.values())
    .filter(e => e.regionCount > 0)
    .sort((a, b) => a.symbol.localeCompare(b.symbol, undefined, { numeric: true }));

  if (entries.length === 0) return null;

  return (
    <div className="w-full">
      <h3 style={{
        fontFamily: 'var(--font-playfair), Georgia, serif',
        fontSize: '0.9rem',
        fontWeight: 600,
        color: 'var(--color-ink)',
        marginBottom: '6px',
      }}>
        색상 범례
        <span style={{
          fontFamily: 'var(--font-inter), Inter, sans-serif',
          fontSize: '0.7rem',
          fontWeight: 400,
          color: 'var(--color-muted)',
          marginLeft: '6px',
        }}>
          / Color Legend
        </span>
      </h3>
      <div style={{ height: '1px', background: 'var(--color-frame)', opacity: 0.35, marginBottom: '10px' }} />

      <div className="overflow-auto pr-1" style={{ maxHeight: '520px' }}>
        <table className="w-full text-xs border-collapse">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#FDFAF5' }}>
            <tr style={{ borderBottom: '1px solid #DDD0BC' }}>
              <th className="py-1.5 px-1 text-center font-medium w-8 section-label">기호</th>
              <th className="py-1.5 px-1 text-center font-medium w-8 section-label">색상</th>
              <th className="py-1.5 px-1 text-left font-medium section-label">물감</th>
              <th className="py-1.5 px-1 text-left font-medium hidden sm:table-cell section-label">HEX</th>
              <th className="py-1.5 px-1 text-center font-medium w-10 section-label">구역</th>
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
                    {entry.paintColor.nameKo}
                  </p>
                  <p style={{ fontSize: '0.6rem', color: 'var(--color-muted)', lineHeight: 1.2 }}>
                    {entry.paintColor.name}
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
        총 {entries.length}색 / {entries.reduce((s, e) => s + e.regionCount, 0)}구역
        {labeledRegionCount !== undefined && totalRegionCount !== undefined && (
          <> · 번호 표시 {labeledRegionCount}/{totalRegionCount}</>
        )}
      </p>
    </div>
  );
}
