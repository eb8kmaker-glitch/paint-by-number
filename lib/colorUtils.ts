// Browser-only module (uses no browser APIs directly, but consumed by client-side code)
import { PaintColor, PAINT_COLORS } from '@/constants/paintColors';

// ─────────────────────────────────────────────
// Color space conversions
// ─────────────────────────────────────────────

export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // Linearise sRGB
  const lin = (c: number): number => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const rl = lin(r), gl = lin(g), bl = lin(b);

  // sRGB → XYZ (D65, normalised to [0,1])
  const X = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
  const Y = (rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750) / 1.00000;
  const Z = (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) / 1.08883;

  // XYZ → L*a*b*
  const f = (t: number): number =>
    t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;

  const fx = f(X), fy = f(Y), fz = f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function labToRgb(L: number, a: number, b: number): [number, number, number] {
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;

  const cube = (t: number) => t * t * t;
  const X = (cube(fx) > 0.008856 ? cube(fx) : (116 * fx - 16) / 903.3) * 0.95047;
  const Y = L > 903.3 * 0.008856 ? cube((L + 16) / 116) : L / 903.3;
  const Z = (cube(fz) > 0.008856 ? cube(fz) : (116 * fz - 16) / 903.3) * 1.08883;

  const rL = X *  3.2404542 + Y * -1.5371385 + Z * -0.4985314;
  const gL = X * -0.9692660 + Y *  1.8760108 + Z *  0.0415560;
  const bL = X *  0.0556434 + Y * -0.2040259 + Z *  1.0572252;

  const gamma = (c: number) => {
    c = Math.max(0, Math.min(1, c));
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  };
  return [
    Math.round(gamma(rL) * 255),
    Math.round(gamma(gL) * 255),
    Math.round(gamma(bL) * 255),
  ];
}

// ─────────────────────────────────────────────
// CIEDE2000 colour difference
// ─────────────────────────────────────────────

export function deltaE2000(
  [L1, a1, b1]: [number, number, number],
  [L2, a2, b2]: [number, number, number],
): number {
  const deg = (r: number) => r * 180 / Math.PI;
  const rad = (d: number) => d * Math.PI / 180;
  const P25_7 = 6103515625; // 25^7

  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const Cav = (C1 + C2) / 2;
  const Cav7 = Math.pow(Cav, 7);
  const G = 0.5 * (1 - Math.sqrt(Cav7 / (Cav7 + P25_7)));

  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  const h1p = (deg(Math.atan2(b1, a1p)) + 360) % 360;
  const h2p = (deg(Math.atan2(b2, a2p)) + 360) % 360;

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp = 0;
  if (C1p * C2p !== 0) {
    const diff = h2p - h1p;
    if (Math.abs(diff) <= 180) dhp = diff;
    else if (diff > 180) dhp = diff - 360;
    else dhp = diff + 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp / 2));

  const Lp = (L1 + L2) / 2;
  const Cp = (C1p + C2p) / 2;

  let hp: number;
  if (C1p * C2p === 0) {
    hp = h1p + h2p;
  } else if (Math.abs(h1p - h2p) <= 180) {
    hp = (h1p + h2p) / 2;
  } else if (h1p + h2p < 360) {
    hp = (h1p + h2p + 360) / 2;
  } else {
    hp = (h1p + h2p - 360) / 2;
  }

  const T =
    1 - 0.17 * Math.cos(rad(hp - 30))
      + 0.24 * Math.cos(rad(2 * hp))
      + 0.32 * Math.cos(rad(3 * hp + 6))
      - 0.20 * Math.cos(rad(4 * hp - 63));

  const SL = 1 + 0.015 * Math.pow(Lp - 50, 2) / Math.sqrt(20 + Math.pow(Lp - 50, 2));
  const SC = 1 + 0.045 * Cp;
  const SH = 1 + 0.015 * Cp * T;

  const Cp7 = Math.pow(Cp, 7);
  const RC = 2 * Math.sqrt(Cp7 / (Cp7 + P25_7));
  const RT = -Math.sin(rad(60 * Math.exp(-Math.pow((hp - 275) / 25, 2)))) * RC;

  return Math.sqrt(
    (dLp / SL) ** 2 +
    (dCp / SC) ** 2 +
    (dHp / SH) ** 2 +
    RT * (dCp / SC) * (dHp / SH),
  );
}

// ─────────────────────────────────────────────
// K-means clustering in L*a*b* space
// ─────────────────────────────────────────────

function labDistSq(
  [L1, a1, b1]: [number, number, number],
  [L2, a2, b2]: [number, number, number],
): number {
  return (L1 - L2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2;
}

function kMeansPlusPlus(
  pixels: [number, number, number][],
  k: number,
): [number, number, number][] {
  const n = pixels.length;
  const centers: [number, number, number][] = [[...pixels[Math.floor(Math.random() * n)]] as [number, number, number]];

  for (let c = 1; c < k; c++) {
    const dists = pixels.map(p => Math.min(...centers.map(ct => labDistSq(p, ct))));
    const total = dists.reduce((s, d) => s + d, 0);
    let rand = Math.random() * total;
    let chosen = n - 1;
    for (let i = 0; i < n; i++) {
      rand -= dists[i];
      if (rand <= 0) { chosen = i; break; }
    }
    centers.push([...pixels[chosen]] as [number, number, number]);
  }
  return centers;
}

export function kMeans(
  pixels: [number, number, number][],
  k: number,
  maxIter = 25,
): { centers: [number, number, number][]; assignments: Int32Array } {
  const n = pixels.length;
  const centers = kMeansPlusPlus(pixels, k);
  const assignments = new Int32Array(n);

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      let best = 0, bestDist = Infinity;
      for (let j = 0; j < k; j++) {
        const d = labDistSq(pixels[i], centers[j]);
        if (d < bestDist) { bestDist = d; best = j; }
      }
      if (assignments[i] !== best) { assignments[i] = best; changed = true; }
    }
    if (!changed) break;

    const sums = Array.from({ length: k }, () => [0, 0, 0] as [number, number, number]);
    const counts = new Array<number>(k).fill(0);
    for (let i = 0; i < n; i++) {
      const c = assignments[i];
      sums[c][0] += pixels[i][0];
      sums[c][1] += pixels[i][1];
      sums[c][2] += pixels[i][2];
      counts[c]++;
    }
    for (let j = 0; j < k; j++) {
      if (counts[j] > 0) {
        centers[j] = [sums[j][0] / counts[j], sums[j][1] / counts[j], sums[j][2] / counts[j]];
      }
    }
  }
  return { centers, assignments };
}

// ─────────────────────────────────────────────
// Paint colour mapping via ΔE2000
// ─────────────────────────────────────────────

const PAINT_WITH_LAB = PAINT_COLORS.map(pc => ({
  ...pc,
  lab: rgbToLab(...pc.rgb) as [number, number, number],
}));

export function mapToNearestPaint(lab: [number, number, number]): PaintColor {
  let best = PAINT_WITH_LAB[0];
  let bestDelta = Infinity;
  for (const pc of PAINT_WITH_LAB) {
    const d = deltaE2000(lab, pc.lab);
    if (d < bestDelta) { bestDelta = d; best = pc; }
  }
  return best;
}

// ─────────────────────────────────────────────
// Symbol generator  (1-9, A-Z, 1A-9Z …)
// ─────────────────────────────────────────────

export function generateSymbols(count: number): string[] {
  return Array.from({ length: count }, (_, i) => String(i + 1));
}

// ─────────────────────────────────────────────────────────────────────────────
// Gaussian blur (3 passes of separable box blur ≈ Gaussian)
// Operates directly on raw RGBA pixel data.
// ─────────────────────────────────────────────────────────────────────────────

type Pixels = Uint8ClampedArray<ArrayBufferLike>;

function _boxBlurH(src: Pixels, W: number, H: number, r: number): Uint8ClampedArray<ArrayBuffer> {
  const dst = new Uint8ClampedArray(src.length);
  const len = 2 * r + 1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let rs = 0, gs = 0, bs = 0;
      for (let dx = -r; dx <= r; dx++) {
        const nx = Math.max(0, Math.min(W - 1, x + dx));
        const i  = (y * W + nx) * 4;
        rs += src[i]; gs += src[i + 1]; bs += src[i + 2];
      }
      const o = (y * W + x) * 4;
      dst[o] = rs / len; dst[o + 1] = gs / len; dst[o + 2] = bs / len; dst[o + 3] = 255;
    }
  }
  return dst;
}

function _boxBlurV(src: Pixels, W: number, H: number, r: number): Uint8ClampedArray<ArrayBuffer> {
  const dst = new Uint8ClampedArray(src.length);
  const len = 2 * r + 1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let rs = 0, gs = 0, bs = 0;
      for (let dy = -r; dy <= r; dy++) {
        const ny = Math.max(0, Math.min(H - 1, y + dy));
        const i  = (ny * W + x) * 4;
        rs += src[i]; gs += src[i + 1]; bs += src[i + 2];
      }
      const o = (y * W + x) * 4;
      dst[o] = rs / len; dst[o + 1] = gs / len; dst[o + 2] = bs / len; dst[o + 3] = 255;
    }
  }
  return dst;
}

/**
 * Apply Gaussian blur approximation (3 passes of box blur).
 * Returns a new Uint8ClampedArray with the blurred RGBA data.
 */
export function gaussianBlur(
  src: Pixels,
  W: number,
  H: number,
  radius: number,
): Uint8ClampedArray<ArrayBuffer> {
  if (radius <= 0) return new Uint8ClampedArray(src);
  let buf: Pixels = new Uint8ClampedArray(src);
  for (let p = 0; p < 3; p++) {
    buf = _boxBlurH(buf, W, H, radius);
    buf = _boxBlurV(buf, W, H, radius);
  }
  return buf as Uint8ClampedArray<ArrayBuffer>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Color-count suggestion based on image colour spread in LAB space
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyse the image and return a suggested number of paint colors.
 * Uses variance of pixel LAB values as a proxy for image complexity.
 */
export function suggestColorCount(pixels: Pixels, W: number, H: number): number {
  const N = W * H;
  const step = Math.max(1, Math.floor(N / 500)); // sample ≤500 pixels
  let sumL = 0, sumA = 0, sumB = 0;
  let count = 0;
  const labs: [number, number, number][] = [];

  for (let i = 0; i < N; i += step) {
    const lab = rgbToLab(pixels[i * 4], pixels[i * 4 + 1], pixels[i * 4 + 2]);
    labs.push(lab);
    sumL += lab[0]; sumA += lab[1]; sumB += lab[2];
    count++;
  }

  const mL = sumL / count, mA = sumA / count, mB = sumB / count;
  let varTotal = 0;
  for (const [L, a, b] of labs) {
    varTotal += (L - mL) ** 2 + (a - mA) ** 2 + (b - mB) ** 2;
  }
  const spread = Math.sqrt(varTotal / count);

  if (spread > 40) return 48;
  if (spread > 25) return 36;
  if (spread > 12) return 24;
  return 16;
}

