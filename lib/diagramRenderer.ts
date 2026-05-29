// Client-side only — uses HTMLImageElement, HTMLCanvasElement
import { rgbToLab, kMeans, mapToNearestPaint, generateSymbols } from '@/lib/colorUtils';
import { segmentRegions } from '@/lib/regionSegmentation';
import { PaintColor } from '@/constants/paintColors';

export type DetailLevel = 'low' | 'medium' | 'high';
export type CanvasSize  = 'f4' | 'f6' | 'f8' | 'f10' | 'f12' | 'f15' | 'f20' | 'f30' | 'f50' | 'square';
export type Style       = 'clean' | 'detailed';
export type FitMode     = 'fit' | 'fill';

export interface FrameSpec {
  nameKo: string;
  nameEn: string;
  w: number;       // mm
  h: number;       // mm
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

// Output dimensions at 300 DPI
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

// Processing resolution width.  K-means and segmentation run at this size.
const PROC_W = 800;

const tick = () => new Promise<void>(r => setTimeout(r, 0));

// ─────────────────────────────────────────────────────────────────────────────
// Unsharp-mask sharpening — applied before K-means for low-res source images
// ─────────────────────────────────────────────────────────────────────────────
function applySharpen(ctx: CanvasRenderingContext2D, W: number, H: number, amount = 0.7): void {
  const id  = ctx.getImageData(0, 0, W, H);
  const src = new Uint8ClampedArray(id.data);
  const dst = id.data;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = (y * W + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = src[i + c];
        const blur   = (src[((y-1)*W+x)*4+c] + src[((y+1)*W+x)*4+c] +
                        src[(y*W+x-1)*4+c]   + src[(y*W+x+1)*4+c]) / 4;
        dst[i + c] = Math.max(0, Math.min(255, Math.round(center + amount * (center - blur))));
      }
    }
  }
  ctx.putImageData(id, 0, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Build isEdge map: a pixel is an edge if any 4-neighbour has a different color
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

// Morphological dilation: expand edges by 1 pixel (used for medium detail)
function dilateEdges(isEdge: Uint8Array, W: number, H: number): Uint8Array {
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (
        isEdge[i] ||
        (x > 0     && isEdge[i - 1]) ||
        (x < W - 1 && isEdge[i + 1]) ||
        (y > 0     && isEdge[i - W]) ||
        (y < H - 1 && isEdge[i + W])
      ) {
        out[i] = 1;
      }
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Find a good label position for a region.
// Start from centroid; if that lands on an edge pixel, spiral outward to find
// the nearest interior pixel.
// ─────────────────────────────────────────────────────────────────────────────
function findLabelPos(
  cx: number, cy: number,
  isEdge: Uint8Array,
  W: number, H: number,
): { x: number; y: number } {
  const sx = Math.round(cx), sy = Math.round(cy);
  if (!isEdge[sy * W + sx]) return { x: sx, y: sy };

  // Spiral search for nearest non-edge pixel
  for (let r = 1; r <= 20; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; // perimeter only
        const nx = sx + dx, ny = sy + dy;
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
        if (!isEdge[ny * W + nx]) return { x: nx, y: ny };
      }
    }
  }
  return { x: sx, y: sy }; // fallback
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────
export async function generateDiagram(
  img: HTMLImageElement,
  settings: DiagramSettings,
  onProgress?: (pct: number) => void,
): Promise<DiagramResult> {

  // ── 1. Target output dimensions ──────────────────────────────────────────
  const { w: TW, h: TH } = CANVAS_DIMS[settings.canvasSize];
  const targetAR = TW / TH;

  // ── 2. Build processing canvas at PROC_W × procH (matching target AR) ────
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

  // Apply sharpening for low-res source images
  if (img.naturalWidth * img.naturalHeight < 500_000) {
    applySharpen(srcCtx, W, H, 0.7);
  }

  const { data: px } = srcCtx.getImageData(0, 0, W, H);
  onProgress?.(5); await tick();

  // ── 3. Sample pixels and run K-means in LAB space ─────────────────────────
  const STEP = 4;
  const sampled: [number, number, number][] = [];
  for (let y = 0; y < H; y += STEP)
    for (let x = 0; x < W; x += STEP) {
      const i = (y * W + x) * 4;
      sampled.push(rgbToLab(px[i], px[i + 1], px[i + 2]));
    }

  const K = settings.detailLevel === 'low'
    ? Math.min(settings.colorCount, 16)
    : settings.colorCount;

  onProgress?.(8); await tick();
  const { centers } = kMeans(sampled, K, 25);
  onProgress?.(38); await tick();

  // ── 4. Assign every pixel to nearest cluster ──────────────────────────────
  const clusterMap = new Int32Array(W * H);
  const labDistSq = (
    [L1, a1, b1]: [number, number, number],
    [L2, a2, b2]: [number, number, number],
  ) => (L1-L2)**2 + (a1-a2)**2 + (b1-b2)**2;

  for (let i = 0; i < W * H; i++) {
    const lab = rgbToLab(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
    let best = 0, bestD = Infinity;
    for (let j = 0; j < K; j++) {
      const d = labDistSq(lab, centers[j]);
      if (d < bestD) { bestD = d; best = j; }
    }
    clusterMap[i] = best;
  }

  onProgress?.(55); await tick();

  // ── 5. Map cluster centres → paint colours ────────────────────────────────
  const clusterToPaint = centers.map(c => mapToNearestPaint(c));
  const symbols        = generateSymbols(K);

  // ── 6. Region segmentation + merging (mutates clusterMap) ─────────────────
  const regions = segmentRegions(clusterMap, W, H, settings.detailLevel);
  onProgress?.(70); await tick();

  // ── 7. Build edge map (boundaries between colour regions) ─────────────────
  let isEdge = buildEdgeMap(clusterMap, W, H);

  // Medium detail: slightly dilate outlines for easier painting
  if (settings.detailLevel === 'medium') {
    isEdge = dilateEdges(isEdge, W, H);
  }

  // Detailed style: extra dilation pass for bolder outlines
  if (settings.style === 'detailed') {
    isEdge = dilateEdges(isEdge, W, H);
  }

  onProgress?.(80); await tick();

  // ── 8. Render low-res outline canvas (white bg, black outlines) ───────────
  const edgeCanvas = document.createElement('canvas');
  edgeCanvas.width = W; edgeCanvas.height = H;
  const edgeCtx    = edgeCanvas.getContext('2d')!;

  const edgeId = edgeCtx.createImageData(W, H);
  const edgePx = edgeId.data;
  for (let i = 0; i < W * H; i++) {
    const base = i * 4;
    if (isEdge[i]) {
      edgePx[base]     = 0;
      edgePx[base + 1] = 0;
      edgePx[base + 2] = 0;
    } else {
      edgePx[base]     = 255;
      edgePx[base + 1] = 255;
      edgePx[base + 2] = 255;
    }
    edgePx[base + 3] = 255;
  }
  edgeCtx.putImageData(edgeId, 0, 0);

  // ── 9. Scale edge canvas to final output resolution (nearest-neighbour) ───
  const outCanvas = document.createElement('canvas');
  outCanvas.width  = TW;
  outCanvas.height = TH;
  const outCtx = outCanvas.getContext('2d')!;
  outCtx.imageSmoothingEnabled = false;
  outCtx.drawImage(edgeCanvas, 0, 0, TW, TH);

  onProgress?.(88); await tick();

  // ── 10. Place labels at final resolution ──────────────────────────────────
  //
  // Font size scales with region pixel area (at processing resolution):
  //   < 500 px   → skip
  //   < 2 000 px → tiny
  //   < 8 000 px → small
  //   ≥ 8 000 px → normal
  //
  const scaleX = TW / W;
  const scaleY = TH / H;
  const baseFS = Math.max(16, Math.round(TW / 100)); // font size at output res for "normal"

  outCtx.textAlign    = 'center';
  outCtx.textBaseline = 'middle';
  outCtx.fillStyle    = '#222222';

  // Build colorMap: one entry per cluster, aggregating region counts
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
    const ci = region.colorIndex;
    const info = colorMap.get(ci);
    if (!info) continue;

    info.regionCount++;
    info.pixelCount += region.pixelCount;

    // Skip tiny regions (no label)
    if (region.pixelCount < 500) continue;

    // Font size proportional to region size
    const fs = region.pixelCount < 2000 ? Math.round(baseFS * 0.55)
             : region.pixelCount < 8000 ? Math.round(baseFS * 0.75)
             : baseFS;

    outCtx.font = `bold ${fs}px Arial, sans-serif`;

    // Find label position (avoid outline pixels)
    const pos = findLabelPos(region.centroidX, region.centroidY, isEdge, W, H);
    outCtx.fillText(info.symbol, pos.x * scaleX, pos.y * scaleY);
  }

  onProgress?.(100);
  return { canvas: outCanvas, colorMap };
}
