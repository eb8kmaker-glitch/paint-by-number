// Client-side only — uses HTMLImageElement, HTMLCanvasElement
import { rgbToLab, kMeans, mapToNearestPaint, generateSymbols, gaussianBlur } from '@/lib/colorUtils';
import { segmentRegions, medianFilterQuantized } from '@/lib/regionSegmentation';
import { PaintColor } from '@/constants/paintColors';

export type DetailLevel = 'low' | 'medium' | 'high';
export type CanvasSize  = 'f4' | 'f6' | 'f8' | 'f10' | 'f12' | 'f15' | 'f20' | 'f30' | 'f50' | 'square';
export type Style       = 'clean' | 'detailed';
export type FitMode     = 'fit' | 'fill';

export interface FrameSpec {
  nameKo: string;
  nameEn: string;
  w: number;
  h: number;
  group: 'small' | 'large';
}

export const FRAME_SPECS: Record<CanvasSize, FrameSpec | null> = {
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
}

export interface ColorInfo {
  paintColor:  PaintColor;
  symbol:      string;
  regionCount: number;
  pixelCount:  number;
  clusterLab:  [number, number, number];
}

export interface DiagramResult {
  canvas:   HTMLCanvasElement;
  colorMap: Map<number, ColorInfo>;
}

export const CANVAS_DIMS: Record<CanvasSize, { w: number; h: number }> = {
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
  normal:  Math.round(2.0 * MM_TO_PX), // 24px
  small:   Math.round(1.5 * MM_TO_PX), // 18px
  minimum: Math.round(1.2 * MM_TO_PX), // 14px
};

// Frame physical width in mm (used for mm² area thresholds)
const FRAME_WIDTH_MM: Record<CanvasSize, number> = {
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
  if (areaMm2 < 15)  return null;
  if (areaMm2 < 50)  return LABEL_PX.minimum;
  if (areaMm2 < 150) return LABEL_PX.small;
  return LABEL_PX.normal;
}

// Median filter passes after K-means — reduced to preserve distinct region boundaries
const MEDIAN_PASSES: Record<DetailLevel, number> = { low: 2, medium: 1, high: 0 };

// K-means iterations per detail level — more iterations = better cluster separation
const KMEANS_ITER: Record<DetailLevel, number> = { low: 20, medium: 30, high: 50 };

// Outline gray level: clean = light gray, detailed = slightly darker
const OUTLINE_GRAY: Record<Style, number> = { clean: 170, detailed: 120 };

const tick = () => new Promise<void>(r => setTimeout(r, 0));

// ─────────────────────────────────────────────────────────────────────────────
// Edge map: pixel is an edge if any 4-neighbour has a different cluster value
// ─────────────────────────────────────────────────────────────────────────────
function buildEdgeMap(clusterMap: Int32Array, W: number, H: number): Uint8Array {
  const isEdge = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const c = clusterMap[i];
      if (
        (x > 0     && clusterMap[i - 1] !== c) ||
        (x < W - 1 && clusterMap[i + 1] !== c) ||
        (y > 0     && clusterMap[i - W] !== c) ||
        (y < H - 1 && clusterMap[i + W] !== c)
      ) {
        isEdge[i] = 1;
      }
    }
  }
  return isEdge;
}

// ─────────────────────────────────────────────────────────────────────────────
// Label position: centroid, then spiral-search if centroid is on an edge pixel
// ─────────────────────────────────────────────────────────────────────────────
function findLabelPos(
  cx: number, cy: number,
  isEdge: Uint8Array,
  W: number, H: number,
): { x: number; y: number } {
  const sx = Math.round(cx), sy = Math.round(cy);
  if (!isEdge[sy * W + sx]) return { x: sx, y: sy };
  for (let r = 1; r <= 20; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const nx = sx + dx, ny = sy + dy;
        if (nx >= 0 && nx < W && ny >= 0 && ny < H && !isEdge[ny * W + nx]) {
          return { x: nx, y: ny };
        }
      }
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
  // No dilation — outlines are exactly 1px at processing resolution
  const isEdge = buildEdgeMap(clusterMap, W, H);

  // ── 10. Render outline canvas: white bg, gray outlines ────────────────────
  const gray = OUTLINE_GRAY[settings.style];
  const edgeId = new ImageData(W, H);
  const ep     = edgeId.data;
  for (let i = 0; i < W * H; i++) {
    const b = i * 4;
    if (isEdge[i]) {
      ep[b] = gray; ep[b + 1] = gray; ep[b + 2] = gray;
    } else {
      ep[b] = 255; ep[b + 1] = 255; ep[b + 2] = 255;
    }
    ep[b + 3] = 255;
  }

  const edgeCanvas = document.createElement('canvas');
  edgeCanvas.width = W; edgeCanvas.height = H;
  edgeCanvas.getContext('2d')!.putImageData(edgeId, 0, 0);

  onProgress?.(85); await tick();

  // ── 11. Scale to output resolution (nearest-neighbour → crisp 1px lines) ──
  const outCanvas = document.createElement('canvas');
  outCanvas.width  = TW;
  outCanvas.height = TH;
  const outCtx = outCanvas.getContext('2d')!;
  outCtx.imageSmoothingEnabled = false;
  outCtx.drawImage(edgeCanvas, 0, 0, TW, TH);

  // ── 12. Place labels at output resolution ─────────────────────────────────
  // Font size (px at output res) — no bold, dark gray
  // Area thresholds are at processing resolution
  const scaleX = TW / W;
  const scaleY = TH / H;
  const outPxPerProcPx = TW / W; // ≈ same as scaleX

  outCtx.textAlign    = 'center';
  outCtx.textBaseline = 'middle';
  outCtx.fillStyle    = '#444444';

  const frameMmWidth = FRAME_WIDTH_MM[settings.canvasSize];

  // Build colorMap aggregated per cluster
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

  for (const region of regions) {
    const info = colorMap.get(region.colorIndex);
    if (!info) continue;
    info.regionCount++;
    info.pixelCount += region.pixelCount;

    // Convert processing-res pixel count to output-res pixel count for area calc
    const outputPixelCount = region.pixelCount * (scaleX * scaleY);
    const fontSize = getLabelFontSize(outputPixelCount, TW, frameMmWidth);
    if (fontSize === null) continue;

    outCtx.font = `${fontSize}px Arial, sans-serif`;

    const pos = findLabelPos(region.centroidX, region.centroidY, isEdge, W, H);
    outCtx.fillText(info.symbol, pos.x * scaleX, pos.y * scaleY);
  }

  onProgress?.(100);
  return { canvas: outCanvas, colorMap };
}
