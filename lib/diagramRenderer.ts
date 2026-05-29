// Client-side only — uses HTMLImageElement, HTMLCanvasElement
import { rgbToLab, kMeans, mapToNearestPaint, generateSymbols } from '@/lib/colorUtils';
import { PaintColor } from '@/constants/paintColors';

export type DetailLevel = 'low' | 'medium' | 'high';
export type CanvasSize  = 'f4' | 'f6' | 'f8' | 'f10' | 'f12' | 'f15' | 'f20' | 'f30' | 'f50' | 'square';
export type Style       = 'clean' | 'detailed';
export type FitMode     = 'fit' | 'fill';

export interface FrameSpec {
  nameKo: string;  // e.g. "4호"
  nameEn: string;  // e.g. "F4"
  w: number;       // mm width
  h: number;       // mm height
  group: 'small' | 'large';
}

export const FRAME_SPECS: Record<CanvasSize, FrameSpec | null> = {
  f4:     { nameKo: '4호',   nameEn: 'F4',  w: 333,  h: 242,  group: 'small' },
  f6:     { nameKo: '6호',   nameEn: 'F6',  w: 410,  h: 318,  group: 'small' },
  f8:     { nameKo: '8호',   nameEn: 'F8',  w: 455,  h: 380,  group: 'small' },
  f10:    { nameKo: '10호',  nameEn: 'F10', w: 530,  h: 455,  group: 'small' },
  f12:    { nameKo: '12호',  nameEn: 'F12', w: 606,  h: 500,  group: 'large' },
  f15:    { nameKo: '15호',  nameEn: 'F15', w: 652,  h: 530,  group: 'large' },
  f20:    { nameKo: '20호',  nameEn: 'F20', w: 727,  h: 606,  group: 'large' },
  f30:    { nameKo: '30호',  nameEn: 'F30', w: 910,  h: 727,  group: 'large' },
  f50:    { nameKo: '50호',  nameEn: 'F50', w: 1167, h: 910,  group: 'large' },
  square: null,
};

export interface CropRegion {
  x: number; // source x in pixels
  y: number; // source y in pixels
  w: number; // source width in pixels
  h: number; // source height in pixels
}

export interface DiagramSettings {
  colorCount:  number;
  detailLevel: DetailLevel;
  canvasSize:  CanvasSize;
  fitMode:     FitMode;
  cropRegion:  CropRegion | null; // null = auto-center crop (fill) or full image (fit)
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
  colorMap: Map<number, ColorInfo>; // clusterIndex → info
}

// Output dimensions at 300 DPI (mm / 25.4 * 300, rounded)
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

// Maximum processing width (px) — K-means runs at this resolution
const MAX_PROC_W = 800;

// Minimum region pixel area to receive a label (per detail level, at processing resolution)
const MIN_LABEL_PX: Record<DetailLevel, number> = {
  low:    600,
  medium: 200,
  high:   60,
};

// Yield to the browser so React can re-render the progress bar
const tick = () => new Promise<void>(r => setTimeout(r, 0));

// ─────────────────────────────────────────────────────────
// Unsharp-mask sharpening (3×3 convolution)
// Applies in-place to the pixel buffer of a W×H canvas.
// Helps low-res images produce crisper region boundaries.
// ─────────────────────────────────────────────────────────
function applySharpen(ctx: CanvasRenderingContext2D, W: number, H: number, amount = 0.6): void {
  const id = ctx.getImageData(0, 0, W, H);
  const src = new Uint8ClampedArray(id.data);
  const dst = id.data;

  // Sharpen kernel: identity + amount * (identity - blur)
  // Equivalent to: out = src + amount*(src - blur(src))
  const k = amount;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = (y * W + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = src[i + c];
        const neighbours =
          src[((y-1)*W + x    ) * 4 + c] +
          src[((y+1)*W + x    ) * 4 + c] +
          src[(y    *W + x - 1) * 4 + c] +
          src[(y    *W + x + 1) * 4 + c];
        const blurred = neighbours / 4;
        dst[i + c] = Math.max(0, Math.min(255, Math.round(center + k * (center - blurred))));
      }
    }
  }
  ctx.putImageData(id, 0, 0);
}

// ─────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────

export async function generateDiagram(
  img: HTMLImageElement,
  settings: DiagramSettings,
  onProgress?: (pct: number) => void,
): Promise<DiagramResult> {
  // ── 1. Determine target canvas dimensions ──────────────
  const { w: TW, h: TH } = CANVAS_DIMS[settings.canvasSize];
  const targetAR = TW / TH;

  // ── 2. Determine source crop / fit parameters ──────────
  // Processing canvas always has the target aspect ratio so
  // the result maps 1:1 when scaled up to TW×TH.
  const W = MAX_PROC_W;
  const H = Math.round(W / targetAR);

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = W; srcCanvas.height = H;
  const srcCtx = srcCanvas.getContext('2d')!;
  srcCtx.fillStyle = '#ffffff';
  srcCtx.fillRect(0, 0, W, H);

  if (settings.fitMode === 'fit') {
    // Letterbox: scale image to fit inside W×H, center it
    const imgAR = img.naturalWidth / img.naturalHeight;
    let dw = W, dh = H;
    if (imgAR > targetAR) { dh = W / imgAR; } else { dw = H * imgAR; }
    const dx = (W - dw) / 2;
    const dy = (H - dh) / 2;
    srcCtx.drawImage(img, dx, dy, dw, dh);
  } else {
    // Fill: crop image to target AR, use cropRegion or auto-center
    let cropX: number, cropY: number, cropW: number, cropH: number;

    if (settings.cropRegion) {
      ({ x: cropX, y: cropY, w: cropW, h: cropH } = settings.cropRegion);
    } else {
      // Auto-center crop
      const imgAR = img.naturalWidth / img.naturalHeight;
      if (imgAR > targetAR) {
        cropH = img.naturalHeight;
        cropW = cropH * targetAR;
        cropX = (img.naturalWidth - cropW) / 2;
        cropY = 0;
      } else {
        cropW = img.naturalWidth;
        cropH = cropW / targetAR;
        cropX = 0;
        cropY = (img.naturalHeight - cropH) / 2;
      }
    }
    srcCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, W, H);
  }

  // Apply sharpening when source image is low-res (< 500K px) to improve
  // region boundary definition before K-means clustering
  const srcPixels = img.naturalWidth * img.naturalHeight;
  if (srcPixels < 500_000) {
    applySharpen(srcCtx, W, H, 0.7);
  }

  const { data: px } = srcCtx.getImageData(0, 0, W, H); // RGBA flat

  onProgress?.(5); await tick();

  // ── 3. Sample pixels for K-means ───────────────────────
  const STEP = 4;
  const sampled: [number, number, number][] = [];
  for (let y = 0; y < H; y += STEP) {
    for (let x = 0; x < W; x += STEP) {
      const i = (y * W + x) * 4;
      sampled.push(rgbToLab(px[i], px[i + 1], px[i + 2]));
    }
  }

  onProgress?.(10); await tick();

  // ── 4. K-means in LAB space ────────────────────────────
  const K = settings.colorCount;
  const { centers } = kMeans(sampled, K, 25);

  onProgress?.(40); await tick();

  // ── 5. Assign every pixel to nearest cluster ────────────
  const clusterMap = new Int32Array(W * H);
  const labDistSq = (
    [L1, a1, b1]: [number, number, number],
    [L2, a2, b2]: [number, number, number],
  ) => (L1 - L2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2;

  for (let i = 0; i < W * H; i++) {
    const lab = rgbToLab(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
    let best = 0, bestD = Infinity;
    for (let j = 0; j < K; j++) {
      const d = labDistSq(lab, centers[j]);
      if (d < bestD) { bestD = d; best = j; }
    }
    clusterMap[i] = best;
  }

  onProgress?.(60); await tick();

  // ── 6. Map cluster centres → nearest paint colour ────────
  const clusterToPaint = centers.map(c => mapToNearestPaint(c));
  const symbols        = generateSymbols(K);

  // ── 7. Connected components (BFS) ───────────────────────
  const visited  = new Uint8Array(W * H);
  const bfsQueue = new Int32Array(W * H);
  const componentsByClu = new Map<number, Array<{ size: number; cx: number; cy: number }>>();

  for (let start = 0; start < W * H; start++) {
    if (visited[start]) continue;
    const clu = clusterMap[start];
    visited[start] = 1;

    let head = 0, tail = 0;
    bfsQueue[tail++] = start;
    let sumX = 0, sumY = 0, size = 0;

    while (head < tail) {
      const idx = bfsQueue[head++];
      const x = idx % W;
      const y = (idx / W) | 0;
      sumX += x; sumY += y; size++;

      const nbrs = [
        y > 0     ? idx - W : -1,
        y < H - 1 ? idx + W : -1,
        x > 0     ? idx - 1 : -1,
        x < W - 1 ? idx + 1 : -1,
      ];
      for (const n of nbrs) {
        if (n >= 0 && !visited[n] && clusterMap[n] === clu) {
          visited[n] = 1;
          bfsQueue[tail++] = n;
        }
      }
    }

    const comp = componentsByClu.get(clu);
    const entry = { size, cx: sumX / size, cy: sumY / size };
    if (comp) comp.push(entry);
    else componentsByClu.set(clu, [entry]);
  }

  onProgress?.(75); await tick();

  // ── 8. Build edge map ─────────────────────────────────
  const isEdge = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const c = clusterMap[i];
      if (x < W - 1 && clusterMap[i + 1] !== c) { isEdge[i] = 1; isEdge[i + 1] = 1; }
      if (y < H - 1 && clusterMap[i + W] !== c) { isEdge[i] = 1; isEdge[i + W] = 1; }
    }
  }

  if (settings.style === 'detailed') {
    applySobelOverlay(px, W, H, isEdge, 40);
  }

  onProgress?.(85); await tick();

  // ── 9. Render low-res edge canvas ─────────────────────
  const edgeCanvas = document.createElement('canvas');
  edgeCanvas.width = W; edgeCanvas.height = H;
  const edgeCtx = edgeCanvas.getContext('2d')!;
  edgeCtx.fillStyle = '#ffffff';
  edgeCtx.fillRect(0, 0, W, H);

  const edgeData = edgeCtx.getImageData(0, 0, W, H);
  const edgePx   = edgeData.data;
  const edgeGray = settings.style === 'clean' ? 185 : 140;
  for (let i = 0; i < W * H; i++) {
    if (isEdge[i]) {
      edgePx[i * 4]     = edgeGray;
      edgePx[i * 4 + 1] = edgeGray;
      edgePx[i * 4 + 2] = edgeGray;
      edgePx[i * 4 + 3] = 255;
    }
  }
  edgeCtx.putImageData(edgeData, 0, 0);

  // ── 10. Scale edges up to final target resolution ─────
  const outCanvas = document.createElement('canvas');
  outCanvas.width  = TW;
  outCanvas.height = TH;
  const outCtx = outCanvas.getContext('2d')!;
  // Nearest-neighbour keeps edges crisp (no anti-alias blur)
  outCtx.imageSmoothingEnabled = false;
  outCtx.drawImage(edgeCanvas, 0, 0, TW, TH);

  // ── 11. Draw region labels at full resolution ─────────
  const minPx    = MIN_LABEL_PX[settings.detailLevel];
  const fontSize = Math.max(20, Math.round(TW / 70));
  const scaleX   = TW / W;
  const scaleY   = TH / H;

  outCtx.textAlign    = 'center';
  outCtx.textBaseline = 'middle';
  outCtx.font         = `bold ${fontSize}px Arial, sans-serif`;
  outCtx.fillStyle    = '#333333';

  const colorMap = new Map<number, ColorInfo>();

  for (let clu = 0; clu < K; clu++) {
    const comps      = componentsByClu.get(clu) ?? [];
    const totalPx    = comps.reduce((s, c) => s + c.size, 0);
    const significant = comps.filter(c => c.size >= minPx);

    colorMap.set(clu, {
      paintColor:  clusterToPaint[clu],
      symbol:      symbols[clu],
      regionCount: significant.length,
      pixelCount:  totalPx,
      clusterLab:  centers[clu],
    });

    for (const comp of significant) {
      outCtx.fillText(symbols[clu], comp.cx * scaleX, comp.cy * scaleY);
    }
  }

  onProgress?.(100);
  return { canvas: outCanvas, colorMap };
}

// ─────────────────────────────────────────────────────────
// Sobel edge overlay helper
// ─────────────────────────────────────────────────────────

function applySobelOverlay(
  src: Uint8ClampedArray,
  W: number,
  H: number,
  isEdge: Uint8Array,
  threshold: number,
): void {
  const gray = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    gray[i] = 0.299 * src[i * 4] + 0.587 * src[i * 4 + 1] + 0.114 * src[i * 4 + 2];
  }

  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const tl = gray[(y-1)*W+(x-1)], tc = gray[(y-1)*W+x], tr = gray[(y-1)*W+(x+1)];
      const ml = gray[y*W+(x-1)],                             mr = gray[y*W+(x+1)];
      const bl = gray[(y+1)*W+(x-1)], bc = gray[(y+1)*W+x], br = gray[(y+1)*W+(x+1)];

      const gx = -tl - 2*ml - bl + tr + 2*mr + br;
      const gy = -tl - 2*tc - tr + bl + 2*bc + br;
      if (Math.sqrt(gx*gx + gy*gy) > threshold) {
        isEdge[y * W + x] = 1;
      }
    }
  }
}
