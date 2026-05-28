// Client-side only — jsPDF uses browser APIs
import type { ColorInfo } from '@/lib/diagramRenderer';
import type { CanvasSize } from '@/lib/diagramRenderer';

// Paper dimensions in mm
const PAPER: Record<CanvasSize, { w: number; h: number; format: string }> = {
  a4:     { w: 210, h: 297, format: 'a4' },
  a3:     { w: 297, h: 420, format: 'a3' },
  square: { w: 210, h: 297, format: 'a4' }, // square diagram centred on A4
};

export async function exportToPdf(
  diagramCanvas: HTMLCanvasElement,
  colorMap: Map<number, ColorInfo>,
  canvasSize: CanvasSize = 'a4',
): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const paper  = PAPER[canvasSize];
  const PW     = paper.w;
  const PH     = paper.h;
  const MARGIN = 10;
  const CONTENT_W = PW - 2 * MARGIN;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: paper.format });

  // ── Diagram section ────────────────────────────────────
  const diagramMaxH = canvasSize === 'square'
    ? CONTENT_W          // square: fill content width
    : (PH - 3 * MARGIN) * 0.60;

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
  pdf.setFontSize(9);
  pdf.setTextColor(60, 60, 60);
  pdf.text('색상 범례 / Color Legend', MARGIN, sepY + 5);

  const entries = Array.from(colorMap.values())
    .filter(e => e.regionCount > 0)
    .sort((a, b) => a.symbol.localeCompare(b.symbol, undefined, { numeric: true }));

  const COLS   = 3;
  const COL_W  = CONTENT_W / COLS;
  const ROW_H  = 8;
  const SWATCH = 4;

  // Calculate how many rows fit on the first page vs. subsequent pages
  const firstPageStartY = sepY + 11;
  const firstPageRows   = Math.floor((PH - MARGIN - firstPageStartY) / ROW_H);
  const extraPageRows   = Math.floor((PH - 2 * MARGIN) / ROW_H);

  let entryIdx = 0;
  let isFirstSection = true;

  while (entryIdx < entries.length) {
    const rowsAvail = isFirstSection ? firstPageRows : extraPageRows;
    const startY    = isFirstSection ? firstPageStartY : MARGIN;
    const batchSize = rowsAvail * COLS;

    if (!isFirstSection) {
      pdf.addPage();
    }

    const batch = entries.slice(entryIdx, entryIdx + batchSize);

    batch.forEach((entry, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const x   = MARGIN + col * COL_W;
      const y   = startY + row * ROW_H;

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

      // Paint name
      pdf.setTextColor(40, 40, 40);
      pdf.text(entry.paintColor.nameKo, x + SWATCH + 9, y);

      // Hex + region count
      pdf.setTextColor(110, 110, 110);
      pdf.text(`${entry.paintColor.hex}  ×${entry.regionCount}`, x + SWATCH + 9, y + 3.5);
    });

    entryIdx      += batch.length;
    isFirstSection = false;
  }

  pdf.save('paint-by-number.pdf');
}

export function exportToPng(canvas: HTMLCanvasElement, filename = 'paint-by-number.png'): void {
  const link = document.createElement('a');
  link.href     = canvas.toDataURL('image/png');
  link.download = filename;
  link.click();
}
