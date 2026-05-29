// Client-side only — uses HTMLImageElement, HTMLCanvasElement
import { rgbToLab, kMeans, mapToNearestPaint, generateSymbols, gaussianBlur } from '@/lib/colorUtils';
import { segmentRegions, medianFilterQuantized } from '@/lib/regionSegmentation';
import { PaintColor } from '@/constants/paintColors';

export type DetailLevel = 'low' | 'medium' | 'high';
export type CanvasSize  = 'a5' | 'a4' | 'a3' | 'f4' | 'f6' | 'f8' | 'f10' | 'f12' | 'f15' | 'f20' | 'f30' | 'f50' | 'square';
export type Style       = 'clean' | 'detailed';
export type FitMode     = 'fit' | 'fill';
export type ColorMode   = 'outline' | 'tint';

export interface FrameSpec {
  nameKo: string;
  nameEn: string;
  w: number;
  h: number;
  group: 'print' | 'small' | 'large' | 'other';
}

export const FRAME_SPECS: Record<CanvasSize, FrameSpec | null> = {
  // Print sizes (portrait, 300 dpi)
  a5:     { nameKo: 'A5',   nameEn: 'A5',  w: 148,  h: 210,  group: 'print' },
  a4:     { nameKo: 'A4',   nameEn: 'A4',  w: 210,  h: 297,  group: 'print' },
  a3:     { nameKo: 'A3',   nameEn: 'A3',  w: 297,  h: 420,  group: 'print' },
  // Korean frame sizes
  f4:     { nameKo: '4호',  nameEn: 'F4',  w: 333,  h: 242,  group: 'small' },
  f6:     { nameKo: '6호',  nameEn: 'F6',  w: 410,  h: 318,  group: 'small' },
  f8:     { nameKo: '8호',  nameEn: 'F8',  w: 455,  h: 380,  group: 'small' },
  f10:    { nameKo: '10호', nameEn: 'F10', w: 530,  h: 455,  group: 'small' },
  f12:    { nameKo: '12호', nameEn: 'F12', w: 606,  h: 500,  group: 'large' },
  f15:    { nameKo: '15호', nameEn: 'F15', w: 652,  h: 530,  group: 'large' },
  f20:    { nameKo: '20호', nameEn: 'F20', w: 727,  h: 606,  group: 'large' },
  f30:    { nameKo: '30호', nameEn: 'F30', w: 910,  h: 727,  group: 'large' },
  f50:    { nameKo: '50호', nameEn: 'F50', w: 1167, h: 910,  group: 'large' },
  square: null,
};

export interface CropRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DiagramSettings {
  colorCount:  number;
  detailLevel: DetailLevel;
  canvasSize:  CanvasSize;
  fitMode:     FitMode;
  cropRegion:  CropRegion | null;
  style:       Style;
  colorMode:   ColorMode;
}

export interface ColorInfo {
  paintColor:  PaintColor;
  symbol:      string;
  regionCount: number;
  pixelCount:  number;
  clusterLab:  [number, number, number];
}

export interface DiagramResult {
  canvas:              HTMLCanvasElement;
  colorMap:            Map<number, ColorInfo>;
  labeledRegionCount:  number;
  totalRegionCount:    number;
  // Stored for fast re-render when colorMode changes (skip K-means)
  _clusterMap:         Int32Array;
  _clusterToPaint:     PaintColor[];
  _symbols:            string[];
  _regions:            import('@/lib/regionSegmentation').Region[];
  _procW:              number;
  _procH:              number;
  _settings:           DiagramSettings;
}

export const CANVAS_DIMS: Record<CanvasSize, { w: number; h: number }> = {
  // Print sizes at 300 dpi (portrait)
  a5:     { w: 1748,  h: 2480  },
  a4:     { w: 2480,  h: 3508  },
  a3:     { w: 3508,  h: 4961  },
  // Frame sizes
  f4:     { w: 3937,  h: 2858  },
  f6:     { w: 4843,  h: 3756  },
  f8:     { w: 5374,  h: 4488  },
  f10:    { w: 6260,  h: 5374  },
  f12:    { w: 7158,  h: 5906  },
  f15:    { w: 7701,  h: 6260  },
  f20:    { w: 8591,  h: 7158  },
  f30:    { w: 10748, h: 8591  },
  f50:    { w: 13783, h: 10748 },
  square: { w: 2480,  h: 2480  },
};

// Processing resolution (K-means + segmentation run at this width)
const PROC_W = 800;

// Gaussian blur radius before K-means (smooths noise → fewer jagged regions)
const BLUR_RADIUS: Record<DetailLevel, number> = { low: 4, medium: 2, high: 1 };

// Physical label sizes at 300 dpi — constant regardless of frame size
const DPI = 300;
const MM_TO_PX = DPI / 25.4; // ~11.81 px/mm
const LABEL_PX = {
  xl:      Math.round(2.4 * MM_TO_PX), // ~28px — large regions
  large:   Math.round(2.0 * MM_TO_PX), // ~24px
  medium:  Math.round(1.7 * MM_TO_PX), // ~20px
  small:   Math.round(1.4 * MM_TO_PX), // ~17px
  minimum: Math.round(1.1 * MM_TO_PX), // ~13px
  tiny:    Math.round(0.9 * MM_TO_PX), // ~11px — very small regions
};

// Physical width in mm (used for mm² label area thresholds)
const FRAME_WIDTH_MM: Record<CanvasSize, number> = {
  a5: 148, a4: 210, a3: 297,
  f4: 333, f6: 410, f8: 455, f10: 530,
  f12: 606, f15: 652, f20: 727, f30: 910, f50: 1167,
  square: 210,
};

function getLabelFontSize(
  regionPixelCount: number,
  outputWidthPx: number,
  frameMmWidth: number,
): number | null {
  const pxPerMm = outputWidthPx / frameMmWidth;
  const areaMm2 = regionPixelCount / (pxPerMm * pxPerMm);
  if (areaMm2 < 3)   return null;
  if (areaMm2 < 8)   return LABEL_PX.tiny;
  if (areaMm2 < 15)  return LABEL_PX.minimum;
  if (areaMm2 < 40)  return LABEL_PX.small;
  if (areaMm2 < 100) return LABEL_PX.medium;
  if (areaMm2 < 300) return LABEL_PX.large;
  return LABEL_PX.xl;
}

// Median filter passes after K-means — reduced to preserve distinct region boundaries
const MEDIAN_PASSES: Record<DetailLevel, number> = { low: 2, medium: 1, high: 0 };

// K-means iterations per detail level — more iterations = better cluster separation
const KMEANS_ITER: Record<DetailLevel, number> = { low: 20, medium: 30, high: 50 };

// Outline gray: lighter since 1px half-edge marking is now used (no double-marking)
const OUTLINE_GRAY: Record<Style, number> = { clean: 192, detailed: 160 };

const tick = () => new Promise<void>(r => setTimeout(r, 0));

// ─────────────────────────────────────────────────────────────────────────────
// Edge map: mark only the left/top side of each boundary → true 1px lines
// (checking all 4 neighbours marks both sides, doubling apparent thickness)
// ─────────────────────────────────────────────────────────────────────────────
function buildEdgeMap(clusterMap: Int32Array, W: number, H: number): Uint8Array {
  const isEdge = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const c = clusterMap[i];
      if (
        (x > 0 && clusterMap[i - 1] !== c) ||
        (y > 0 && clusterMap[i - W] !== c)
      ) {
        isEdge[i] = 1;
      }
    }
  }
  return isEdge;
}

// ─────────────────────────────────────────────────────────────────────────────
// Label position: find the interior point furthest from any boundary
// (pole of inaccessibility approximation — works for concave regions)
// ─────────────────────────────────────────────────────────────────────────────
function findLabelPos(
  cx: number, cy: number,
  clusterMap: Int32Array,
  colorIndex: number,
  pixelCount: number,
  W: number, H: number,
): { x: number; y: number } {
  const sx = Math.max(1, Math.min(W - 2, Math.round(cx)));
  const sy = Math.max(1, Math.min(H - 2, Math.round(cy)));

  // If centroid is well inside the region, use it directly
  const centroidIdx = sy * W + sx;
  if (clusterMap[centroidIdx] === colorIndex &&
      clusterMap[centroidIdx - 1] === colorIndex &&
      clusterMap[centroidIdx + 1] === colorIndex &&
      clusterMap[centroidIdx - W] === colorIndex &&
      clusterMap[centroidIdx + W] === colorIndex) {
    return { x: sx, y: sy };
  }

  // Pole-of-inaccessibility: find region pixel with max inset from boundary
  const step = Math.max(1, Math.floor(pixelCount / 600));
  let bestX = -1, bestY = -1, bestDist = -1;

  // First pass: scan around centroid (fast path for convex regions)
  const scanR = Math.min(100, Math.ceil(Math.sqrt(pixelCount) * 1.5));
  const x0 = Math.max(1, sx - scanR), x1 = Math.min(W - 2, sx + scanR);
  const y0 = Math.max(1, sy - scanR), y1 = Math.min(H - 2, sy + scanR);

  for (let py = y0; py <= y1; py += step) {
    for (let px = x0; px <= x1; px += step) {
      if (clusterMap[py * W + px] !== colorIndex) continue;
      let dist = 0;
      outer: for (let r = 1; r <= 25; r++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
            const nx = px + dx, ny = py + dy;
            if (nx < 0 || nx >= W || ny < 0 || ny >= H || clusterMap[ny * W + nx] !== colorIndex) {
              dist = r; break outer;
            }
          }
        }
      }
      if (dist > bestDist) { bestDist = dist; bestX = px; bestY = py; }
    }
  }

  if (bestX >= 0) return { x: bestX, y: bestY };

  // Fallback: full-canvas scan at larger step to find any pixel of this color
  const step2 = Math.max(2, Math.floor(Math.sqrt(W * H) / 40));
  for (let py = 0; py < H; py += step2) {
    for (let px = 0; px < W; px += step2) {
      if (clusterMap[py * W + px] === colorIndex) return { x: px, y: py };
    }
  }
  return { x: sx, y: sy };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────
export async function generateDiagram(
  img: HTMLImageElement,
  settings: DiagramSettings,
  onProgress?: (pct: number) => void,
): Promise<DiagramResult> {

  // ── 1. Target output dimensions ───────────────────────────────────────────
  const { w: TW, h: TH } = CANVAS_DIMS[settings.canvasSize];
  const targetAR = TW / TH;

  // ── 2. Draw source image onto processing canvas (PROC_W × procH) ──────────
  const W = PROC_W;
  const H = Math.round(W / targetAR);

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = W; srcCanvas.height = H;
  const srcCtx = srcCanvas.getContext('2d')!;
  srcCtx.fillStyle = '#ffffff';
  srcCtx.fillRect(0, 0, W, H);

  if (settings.fitMode === 'fit') {
    const imgAR = img.naturalWidth / img.naturalHeight;
    let dw = W, dh = H;
    if (imgAR > targetAR) { dh = W / imgAR; } else { dw = H * imgAR; }
    srcCtx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  } else {
    let cropX: number, cropY: number, cropW: number, cropH: number;
    if (settings.cropRegion) {
      ({ x: cropX, y: cropY, w: cropW, h: cropH } = settings.cropRegion);
    } else {
      const imgAR = img.naturalWidth / img.naturalHeight;
      if (imgAR > targetAR) {
        cropH = img.naturalHeight; cropW = cropH * targetAR;
        cropX = (img.naturalWidth - cropW) / 2; cropY = 0;
      } else {
        cropW = img.naturalWidth; cropH = cropW / targetAR;
        cropX = 0; cropY = (img.naturalHeight - cropH) / 2;
      }
    }
    srcCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, W, H);
  }

  onProgress?.(4); await tick();

  // ── 3. Gaussian blur — reduces noise before quantization ──────────────────
  const rawId = srcCtx.getImageData(0, 0, W, H);
  const blurRadius = BLUR_RADIUS[settings.detailLevel];
  const blurred = gaussianBlur(rawId.data, W, H, blurRadius);

  onProgress?.(10); await tick();

  // ── 4. K-means colour quantization in LAB space ───────────────────────────
  const STEP = 4;
  const sampled: [number, number, number][] = [];
  for (let y = 0; y < H; y += STEP)
    for (let x = 0; x < W; x += STEP) {
      const i = (y * W + x) * 4;
      sampled.push(rgbToLab(blurred[i], blurred[i + 1], blurred[i + 2]));
    }

  const K = settings.detailLevel === 'low'
    ? Math.min(settings.colorCount, 16)
    : settings.colorCount;

  const { centers } = kMeans(sampled, K, KMEANS_ITER[settings.detailLevel]);
  onProgress?.(42); await tick();

  // ── 5. Assign every pixel to nearest cluster ──────────────────────────────
  const labDistSq = (
    [L1, a1, b1]: [number, number, number],
    [L2, a2, b2]: [number, number, number],
  ) => (L1 - L2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2;

  const clusterMap = new Int32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const lab = rgbToLab(blurred[i * 4], blurred[i * 4 + 1], blurred[i * 4 + 2]);
    let best = 0, bestD = Infinity;
    for (let j = 0; j < K; j++) {
      const d = labDistSq(lab, centers[j]);
      if (d < bestD) { bestD = d; best = j; }
    }
    clusterMap[i] = best;
  }

  onProgress?.(58); await tick();

  // ── 6. Map cluster centres → nearest acrylic paint colour ─────────────────
  const clusterToPaint = centers.map(c => mapToNearestPaint(c));
  const symbols        = generateSymbols(K);

  // ── 7. Median filter — smooths region boundaries (mutates clusterMap) ─────
  medianFilterQuantized(clusterMap, W, H, MEDIAN_PASSES[settings.detailLevel], K);
  onProgress?.(68); await tick();

  // ── 8. Region segmentation + small-region merging (mutates clusterMap) ────
  const regions = segmentRegions(clusterMap, W, H, settings.detailLevel);
  onProgress?.(78); await tick();

  // ── 9. Build 1px outline edge map from region boundaries ──────────────────
  const isEdge = buildEdgeMap(clusterMap, W, H);

  onProgress?.(85); await tick();

  // ── 10–12. Render canvas (outline + optional tint + labels) ───────────────
  // Build colorMap first (needed for both render and result)
  const colorMap = new Map<number, ColorInfo>();
  for (let c = 0; c < K; c++) {
    colorMap.set(c, {
      paintColor:  clusterToPaint[c],
      symbol:      symbols[c],
      regionCount: 0,
      pixelCount:  0,
      clusterLab:  centers[c],
    });
  }
  // Accumulate region stats
  for (const region of regions) {
    const info = colorMap.get(region.colorIndex);
    if (info) { info.regionCount++; info.pixelCount += region.pixelCount; }
  }

  const { canvas: outCanvas, labeledCount } = renderToCanvas(
    clusterMap, clusterToPaint, symbols, isEdge, regions,
    W, H, TW, TH, settings.style, settings.colorMode, settings.canvasSize,
  );

  onProgress?.(100);
  return {
    canvas: outCanvas, colorMap,
    labeledRegionCount: labeledCount, totalRegionCount: regions.length,
    _clusterMap: clusterMap, _clusterToPaint: clusterToPaint,
    _symbols: symbols, _regions: regions,
    _procW: W, _procH: H, _settings: settings,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-render with a different colorMode — skips the expensive K-means step
// ─────────────────────────────────────────────────────────────────────────────
export function reRenderDiagram(prev: DiagramResult, colorMode: ColorMode): { canvas: HTMLCanvasElement; labeledRegionCount: number } {
  const { _clusterMap, _clusterToPaint, _symbols, _regions, _procW, _procH, _settings } = prev;
  const { w: TW, h: TH } = CANVAS_DIMS[_settings.canvasSize];
  const isEdge = buildEdgeMap(_clusterMap, _procW, _procH);
  const { canvas, labeledCount } = renderToCanvas(
    _clusterMap, _clusterToPaint, _symbols, isEdge, _regions,
    _procW, _procH, TW, TH, _settings.style, colorMode, _settings.canvasSize,
  );
  return { canvas, labeledRegionCount: labeledCount };
}

// ─────────────────────────────────────────────────────────────────────────────
// Core canvas render: outlines (+ optional tint) + labels
// ─────────────────────────────────────────────────────────────────────────────
function renderToCanvas(
  clusterMap:     Int32Array,
  clusterToPaint: PaintColor[],
  symbols:        string[],
  isEdge:         Uint8Array,
  regions:        import('@/lib/regionSegmentation').Region[],
  W: number, H: number,
  TW: number, TH: number,
  style:      Style,
  colorMode:  ColorMode,
  canvasSize: CanvasSize,
): { canvas: HTMLCanvasElement; labeledCount: number } {
  const gray   = OUTLINE_GRAY[style];
  const edgeId = new ImageData(W, H);
  const ep     = edgeId.data;
  const TINT   = 0.30; // 30% color + 70% white

  for (let i = 0; i < W * H; i++) {
    const b = i * 4;
    if (isEdge[i]) {
      ep[b] = gray; ep[b + 1] = gray; ep[b + 2] = gray;
    } else if (colorMode === 'tint') {
      const paint = clusterToPaint[clusterMap[i]];
      const [r, g, bl] = paint?.rgb ?? [255, 255, 255];
      ep[b]     = Math.round(255 * (1 - TINT) + r  * TINT);
      ep[b + 1] = Math.round(255 * (1 - TINT) + g  * TINT);
      ep[b + 2] = Math.round(255 * (1 - TINT) + bl * TINT);
    } else {
      ep[b] = 255; ep[b + 1] = 255; ep[b + 2] = 255;
    }
    ep[b + 3] = 255;
  }

  const edgeCanvas = document.createElement('canvas');
  edgeCanvas.width = W; edgeCanvas.height = H;
  edgeCanvas.getContext('2d')!.putImageData(edgeId, 0, 0);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = TW; outCanvas.height = TH;
  const outCtx = outCanvas.getContext('2d')!;
  outCtx.imageSmoothingEnabled = false;
  outCtx.drawImage(edgeCanvas, 0, 0, TW, TH);

  // Labels
  const scaleX = TW / W;
  const scaleY = TH / H;
  const frameMmWidth = FRAME_WIDTH_MM[canvasSize];
  outCtx.textAlign    = 'center';
  outCtx.textBaseline = 'middle';
  outCtx.fillStyle    = colorMode === 'tint' ? '#222222' : '#444444';

  let labeledCount = 0;
  for (const region of regions) {
    const outputPixelCount = region.pixelCount * (scaleX * scaleY);
    const fontSize = getLabelFontSize(outputPixelCount, TW, frameMmWidth);
    if (fontSize === null) continue;
    labeledCount++;
    outCtx.font = `bold ${fontSize}px Arial, sans-serif`;
    const pos = findLabelPos(region.centroidX, region.centroidY, clusterMap, region.colorIndex, region.pixelCount, W, H);
    outCtx.fillText(symbols[region.colorIndex] ?? '', pos.x * scaleX, pos.y * scaleY);
  }

  return { canvas: outCanvas, labeledCount };
}
