// Region segmentation: flood-fill connected components + small-region merging.
// All operations run at the processing resolution (e.g. 800px wide canvas).

export interface Region {
  colorIndex: number;   // K-means cluster index (after merging)
  pixelCount: number;
  centroidX:  number;   // in processing-canvas pixels
  centroidY:  number;
}

const MIN_AREA: Record<'low' | 'medium' | 'high', number> = {
  low:    1200,
  medium:  500,
  high:    200,
};

/**
 * Given a quantized pixel array (clusterMap), find all connected regions
 * via 4-connectivity BFS, merge tiny regions into their best neighbours,
 * then return region metadata.
 *
 * Side-effect: `clusterMap` is mutated in place so merged pixels take the
 * absorbing region's color index.
 */
export function segmentRegions(
  clusterMap: Int32Array,
  W: number,
  H: number,
  detailLevel: 'low' | 'medium' | 'high',
): Region[] {
  const N       = W * H;
  const minArea = MIN_AREA[detailLevel];

  // ── 1. BFS flood-fill ─────────────────────────────────────────────────────
  const compOf    = new Int32Array(N).fill(-1);
  const compColor: number[] = [];   // comp → original cluster index
  const compCount: number[] = [];   // comp → pixel count
  const compSumX:  number[] = [];
  const compSumY:  number[] = [];
  const queue = new Int32Array(N);

  for (let start = 0; start < N; start++) {
    if (compOf[start] >= 0) continue;
    const colorIdx = clusterMap[start];
    const cId = compColor.length;
    compColor.push(colorIdx);
    compCount.push(0);
    compSumX.push(0);
    compSumY.push(0);

    let head = 0, tail = 0;
    queue[tail++] = start;
    compOf[start] = cId;

    while (head < tail) {
      const idx = queue[head++];
      const x = idx % W, y = (idx / W) | 0;
      compCount[cId]++;
      compSumX[cId] += x;
      compSumY[cId] += y;

      const up    = y > 0     ? idx - W : -1;
      const down  = y < H - 1 ? idx + W : -1;
      const left  = x > 0     ? idx - 1 : -1;
      const right = x < W - 1 ? idx + 1 : -1;

      for (const n of [up, down, left, right]) {
        if (n >= 0 && compOf[n] < 0 && clusterMap[n] === colorIdx) {
          compOf[n] = cId;
          queue[tail++] = n;
        }
      }
    }
  }

  const numComps = compColor.length;

  // ── 2. Union-Find setup ───────────────────────────────────────────────────
  const parent   = new Int32Array(numComps);
  const rootSize = new Int32Array(numComps);
  for (let i = 0; i < numComps; i++) { parent[i] = i; rootSize[i] = compCount[i]; }

  const findRoot = (x: number): number => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };

  // ── 3. Multi-pass merging ─────────────────────────────────────────────────
  // Each pass rebuilds the boundary adjacency from scratch using current roots,
  // then merges any root whose area is still < minArea into its best neighbour.
  for (let pass = 0; pass < 8; pass++) {
    // Build per-root adjacency (bidirectional, boundary-pixel count)
    const adj = new Map<number, Map<number, number>>();

    for (let idx = 0; idx < N; idx++) {
      const ra = findRoot(compOf[idx]);
      const x  = idx % W;
      const y  = (idx / W) | 0;

      const addEdge = (n: number) => {
        const rb = findRoot(compOf[n]);
        if (ra === rb) return;
        if (!adj.has(ra)) adj.set(ra, new Map());
        if (!adj.has(rb)) adj.set(rb, new Map());
        adj.get(ra)!.set(rb, (adj.get(ra)!.get(rb) ?? 0) + 1);
        adj.get(rb)!.set(ra, (adj.get(rb)!.get(ra) ?? 0) + 1);
      };

      if (x < W - 1) addEdge(idx + 1);
      if (y < H - 1) addEdge(idx + W);
    }

    // Collect unique roots sorted by size ascending
    const roots = new Set<number>();
    for (let i = 0; i < numComps; i++) roots.add(findRoot(i));

    const sortedRoots = [...roots].sort((a, b) => rootSize[a] - rootSize[b]);

    let anyMerged = false;

    for (const root of sortedRoots) {
      if (rootSize[root] >= minArea) continue; // already large enough

      const neighbours = adj.get(root);
      if (!neighbours) continue;

      let bestNeighbour = -1, bestShared = 0;
      for (const [nb, shared] of neighbours) {
        if (shared > bestShared) { bestShared = shared; bestNeighbour = nb; }
      }

      if (bestNeighbour < 0) continue;

      // Merge root → bestNeighbour
      parent[root] = bestNeighbour;
      rootSize[bestNeighbour] += rootSize[root];
      rootSize[root] = 0;
      anyMerged = true;
    }

    if (!anyMerged) break;
  }

  // ── 4. Apply merging to clusterMap + build final region list ──────────────
  // Map each surviving root → final region
  const rootToRegion = new Map<number, {
    colorIndex: number; count: number; sumX: number; sumY: number;
  }>();

  for (let idx = 0; idx < N; idx++) {
    const root = findRoot(compOf[idx]);
    if (!rootToRegion.has(root)) {
      rootToRegion.set(root, {
        colorIndex: compColor[root],
        count: 0, sumX: 0, sumY: 0,
      });
    }
    const s = rootToRegion.get(root)!;
    s.count++;
    s.sumX += idx % W;
    s.sumY += (idx / W) | 0;
    // Update clusterMap to the surviving root's color
    clusterMap[idx] = compColor[root];
  }

  const regions: Region[] = [];
  for (const s of rootToRegion.values()) {
    if (s.count === 0) continue;
    regions.push({
      colorIndex: s.colorIndex,
      pixelCount: s.count,
      centroidX:  s.sumX / s.count,
      centroidY:  s.sumY / s.count,
    });
  }

  return regions;
}

// ─────────────────────────────────────────────────────────────────────────────
// Median filter on quantized cluster map.
// Replaces each pixel's cluster index with the modal (most-common) value
// in its 3×3 neighbourhood.  Smooths jagged region boundaries without
// blurring across large colour differences.
//
// Mutates clusterMap in place.
// ─────────────────────────────────────────────────────────────────────────────
export function medianFilterQuantized(
  clusterMap: Int32Array,
  W: number,
  H: number,
  passes: number,
  K: number,           // total number of clusters (max cluster index + 1)
): void {
  const N    = W * H;
  const temp = new Int32Array(N);
  const freq = new Int32Array(K + 1);

  for (let p = 0; p < passes; p++) {
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        // Collect 3×3 neighbourhood
        const used: number[] = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const c = clusterMap[(y + dy) * W + (x + dx)];
            if (freq[c] === 0) used.push(c);
            freq[c]++;
          }
        }
        // Find modal cluster
        let best = clusterMap[y * W + x], bestF = 0;
        for (const c of used) {
          if (freq[c] > bestF) { bestF = freq[c]; best = c; }
          freq[c] = 0; // reset for next pixel
        }
        temp[y * W + x] = best;
      }
    }
    // Copy border pixels unchanged
    for (let x = 0; x < W; x++) {
      temp[x]             = clusterMap[x];
      temp[(H - 1) * W + x] = clusterMap[(H - 1) * W + x];
    }
    for (let y = 0; y < H; y++) {
      temp[y * W]         = clusterMap[y * W];
      temp[y * W + W - 1] = clusterMap[y * W + W - 1];
    }
    clusterMap.set(temp);
  }
}

