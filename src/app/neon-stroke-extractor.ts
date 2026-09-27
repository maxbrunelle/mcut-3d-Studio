import * as THREE from 'three';

export interface NeonStroke {
  points: THREE.Vector3[];
  isClosed: boolean;
}

/**
 * Extracts smooth, high-precision single-line centerline strokes from any Three.js Font glyph shapes.
 * Uses topological Medial Axis Thinning (Zhang-Suen) and cubic spline smoothing for authentic neon flex tubes.
 */
export function extractGlyphCenterlineStrokes(
  shapes: THREE.Shape[],
  curveSegments = 32
): NeonStroke[] {
  const allStrokes: NeonStroke[] = [];

  for (const shape of shapes) {
    const shapeStrokes = skeletonizeShape(shape, curveSegments);
    allStrokes.push(...shapeStrokes);
  }

  return allStrokes;
}

/**
 * Extracts outline perimeter contour strokes for outline routing mode.
 */
export function extractGlyphOutlineStrokes(
  shapes: THREE.Shape[],
  curveSegments = 36
): NeonStroke[] {
  const allStrokes: NeonStroke[] = [];

  for (const shape of shapes) {
    const shapePoints = shape.extractPoints(curveSegments);
    const outer = shapePoints.shape;
    const holes = shapePoints.holes || [];

    const loops = [outer, ...holes];
    for (const loop of loops) {
      if (!loop || loop.length < 3) continue;
      const cleaned = clean2DPoints(loop, 0.4);
      if (cleaned.length < 3) continue;

      const pts3d = cleaned.map(p => new THREE.Vector3(p.x, p.y, 0));
      pts3d.push(pts3d[0].clone()); // Close loop
      allStrokes.push({ points: pts3d, isClosed: true });
    }
  }

  return allStrokes;
}

// ---------------------------------------------------------------------------
// Internal Skeletonization Engine
// ---------------------------------------------------------------------------

function skeletonizeShape(shape: THREE.Shape, curveSegments: number): NeonStroke[] {
  const shapePoints = shape.extractPoints(curveSegments);
  const outer = shapePoints.shape;
  const holes = shapePoints.holes || [];

  if (!outer || outer.length < 3) return [];

  // Compute Bounding Box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of outer) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const shapeW = maxX - minX;
  const shapeH = maxY - minY;

  if (shapeW < 0.1 || shapeH < 0.1) {
    // Very small dot/dash (e.g. dot of 'i' or period)
    const mid = new THREE.Vector3((minX + maxX) * 0.5, (minY + maxY) * 0.5, 0);
    return [{ points: [mid, mid.clone().add(new THREE.Vector3(0.01, 0, 0))], isClosed: false }];
  }

  // Choose pixel resolution (0.4mm to 0.7mm per cell for fast, sub-millisecond execution)
  const maxDim = Math.max(shapeW, shapeH);
  const targetCells = Math.min(110, Math.max(40, Math.round(maxDim * 1.8)));
  const cellSize = maxDim / targetCells;

  const pad = 2;
  const cols = Math.ceil(shapeW / cellSize) + pad * 2;
  const rows = Math.ceil(shapeH / cellSize) + pad * 2;

  const grid = new Uint8Array(cols * rows);

  // Rasterize shape onto grid using point-in-polygon
  for (let r = 0; r < rows; r++) {
    const wy = minY + (r - pad) * cellSize;
    for (let c = 0; c < cols; c++) {
      const wx = minX + (c - pad) * cellSize;
      const pt = new THREE.Vector2(wx, wy);

      if (isPointInPolygon(pt, outer) && !isPointInHoles(pt, holes)) {
        grid[r * cols + c] = 1;
      }
    }
  }

  // Apply Zhang-Suen Thinning to obtain 1-pixel wide skeleton
  zhangSuenThinning(grid, cols, rows);

  // Extract ordered stroke paths from skeleton pixels
  const rawPaths = traceSkeletonPaths(grid, cols, rows, minX - pad * cellSize, minY - pad * cellSize, cellSize);

  // Smooth, simplify, and clamp strokes
  const results: NeonStroke[] = [];
  for (const raw of rawPaths) {
    if (raw.points.length < 2) continue;

    // Simplify slightly to eliminate pixel staircasing
    const simplified = douglasPeucker(raw.points, 0.35);
    if (simplified.length < 2) continue;

    // Apply smooth subdivision / Chaikin corner smoothing
    const smoothed = smoothPolyline(simplified, raw.isClosed, 2);
    if (smoothed.length >= 2) {
      results.push({ points: smoothed, isClosed: raw.isClosed });
    }
  }

  // Fallback: If skeleton produced no valid strokes, use outer contour
  if (results.length === 0) {
    const cleaned = clean2DPoints(outer, 0.5);
    if (cleaned.length >= 3) {
      const pts3d = cleaned.map(p => new THREE.Vector3(p.x, p.y, 0));
      pts3d.push(pts3d[0].clone());
      results.push({ points: pts3d, isClosed: true });
    }
  }

  return results;
}

/**
 * Standard Zhang-Suen Thinning Algorithm
 */
function zhangSuenThinning(grid: Uint8Array, cols: number, rows: number) {
  let changed = true;
  let iterations = 0;
  const maxIterations = 60;

  const toDelete: number[] = [];

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    // Step 1
    toDelete.length = 0;
    for (let r = 1; r < rows - 1; r++) {
      const rowOffset = r * cols;
      for (let c = 1; c < cols - 1; c++) {
        const idx = rowOffset + c;
        if (grid[idx] !== 1) continue;

        const p2 = grid[idx - cols];
        const p3 = grid[idx - cols + 1];
        const p4 = grid[idx + 1];
        const p5 = grid[idx + cols + 1];
        const p6 = grid[idx + cols];
        const p7 = grid[idx + cols - 1];
        const p8 = grid[idx - 1];
        const p9 = grid[idx - cols - 1];

        const b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (b < 2 || b > 6) continue;

        let a = 0;
        if (p2 === 0 && p3 === 1) a++;
        if (p3 === 0 && p4 === 1) a++;
        if (p4 === 0 && p5 === 1) a++;
        if (p5 === 0 && p6 === 1) a++;
        if (p6 === 0 && p7 === 1) a++;
        if (p7 === 0 && p8 === 1) a++;
        if (p8 === 0 && p9 === 1) a++;
        if (p9 === 0 && p2 === 1) a++;

        if (a !== 1) continue;

        if (p2 * p4 * p6 !== 0) continue;
        if (p4 * p6 * p8 !== 0) continue;

        toDelete.push(idx);
      }
    }

    for (const idx of toDelete) {
      grid[idx] = 0;
      changed = true;
    }

    // Step 2
    toDelete.length = 0;
    for (let r = 1; r < rows - 1; r++) {
      const rowOffset = r * cols;
      for (let c = 1; c < cols - 1; c++) {
        const idx = rowOffset + c;
        if (grid[idx] !== 1) continue;

        const p2 = grid[idx - cols];
        const p3 = grid[idx - cols + 1];
        const p4 = grid[idx + 1];
        const p5 = grid[idx + cols + 1];
        const p6 = grid[idx + cols];
        const p7 = grid[idx + cols - 1];
        const p8 = grid[idx - 1];
        const p9 = grid[idx - cols - 1];

        const b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (b < 2 || b > 6) continue;

        let a = 0;
        if (p2 === 0 && p3 === 1) a++;
        if (p3 === 0 && p4 === 1) a++;
        if (p4 === 0 && p5 === 1) a++;
        if (p5 === 0 && p6 === 1) a++;
        if (p6 === 0 && p7 === 1) a++;
        if (p7 === 0 && p8 === 1) a++;
        if (p8 === 0 && p9 === 1) a++;
        if (p9 === 0 && p2 === 1) a++;

        if (a !== 1) continue;

        if (p2 * p4 * p8 !== 0) continue;
        if (p2 * p6 * p8 !== 0) continue;

        toDelete.push(idx);
      }
    }

    for (const idx of toDelete) {
      grid[idx] = 0;
      changed = true;
    }
  }
}

/**
 * Traces 8-connected skeleton pixels into continuous ordered paths.
 */
function traceSkeletonPaths(
  grid: Uint8Array,
  cols: number,
  rows: number,
  originX: number,
  originY: number,
  cellSize: number
): { points: THREE.Vector3[]; isClosed: boolean }[] {
  const visited = new Uint8Array(cols * rows);
  const paths: { points: THREE.Vector3[]; isClosed: boolean }[] = [];

  const neighbors = [
    [-1, 0], [-1, 1], [0, 1], [1, 1],
    [1, 0], [1, -1], [0, -1], [-1, -1]
  ];

  // Helper to count active skeleton neighbors
  const getNeighbors = (r: number, c: number): [number, number][] => {
    const list: [number, number][] = [];
    for (const [dr, dc] of neighbors) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        if (grid[nr * cols + nc] === 1) {
          list.push([nr, nc]);
        }
      }
    }
    return list;
  };

  // 1. Pass 1: Trace starting from endpoints (degree === 1)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (grid[idx] !== 1 || visited[idx] === 1) continue;

      const nbs = getNeighbors(r, c);
      if (nbs.length === 1) {
        // Start of a stroke line
        const pathPoints: THREE.Vector3[] = [];
        let currR = r;
        let currC = c;
        let prevR = -1;
        let prevC = -1;

        while (true) {
          const cIdx = currR * cols + currC;
          visited[cIdx] = 1;
          pathPoints.push(new THREE.Vector3(
            originX + currC * cellSize,
            originY + currR * cellSize,
            0
          ));

          const currentNbs = getNeighbors(currR, currC);
          let nextStep: [number, number] | null = null;

          for (const [nr, nc] of currentNbs) {
            if (nr === prevR && nc === prevC) continue;
            if (visited[nr * cols + nc] === 0) {
              nextStep = [nr, nc];
              break;
            }
          }

          if (!nextStep) {
            break;
          }

          prevR = currR;
          prevC = currC;
          currR = nextStep[0];
          currC = nextStep[1];
        }

        if (pathPoints.length >= 2) {
          paths.push({ points: pathPoints, isClosed: false });
        }
      }
    }
  }

  // 2. Pass 2: Trace remaining unvisited closed loops (e.g. letter 'O')
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (grid[idx] !== 1 || visited[idx] === 1) continue;

      const pathPoints: THREE.Vector3[] = [];
      let currR = r;
      let currC = c;
      let prevR = -1;
      let prevC = -1;

      while (true) {
        const cIdx = currR * cols + currC;
        visited[cIdx] = 1;
        pathPoints.push(new THREE.Vector3(
          originX + currC * cellSize,
          originY + currR * cellSize,
          0
        ));

        const currentNbs = getNeighbors(currR, currC);
        let nextStep: [number, number] | null = null;

        for (const [nr, nc] of currentNbs) {
          if (nr === prevR && nc === prevC) continue;
          if (visited[nr * cols + nc] === 0) {
            nextStep = [nr, nc];
            break;
          }
        }

        if (!nextStep) {
          break;
        }

        prevR = currR;
        prevC = currC;
        currR = nextStep[0];
        currC = nextStep[1];
      }

      if (pathPoints.length >= 3) {
        // Connect closed loop
        pathPoints.push(pathPoints[0].clone());
        paths.push({ points: pathPoints, isClosed: true });
      }
    }
  }

  return paths;
}

// ---------------------------------------------------------------------------
// Geometry & Smoothing Helpers
// ---------------------------------------------------------------------------

function isPointInPolygon(point: THREE.Vector2, vs: THREE.Vector2[]): boolean {
  const x = point.x;
  const y = point.y;
  let inside = false;

  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].x;
    const yi = vs[i].y;
    const xj = vs[j].x;
    const yj = vs[j].y;

    const intersect = (yi > y) !== (yj > y) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

function isPointInHoles(point: THREE.Vector2, holes: THREE.Vector2[][]): boolean {
  for (const hole of holes) {
    if (isPointInPolygon(point, hole)) return true;
  }
  return false;
}

function clean2DPoints(pts: THREE.Vector2[], minDist = 0.5): THREE.Vector2[] {
  const res: THREE.Vector2[] = [];
  const minDistSq = minDist * minDist;
  for (const p of pts) {
    if (res.length === 0 || p.distanceToSquared(res[res.length - 1]) >= minDistSq) {
      res.push(p);
    }
  }
  return res;
}

function douglasPeucker(points: THREE.Vector3[], epsilon: number): THREE.Vector3[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let index = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], start, end);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }

  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, index + 1), epsilon);
    const right = douglasPeucker(points.slice(index), epsilon);
    return left.slice(0, left.length - 1).concat(right);
  } else {
    return [start, end];
  }
}

function perpendicularDistance(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): number {
  const l2 = a.distanceToSquared(b);
  if (l2 === 0) return p.distanceTo(a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2));
  const projection = new THREE.Vector3(
    a.x + t * (b.x - a.x),
    a.y + t * (b.y - a.y),
    0
  );
  return p.distanceTo(projection);
}

/**
 * Chaikin Corner Cutting subdivision algorithm for natural organic neon curves.
 */
function smoothPolyline(points: THREE.Vector3[], isClosed: boolean, iterations = 2): THREE.Vector3[] {
  if (points.length < 3) return points;

  let current = [...points];

  for (let it = 0; it < iterations; it++) {
    const next: THREE.Vector3[] = [];
    const n = current.length;

    if (!isClosed) {
      next.push(current[0].clone());
      for (let i = 0; i < n - 1; i++) {
        const p0 = current[i];
        const p1 = current[i + 1];

        const q = new THREE.Vector3(0.75 * p0.x + 0.25 * p1.x, 0.75 * p0.y + 0.25 * p1.y, 0);
        const r = new THREE.Vector3(0.25 * p0.x + 0.75 * p1.x, 0.25 * p0.y + 0.75 * p1.y, 0);

        next.push(q, r);
      }
      next.push(current[n - 1].clone());
    } else {
      for (let i = 0; i < n - 1; i++) {
        const p0 = current[i];
        const p1 = current[i + 1];

        const q = new THREE.Vector3(0.75 * p0.x + 0.25 * p1.x, 0.75 * p0.y + 0.25 * p1.y, 0);
        const r = new THREE.Vector3(0.25 * p0.x + 0.75 * p1.x, 0.25 * p0.y + 0.75 * p1.y, 0);

        next.push(q, r);
      }
      next.push(next[0].clone());
    }

    current = next;
  }

  // Resample at uniform 1.5mm arc lengths to prevent tube geometry pinching
  return resampleUniformArcLength(current, 1.5, isClosed);
}

function resampleUniformArcLength(points: THREE.Vector3[], stepMm: number, isClosed: boolean): THREE.Vector3[] {
  if (points.length < 2) return points;

  let totalLen = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalLen += points[i].distanceTo(points[i + 1]);
  }

  if (totalLen < stepMm) return points;

  const numSteps = Math.max(3, Math.round(totalLen / stepMm));
  const resampled: THREE.Vector3[] = [points[0].clone()];

  let currentDist = 0;
  let segIdx = 0;

  for (let s = 1; s <= numSteps; s++) {
    const targetDist = (s / numSteps) * totalLen;

    while (segIdx < points.length - 1) {
      const pA = points[segIdx];
      const pB = points[segIdx + 1];
      const segLen = pA.distanceTo(pB);

      if (currentDist + segLen >= targetDist) {
        const remaining = targetDist - currentDist;
        const frac = segLen > 0.0001 ? remaining / segLen : 0;
        resampled.push(new THREE.Vector3(
          pA.x + frac * (pB.x - pA.x),
          pA.y + frac * (pB.y - pA.y),
          0
        ));
        break;
      }

      currentDist += segLen;
      segIdx++;
    }
  }

  if (isClosed) {
    resampled.push(resampled[0].clone());
  } else if (resampled.length > 0 && points.length > 0) {
    resampled[resampled.length - 1] = points[points.length - 1].clone();
  }

  return resampled;
}
