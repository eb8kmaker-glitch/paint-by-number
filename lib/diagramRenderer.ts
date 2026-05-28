// Client-side only — uses HTMLImageElement, HTMLCanvasElement
import { rgbToLab, kMeans, mapToNearestPaint, generateSymbols } from '@/lib/colorUtils';
import { PaintColor } from '@/constants/paintColors';

export type DetailLevel = 'low' | 'medium' | 'high';
export type CanvasSize  = 'a4' | 'a3' | 'square';
export type Style       = 'clean' | 'detailed';

export interface DiagramSettings {
  colorCount:  number;
  detailLevel: DetailLevel;
  canvasSize:  CanvasSize;
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

// Maximum processing width (px)
const MAX_W = 800;

// Minimum region pixel area to receive a label (per detail level)
const MIN_LABEL_PX: Record<DetailLevel, number> = {
  low:    600,
  medium: 200,
  high:   60,
};

// Yield to the browser so React can re-render the progress bar
const tick = () => new Promise<void>(r => setTimeout(r, 0));

// ─────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────

export async function generateDiagram(
  img: HTMLImageElement,
  settings: DiagramSettings,
  onProgress?: (pct: number) => void,
): Promise<DiagramResult> {
  // ── 1. Scale source image ──────────────────────────────
  const scale = Math.min(1, MAX_W / img.naturalWidth);
  const W = Math.round(img.naturalWidth  * scale);
  const H = Math.round(img.naturalHeight * scale);

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = W;  srcCanvas.height = H;
  const srcCtx = srcCanvas.getContext('2d')!;
  srcCtx.drawImage(img, 0, 0, W, H);
  const { data: px } = srcCtx.getImageData(0, 0, W, H); // RGBA flat

  onProgress?.(5); await tick();

  // ── 2. Sample pixels for K-means ───────────────────────
  const STEP = 4; // sample every Nth pixel
  const sampled: [number, number, number][] = [];
  for (let y = 0; y < H; y += STEP) {
    for (let x = 0; x < W; x += STEP) {
      const i = (y * W + x) * 4;
      sampled.push(rgbToLab(px[i], px[i + 1], px[i + 2]));
    }
  }

  onProgress?.(10); await tick();

  // ── 3. K-means in LAB space ────────────────────────────
  const K = settings.colorCount;
  const { centers } = kMeans(sampled, K, 25);

  onProgress?.(40); await tick();

  // ── 4. Assign every pixel to nearest cluster ────────────
  const clusterMap = new Int32Array(W * H);
  // Pre-compute squared distances helper (Euclidean LAB, fast)
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

  // ── 5. Map cluster centres → nearest paint colour ────────
  const clusterToPaint = centers.map(c => mapToNearestPaint(c));
  const symbols        = generateSymbols(K);

  // ── 6. Connected components (BFS, typed-array queue) ────
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

  // ── 7. Build edge map ─────────────────────────────────
  const isEdge = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const c = clusterMap[i];
      if (x < W - 1 && clusterMap[i + 1] !== c) { isEdge[i] = 1; isEdge[i + 1] = 1; }
      if (y < H - 1 && clusterMap[i + W] !== c) { isEdge[i] = 1; isEdge[i + W] = 1; }
    }
  }

  // For "detailed" style add a faint Sobel overlay on the original
  if (settings.style === 'detailed') {
    applySobelOverlay(px, W, H, isEdge, 40);
  }

  onProgress?.(85); await tick();

  // ── 8. Render output canvas ───────────────────────────
  const outCanvas = document.createElement('canvas');
  outCanvas.width = W; outCanvas.height = H;
  const outCtx = outCanvas.getContext('2d')!;
  outCtx.fillStyle = '#ffffff';
  outCtx.fillRect(0, 0, W, H);

  const outData = outCtx.getImageData(0, 0, W, H);
  const outPx   = outData.data;

  const edgeGray = settings.style === 'clean' ? 185 : 140;
  for (let i = 0; i < W * H; i++) {
    if (isEdge[i]) {
      outPx[i * 4]     = edgeGray;
      outPx[i * 4 + 1] = edgeGray;
      outPx[i * 4 + 2] = edgeGray;
      outPx[i * 4 + 3] = 255;
    }
  }
  outCtx.putImageData(outData, 0, 0);

  // ── 9. Draw region labels ─────────────────────────────
  const minPx   = MIN_LABEL_PX[settings.detailLevel];
  const fontSize = Math.max(9, Math.min(16, Math.round(W / 70)));

  outCtx.textAlign    = 'center';
  outCtx.textBaseline = 'middle';
  outCtx.font         = `bold ${fontSize}px Arial, sans-serif`;

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

    outCtx.fillStyle = '#333333';
    for (const comp of significant) {
      outCtx.fillText(symbols[clu], comp.cx, comp.cy);
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
