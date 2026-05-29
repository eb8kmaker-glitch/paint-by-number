// Client-side only — jsPDF uses browser APIs
import type { ColorInfo, CanvasSize } from '@/lib/diagramRenderer';
import { FRAME_SPECS } from '@/lib/diagramRenderer';

// A4 page in mm
const A4_W = 210;
const A4_H = 297;
const MARGIN = 15;
const CONTENT_W = A4_W - 2 * MARGIN;
const CONTENT_H = A4_H - 2 * MARGIN;

async function loadKoreanFont(doc: import('jspdf').jsPDF) {
  const response = await fetch('/fonts/NotoSansKR-Regular.ttf');
  const fontBuffer = await response.arrayBuffer();
  const fontBase64 = btoa(
    new Uint8Array(fontBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  doc.addFileToVFS('NotoSansKR-Regular.ttf', fontBase64);
  doc.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal');
  doc.setFont('NotoSansKR');
}

function setKorean(doc: import('jspdf').jsPDF) {
  doc.setFont('NotoSansKR');
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

  await loadKoreanFont(pdf);

  const frameSpec = FRAME_SPECS[canvasSize];
  const frameName = frameSpec
    ? `${frameSpec.nameKo} / ${frameSpec.w}×${frameSpec.h}mm`
    : canvasSize.toUpperCase();

  // ══════════════════════════════════════════════════════════════
  // Page 1 — Cover
  // ══════════════════════════════════════════════════════════════
  setKorean(pdf);

  // Background tint
  pdf.setFillColor(253, 250, 245);
  pdf.rect(0, 0, A4_W, A4_H, 'F');

  // Decorative top bar
  pdf.setFillColor(139, 109, 56);
  pdf.rect(0, 0, A4_W, 8, 'F');

  // Title
  pdf.setFontSize(22);
  pdf.setTextColor(44, 34, 24);
  pdf.text('페인트 바이 넘버 도안', A4_W / 2, 30, { align: 'center' });

  pdf.setFontSize(11);
  pdf.setTextColor(100, 85, 65);
  pdf.text('Paint by Number Diagram', A4_W / 2, 38, { align: 'center' });

  // Divider
  pdf.setDrawColor(180, 150, 100);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN + 20, 43, A4_W - MARGIN - 20, 43);

  // Original image thumbnail
  let thumbY = 50;
  if (originalImageDataUrl) {
    const thumbMaxW = 100, thumbMaxH = 80;
    const img = new Image();
    await new Promise<void>(r => { img.onload = () => r(); img.src = originalImageDataUrl; });
    const ar = img.naturalWidth / img.naturalHeight;
    let tw = thumbMaxW, th = tw / ar;
    if (th > thumbMaxH) { th = thumbMaxH; tw = th * ar; }
    const tx = (A4_W - tw) / 2;
    pdf.addImage(originalImageDataUrl, 'JPEG', tx, thumbY, tw, th);
    // Frame border around thumbnail
    pdf.setDrawColor(139, 109, 56);
    pdf.setLineWidth(1);
    pdf.rect(tx - 1, thumbY - 1, tw + 2, th + 2, 'S');
    thumbY += th + 8;
  }

  // Metadata table
  const metaY = thumbY + 5;
  const rows: [string, string][] = [
    ['생성일 / Date', metadata?.date ?? new Date().toLocaleDateString('ko-KR')],
    ['색상 수 / Color Count', String(metadata?.colorCount ?? colorMap.size)],
    ['액자 규격 / Frame Size', frameName],
    ['세부 수준 / Detail Level', metadata?.detailLevel ?? '-'],
  ];

  const tableX = MARGIN + 15;
  const tableW = CONTENT_W - 30;
  const cellH = 9;

  pdf.setFontSize(9);
  rows.forEach(([label, value], i) => {
    const y = metaY + i * cellH;
    const isEven = i % 2 === 0;
    if (isEven) {
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

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 130, 100);
  setKorean(pdf);
  pdf.text('Paint by Number Generator', A4_W / 2, A4_H - 8, { align: 'center' });
  pdf.text('paint-by-number-two.vercel.app', A4_W / 2, A4_H - 4, { align: 'center' });

  // ══════════════════════════════════════════════════════════════
  // Page 2 — Color Guide
  // ══════════════════════════════════════════════════════════════
  pdf.addPage();
  setKorean(pdf);

  pdf.setFillColor(253, 250, 245);
  pdf.rect(0, 0, A4_W, A4_H, 'F');
  pdf.setFillColor(139, 109, 56);
  pdf.rect(0, 0, A4_W, 8, 'F');

  pdf.setFontSize(16);
  pdf.setTextColor(44, 34, 24);
  setKorean(pdf);
  pdf.text('색상 가이드 / Color Guide', MARGIN, 22);

  pdf.setDrawColor(180, 150, 100);
  pdf.setLineWidth(0.4);
  pdf.line(MARGIN, 26, A4_W - MARGIN, 26);

  // Instructions
  pdf.setFontSize(8.5);
  pdf.setTextColor(70, 60, 50);
  setKorean(pdf);
  pdf.text('도안의 각 구역에 표시된 기호에 해당하는 색상으로 채색하세요.', MARGIN, 33);
  pdf.text('Fill each numbered region with the corresponding paint color.', MARGIN, 38);

  // Color table header
  const entries = Array.from(colorMap.values())
    .filter(e => e.regionCount > 0)
    .sort((a, b) => a.symbol.localeCompare(b.symbol, undefined, { numeric: true }));

  const SWATCH_SIZE = 12;
  const ROW_H = 14;
  const COL_W = CONTENT_W / 2;
  let curY = 45;
  let col = 0;

  // Column headers
  const headerY = curY;
  ['기호', '색상', '이름', 'HEX', '구역'].forEach((h, hi) => {
    const x = MARGIN + (col === 0 ? 0 : COL_W) + [0, 16, 30, 68, 90][hi];
    pdf.setFontSize(7);
    pdf.setTextColor(100, 85, 65);
    setKorean(pdf);
    pdf.text(h, x, headerY);
  });
  curY += 5;

  pdf.setDrawColor(200, 175, 140);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, curY, A4_W - MARGIN, curY);
  curY += 3;

  col = 0;
  let rowInCol = 0;

  entries.forEach((entry) => {
    const maxRowsPerCol = Math.floor((A4_H - MARGIN - curY - 25) / ROW_H);
    // If both cols full, would need new page — simplified: just let it overflow for now
    const baseX = MARGIN + col * COL_W;
    const y = curY + rowInCol * ROW_H;

    // Swatch
    const [r, g, b] = entry.paintColor.rgb;
    pdf.setFillColor(r, g, b);
    pdf.rect(baseX, y - SWATCH_SIZE + 2, SWATCH_SIZE, SWATCH_SIZE, 'F');
    pdf.setDrawColor(150, 150, 150);
    pdf.setLineWidth(0.2);
    pdf.rect(baseX, y - SWATCH_SIZE + 2, SWATCH_SIZE, SWATCH_SIZE, 'S');

    // Symbol
    pdf.setFontSize(8);
    pdf.setTextColor(20, 20, 20);
    pdf.text(entry.symbol, baseX + 14, y - 2);

    // Paint name
    pdf.setFontSize(7);
    pdf.setTextColor(40, 40, 40);
    setKorean(pdf);
    pdf.text(entry.paintColor.nameKo, baseX + 28, y - 2);

    // Hex
    pdf.setTextColor(80, 80, 80);
    pdf.text(entry.paintColor.hex, baseX + 66, y - 2);

    // Region count
    pdf.setTextColor(100, 85, 65);
    pdf.text(`×${entry.regionCount}`, baseX + 88, y - 2);

    rowInCol++;
    if (rowInCol >= maxRowsPerCol && col === 0) {
      col = 1;
      rowInCol = 0;
    }
  });

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 130, 100);
  setKorean(pdf);
  pdf.text('Paint by Number Generator', A4_W / 2, A4_H - 8, { align: 'center' });
  pdf.text('paint-by-number-two.vercel.app', A4_W / 2, A4_H - 4, { align: 'center' });

  // ══════════════════════════════════════════════════════════════
  // Page 3+ — Diagram Tiles
  // ══════════════════════════════════════════════════════════════
  // Content area per tile (with margins)
  const TILE_W_MM = CONTENT_W;
  const TILE_H_MM = CONTENT_H - 12; // leave room for header/footer

  // Diagram physical size in mm
  const diagW_mm = frameSpec ? frameSpec.w : A4_W - 2 * MARGIN;
  const diagH_mm = frameSpec ? frameSpec.h : A4_H - 2 * MARGIN;

  // Overlap: 8mm on each shared edge
  const OVERLAP_MM = 8;
  const strideW = TILE_W_MM - OVERLAP_MM;
  const strideH = TILE_H_MM - OVERLAP_MM;

  const tilesX = Math.ceil(diagW_mm / strideW);
  const tilesY = Math.ceil(diagH_mm / strideH);
  const totalTiles = tilesX * tilesY;

  // Scale: diagram canvas px → mm
  const pxPerMmX = diagramCanvas.width  / diagW_mm;
  const pxPerMmY = diagramCanvas.height / diagH_mm;

  let tileNum = 0;
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      tileNum++;
      pdf.addPage();
      setKorean(pdf);

      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, A4_W, A4_H, 'F');

      // Page indicator
      pdf.setFontSize(8);
      pdf.setTextColor(120, 100, 80);
      setKorean(pdf);
      pdf.text(`[ ${tileNum} / ${totalTiles} ]`, A4_W - MARGIN, MARGIN - 4, { align: 'right' });

      // Tile source region in mm
      const srcX_mm = tx * strideW;
      const srcY_mm = ty * strideH;
      const srcW_mm = Math.min(TILE_W_MM, diagW_mm - srcX_mm);
      const srcH_mm = Math.min(TILE_H_MM, diagH_mm - srcY_mm);

      // Convert to canvas pixels
      const srcX_px = Math.round(srcX_mm * pxPerMmX);
      const srcY_px = Math.round(srcY_mm * pxPerMmY);
      const srcW_px = Math.round(srcW_mm * pxPerMmX);
      const srcH_px = Math.round(srcH_mm * pxPerMmY);

      // Extract tile from canvas
      const tileCanvas = document.createElement('canvas');
      tileCanvas.width  = srcW_px;
      tileCanvas.height = srcH_px;
      const tileCtx = tileCanvas.getContext('2d')!;
      tileCtx.drawImage(diagramCanvas, srcX_px, srcY_px, srcW_px, srcH_px, 0, 0, srcW_px, srcH_px);

      const tileData = tileCanvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(tileData, 'JPEG', MARGIN, MARGIN, srcW_mm, srcH_mm);

      // Crosshair marks at corners
      pdf.setDrawColor(180, 160, 130);
      pdf.setLineWidth(0.3);
      const cx = [MARGIN, MARGIN + srcW_mm];
      const cy = [MARGIN, MARGIN + srcH_mm];
      const CROSS = 4;
      cx.forEach(x => cy.forEach(y => {
        pdf.line(x - CROSS, y, x + CROSS, y);
        pdf.line(x, y - CROSS, x, y + CROSS);
      }));

      // Scale bar
      pdf.setFontSize(7);
      pdf.setTextColor(120, 100, 80);
      setKorean(pdf);
      pdf.text(`1 구역 ≈ 10mm`, MARGIN, MARGIN + srcH_mm + 6);

      // Footer
      pdf.setFontSize(7);
      pdf.setTextColor(150, 130, 100);
      setKorean(pdf);
      pdf.text('Paint by Number Generator — paint-by-number-two.vercel.app', A4_W / 2, A4_H - 4, { align: 'center' });
    }
  }

  // ══════════════════════════════════════════════════════════════
  // Final Page — Reference Image
  // ══════════════════════════════════════════════════════════════
  if (originalImageDataUrl) {
    pdf.addPage();
    setKorean(pdf);

    pdf.setFillColor(253, 250, 245);
    pdf.rect(0, 0, A4_W, A4_H, 'F');
    pdf.setFillColor(139, 109, 56);
    pdf.rect(0, 0, A4_W, 8, 'F');

    pdf.setFontSize(14);
    pdf.setTextColor(44, 34, 24);
    setKorean(pdf);
    pdf.text('완성 참고 이미지 / Original Reference', A4_W / 2, 20, { align: 'center' });

    pdf.setDrawColor(180, 150, 100);
    pdf.setLineWidth(0.4);
    pdf.line(MARGIN + 10, 24, A4_W - MARGIN - 10, 24);

    const imgMaxW = CONTENT_W;
    const imgMaxH = CONTENT_H - 20;
    const img = new Image();
    await new Promise<void>(r => { img.onload = () => r(); img.src = originalImageDataUrl; });
    const ar = img.naturalWidth / img.naturalHeight;
    let iw = imgMaxW, ih = iw / ar;
    if (ih > imgMaxH) { ih = imgMaxH; iw = ih * ar; }
    const ix = (A4_W - iw) / 2;
    pdf.addImage(originalImageDataUrl, 'JPEG', ix, 30, iw, ih);

    // Caption
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 85, 65);
    setKorean(pdf);
    pdf.text('채색 시 이 이미지를 참고하세요 / Use this image as reference while painting', A4_W / 2, 30 + ih + 8, { align: 'center' });

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(150, 130, 100);
    setKorean(pdf);
    pdf.text('Paint by Number Generator', A4_W / 2, A4_H - 8, { align: 'center' });
    pdf.text('paint-by-number-two.vercel.app', A4_W / 2, A4_H - 4, { align: 'center' });
  }

  pdf.save('paint-by-number.pdf');
}

export function exportToPng(canvas: HTMLCanvasElement, filename = 'paint-by-number.png'): void {
  const link = document.createElement('a');
  link.href     = canvas.toDataURL('image/png');
  link.download = filename;
  link.click();
}
