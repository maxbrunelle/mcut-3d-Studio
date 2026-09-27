import * as THREE from 'three';
import * as ClipperLib from 'clipper-lib';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { CustomHole, ProjectSettings } from './store';

export interface HoleConfig extends CustomHole {
  holeCategory?: 'mounting' | 'wire';
}

function shapeToPaths(shape: THREE.Shape, scale: number): { X: number; Y: number }[][] {
  const paths: { X: number; Y: number }[][] = [];
  const outer = shape.getPoints();
  paths.push(outer.map(p => ({ X: Math.round(p.x * scale), Y: Math.round(p.y * scale) })));
  if (shape.holes) {
    shape.holes.forEach(hole => {
      const holePoints = hole.getPoints();
      paths.push(holePoints.map(p => ({ X: Math.round(p.x * scale), Y: Math.round(p.y * scale) })));
    });
  }
  return paths;
}

function polyTreeToShapes(polyTree: ClipperLib.PolyTree, scale: number): THREE.Shape[] {
  const shapes: THREE.Shape[] = [];
  if (!polyTree || !polyTree.Childs) return shapes;
  const nodes = polyTree.Childs();
  for (const outerNode of nodes) {
    const shape = new THREE.Shape();
    const outerPath = outerNode.Contour();
    if (!outerPath || outerPath.length === 0) continue;

    shape.moveTo(outerPath[0].X / scale, outerPath[0].Y / scale);
    for (let j = 1; j < outerPath.length; j++) {
      shape.lineTo(outerPath[j].X / scale, outerPath[j].Y / scale);
    }
    shape.closePath();

    const holeNodes = outerNode.Childs();
    for (const holeNode of holeNodes) {
      const holePath = holeNode.Contour();
      if (!holePath || holePath.length === 0) continue;

      const hole = new THREE.Path();
      hole.moveTo(holePath[0].X / scale, holePath[0].Y / scale);
      for (let k = 1; k < holePath.length; k++) {
        hole.lineTo(holePath[k].X / scale, holePath[k].Y / scale);
      }
      hole.closePath();

      shape.holes.push(hole);
    }
    shapes.push(shape);
  }
  return shapes;
}

function offsetShapesInward(shapes: THREE.Shape[], offsetMM: number): THREE.Shape[] {
  const scale = 10000;
  const co = new ClipperLib.ClipperOffset();

  shapes.forEach(shape => {
    const paths = shapeToPaths(shape, scale);
    co.AddPaths(paths, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
  });

  const solution = new ClipperLib.PolyTree();
  co.Execute(solution, -offsetMM * scale);

  return polyTreeToShapes(solution, scale);
}

function pointInPolygon(x: number, y: number, poly: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function isPointInsideShapes(x: number, y: number, insetShapes: THREE.Shape[]): boolean {
  for (const shape of insetShapes) {
    const outerPoints = shape.getPoints();
    if (pointInPolygon(x, y, outerPoints)) {
      let insideHole = false;
      if (shape.holes) {
        for (const hole of shape.holes) {
          const holePoints = hole.getPoints();
          if (pointInPolygon(x, y, holePoints)) {
            insideHole = true;
            break;
          }
        }
      }
      if (!insideHole) return true;
    }
  }
  return false;
}

export function generateAutoHolesForShapes(
  shapes: THREE.Shape[],
  offsetX: number,
  offsetY = 0,
  rotation = 0,
  settings: ProjectSettings = {} as ProjectSettings
): HoleConfig[] {
  const holes: HoleConfig[] = [];
  if (!shapes || shapes.length === 0) return holes;

  const maxHoles = settings.autoHolesMaxPerLetter ?? 3;
  const edgeMargin = settings.autoHolesEdgeMargin ?? 8;
  const minDist = settings.autoHolesMinDistance ?? 25;
  const pattern = settings.autoHolesPattern || 'corners-center';
  const addWireHole = settings.autoHolesAddWireHole ?? true;
  const holeRadius = settings.holeRadius ?? 4;
  const wireRadius = settings.autoHolesWireRadius ?? 6;

  const transformPoint = (px: number, py: number) => {
    let x = px;
    let y = py;
    if (rotation !== 0) {
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      x = px * cos - py * sin;
      y = px * sin + py * cos;
    }
    return {
      x: Number((x + offsetX).toFixed(1)),
      y: Number((y + offsetY).toFixed(1))
    };
  };

  // Calculate required inset
  const requiredOffset = Math.max(3, edgeMargin + Math.max(holeRadius, wireRadius) * 0.5);
  let insetShapes = offsetShapesInward(shapes, requiredOffset);

  if (insetShapes.length === 0) {
    insetShapes = offsetShapesInward(shapes, Math.max(1.5, holeRadius + 0.5));
  }
  if (insetShapes.length === 0) {
    insetShapes = shapes;
  }

  // Calculate bounding box of inset region
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  insetShapes.forEach((s: THREE.Shape) => {
    s.getPoints().forEach((p: THREE.Vector2) => box.expandByPoint(v.set(p.x, p.y, 0)));
  });

  if (box.isEmpty()) return holes;

  const minX = box.min.x;
  const maxX = box.max.x;
  const minY = box.min.y;
  const maxY = box.max.y;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Grid sampling inside valid region
  const step = 3.5; // mm step
  const validGridPoints: { x: number; y: number }[] = [];

  for (let gx = minX; gx <= maxX; gx += step) {
    for (let gy = minY; gy <= maxY; gy += step) {
      if (isPointInsideShapes(gx, gy, insetShapes)) {
        validGridPoints.push({ x: gx, y: gy });
      }
    }
  }

  if (validGridPoints.length === 0) return holes;

  const placedHoles: { x: number; y: number; r: number }[] = [];

  const isFarEnough = (x: number, y: number, dist: number) => {
    return placedHoles.every(h => {
      const dx = h.x - x;
      const dy = h.y - y;
      return Math.sqrt(dx * dx + dy * dy) >= dist;
    });
  };

  // 1. Add Wire Cable Hole in Center if requested
  if (addWireHole) {
    let bestWirePt = validGridPoints[0];
    let minWireDist = Infinity;
    for (const pt of validGridPoints) {
      const d = Math.hypot(pt.x - centerX, pt.y - centerY);
      if (d < minWireDist) {
        minWireDist = d;
        bestWirePt = pt;
      }
    }
    placedHoles.push({ x: bestWirePt.x, y: bestWirePt.y, r: wireRadius });
    const pos = transformPoint(bestWirePt.x, bestWirePt.y);
    holes.push({ x: pos.x, y: pos.y, r: wireRadius, type: 'round', holeCategory: 'wire' });
  }

  const mType = settings.mountingHoleType || 'keyhole';
  const mSlotWidth = settings.keyholeSlotWidth ?? 4;
  const mSlotHeight = settings.keyholeSlotHeight ?? 10;
  const mRotation = mType === 'oval' ? (settings.ovalRotation ?? 0) : (settings.keyholeDirection ?? 0);
  const mWidth = settings.ovalHoleWidth ?? 10;
  const mHeight = settings.ovalHoleHeight ?? 20;
  const mCornerRadius = settings.ovalCornerRadius ?? 5;

  // 2. Add Mounting Holes according to pattern
  const targetPoints: { name: string; x: number; y: number }[] = [];

  if (pattern === 'top-bottom') {
    targetPoints.push({ name: 'top', x: centerX, y: maxY });
    targetPoints.push({ name: 'bottom', x: centerX, y: minY });
    targetPoints.push({ name: 'mid-top', x: centerX, y: centerY + (maxY - centerY) * 0.5 });
    targetPoints.push({ name: 'mid-bottom', x: centerX, y: centerY - (centerY - minY) * 0.5 });
  } else if (pattern === 'corners') {
    targetPoints.push({ name: 'top-left', x: minX, y: maxY });
    targetPoints.push({ name: 'top-right', x: maxX, y: maxY });
    targetPoints.push({ name: 'bottom-left', x: minX, y: minY });
    targetPoints.push({ name: 'bottom-right', x: maxX, y: minY });
  } else if (pattern === 'grid-balanced') {
    const targetCount = maxHoles;
    let iterations = 0;
    while (holes.filter(h => h.holeCategory === 'mounting').length < targetCount && iterations < 15) {
      iterations++;
      let farthestPt: { x: number; y: number } | null = null;
      let maxDistFromAll = -1;

      for (const pt of validGridPoints) {
        if (!isFarEnough(pt.x, pt.y, minDist)) continue;

        let minDistToPlaced = Infinity;
        for (const h of placedHoles) {
          const d = Math.hypot(pt.x - h.x, pt.y - h.y);
          if (d < minDistToPlaced) minDistToPlaced = d;
        }

        if (minDistToPlaced > maxDistFromAll) {
          maxDistFromAll = minDistToPlaced;
          farthestPt = pt;
        }
      }

      if (farthestPt) {
        placedHoles.push({ x: farthestPt.x, y: farthestPt.y, r: holeRadius });
        const pos = transformPoint(farthestPt.x, farthestPt.y);
        holes.push({
          x: pos.x,
          y: pos.y,
          r: holeRadius,
          type: mType,
          slotWidth: mSlotWidth,
          slotHeight: mSlotHeight,
          rotation: mRotation,
          width: mWidth,
          height: mHeight,
          cornerRadius: mCornerRadius,
          holeCategory: 'mounting'
        });
      } else {
        break;
      }
    }
  } else {
    // Default: 'corners-center'
    targetPoints.push({ name: 'top-left', x: minX, y: maxY });
    targetPoints.push({ name: 'top-right', x: maxX, y: maxY });
    targetPoints.push({ name: 'bottom-left', x: minX, y: minY });
    targetPoints.push({ name: 'bottom-right', x: maxX, y: minY });
    targetPoints.push({ name: 'center', x: centerX, y: centerY });
    targetPoints.push({ name: 'mid-left', x: minX, y: centerY });
    targetPoints.push({ name: 'mid-right', x: maxX, y: centerY });
  }

  if (pattern !== 'grid-balanced') {
    for (const tgt of targetPoints) {
      if (holes.filter(h => h.holeCategory === 'mounting').length >= maxHoles) break;

      let bestPt: { x: number; y: number } | null = null;
      let minDistToTgt = Infinity;

      for (const pt of validGridPoints) {
        if (!isFarEnough(pt.x, pt.y, minDist)) continue;

        const d = Math.hypot(pt.x - tgt.x, pt.y - tgt.y);
        if (d < minDistToTgt) {
          minDistToTgt = d;
          bestPt = pt;
        }
      }

      if (bestPt) {
        placedHoles.push({ x: bestPt.x, y: bestPt.y, r: holeRadius });
        const pos = transformPoint(bestPt.x, bestPt.y);
        holes.push({
          x: pos.x,
          y: pos.y,
          r: holeRadius,
          type: mType,
          slotWidth: mSlotWidth,
          slotHeight: mSlotHeight,
          rotation: mRotation,
          width: mWidth,
          height: mHeight,
          cornerRadius: mCornerRadius,
          holeCategory: 'mounting'
        });
      }
    }
  }

  return holes;
}

export function calculateAutoHoles(settings: ProjectSettings, font: Font | null): CustomHole[] {
  const allHoles: CustomHole[] = [];

  if (settings.inputSource === 'text') {
    if (!font) return [];
    const rawText = settings.text || ' ';
    const height = settings.targetHeight || 150;
    const lines = rawText.split('\n');
    const letterSpacing = settings.letterSpacing ?? 15;
    const lineSpacing = settings.lineSpacing ?? 25;
    const textAlign = settings.textAlign || 'center';
    const arcEnabled = settings.arcEnabled || false;
    const arcAngleDeg = settings.arcAngle || 60;

    const customKerning = settings.customKerning || {};

    interface CharMetric {
      char: string;
      charIndex: number;
      shapes: THREE.Shape[];
      width: number;
      minX: number;
    }
    const lineMetrics: { chars: CharMetric[]; totalWidth: number }[] = [];

    let charGlobalCounter = 0;
    for (const line of lines) {
      const chars: CharMetric[] = [];
      let totalWidth = 0;
      for (const char of line) {
        const charIdx = charGlobalCounter++;
        const kerningShift = customKerning[charIdx] || 0;
        if (char === ' ') {
          chars.push({ char, charIndex: charIdx, shapes: [], width: height * 0.45, minX: 0 });
          totalWidth += height * 0.45 + kerningShift;
        } else {
          const shapes = font.generateShapes(char, height);
          const box = new THREE.Box3();
          const v = new THREE.Vector3();
          shapes.forEach((s: THREE.Shape) => s.getPoints().forEach((p: THREE.Vector2) => box.expandByPoint(v.set(p.x, p.y, 0))));
          const minX = !box.isEmpty() ? box.min.x : 0;
          const maxX = !box.isEmpty() ? box.max.x : height * 0.5;
          const w = Math.max(1, maxX - minX);
          chars.push({ char, charIndex: charIdx, shapes, width: w, minX });
          totalWidth += w + letterSpacing + kerningShift;
        }
      }
      if (chars.length > 0 && chars[chars.length - 1].char !== ' ') {
        totalWidth -= letterSpacing;
      }
      lineMetrics.push({ chars, totalWidth: Math.max(0, totalWidth) });
      charGlobalCounter++; // account for newline character
    }

    const maxLineWidth = Math.max(1, ...lineMetrics.map(l => l.totalWidth));

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const { chars, totalWidth } = lineMetrics[lineIndex];
      const lineYOffset = - lineIndex * (height + lineSpacing);

      let lineStartX = 0;
      if (textAlign === 'center') {
        lineStartX = (maxLineWidth - totalWidth) / 2;
      } else if (textAlign === 'right') {
        lineStartX = maxLineWidth - totalWidth;
      }

      let currentX = lineStartX;

      for (const charItem of chars) {
        const kerningShift = customKerning[charItem.charIndex] || 0;
        currentX += kerningShift;

        if (charItem.char === ' ' || charItem.shapes.length === 0) {
          currentX += charItem.width;
          continue;
        }

        let posX = currentX - charItem.minX;
        let posY = lineYOffset;
        let rotZ = 0;

        if (arcEnabled && arcAngleDeg !== 0 && totalWidth > 10) {
          const arcAngleRad = (arcAngleDeg * Math.PI) / 180;
          const arcRadius = totalWidth / arcAngleRad;
          const charCenterRelX = (currentX - lineStartX + charItem.width / 2) - (totalWidth / 2);
          const theta = (charCenterRelX / totalWidth) * arcAngleRad;

          posX = lineStartX + (totalWidth / 2) + arcRadius * Math.sin(theta) - (charItem.width / 2) - charItem.minX;
          posY = lineYOffset + arcRadius * (Math.cos(theta) - 1);
          rotZ = -theta;
        }

        const letterHoles = generateAutoHolesForShapes(charItem.shapes, posX, posY, rotZ, settings);
        letterHoles.forEach(h => allHoles.push({
          id: `hole-${allHoles.length + 1}`,
          x: h.x,
          y: h.y,
          r: h.r,
          type: h.type,
          slotWidth: h.slotWidth,
          slotHeight: h.slotHeight,
          rotation: h.rotation
        }));

        currentX += charItem.width + letterSpacing;
      }
    }
  } else if (settings.inputSource === 'svg' && settings.vectorData) {
    const loader = new SVGLoader();
    const svgData = loader.parse(settings.vectorData);

    for (const path of svgData.paths) {
      const shapes = SVGLoader.createShapes(path);
      if (shapes.length > 0) {
        const svgHoles = generateAutoHolesForShapes(shapes, 0, 0, 0, settings);
        svgHoles.forEach(h => allHoles.push({
          id: `hole-${allHoles.length + 1}`,
          x: h.x,
          y: h.y,
          r: h.r,
          type: h.type,
          slotWidth: h.slotWidth,
          slotHeight: h.slotHeight,
          rotation: h.rotation
        }));
      }
    }
  }

  return allHoles;
}
