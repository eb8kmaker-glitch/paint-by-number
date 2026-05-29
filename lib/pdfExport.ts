// Client-side only — jsPDF uses browser APIs
import type { ColorInfo, CanvasSize } from '@/lib/diagramRenderer';
import { FRAME_SPECS } from '@/lib/diagramRenderer';

// A4 page in mm
const A4_W = 210;
const A4_H = 297;
const MARGIN = 15;
const CONTENT_W = A4_W - 2 * MARGIN;
const CONTENT_H = A4_H - 2 * MARGIN;

// Load an image from a data URL safely (with error + timeout guard)
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timeout = setTimeout(() => reject(new Error('Image load timeout')), 10_000);
    img.onload  = () => { clearTimeout(timeout); resolve(img); };
    img.onerror = () => { clearTimeout(timeout); reject(new Error('Image load error')); };
    img.src = src;
  });
}

// Scale a canvas down so its longest side is <= maxSide.
// Returns the original canvas unchanged if it already fits.
function scaleCanvas(src: HTMLCanvasElement, maxSide: number): HTMLCanvasElement {
  const ratio = Math.min(1, maxSide / Math.max(src.width, src.height));
  if (ratio >= 1) return src;
  const dst = document.createElement('canvas');
  dst.width  = Math.round(src.width  * ratio);
  dst.height = Math.round(src.height * ratio);
  const ctx = dst.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, dst.width, dst.height);
  return dst;
}

export async function exportToPdf(
  diagramCanvas: HTMLCanvasElement,
  colorMap: Map<number, ColorInfo>,
  canvasSize: CanvasSize,
  originalImageDataUrl?: string,
  metadata?: { date?: string; colorCount?: number; detailLevel?: string },
): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const frameSpec = FRAME_SPECS[canvasSize];
  const frameName = frameSpec
    ? `${frameSpec.nameEn} / ${frameSpec.w}x${frameSpec.h}mm`
    : canvasSize.toUpperCase();

  // ══════════════════════════════════════════════════════════════
  // Page 1 — Cover
  // ══════════════════════════════════════════════════════════════
  pdf.setFillColor(253, 250, 245);
  pdf.rect(0, 0, A4_W, A4_H, 'F');
  pdf.setFillColor(139, 109, 56);
  pdf.rect(0, 0, A4_W, 8, 'F');

  pdf.setFontSize(22);
  pdf.setTextColor(44, 34, 24);
  pdf.text('Paint by Number', A4_W / 2, 30, { align: 'center' });
  pdf.setFontSize(11);
  pdf.setTextColor(100, 85, 65);
  pdf.text('Paint by Number Diagram', A4_W / 2, 38, { align: 'center' });

  pdf.setDrawColor(180, 150, 100);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN + 20, 43, A4_W - MARGIN - 20, 43);

  let thumbY = 50;
  if (originalImageDataUrl) {
    try {
      const img = await loadImage(originalImageDataUrl);
      const thumbMaxW = 100, thumbMaxH = 80;
      const ar = img.naturalWidth / img.naturalHeight;
      let tw = thumbMaxW, th = tw / ar;
      if (th > thumbMaxH) { th = thumbMaxH; tw = th * ar; }
      const tx = (A4_W - tw) / 2;
      pdf.addImage(img, 'JPEG', tx, thumbY, tw, th);
      pdf.setDrawColor(139, 109, 56);
      pdf.setLineWidth(1);
      pdf.rect(tx - 1, thumbY - 1, tw + 2, th + 2, 'S');
      thumbY += th + 8;
    } catch { /* skip thumbnail on error */ }
  }

  const metaY = thumbY + 5;
  const dateStr = metadata?.date ?? new Date().toLocaleDateString('en-US');
  const rows: [string, string][] = [
    ['Date', dateStr],
    ['Color Count', String(metadata?.colorCount ?? colorMap.size)],
    ['Frame Size', frameName],
    ['Detail Level', metadata?.detailLevel ?? '-'],
  ];
  const tableX = MARGIN + 15;
  const tableW = CONTENT_W - 30;
  const cellH = 9;
  pdf.setFontSize(9);
  rows.forEach(([label, value], i) => {
    const y = metaY + i * cellH;
    if (i % 2 === 0) {
      pdf.setFillColor(245, 240, 232);
      pdf.rect(tableX, y - 6.5, tableW, cellH, 'F');
    }
    pdf.setTextColor(100, 85, 65);
    pdf.text(label, tableX + 3, y);
    pdf.setTextColor(44, 34, 24);
    pdf.text(value, tableX + tableW - 3, y, { align: 'right' });
  });
  pdf.setDrawColor(200, 180, 150);
  pdf.setLineWidth(0.3);
  pdf.rect(tableX, metaY - 6.5, tableW, rows.length * cellH, 'S');

  pdf.setFontSize(8);
  pdf.setTextColor(150, 130, 100);
  pdf.text('Paint by Number Generator', A4_W / 2, A4_H - 8, { align: 'center' });
  pdf.text('paint-by-number-two.vercel.app', A4_W / 2, A4_H - 4, { align: 'center' });

  // ══════════════════════════════════════════════════════════════
  // Page 2 — Color Guide
  // ══════════════════════════════════════════════════════════════
  pdf.addPage();
  pdf.setFillColor(253, 250, 245);
  pdf.rect(0, 0, A4_W, A4_H, 'F');
  pdf.setFillColor(139, 109, 56);
  pdf.rect(0, 0, A4_W, 8, 'F');

  pdf.setFontSize(16);
  pdf.setTextColor(44, 34, 24);
  pdf.text('Color Guide', MARGIN, 22);
  pdf.setDrawColor(180, 150, 100);
  pdf.setLineWidth(0.4);
  pdf.line(MARGIN, 26, A4_W - MARGIN, 26);

  pdf.setFontSize(8.5);
  pdf.setTextColor(70, 60, 50);
  pdf.text('Fill each region with the paint color matching its symbol.', MARGIN, 33);

  const entries = Array.from(colorMap.values())
    .filter(e => e.regionCount > 0)
    .sort((a, b) => a.symbol.localeCompare(b.symbol, undefined, { numeric: true }));

  const SWATCH_SIZE = 12;
  const ROW_H = 14;
  const COL_W = CONTENT_W / 2;
  let curY = 42;

  // Column headers
  const headers = ['Sym', 'Color', 'Name', 'HEX', 'Zones'];
  const hOffsets = [0, 16, 30, 68, 90];
  headers.forEach((h, hi) => {
    const x = MARGIN + hOffsets[hi];
    pdf.setFontSize(7);
    pdf.setTextColor(100, 85, 65);
    pdf.text(h, x, curY);
  });
  curY += 5;
  pdf.setDrawColor(200, 175, 140);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, curY, A4_W - MARGIN, curY);
  curY += 3;

  let col = 0, rowInCol = 0;
  entries.forEach((entry) => {
    const maxRowsPerCol = Math.floor((A4_H - MARGIN - curY - 25) / ROW_H);
    const baseX = MARGIN + col * COL_W;
    const y = curY + rowInCol * ROW_H;

    const [r, g, b] = entry.paintColor.rgb;
    pdf.setFillColor(r, g, b);
    pdf.rect(baseX, y - SWATCH_SIZE + 2, SWATCH_SIZE, SWATCH_SIZE, 'F');
    pdf.setDrawColor(150, 150, 150);
    pdf.setLineWidth(0.2);
    pdf.rect(baseX, y - SWATCH_SIZE + 2, SWATCH_SIZE, SWATCH_SIZE, 'S');

    pdf.setFontSize(8);
    pdf.setTextColor(20, 20, 20);
    pdf.text(entry.symbol, baseX + 14, y - 2);
    pdf.setFontSize(7);
    pdf.setTextColor(40, 40, 40);
    pdf.text(entry.paintColor.name, baseX + 28, y - 2);
    pdf.setTextColor(80, 80, 80);
    pdf.text(entry.paintColor.hex, baseX + 66, y - 2);
    pdf.setTextColor(100, 85, 65);
    pdf.text(`x${entry.regionCount}`, baseX + 88, y - 2);

    rowInCol++;
    if (rowInCol >= maxRowsPerCol && col === 0) { col = 1; rowInCol = 0; }
  });

  pdf.setFontSize(8);
  pdf.setTextColor(150, 130, 100);
  pdf.text('Paint by Number Generator', A4_W / 2, A4_H - 8, { align: 'center' });
  pdf.text('paint-by-number-two.vercel.app', A4_W / 2, A4_H - 4, { align: 'center' });

  // ══════════════════════════════════════════════════════════════
  // Page 3+ — Diagram Tiles
  // Scale the canvas down to max 2480px (A4@300dpi) before tiling
  // to keep toDataURL fast and memory usage under control.
  // ══════════════════════════════════════════════════════════════
  const scaledDiagram = scaleCanvas(diagramCanvas, 2480);

  const TILE_W_MM = CONTENT_W;
  const TILE_H_MM = CONTENT_H - 12;
  const OVERLAP_MM = 8;
  const strideW = TILE_W_MM - OVERLAP_MM;
  const strideH = TILE_H_MM - OVERLAP_MM;

  const diagW_mm = frameSpec ? frameSpec.w : A4_W - 2 * MARGIN;
  const diagH_mm = frameSpec ? frameSpec.h : A4_H - 2 * MARGIN;

  const tilesX = Math.ceil(diagW_mm / strideW);
  const tilesY = Math.ceil(diagH_mm / strideH);
  const totalTiles = tilesX * tilesY;

  const pxPerMmX = scaledDiagram.width  / diagW_mm;
  const pxPerMmY = scaledDiagram.height / diagH_mm;

  let tileNum = 0;
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      tileNum++;
      pdf.addPage();

      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, A4_W, A4_H, 'F');

      pdf.setFontSize(8);
      pdf.setTextColor(120, 100, 80);
      pdf.text(`[ ${tileNum} / ${totalTiles} ]`, A4_W - MARGIN, MARGIN - 4, { align: 'right' });

      const srcX_mm = tx * strideW;
      const srcY_mm = ty * strideH;
      const srcW_mm = Math.min(TILE_W_MM, diagW_mm - srcX_mm);
      const srcH_mm = Math.min(TILE_H_MM, diagH_mm - srcY_mm);

      const srcX_px = Math.round(srcX_mm * pxPerMmX);
      const srcY_px = Math.round(srcY_mm * pxPerMmY);
      const srcW_px = Math.round(srcW_mm * pxPerMmX);
      const srcH_px = Math.round(srcH_mm * pxPerMmY);

      const tile = document.createElement('canvas');
      tile.width  = srcW_px;
      tile.height = srcH_px;
      const tileCtx = tile.getContext('2d')!;
      tileCtx.drawImage(scaledDiagram, srcX_px, srcY_px, srcW_px, srcH_px, 0, 0, srcW_px, srcH_px);

      pdf.addImage(tile.toDataURL('image/jpeg', 0.90), 'JPEG', MARGIN, MARGIN, srcW_mm, srcH_mm);

      // Crosshair corner marks
      pdf.setDrawColor(180, 160, 130);
      pdf.setLineWidth(0.3);
      [[MARGIN, MARGIN], [MARGIN + srcW_mm, MARGIN],
       [MARGIN, MARGIN + srcH_mm], [MARGIN + srcW_mm, MARGIN + srcH_mm]].forEach(([x, y]) => {
        pdf.line(x - 4, y, x + 4, y);
        pdf.line(x, y - 4, x, y + 4);
      });

      pdf.setFontSize(7);
      pdf.setTextColor(120, 100, 80);
      pdf.text('1 zone = 10mm', MARGIN, MARGIN + srcH_mm + 6);
      pdf.setTextColor(150, 130, 100);
      pdf.text('Paint by Number Generator — paint-by-number-two.vercel.app', A4_W / 2, A4_H - 4, { align: 'center' });
    }
  }

  // ══════════════════════════════════════════════════════════════
  // Final Page — Reference Image
  // ══════════════════════════════════════════════════════════════
  if (originalImageDataUrl) {
    pdf.addPage();
    pdf.setFillColor(253, 250, 245);
    pdf.rect(0, 0, A4_W, A4_H, 'F');
    pdf.setFillColor(139, 109, 56);
    pdf.rect(0, 0, A4_W, 8, 'F');

    pdf.setFontSize(14);
    pdf.setTextColor(44, 34, 24);
    pdf.text('Reference Image', A4_W / 2, 20, { align: 'center' });
    pdf.setDrawColor(180, 150, 100);
    pdf.setLineWidth(0.4);
    pdf.line(MARGIN + 10, 24, A4_W - MARGIN - 10, 24);

    try {
      const img = await loadImage(originalImageDataUrl);
      const imgMaxW = CONTENT_W, imgMaxH = CONTENT_H - 20;
      const ar = img.naturalWidth / img.naturalHeight;
      let iw = imgMaxW, ih = iw / ar;
      if (ih > imgMaxH) { ih = imgMaxH; iw = ih * ar; }
      pdf.addImage(img, 'JPEG', (A4_W - iw) / 2, 30, iw, ih);

      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 85, 65);
      pdf.text('Use this image as reference while painting.',
        A4_W / 2, 30 + ih + 8, { align: 'center' });
    } catch { /* skip reference image on error */ }

    pdf.setFontSize(8);
    pdf.setTextColor(150, 130, 100);
    pdf.text('Paint by Number Generator', A4_W / 2, A4_H - 8, { align: 'center' });
    pdf.text('paint-by-number-two.vercel.app', A4_W / 2, A4_H - 4, { align: 'center' });
  }

  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'paint-by-number.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToPng(canvas: HTMLCanvasElement, filename = 'paint-by-number.png'): void {
  const link = document.createElement('a');
  link.href     = canvas.toDataURL('image/png');
  link.download = filename;
  link.click();
}
