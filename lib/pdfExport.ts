// Client-side only — jsPDF uses browser APIs
import type { ColorInfo } from '@/lib/diagramRenderer';

export async function exportToPdf(
  diagramCanvas: HTMLCanvasElement,
  colorMap: Map<number, ColorInfo>,
): Promise<void> {
  // Dynamic import to avoid SSR issues
  const { jsPDF } = await import('jspdf');

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PW = 210, PH = 297;
  const MARGIN = 10;
  const CONTENT_W = PW - 2 * MARGIN;

  // ── Diagram section (upper 60 % of page) ──────────────
  const diagramMaxH = (PH - 3 * MARGIN) * 0.60;
  const ar = diagramCanvas.width / diagramCanvas.height;
  let dw = CONTENT_W;
  let dh = dw / ar;
  if (dh > diagramMaxH) { dh = diagramMaxH; dw = dh * ar; }
  const dx = MARGIN + (CONTENT_W - dw) / 2;
  const dy = MARGIN;

  const imgData = diagramCanvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', dx, dy, dw, dh);

  // Thin separator
  const sepY = dy + dh + 4;
  pdf.setDrawColor(200, 200, 200);
  pdf.line(MARGIN, sepY, PW - MARGIN, sepY);

  // ── Legend section ─────────────────────────────────────
  const legY = sepY + 6;
  pdf.setFontSize(9);
  pdf.setTextColor(60, 60, 60);
  pdf.text('색상 범례 / Color Legend', MARGIN, legY);

  const entries = Array.from(colorMap.values())
    .filter(e => e.regionCount > 0)
    .sort((a, b) => a.symbol.localeCompare(b.symbol, undefined, { numeric: true }));

  const COLS    = 3;
  const COL_W   = CONTENT_W / COLS;
  const ROW_H   = 8;
  const SWATCH  = 4;
  const startY  = legY + 5;

  entries.forEach((entry, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const x   = MARGIN + col * COL_W;
    const y   = startY + row * ROW_H;

    if (y + ROW_H > PH - MARGIN) return; // skip overflow

    // Colour swatch
    const [r, g, b] = entry.paintColor.rgb;
    pdf.setFillColor(r, g, b);
    pdf.rect(x, y - SWATCH + 1, SWATCH, SWATCH, 'F');
    pdf.setDrawColor(160, 160, 160);
    pdf.rect(x, y - SWATCH + 1, SWATCH, SWATCH, 'S');

    // Symbol
    pdf.setFontSize(7);
    pdf.setTextColor(20, 20, 20);
    pdf.text(entry.symbol, x + SWATCH + 2, y);

    // Paint name (Korean)
    pdf.setTextColor(40, 40, 40);
    pdf.text(entry.paintColor.nameKo, x + SWATCH + 9, y);

    // Hex + region count
    pdf.setTextColor(110, 110, 110);
    pdf.text(`${entry.paintColor.hex}  ×${entry.regionCount}`, x + SWATCH + 9, y + 3.5);
  });

  pdf.save('paint-by-number.pdf');
}

export function exportToPng(canvas: HTMLCanvasElement, filename = 'paint-by-number.png'): void {
  const link = document.createElement('a');
  link.href     = canvas.toDataURL('image/png');
  link.download = filename;
  link.click();
}
