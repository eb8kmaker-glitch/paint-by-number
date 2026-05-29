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
  metadata?: { date?: string; colorCount?: number; detailLevel?: string; colorMode?: string },
): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Always set font explicitly — jsPDF can lose font state across addPage() calls
  const setFont = (size: number) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(size);
  };

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

  setFont(22);
  pdf.setTextColor(44, 34, 24);
  pdf.text('Paint by Number', A4_W / 2, 30, { align: 'center' });
  setFont(11);
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
    ['Color Guide', metadata?.colorMode === 'tint' ? 'With Color Tint' : 'Outline Only'],
  ];
  const tableX = MARGIN + 15;
  const tableW = CONTENT_W - 30;
  const cellH = 9;
  setFont(9);
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

  setFont(8);
  pdf.setTextColor(150, 130, 100);
  pdf.text('Paint by Number Generator', A4_W / 2, A4_H - 8, { align: 'center' });
  pdf.text('paint-by-number-two.vercel.app', A4_W / 2, A4_H - 4, { align: 'center' });

  // ══════════════════════════════════════════════════════════════
  // Page 2 — Color Guide (fixed layout: no overlap, proper 2-col)
  // ══════════════════════════════════════════════════════════════
  pdf.addPage();
  pdf.setFillColor(253, 250, 245);
  pdf.rect(0, 0, A4_W, A4_H, 'F');
  pdf.setFillColor(139, 109, 56);
  pdf.rect(0, 0, A4_W, 12, 'F');

  // Title — below header bar
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(44, 34, 24);
  pdf.text('Color Guide', MARGIN, 24);

  // Subtitle
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(140, 120, 90);
  pdf.text('Fill each region with the paint color matching its symbol.', MARGIN, 31);
  if (metadata?.colorMode === 'tint') {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(140, 120, 90);
    pdf.text('Note: Regions are lightly tinted to indicate paint color. Outlines will be covered when painted.', MARGIN, 37, { maxWidth: CONTENT_W });
  }

  // Divider
  pdf.setDrawColor(200, 169, 110);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, 34, A4_W - MARGIN, 34);

  const entries = Array.from(colorMap.values())
    .filter(e => e.regionCount > 0)
    .sort((a, b) => a.symbol.localeCompare(b.symbol, undefined, { numeric: true }));

  // Column x positions for left (col 0) and right (col 1) halves
  const C0 = MARGIN;          // left col start
  const C1 = MARGIN + 95;     // right col start
  const colOffsets = [
    { sym: 0, sw: 8, name: 22, hex: 60, zones: 82 },  // within a column
  ];
  const SWATCH = 6;
  const ROW_H  = 8;
  const HDR_Y  = 40;
  const DATA_Y = 44;

  // Column headers — both columns
  [C0, C1].forEach(cx => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(140, 120, 90);
    pdf.text('Sym',   cx + colOffsets[0].sym,   HDR_Y);
    pdf.text('Color', cx + colOffsets[0].sw,    HDR_Y);
    pdf.text('Name',  cx + colOffsets[0].name,  HDR_Y);
    pdf.text('HEX',   cx + colOffsets[0].hex,   HDR_Y);
    pdf.text('Zones', cx + colOffsets[0].zones, HDR_Y);
  });
  pdf.setDrawColor(200, 175, 140);
  pdf.setLineWidth(0.2);
  pdf.line(MARGIN, HDR_Y + 2, A4_W - MARGIN, HDR_Y + 2);

  const maxRows = Math.floor((A4_H - MARGIN - DATA_Y - 10) / ROW_H);
  const halfLen = Math.ceil(entries.length / 2);

  entries.forEach((entry, i) => {
    const isRight = i >= halfLen;
    const rowIdx  = isRight ? i - halfLen : i;
    if (rowIdx >= maxRows) return; // overflow guard
    const cx = isRight ? C1 : C0;
    const y  = DATA_Y + rowIdx * ROW_H;
    const textY = y + SWATCH * 0.7;

    // Alternating row tint (drawn before text)
    if (rowIdx % 2 === 0) {
      pdf.setFillColor(248, 244, 238);
      pdf.rect(cx - 1, y - 1, 90, ROW_H, 'F');
    }

    // Swatch
    const [r, g, b] = entry.paintColor.rgb;
    pdf.setFillColor(r, g, b);
    pdf.rect(cx + colOffsets[0].sw, y, SWATCH, SWATCH, 'F');
    pdf.setDrawColor(160, 160, 160);
    pdf.setLineWidth(0.15);
    pdf.rect(cx + colOffsets[0].sw, y, SWATCH, SWATCH, 'S');

    // Symbol
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(44, 34, 24);
    pdf.text(entry.symbol, cx + colOffsets[0].sym, textY);

    // Name (truncated)
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(44, 34, 24);
    const nameStr = entry.paintColor.name.length > 14
      ? entry.paintColor.name.slice(0, 13) + '…'
      : entry.paintColor.name;
    pdf.text(nameStr, cx + colOffsets[0].name, textY);

    // HEX
    pdf.setTextColor(100, 90, 80);
    pdf.text(entry.paintColor.hex, cx + colOffsets[0].hex, textY);

    // Zones
    pdf.setTextColor(140, 120, 90);
    pdf.text(`x${entry.regionCount}`, cx + colOffsets[0].zones, textY);
  });

  setFont(8);
  pdf.setTextColor(150, 130, 100);
  pdf.text('Paint by Number Generator', A4_W / 2, A4_H - 8, { align: 'center' });
  pdf.text('paint-by-number-two.vercel.app', A4_W / 2, A4_H - 4, { align: 'center' });

  // ══════════════════════════════════════════════════════════════
  // Page 3+ — Diagram (single page for print sizes; tiled for frame sizes)
  // ══════════════════════════════════════════════════════════════
  const isPrintSize = frameSpec?.group === 'print';
  const scaledDiagram = scaleCanvas(diagramCanvas, 2480);

  if (isPrintSize) {
    // Print sizes: one dedicated page in the correct paper format
    const fmt = canvasSize as 'a5' | 'a4' | 'a3';
    pdf.addPage([frameSpec!.w, frameSpec!.h], 'portrait');
    const pw = frameSpec!.w, ph = frameSpec!.h;
    const pm = 10; // 10mm margin
    const iw = pw - 2 * pm, ih = ph - 2 * pm;
    // Scale diagram to fit within margins preserving aspect
    const diagAR = diagramCanvas.width / diagramCanvas.height;
    const pageAR = iw / ih;
    let dw = iw, dh = iw / diagAR;
    if (dh > ih) { dh = ih; dw = ih * diagAR; }
    const dx = pm + (iw - dw) / 2;
    const dy = pm + (ih - dh) / 2;
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pw, ph, 'F');
    pdf.addImage(scaledDiagram.toDataURL('image/jpeg', 0.92), 'JPEG', dx, dy, dw, dh);
    // Corner marks
    pdf.setDrawColor(180, 160, 130);
    pdf.setLineWidth(0.3);
    [[dx, dy], [dx + dw, dy], [dx, dy + dh], [dx + dw, dy + dh]].forEach(([x, y]) => {
      pdf.line(x - 3, y, x + 3, y); pdf.line(x, y - 3, x, y + 3);
    });
    setFont(7);
    pdf.setTextColor(150, 130, 100);
    pdf.text(`${frameSpec!.nameEn} — Paint by Number Generator`, pw / 2, ph - 4, { align: 'center' });
  } else {
  // Frame / square sizes: tile across A4 pages

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

      setFont(8);
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

      setFont(7);
      pdf.setTextColor(120, 100, 80);
      pdf.text('1 zone = 10mm', MARGIN, MARGIN + srcH_mm + 6);
      pdf.setTextColor(150, 130, 100);
      pdf.text('Paint by Number Generator — paint-by-number-two.vercel.app', A4_W / 2, A4_H - 4, { align: 'center' });
    }
  }
  } // end else (frame/square tiling)

  // ══════════════════════════════════════════════════════════════
  // Final Page — Reference Image
  // ══════════════════════════════════════════════════════════════
  if (originalImageDataUrl) {
    pdf.addPage();
    pdf.setFillColor(253, 250, 245);
    pdf.rect(0, 0, A4_W, A4_H, 'F');
    pdf.setFillColor(139, 109, 56);
    pdf.rect(0, 0, A4_W, 8, 'F');

    setFont(14);
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

      setFont(8.5);
      pdf.setTextColor(100, 85, 65);
      pdf.text('Use this image as reference while painting.',
        A4_W / 2, 30 + ih + 8, { align: 'center' });
    } catch { /* skip reference image on error */ }

    setFont(8);
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
