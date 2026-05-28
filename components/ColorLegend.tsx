'use client';
import { ColorInfo } from '@/lib/diagramRenderer';

interface Props {
  colorMap: Map<number, ColorInfo>;
}

export default function ColorLegend({ colorMap }: Props) {
  const entries = Array.from(colorMap.values())
    .filter(e => e.regionCount > 0)
    .sort((a, b) => a.symbol.localeCompare(b.symbol, undefined, { numeric: true }));

  if (entries.length === 0) return null;

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">
        색상 범례 <span className="font-normal text-slate-400 text-xs">/ Color Legend</span>
      </h3>

      <div className="overflow-auto max-h-[520px] pr-1">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-50 z-10">
            <tr className="text-slate-500 border-b border-slate-200">
              <th className="py-1.5 px-1 text-center font-medium w-8">기호</th>
              <th className="py-1.5 px-1 text-center font-medium w-8">색상</th>
              <th className="py-1.5 px-1 text-left font-medium">물감 이름</th>
              <th className="py-1.5 px-1 text-left font-medium hidden sm:table-cell">HEX</th>
              <th className="py-1.5 px-1 text-center font-medium w-10">구역</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <tr key={entry.symbol} className="hover:bg-slate-50 transition-colors">
                {/* Symbol */}
                <td className="py-1.5 px-1 text-center">
                  <span className="inline-flex items-center justify-center
                    w-6 h-6 rounded bg-slate-100 font-bold text-slate-700 text-xs">
                    {entry.symbol}
                  </span>
                </td>

                {/* Color swatch */}
                <td className="py-1.5 px-1 text-center">
                  <span
                    className="inline-block w-6 h-6 rounded border border-slate-200 shadow-sm"
                    style={{ backgroundColor: entry.paintColor.hex }}
                    title={entry.paintColor.hex}
                  />
                </td>

                {/* Paint name */}
                <td className="py-1.5 px-2">
                  <p className="font-medium text-slate-700 leading-tight">
                    {entry.paintColor.nameKo}
                  </p>
                  <p className="text-slate-400 leading-tight text-[10px]">
                    {entry.paintColor.name}
                  </p>
                </td>

                {/* Hex code */}
                <td className="py-1.5 px-1 hidden sm:table-cell">
                  <span className="font-mono text-slate-500 text-[10px]">
                    {entry.paintColor.hex}
                  </span>
                </td>

                {/* Region count */}
                <td className="py-1.5 px-1 text-center">
                  <span className="text-slate-500 font-medium tabular-nums">
                    {entry.regionCount}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-slate-400 mt-2 text-right">
        총 {entries.length}색 / {entries.reduce((s, e) => s + e.regionCount, 0)}구역
      </p>
    </div>
  );
}
