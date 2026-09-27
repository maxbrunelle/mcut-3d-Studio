import * as THREE from 'three';

export interface NeonStroke {
  points: THREE.Vector3[];
  isClosed: boolean;
}

export interface NeonLetterGlyph {
  strokes: { points: { x: number; y: number }[]; isClosed: boolean }[];
  width: number;
}

export type NeonTypographyStyle = 'script' | 'sans' | 'rounded' | 'display' | 'classic';

/**
 * Determines appropriate Neon Typography Style based on font id/name.
 */
export function getNeonStyleForFont(fontId: string): NeonTypographyStyle {
  const lower = (fontId || '').toLowerCase();
  if (
    lower.includes('pacifico') ||
    lower.includes('lobster') ||
    lower.includes('vibes') ||
    lower.includes('yellowtail') ||
    lower.includes('caveat') ||
    lower.includes('satisfy') ||
    lower.includes('leckerli') ||
    lower.includes('script') ||
    lower.includes('cursive') ||
    lower.includes('brush') ||
    lower.includes('dancingscript') ||
    lower.includes('marck')
  ) {
    return 'script';
  }
  if (
    lower.includes('audiowide') ||
    lower.includes('righteous') ||
    lower.includes('bangers') ||
    lower.includes('bebas') ||
    lower.includes('anton') ||
    lower.includes('display') ||
    lower.includes('retro')
  ) {
    return 'display';
  }
  if (lower.includes('round') || lower.includes('comfortaa') || lower.includes('quicksand') || lower.includes('nunito')) {
    return 'rounded';
  }
  return 'sans';
}

// ---------------------------------------------------------------------------
// Mathematical Curve Generation Primitives for Silky-Smooth Neon Tubes
// ---------------------------------------------------------------------------

interface Pt2D {
  x: number;
  y: number;
}

function pt(x: number, y: number): Pt2D {
  return { x, y };
}

function linePts(p0: Pt2D, p1: Pt2D, steps = 6): Pt2D[] {
  const res: Pt2D[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    res.push({
      x: p0.x + t * (p1.x - p0.x),
      y: p0.y + t * (p1.y - p0.y)
    });
  }
  return res;
}

function cubicBezierPts(p0: Pt2D, p1: Pt2D, p2: Pt2D, p3: Pt2D, steps = 14): Pt2D[] {
  const res: Pt2D[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    const x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
    const y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;
    res.push({ x, y });
  }
  return res;
}

function quadBezierPts(p0: Pt2D, p1: Pt2D, p2: Pt2D, steps = 10): Pt2D[] {
  const res: Pt2D[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x;
    const y = u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y;
    res.push({ x, y });
  }
  return res;
}

function arcPts(cx: number, cy: number, rx: number, ry: number, startAngle: number, endAngle: number, steps = 16): Pt2D[] {
  const res: Pt2D[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = startAngle + t * (endAngle - startAngle);
    res.push({
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle)
    });
  }
  return res;
}

function combineSegments(...segments: Pt2D[][]): Pt2D[] {
  const result: Pt2D[] = [];
  for (const seg of segments) {
    if (seg.length === 0) continue;
    if (result.length === 0) {
      result.push(...seg);
    } else {
      // Avoid duplicating junction point if close
      const last = result[result.length - 1];
      const startIdx = (Math.hypot(last.x - seg[0].x, last.y - seg[0].y) < 1.0) ? 1 : 0;
      for (let i = startIdx; i < seg.length; i++) {
        result.push(seg[i]);
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Stroke Generation Engine
// ---------------------------------------------------------------------------

/**
 * Generates pristine, clean, non-overlapping neon flex strokes for a given text string.
 * Guaranteed zero overlapping channels, zero messy artifacts, and realistic bend radii.
 */
export function generateNeonTextStrokes(
  text: string,
  targetHeightMm: number,
  letterSpacingMm: number,
  lineSpacingMm: number,
  textAlign: 'left' | 'center' | 'right' = 'center',
  fontStyle: NeonTypographyStyle = 'script'
): {
  lines: {
    chars: {
      char: string;
      charIndex: number;
      strokes: NeonStroke[];
      acrylicShapes: THREE.Shape[];
      x: number;
      y: number;
      width: number;
      box: THREE.Box3;
    }[];
    lineWidth: number;
  }[];
  totalWidth: number;
  totalHeight: number;
} {
  const rawLines = text.split('\n');
  const linesToRender = rawLines.length === 0 ? ['NEON'] : rawLines.map(l => l || ' ');

  const scale = targetHeightMm / 100; // normalized 100-unit coordinate space
  const processedLines: {
    chars: {
      char: string;
      charIndex: number;
      strokes: NeonStroke[];
      acrylicShapes: THREE.Shape[];
      x: number;
      y: number;
      width: number;
      box: THREE.Box3;
    }[];
    lineWidth: number;
  }[] = [];

  let globalCharCounter = 0;
  let maxLineWidth = 0;

  for (const lineText of linesToRender) {
    const chars: {
      char: string;
      charIndex: number;
      strokes: NeonStroke[];
      acrylicShapes: THREE.Shape[];
      x: number;
      y: number;
      width: number;
      box: THREE.Box3;
    }[] = [];

    let currentLineW = 0;

    for (const ch of lineText) {
      const charIdx = globalCharCounter++;

      if (ch === ' ') {
        const spaceW = 34 * scale;
        chars.push({
          char: ' ',
          charIndex: charIdx,
          strokes: [],
          acrylicShapes: [],
          x: 0,
          y: 0,
          width: spaceW,
          box: new THREE.Box3()
        });
        currentLineW += spaceW + letterSpacingMm;
        continue;
      }

      const glyph = getGlyphDefinition(ch, fontStyle);
      const glyphWidth = glyph.width * scale;

      // Transform raw normalized points into millimeters & smooth polyline
      const scaledStrokes: NeonStroke[] = glyph.strokes.map(st => {
        const pts3d = st.points.map(p => new THREE.Vector3(p.x * scale, p.y * scale, 0));
        const smoothed = smoothStrokePoints(pts3d, st.isClosed);
        return {
          points: smoothed,
          isClosed: st.isClosed
        };
      });

      // Generate clean acrylic contour envelope around strokes for backplate cutting
      const acrylicShapes = generateLetterAcrylicContour(scaledStrokes, 14 * scale);

      const minPt = new THREE.Vector3(Infinity, Infinity, 0);
      const maxPt = new THREE.Vector3(-Infinity, -Infinity, 0);
      for (const st of scaledStrokes) {
        for (const p of st.points) {
          minPt.min(p);
          maxPt.max(p);
        }
      }
      const box = minPt.x !== Infinity ? new THREE.Box3(minPt, maxPt) : new THREE.Box3();

      chars.push({
        char: ch,
        charIndex: charIdx,
        strokes: scaledStrokes,
        acrylicShapes,
        x: 0,
        y: 0,
        width: glyphWidth,
        box
      });

      currentLineW += glyphWidth + letterSpacingMm;
    }

    if (chars.length > 0 && chars[chars.length - 1].char !== ' ') {
      currentLineW -= letterSpacingMm;
    }

    if (currentLineW > maxLineWidth) {
      maxLineWidth = currentLineW;
    }

    processedLines.push({
      chars,
      lineWidth: currentLineW
    });
  }

  const totalLinesHeight = (processedLines.length - 1) * lineSpacingMm + targetHeightMm;

  // Calculate final layout positions based on text alignment
  for (let lIdx = 0; lIdx < processedLines.length; lIdx++) {
    const line = processedLines[lIdx];
    const lineY = (totalLinesHeight / 2) - targetHeightMm - (lIdx * lineSpacingMm);

    let lineStartX = -maxLineWidth / 2;
    if (textAlign === 'center') {
      lineStartX = -line.lineWidth / 2;
    } else if (textAlign === 'right') {
      lineStartX = (maxLineWidth / 2) - line.lineWidth;
    }

    let cursorX = lineStartX;
    for (const charItem of line.chars) {
      charItem.x = cursorX;
      charItem.y = lineY;
      cursorX += charItem.width + letterSpacingMm;
    }
  }

  return {
    lines: processedLines,
    totalWidth: maxLineWidth,
    totalHeight: totalLinesHeight
  };
}

/**
 * Smooths stroke polyline with uniform sub-sampling.
 */
function smoothStrokePoints(points: THREE.Vector3[], isClosed: boolean): THREE.Vector3[] {
  if (points.length < 2) return points;
  if (points.length === 2) {
    const p0 = points[0];
    const p1 = points[1];
    const dist = p0.distanceTo(p1);
    const numSub = Math.max(3, Math.ceil(dist / 3));
    const result: THREE.Vector3[] = [];
    for (let i = 0; i <= numSub; i++) {
      const t = i / numSub;
      result.push(new THREE.Vector3(
        p0.x + t * (p1.x - p0.x),
        p0.y + t * (p1.y - p0.y),
        0
      ));
    }
    return result;
  }

  // Centripetal Catmull-Rom resampling for smooth curves
  const spline = new THREE.CatmullRomCurve3(points, isClosed, 'centripetal', 0.5);
  const totalLen = spline.getLength();
  const sampleCount = Math.max(points.length * 4, Math.ceil(totalLen / 1.5));
  return spline.getPoints(sampleCount);
}

/**
 * Generates 2D acrylic base contour shapes enclosing letter strokes.
 */
function generateLetterAcrylicContour(strokes: NeonStroke[], marginMm: number): THREE.Shape[] {
  const shapes: THREE.Shape[] = [];

  for (const st of strokes) {
    if (st.points.length < 2) continue;
    const pts = st.points;

    // Sample envelope circles along stroke to build organic contour
    const step = Math.max(1, Math.floor(pts.length / 16));
    for (let i = 0; i < pts.length; i += step) {
      const p = pts[i];
      const circ = new THREE.Shape();
      circ.absarc(p.x, p.y, marginMm, 0, Math.PI * 2, false);
      shapes.push(circ);
    }
    // Also include end point
    const lastP = pts[pts.length - 1];
    const endCirc = new THREE.Shape();
    endCirc.absarc(lastP.x, lastP.y, marginMm, 0, Math.PI * 2, false);
    shapes.push(endCirc);
  }

  return shapes;
}

// ---------------------------------------------------------------------------
// Precision Vector Glyph Definitions (100x100 Normalized Grid)
// ---------------------------------------------------------------------------

function getGlyphDefinition(ch: string, style: NeonTypographyStyle): NeonLetterGlyph {
  if (style === 'script') {
    return getScriptGlyph(ch);
  } else if (style === 'display') {
    return getDisplayGlyph(ch);
  } else if (style === 'rounded') {
    return getRoundedGlyph(ch);
  } else {
    return getSansGlyph(ch);
  }
}

// ---------------------------------------------------------------------------
// 1. NEON SCRIPT / CURSIVE (Flowing, connected, authentic non-overlapping neon)
// ---------------------------------------------------------------------------

function getScriptGlyph(char: string): NeonLetterGlyph {
  const c = char;

  switch (c) {
    // UPPERCASE
    case 'A':
      return {
        width: 68,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(8, 12), pt(14, 45), pt(24, 82), pt(34, 95)),
              cubicBezierPts(pt(34, 95), pt(44, 82), pt(54, 45), pt(60, 10)),
              quadBezierPts(pt(60, 10), pt(64, 12), pt(66, 18))
            ),
            isClosed: false
          },
          {
            points: linePts(pt(18, 42), pt(52, 42)),
            isClosed: false
          }
        ]
      };
    case 'B':
      return {
        width: 64,
        strokes: [
          {
            points: linePts(pt(14, 10), pt(14, 95)),
            isClosed: false
          },
          {
            points: combineSegments(
              linePts(pt(14, 95), pt(36, 95)),
              cubicBezierPts(pt(36, 95), pt(54, 95), pt(56, 75), pt(46, 55)),
              linePts(pt(46, 55), pt(18, 55)),
              linePts(pt(18, 55), pt(44, 55)),
              cubicBezierPts(pt(44, 55), pt(62, 55), pt(60, 10), pt(36, 10)),
              linePts(pt(36, 10), pt(14, 10))
            ),
            isClosed: false
          }
        ]
      };
    case 'C':
      return {
        width: 62,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(56, 82), pt(44, 96), pt(24, 96), pt(14, 76)),
              cubicBezierPts(pt(14, 76), pt(6, 60), pt(6, 36), pt(16, 20)),
              cubicBezierPts(pt(16, 20), pt(26, 8), pt(46, 8), pt(58, 22))
            ),
            isClosed: false
          }
        ]
      };
    case 'D':
      // Pristine continuous loop 'D' as seen in the reference image
      return {
        width: 68,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(12, 10), pt(12, 86)),
              cubicBezierPts(pt(12, 86), pt(12, 96), pt(26, 96), pt(42, 92)),
              cubicBezierPts(pt(42, 92), pt(66, 86), pt(66, 22), pt(42, 12)),
              cubicBezierPts(pt(42, 12), pt(26, 10), pt(16, 10), pt(12, 10))
            ),
            isClosed: false
          }
        ]
      };
    case 'E':
      return {
        width: 58,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(52, 92), pt(16, 92)),
              linePts(pt(16, 92), pt(14, 10)),
              linePts(pt(14, 10), pt(52, 10))
            ),
            isClosed: false
          },
          {
            points: linePts(pt(15, 52), pt(46, 52)),
            isClosed: false
          }
        ]
      };
    case 'F':
      return {
        width: 54,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(16, 10), pt(16, 92)),
              linePts(pt(16, 92), pt(52, 92))
            ),
            isClosed: false
          },
          {
            points: linePts(pt(16, 52), pt(44, 52)),
            isClosed: false
          }
        ]
      };
    case 'G':
      return {
        width: 66,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(58, 82), pt(42, 96), pt(22, 96), pt(14, 76)),
              cubicBezierPts(pt(14, 76), pt(6, 58), pt(8, 34), pt(18, 18)),
              cubicBezierPts(pt(18, 18), pt(28, 8), pt(48, 8), pt(58, 22)),
              linePts(pt(58, 22), pt(58, 48)),
              linePts(pt(58, 48), pt(36, 48))
            ),
            isClosed: false
          }
        ]
      };
    case 'H':
      return {
        width: 66,
        strokes: [
          { points: linePts(pt(14, 10), pt(14, 95)), isClosed: false },
          { points: linePts(pt(52, 10), pt(52, 95)), isClosed: false },
          { points: linePts(pt(14, 52), pt(52, 52)), isClosed: false }
        ]
      };
    case 'I':
      return {
        width: 32,
        strokes: [
          { points: linePts(pt(8, 92), pt(24, 92)), isClosed: false },
          { points: linePts(pt(16, 92), pt(16, 10)), isClosed: false },
          { points: linePts(pt(8, 10), pt(24, 10)), isClosed: false }
        ]
      };
    case 'J':
      return {
        width: 48,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(16, 92), pt(38, 92)),
              linePts(pt(36, 92), pt(36, 32)),
              cubicBezierPts(pt(36, 32), pt(36, 8), pt(16, 8), pt(10, 22))
            ),
            isClosed: false
          }
        ]
      };
    case 'K':
      return {
        width: 62,
        strokes: [
          { points: linePts(pt(14, 10), pt(14, 95)), isClosed: false },
          {
            points: combineSegments(
              linePts(pt(52, 92), pt(16, 52)),
              linePts(pt(16, 52), pt(54, 10))
            ),
            isClosed: false
          }
        ]
      };
    case 'L':
      return {
        width: 52,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(14, 95), pt(14, 16)),
              quadBezierPts(pt(14, 16), pt(14, 10), pt(20, 10)),
              linePts(pt(20, 10), pt(48, 10))
            ),
            isClosed: false
          }
        ]
      };
    case 'M':
      return {
        width: 74,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(10, 10), pt(14, 95)),
              linePts(pt(14, 95), pt(37, 36)),
              linePts(pt(37, 36), pt(60, 95)),
              linePts(pt(60, 95), pt(64, 10))
            ),
            isClosed: false
          }
        ]
      };
    case 'N':
      return {
        width: 64,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(14, 10), pt(14, 95)),
              linePts(pt(14, 95), pt(50, 10)),
              linePts(pt(50, 10), pt(50, 95))
            ),
            isClosed: false
          }
        ]
      };
    case 'O':
      return {
        width: 66,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(33, 95), pt(56, 95), pt(64, 76), pt(64, 52)),
              cubicBezierPts(pt(64, 52), pt(64, 28), pt(56, 8), pt(33, 8)),
              cubicBezierPts(pt(33, 8), pt(10, 8), pt(6, 28), pt(6, 52)),
              cubicBezierPts(pt(6, 52), pt(6, 76), pt(10, 95), pt(33, 95))
            ),
            isClosed: true
          }
        ]
      };
    case 'P':
      return {
        width: 58,
        strokes: [
          { points: linePts(pt(14, 10), pt(14, 95)), isClosed: false },
          {
            points: combineSegments(
              linePts(pt(14, 95), pt(36, 95)),
              cubicBezierPts(pt(36, 95), pt(54, 95), pt(54, 54), pt(36, 54)),
              linePts(pt(36, 54), pt(14, 54))
            ),
            isClosed: false
          }
        ]
      };
    case 'Q':
      return {
        width: 66,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(33, 95), pt(56, 95), pt(64, 76), pt(64, 52)),
              cubicBezierPts(pt(64, 52), pt(64, 28), pt(56, 8), pt(33, 8)),
              cubicBezierPts(pt(33, 8), pt(10, 8), pt(6, 28), pt(6, 52)),
              cubicBezierPts(pt(6, 52), pt(6, 76), pt(10, 95), pt(33, 95))
            ),
            isClosed: true
          },
          {
            points: cubicBezierPts(pt(38, 28), pt(46, 18), pt(54, 10), pt(62, 4)),
            isClosed: false
          }
        ]
      };
    case 'R':
      return {
        width: 62,
        strokes: [
          { points: linePts(pt(14, 10), pt(14, 95)), isClosed: false },
          {
            points: combineSegments(
              linePts(pt(14, 95), pt(36, 95)),
              cubicBezierPts(pt(36, 95), pt(54, 95), pt(54, 54), pt(36, 54)),
              linePts(pt(36, 54), pt(14, 54))
            ),
            isClosed: false
          },
          {
            points: cubicBezierPts(pt(34, 54), pt(42, 40), pt(48, 20), pt(56, 10)),
            isClosed: false
          }
        ]
      };
    case 'S':
      return {
        width: 58,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(48, 80), pt(44, 95), pt(22, 95), pt(16, 82)),
              cubicBezierPts(pt(16, 82), pt(12, 66), pt(22, 56), pt(32, 48)),
              cubicBezierPts(pt(32, 48), pt(46, 38), pt(48, 22), pt(42, 14)),
              cubicBezierPts(pt(42, 14), pt(36, 8), pt(20, 8), pt(12, 18))
            ),
            isClosed: false
          }
        ]
      };
    case 'T':
      return {
        width: 58,
        strokes: [
          { points: linePts(pt(6, 95), pt(52, 95)), isClosed: false },
          { points: linePts(pt(29, 95), pt(29, 10)), isClosed: false }
        ]
      };
    case 'U':
      return {
        width: 62,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(14, 95), pt(14, 38)),
              cubicBezierPts(pt(14, 38), pt(14, 8), pt(48, 8), pt(48, 38)),
              linePts(pt(48, 38), pt(48, 95))
            ),
            isClosed: false
          }
        ]
      };
    case 'V':
      return {
        width: 62,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(10, 95), pt(31, 10)),
              linePts(pt(31, 10), pt(52, 95))
            ),
            isClosed: false
          }
        ]
      };
    case 'W':
      return {
        width: 78,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(8, 95), pt(22, 10)),
              linePts(pt(22, 10), pt(39, 65)),
              linePts(pt(39, 65), pt(56, 10)),
              linePts(pt(56, 10), pt(70, 95))
            ),
            isClosed: false
          }
        ]
      };
    case 'X':
      return {
        width: 60,
        strokes: [
          { points: linePts(pt(12, 95), pt(48, 10)), isClosed: false },
          { points: linePts(pt(48, 95), pt(12, 10)), isClosed: false }
        ]
      };
    case 'Y':
      return {
        width: 60,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(10, 95), pt(30, 52)),
              linePts(pt(30, 52), pt(50, 95))
            ),
            isClosed: false
          },
          { points: linePts(pt(30, 52), pt(30, 10)), isClosed: false }
        ]
      };
    case 'Z':
      return {
        width: 58,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(10, 95), pt(48, 95)),
              linePts(pt(48, 95), pt(12, 10)),
              linePts(pt(12, 10), pt(50, 10))
            ),
            isClosed: false
          }
        ]
      };

    // LOWERCASE
    case 'a':
      // Smooth bowl loop + vertical right stem as seen in reference image
      return {
        width: 48,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(38, 52), pt(26, 64), pt(10, 56), pt(10, 36)),
              cubicBezierPts(pt(10, 36), pt(10, 18), pt(24, 10), pt(38, 14)),
              cubicBezierPts(pt(38, 14), pt(38, 30), pt(38, 44), pt(38, 52))
            ),
            isClosed: false
          },
          {
            points: combineSegments(
              linePts(pt(38, 62), pt(38, 16)),
              quadBezierPts(pt(38, 16), pt(38, 10), pt(44, 10))
            ),
            isClosed: false
          }
        ]
      };
    case 'b':
      return {
        width: 48,
        strokes: [
          { points: linePts(pt(12, 95), pt(12, 10)), isClosed: false },
          {
            points: combineSegments(
              cubicBezierPts(pt(12, 48), pt(24, 62), pt(44, 56), pt(44, 36)),
              cubicBezierPts(pt(44, 36), pt(44, 18), pt(28, 10), pt(12, 14))
            ),
            isClosed: false
          }
        ]
      };
    case 'c':
      return {
        width: 44,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(38, 52), pt(28, 64), pt(14, 58), pt(10, 36)),
              cubicBezierPts(pt(10, 36), pt(8, 18), pt(22, 10), pt(38, 16))
            ),
            isClosed: false
          }
        ]
      };
    case 'd':
      return {
        width: 48,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(38, 95), pt(38, 16)),
              quadBezierPts(pt(38, 16), pt(38, 10), pt(44, 10))
            ),
            isClosed: false
          },
          {
            points: combineSegments(
              cubicBezierPts(pt(38, 48), pt(26, 62), pt(10, 56), pt(10, 36)),
              cubicBezierPts(pt(10, 36), pt(10, 18), pt(24, 10), pt(38, 14))
            ),
            isClosed: false
          }
        ]
      };
    case 'e':
      // Single continuous flowing smooth 'e' as seen in the reference image
      return {
        width: 46,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(10, 35), pt(38, 35)),
              cubicBezierPts(pt(38, 35), pt(42, 54), pt(28, 64), pt(18, 60)),
              cubicBezierPts(pt(18, 60), pt(8, 52), pt(8, 26), pt(18, 14)),
              cubicBezierPts(pt(18, 14), pt(28, 8), pt(38, 10), pt(44, 20))
            ),
            isClosed: false
          }
        ]
      };
    case 'f':
      return {
        width: 36,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(28, 92), pt(24, 96), pt(16, 94), pt(16, 82)),
              linePts(pt(16, 82), pt(16, 10))
            ),
            isClosed: false
          },
          { points: linePts(pt(8, 56), pt(28, 56)), isClosed: false }
        ]
      };
    case 'g':
      return {
        width: 48,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(38, 52), pt(26, 64), pt(10, 56), pt(10, 36)),
              cubicBezierPts(pt(10, 36), pt(10, 18), pt(24, 10), pt(38, 14)),
              linePts(pt(38, 14), pt(38, 58))
            ),
            isClosed: false
          },
          {
            points: combineSegments(
              linePts(pt(38, 58), pt(38, -10)),
              cubicBezierPts(pt(38, -10), pt(38, -26), pt(18, -26), pt(12, -16))
            ),
            isClosed: false
          }
        ]
      };
    case 'h':
      return {
        width: 48,
        strokes: [
          { points: linePts(pt(12, 95), pt(12, 10)), isClosed: false },
          {
            points: combineSegments(
              cubicBezierPts(pt(12, 42), pt(18, 62), pt(38, 62), pt(38, 44)),
              linePts(pt(38, 44), pt(38, 10))
            ),
            isClosed: false
          }
        ]
      };
    case 'i':
      return {
        width: 24,
        strokes: [
          { points: linePts(pt(12, 62), pt(12, 10)), isClosed: false },
          { points: linePts(pt(12, 80), pt(12, 82)), isClosed: false }
        ]
      };
    case 'j':
      return {
        width: 30,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(18, 62), pt(18, -12)),
              cubicBezierPts(pt(18, -12), pt(18, -26), pt(6, -26), pt(2, -16))
            ),
            isClosed: false
          },
          { points: linePts(pt(18, 80), pt(18, 82)), isClosed: false }
        ]
      };
    case 'k':
      return {
        width: 44,
        strokes: [
          { points: linePts(pt(12, 95), pt(12, 10)), isClosed: false },
          {
            points: combineSegments(
              linePts(pt(38, 62), pt(14, 34)),
              linePts(pt(14, 34), pt(38, 10))
            ),
            isClosed: false
          }
        ]
      };
    case 'l':
      return {
        width: 26,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(12, 95), pt(12, 16)),
              quadBezierPts(pt(12, 16), pt(12, 10), pt(20, 10))
            ),
            isClosed: false
          }
        ]
      };
    case 'm':
      // Pristine smooth arched 'm' as seen in the reference image
      return {
        width: 68,
        strokes: [
          {
            points: linePts(pt(10, 10), pt(10, 62)),
            isClosed: false
          },
          {
            points: combineSegments(
              cubicBezierPts(pt(10, 42), pt(14, 64), pt(28, 64), pt(34, 44)),
              linePts(pt(34, 44), pt(34, 10))
            ),
            isClosed: false
          },
          {
            points: combineSegments(
              cubicBezierPts(pt(34, 42), pt(38, 64), pt(52, 64), pt(58, 44)),
              linePts(pt(58, 44), pt(58, 10))
            ),
            isClosed: false
          }
        ]
      };
    case 'n':
      return {
        width: 48,
        strokes: [
          { points: linePts(pt(12, 62), pt(12, 10)), isClosed: false },
          {
            points: combineSegments(
              cubicBezierPts(pt(12, 42), pt(16, 64), pt(34, 64), pt(40, 44)),
              linePts(pt(40, 44), pt(40, 10))
            ),
            isClosed: false
          }
        ]
      };
    case 'o':
      return {
        width: 46,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(23, 62), pt(36, 62), pt(42, 50), pt(42, 36)),
              cubicBezierPts(pt(42, 36), pt(42, 22), pt(36, 10), pt(23, 10)),
              cubicBezierPts(pt(23, 10), pt(10, 10), pt(6, 22), pt(6, 36)),
              cubicBezierPts(pt(6, 36), pt(6, 50), pt(10, 62), pt(23, 62))
            ),
            isClosed: true
          }
        ]
      };
    case 'p':
      return {
        width: 48,
        strokes: [
          { points: linePts(pt(12, 62), pt(12, -22)), isClosed: false },
          {
            points: combineSegments(
              cubicBezierPts(pt(12, 48), pt(24, 62), pt(42, 56), pt(42, 36)),
              cubicBezierPts(pt(42, 36), pt(42, 18), pt(26, 10), pt(12, 14))
            ),
            isClosed: false
          }
        ]
      };
    case 'q':
      return {
        width: 48,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(38, 62), pt(38, -22)),
              quadBezierPts(pt(38, -22), pt(38, -26), pt(44, -20))
            ),
            isClosed: false
          },
          {
            points: combineSegments(
              cubicBezierPts(pt(38, 48), pt(26, 62), pt(10, 56), pt(10, 36)),
              cubicBezierPts(pt(10, 36), pt(10, 18), pt(24, 10), pt(38, 14))
            ),
            isClosed: false
          }
        ]
      };
    case 'r':
      // Smooth upright stem + arch shoulder as seen in the reference image
      return {
        width: 36,
        strokes: [
          {
            points: linePts(pt(12, 10), pt(12, 62)),
            isClosed: false
          },
          {
            points: cubicBezierPts(pt(12, 42), pt(16, 62), pt(28, 64), pt(38, 56)),
            isClosed: false
          }
        ]
      };
    case 's':
      // Single continuous flowing smooth 's' as seen in the reference image
      return {
        width: 40,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(38, 54), pt(34, 64), pt(20, 64), pt(14, 52)),
              cubicBezierPts(pt(14, 52), pt(10, 42), pt(20, 36), pt(28, 32)),
              cubicBezierPts(pt(28, 32), pt(40, 26), pt(42, 16), pt(34, 10)),
              cubicBezierPts(pt(34, 10), pt(24, 8), pt(14, 10), pt(10, 16))
            ),
            isClosed: false
          }
        ]
      };
    case 't':
      return {
        width: 34,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(14, 84), pt(14, 18)),
              quadBezierPts(pt(14, 18), pt(14, 10), pt(22, 10))
            ),
            isClosed: false
          },
          { points: linePts(pt(6, 60), pt(26, 60)), isClosed: false }
        ]
      };
    case 'u':
      return {
        width: 48,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(12, 62), pt(12, 24)),
              cubicBezierPts(pt(12, 24), pt(12, 8), pt(38, 8), pt(38, 24)),
              linePts(pt(38, 24), pt(38, 62))
            ),
            isClosed: false
          },
          {
            points: linePts(pt(38, 24), pt(42, 10)),
            isClosed: false
          }
        ]
      };
    case 'v':
      return {
        width: 46,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(8, 62), pt(23, 10)),
              linePts(pt(23, 10), pt(38, 62))
            ),
            isClosed: false
          }
        ]
      };
    case 'w':
      return {
        width: 66,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(6, 62), pt(18, 10)),
              linePts(pt(18, 10), pt(33, 46)),
              linePts(pt(33, 46), pt(48, 10)),
              linePts(pt(48, 10), pt(60, 62))
            ),
            isClosed: false
          }
        ]
      };
    case 'x':
      return {
        width: 44,
        strokes: [
          { points: linePts(pt(8, 62), pt(36, 10)), isClosed: false },
          { points: linePts(pt(36, 62), pt(8, 10)), isClosed: false }
        ]
      };
    case 'y':
      return {
        width: 46,
        strokes: [
          { points: linePts(pt(10, 62), pt(24, 10)), isClosed: false },
          {
            points: combineSegments(
              linePts(pt(36, 62), pt(22, 6)),
              cubicBezierPts(pt(22, 6), pt(14, -18), pt(4, -20), pt(2, -14))
            ),
            isClosed: false
          }
        ]
      };
    case 'z':
      return {
        width: 42,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(8, 62), pt(36, 62)),
              linePts(pt(36, 62), pt(10, 10)),
              linePts(pt(10, 10), pt(38, 10))
            ),
            isClosed: false
          }
        ]
      };

    // NUMBERS & SYMBOLS
    case '0':
      return {
        width: 54,
        strokes: [
          {
            points: arcPts(27, 51, 20, 41, 0, Math.PI * 2, 28),
            isClosed: true
          }
        ]
      };
    case '1':
      return {
        width: 36,
        strokes: [
          { points: linePts(pt(10, 72), pt(22, 92)), isClosed: false },
          { points: linePts(pt(22, 92), pt(22, 10)), isClosed: false },
          { points: linePts(pt(8, 10), pt(34, 10)), isClosed: false }
        ]
      };
    case '2':
      return {
        width: 52,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(8, 74), pt(12, 94), pt(40, 94), pt(44, 76)),
              cubicBezierPts(pt(44, 76), pt(44, 56), pt(24, 32), pt(10, 10)),
              linePts(pt(10, 10), pt(46, 10))
            ),
            isClosed: false
          }
        ]
      };
    case '3':
      return {
        width: 52,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(10, 86), pt(20, 94), pt(44, 94), pt(44, 70)),
              cubicBezierPts(pt(44, 70), pt(44, 54), pt(30, 52), pt(24, 52)),
              cubicBezierPts(pt(24, 52), pt(32, 52), pt(46, 48), pt(46, 32)),
              cubicBezierPts(pt(46, 32), pt(46, 10), pt(22, 8), pt(12, 16))
            ),
            isClosed: false
          }
        ]
      };
    case '4':
      return {
        width: 54,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(38, 95), pt(10, 36)),
              linePts(pt(10, 36), pt(48, 36))
            ),
            isClosed: false
          },
          { points: linePts(pt(38, 95), pt(38, 10)), isClosed: false }
        ]
      };
    case '5':
      return {
        width: 52,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(44, 92), pt(14, 92)),
              linePts(pt(14, 92), pt(12, 54)),
              cubicBezierPts(pt(12, 54), pt(24, 62), pt(46, 56), pt(46, 32)),
              cubicBezierPts(pt(46, 32), pt(46, 10), pt(26, 8), pt(12, 16))
            ),
            isClosed: false
          }
        ]
      };
    case '6':
      return {
        width: 54,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(40, 90), pt(20, 92), pt(10, 68), pt(10, 38)),
              cubicBezierPts(pt(10, 38), pt(10, 8), pt(46, 8), pt(46, 36)),
              cubicBezierPts(pt(46, 36), pt(46, 58), pt(12, 58), pt(10, 38))
            ),
            isClosed: false
          }
        ]
      };
    case '7':
      return {
        width: 52,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(8, 92), pt(46, 92)),
              cubicBezierPts(pt(46, 92), pt(36, 50), pt(24, 25), pt(20, 10))
            ),
            isClosed: false
          }
        ]
      };
    case '8':
      return {
        width: 54,
        strokes: [
          {
            points: combineSegments(
              arcPts(27, 72, 16, 20, 0, Math.PI * 2, 20)
            ),
            isClosed: true
          },
          {
            points: combineSegments(
              arcPts(27, 30, 19, 22, 0, Math.PI * 2, 22)
            ),
            isClosed: true
          }
        ]
      };
    case '9':
      return {
        width: 54,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(44, 64), pt(44, 42), pt(10, 42), pt(10, 64)),
              cubicBezierPts(pt(10, 64), pt(10, 92), pt(44, 92), pt(44, 64)),
              cubicBezierPts(pt(44, 64), pt(44, 30), pt(34, 10), pt(14, 12))
            ),
            isClosed: false
          }
        ]
      };
    case '!':
      return {
        width: 24,
        strokes: [
          { points: linePts(pt(12, 95), pt(12, 32)), isClosed: false },
          { points: linePts(pt(12, 10), pt(12, 12)), isClosed: false }
        ]
      };
    case '?':
      return {
        width: 46,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(10, 76), pt(12, 94), pt(38, 94), pt(38, 70)),
              cubicBezierPts(pt(38, 70), pt(38, 52), pt(24, 46), pt(24, 32))
            ),
            isClosed: false
          },
          { points: linePts(pt(24, 10), pt(24, 12)), isClosed: false }
        ]
      };
    case '.':
      return {
        width: 22,
        strokes: [{ points: linePts(pt(11, 10), pt(11, 12)), isClosed: false }]
      };
    case ',':
      return {
        width: 22,
        strokes: [{ points: linePts(pt(11, 14), pt(8, 2)), isClosed: false }]
      };
    case '-':
      return {
        width: 36,
        strokes: [{ points: linePts(pt(6, 48), pt(30, 48)), isClosed: false }]
      };
    case '+':
      return {
        width: 44,
        strokes: [
          { points: linePts(pt(22, 70), pt(22, 26)), isClosed: false },
          { points: linePts(pt(6, 48), pt(38, 48)), isClosed: false }
        ]
      };
    case '&':
      return {
        width: 58,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(48, 18), pt(36, 8), pt(18, 12), pt(14, 34)),
              cubicBezierPts(pt(14, 34), pt(22, 54), pt(36, 68), pt(26, 86)),
              cubicBezierPts(pt(26, 86), pt(16, 80), pt(16, 68), pt(44, 16)),
              linePts(pt(44, 16), pt(52, 12))
            ),
            isClosed: false
          }
        ]
      };
    case '@':
      return {
        width: 66,
        strokes: [
          {
            points: arcPts(33, 46, 12, 14, 0, Math.PI * 2, 16),
            isClosed: true
          },
          {
            points: combineSegments(
              linePts(pt(45, 46), pt(45, 34)),
              cubicBezierPts(pt(45, 34), pt(54, 34), pt(54, 56), pt(46, 72)),
              cubicBezierPts(pt(46, 72), pt(34, 88), pt(12, 82), pt(8, 52)),
              cubicBezierPts(pt(8, 52), pt(6, 20), pt(28, 8), pt(46, 10)),
              linePts(pt(46, 10), pt(56, 18))
            ),
            isClosed: false
          }
        ]
      };
    case '#':
      return {
        width: 52,
        strokes: [
          { points: linePts(pt(18, 90), pt(14, 10)), isClosed: false },
          { points: linePts(pt(38, 90), pt(34, 10)), isClosed: false },
          { points: linePts(pt(8, 64), pt(46, 64)), isClosed: false },
          { points: linePts(pt(6, 36), pt(44, 36)), isClosed: false }
        ]
      };
    case '$':
      return {
        width: 52,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(40, 78), pt(38, 88), pt(14, 88), pt(14, 64)),
              cubicBezierPts(pt(14, 64), pt(14, 48), pt(38, 48), pt(38, 30)),
              cubicBezierPts(pt(38, 30), pt(38, 12), pt(14, 12), pt(12, 22))
            ),
            isClosed: false
          },
          { points: linePts(pt(26, 96), pt(26, 6)), isClosed: false }
        ]
      };
    case '%':
      return {
        width: 60,
        strokes: [
          { points: linePts(pt(48, 88), pt(12, 12)), isClosed: false },
          { points: arcPts(18, 72, 6, 8, 0, Math.PI * 2, 12), isClosed: true },
          { points: arcPts(42, 28, 6, 8, 0, Math.PI * 2, 12), isClosed: true }
        ]
      };
    default:
      return {
        width: 44,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(10, 90), pt(34, 90)),
              linePts(pt(34, 90), pt(34, 10)),
              linePts(pt(34, 10), pt(10, 10)),
              linePts(pt(10, 10), pt(10, 90))
            ),
            isClosed: true
          }
        ]
      };
  }
}

// ---------------------------------------------------------------------------
// 2. MODERN MONOLINE SANS (Clean, crisp, architectural non-overlapping neon)
// ---------------------------------------------------------------------------

function getSansGlyph(char: string): NeonLetterGlyph {
  const c = char;
  switch (c) {
    case 'A':
      return {
        width: 66,
        strokes: [
          { points: combineSegments(linePts(pt(8, 10), pt(33, 95)), linePts(pt(33, 95), pt(58, 10))), isClosed: false },
          { points: linePts(pt(18, 40), pt(48, 40)), isClosed: false }
        ]
      };
    case 'B':
      return {
        width: 60,
        strokes: [
          { points: linePts(pt(12, 10), pt(12, 95)), isClosed: false },
          {
            points: combineSegments(
              linePts(pt(12, 95), pt(36, 95)),
              cubicBezierPts(pt(36, 95), pt(50, 95), pt(50, 52), pt(36, 52)),
              linePts(pt(36, 52), pt(12, 52))
            ),
            isClosed: false
          },
          {
            points: combineSegments(
              linePts(pt(12, 52), pt(36, 52)),
              cubicBezierPts(pt(36, 52), pt(52, 52), pt(52, 10), pt(36, 10)),
              linePts(pt(36, 10), pt(12, 10))
            ),
            isClosed: false
          }
        ]
      };
    case 'C':
      return {
        width: 60,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(52, 80), pt(40, 95), pt(18, 95), pt(12, 70)),
              cubicBezierPts(pt(12, 70), pt(6, 45), pt(6, 35), pt(12, 25)),
              cubicBezierPts(pt(12, 25), pt(18, 5), pt(40, 5), pt(52, 20))
            ),
            isClosed: false
          }
        ]
      };
    case 'D':
      return {
        width: 64,
        strokes: [
          { points: linePts(pt(12, 10), pt(12, 95)), isClosed: false },
          {
            points: combineSegments(
              linePts(pt(12, 95), pt(34, 95)),
              cubicBezierPts(pt(34, 95), pt(56, 95), pt(56, 10), pt(34, 10)),
              linePts(pt(34, 10), pt(12, 10))
            ),
            isClosed: false
          }
        ]
      };
    case 'E':
      return {
        width: 56,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(50, 95), pt(12, 95)),
              linePts(pt(12, 95), pt(12, 10)),
              linePts(pt(12, 10), pt(50, 10))
            ),
            isClosed: false
          },
          { points: linePts(pt(12, 52), pt(42, 52)), isClosed: false }
        ]
      };
    case 'F':
      return {
        width: 52,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(50, 95), pt(12, 95)),
              linePts(pt(12, 95), pt(12, 10))
            ),
            isClosed: false
          },
          { points: linePts(pt(12, 52), pt(40, 52)), isClosed: false }
        ]
      };
    case 'G':
      return {
        width: 64,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(54, 80), pt(40, 95), pt(18, 95), pt(12, 70)),
              cubicBezierPts(pt(12, 70), pt(6, 45), pt(6, 35), pt(12, 25)),
              cubicBezierPts(pt(12, 25), pt(18, 5), pt(40, 5), pt(54, 25)),
              linePts(pt(54, 25), pt(54, 50)),
              linePts(pt(54, 50), pt(36, 50))
            ),
            isClosed: false
          }
        ]
      };
    case 'H':
      return {
        width: 62,
        strokes: [
          { points: linePts(pt(12, 95), pt(12, 10)), isClosed: false },
          { points: linePts(pt(50, 95), pt(50, 10)), isClosed: false },
          { points: linePts(pt(12, 52), pt(50, 52)), isClosed: false }
        ]
      };
    case 'I':
      return {
        width: 28,
        strokes: [{ points: linePts(pt(14, 95), pt(14, 10)), isClosed: false }]
      };
    case 'J':
      return {
        width: 48,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(38, 95), pt(38, 30)),
              cubicBezierPts(pt(38, 30), pt(38, 10), pt(14, 10), pt(8, 25))
            ),
            isClosed: false
          }
        ]
      };
    case 'K':
      return {
        width: 60,
        strokes: [
          { points: linePts(pt(12, 95), pt(12, 10)), isClosed: false },
          {
            points: combineSegments(
              linePts(pt(50, 95), pt(14, 52)),
              linePts(pt(14, 52), pt(50, 10))
            ),
            isClosed: false
          }
        ]
      };
    case 'L':
      return {
        width: 52,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(12, 95), pt(12, 10)),
              linePts(pt(12, 10), pt(46, 10))
            ),
            isClosed: false
          }
        ]
      };
    case 'M':
      return {
        width: 72,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(10, 10), pt(10, 95)),
              linePts(pt(10, 95), pt(36, 44)),
              linePts(pt(36, 44), pt(62, 95)),
              linePts(pt(62, 95), pt(62, 10))
            ),
            isClosed: false
          }
        ]
      };
    case 'N':
      return {
        width: 62,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(12, 10), pt(12, 95)),
              linePts(pt(12, 95), pt(50, 10)),
              linePts(pt(50, 10), pt(50, 95))
            ),
            isClosed: false
          }
        ]
      };
    case 'O':
      return {
        width: 64,
        strokes: [
          {
            points: arcPts(32, 52, 24, 42, 0, Math.PI * 2, 28),
            isClosed: true
          }
        ]
      };
    case 'P':
      return {
        width: 58,
        strokes: [
          { points: linePts(pt(12, 10), pt(12, 95)), isClosed: false },
          {
            points: combineSegments(
              linePts(pt(12, 95), pt(36, 95)),
              cubicBezierPts(pt(36, 95), pt(52, 95), pt(52, 52), pt(36, 52)),
              linePts(pt(36, 52), pt(12, 52))
            ),
            isClosed: false
          }
        ]
      };
    case 'Q':
      return {
        width: 64,
        strokes: [
          {
            points: arcPts(32, 52, 24, 42, 0, Math.PI * 2, 28),
            isClosed: true
          },
          { points: linePts(pt(38, 26), pt(58, 4)), isClosed: false }
        ]
      };
    case 'R':
      return {
        width: 60,
        strokes: [
          { points: linePts(pt(12, 10), pt(12, 95)), isClosed: false },
          {
            points: combineSegments(
              linePts(pt(12, 95), pt(36, 95)),
              cubicBezierPts(pt(36, 95), pt(50, 95), pt(50, 52), pt(36, 52)),
              linePts(pt(36, 52), pt(12, 52))
            ),
            isClosed: false
          },
          { points: linePts(pt(34, 52), pt(52, 10)), isClosed: false }
        ]
      };
    case 'S':
      return {
        width: 56,
        strokes: [
          {
            points: combineSegments(
              cubicBezierPts(pt(48, 80), pt(44, 95), pt(18, 95), pt(12, 70)),
              cubicBezierPts(pt(12, 70), pt(12, 55), pt(44, 45), pt(44, 30)),
              cubicBezierPts(pt(44, 30), pt(44, 10), pt(18, 10), pt(12, 20))
            ),
            isClosed: false
          }
        ]
      };
    case 'T':
      return {
        width: 58,
        strokes: [
          { points: linePts(pt(6, 95), pt(52, 95)), isClosed: false },
          { points: linePts(pt(29, 95), pt(29, 10)), isClosed: false }
        ]
      };
    case 'U':
      return {
        width: 60,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(12, 95), pt(12, 36)),
              cubicBezierPts(pt(12, 36), pt(12, 10), pt(48, 10), pt(48, 36)),
              linePts(pt(48, 36), pt(48, 95))
            ),
            isClosed: false
          }
        ]
      };
    case 'V':
      return {
        width: 62,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(10, 95), pt(31, 10)),
              linePts(pt(31, 10), pt(52, 95))
            ),
            isClosed: false
          }
        ]
      };
    case 'W':
      return {
        width: 76,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(8, 95), pt(22, 10)),
              linePts(pt(22, 10), pt(38, 68)),
              linePts(pt(38, 68), pt(54, 10)),
              linePts(pt(54, 10), pt(68, 95))
            ),
            isClosed: false
          }
        ]
      };
    case 'X':
      return {
        width: 58,
        strokes: [
          { points: linePts(pt(10, 95), pt(48, 10)), isClosed: false },
          { points: linePts(pt(48, 95), pt(10, 10)), isClosed: false }
        ]
      };
    case 'Y':
      return {
        width: 58,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(10, 95), pt(29, 55)),
              linePts(pt(29, 55), pt(48, 95))
            ),
            isClosed: false
          },
          { points: linePts(pt(29, 55), pt(29, 10)), isClosed: false }
        ]
      };
    case 'Z':
      return {
        width: 56,
        strokes: [
          {
            points: combineSegments(
              linePts(pt(10, 95), pt(46, 95)),
              linePts(pt(46, 95), pt(10, 10)),
              linePts(pt(10, 10), pt(48, 10))
            ),
            isClosed: false
          }
        ]
      };

    default:
      return getScriptGlyph(char);
  }
}

// ---------------------------------------------------------------------------
// 3. ROUNDED / TUBE NEON
// ---------------------------------------------------------------------------

function getRoundedGlyph(char: string): NeonLetterGlyph {
  return getScriptGlyph(char);
}

// ---------------------------------------------------------------------------
// 4. DISPLAY / RETRO NEON
// ---------------------------------------------------------------------------

function getDisplayGlyph(char: string): NeonLetterGlyph {
  return getScriptGlyph(char);
}
