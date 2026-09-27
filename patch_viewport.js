const fs = require('fs');
let code = fs.readFileSync('src/app/viewport-3d.ts', 'utf8');

const lines = code.split('\n');
const startIndex = lines.findIndex(l => l.includes("if (routingMode === 'inline') {"));
let endIndex = -1;
for (let i = startIndex; i < lines.length; i++) {
  if (lines[i] && lines[i].includes("if (!globalRawBox.isEmpty()) {")) {
    endIndex = i;
    break;
  }
}

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `    // Unified Font Processing
    interface CharMetric {
      char: string;
      charIndex: number;
      shapes: THREE.Shape[];
      width: number;
      minX: number;
      box: THREE.Box3;
    }
    const lineMetrics: { chars: CharMetric[]; totalWidth: number }[] = [];
    let charGlobalCounter = 0;

    for (const line of lines) {
      const chars: CharMetric[] = [];
      let totalWidth = 0;
      for (const char of line) {
        const charIdx = charGlobalCounter++;
        if (char === ' ') {
          chars.push({ char, charIndex: charIdx, shapes: [], width: height * 0.38, minX: 0, box: new THREE.Box3() });
          totalWidth += height * 0.38;
        } else {
          const shapes = this.font!.generateShapes(char, height);
          const rawBox = this.getShapesBoundingBox(shapes);
          const minX = !rawBox.isEmpty() ? rawBox.min.x : 0;
          const maxX = !rawBox.isEmpty() ? rawBox.max.x : height * 0.5;
          const w = Math.max(1, maxX - minX);
          chars.push({ char, charIndex: charIdx, shapes, width: w, minX, box: rawBox });
          totalWidth += w + letterSpacing;
        }
      }
      if (chars.length > 0 && chars[chars.length - 1].char !== ' ') {
        totalWidth -= letterSpacing;
      }
      lineMetrics.push({ chars, totalWidth });
    }

    const maxWidth = Math.max(...lineMetrics.map(l => l.totalWidth), 1);
    const totalLinesHeight = (lines.length - 1) * lineSpacing + height;
    
    // Depth variables for Inline / CNC Groove mode
    const grooveDepth = (trackMode === 'cnc-groove' || trackMode === 'both') ? (settings.neonCncGrooveDepth ?? 1.8) : 0;
    const baseTubeZ = tubeRadius - grooveDepth;

    for (let lineIndex = 0; lineIndex < lineMetrics.length; lineIndex++) {
      const { chars, totalWidth } = lineMetrics[lineIndex];
      const lineYOffset = (totalLinesHeight / 2) - height - (lineIndex * lineSpacing);
      
      let lineStartX = -maxWidth / 2;
      if (textAlign === 'center') {
        lineStartX = -totalWidth / 2;
      } else if (textAlign === 'right') {
        lineStartX = (maxWidth / 2) - totalWidth;
      }

      let currentX = lineStartX;

      for (const charItem of chars) {
        if (charItem.char === ' ' || charItem.shapes.length === 0) {
          currentX += charItem.width + letterSpacing;
          continue;
        }

        const posX = currentX - charItem.minX;
        const charGroup = new THREE.Group();
        charGroup.userData = { isLetterGroup: true, char: charItem.char, charIndex: charItem.charIndex };

        const strokes = routingMode === 'inline'
          ? extractGlyphCenterlineStrokes(charItem.shapes, 36)
          : extractGlyphOutlineStrokes(charItem.shapes, 36);

        strokes.forEach((stroke, strkIdx) => {
          const pts3d = stroke.points;
          if (!pts3d || pts3d.length < 2) return;
          const isClosed = stroke.isClosed;
          
          // Smoother curves for inline tracing to match natural neon bending
          const spline = new THREE.CatmullRomCurve3(pts3d, isClosed, 'catmullrom', routingMode === 'inline' ? 0.35 : 0.15);
          const curveLen = spline.getLength();
          const segments = Math.max(20, Math.floor(curveLen / 2.2));

          // 1. Glowing Core Tube
          const coreGeom = new THREE.TubeGeometry(spline, segments, tubeRadius * 0.72, 12, isClosed);
          const coreMesh = new THREE.Mesh(coreGeom, neonGlowMat);
          coreMesh.position.z = baseTubeZ - tubeRadius * 0.25;
          coreMesh.castShadow = true;
          charGroup.add(coreMesh);

          // 2. Silicone Translucent Jacket
          const jacketGeom = new THREE.TubeGeometry(spline, segments, tubeRadius, 16, isClosed);
          const jacketMesh = new THREE.Mesh(jacketGeom, siliconeJacketMat);
          jacketMesh.position.z = baseTubeZ;
          jacketMesh.castShadow = true;
          jacketMesh.receiveShadow = true;
          charGroup.add(jacketMesh);

          // 3. Silicone End-Caps
          if (!isClosed && pts3d.length >= 2) {
            const startCapGeom = new THREE.SphereGeometry(tubeRadius, 12, 12);
            const startCapMesh = new THREE.Mesh(startCapGeom, siliconeJacketMat);
            startCapMesh.position.set(pts3d[0].x, pts3d[0].y, baseTubeZ);
            charGroup.add(startCapMesh);

            const endCapMesh = new THREE.Mesh(startCapGeom, siliconeJacketMat);
            endCapMesh.position.set(pts3d[pts3d.length - 1].x, pts3d[pts3d.length - 1].y, baseTubeZ);
            charGroup.add(endCapMesh);
          }

          // 4. Mounting Clips & Screws
          if (showClips && trackMode !== 'cnc-groove') {
            const numClips = Math.max(1, Math.floor(curveLen / clipSpacing));
            for (let ci = 0; ci < numClips; ci++) {
              const u = (ci + 0.5) / numClips;
              const pt = spline.getPointAt(u);
              const tangent = spline.getTangentAt(u);
              const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
              const clipGroup = new THREE.Group();
              clipGroup.position.set(pt.x, pt.y, 0);

              const clipGeom = new THREE.CylinderGeometry(tubeRadius * 1.25, tubeRadius * 1.25, 4, 16, 1, true, 0, Math.PI);
              const clipMesh = new THREE.Mesh(clipGeom, clipMat);
              clipMesh.rotation.z = Math.atan2(tangent.y, tangent.x) + Math.PI / 2;
              clipMesh.position.z = baseTubeZ + tubeRadius * 0.02;
              clipGroup.add(clipMesh);

              const screwGeom = new THREE.CylinderGeometry(1.2, 1.2, 2, 12);
              const screwMesh = new THREE.Mesh(screwGeom, screwMat);
              screwMesh.rotation.x = Math.PI / 2;
              screwMesh.position.set(normal.x * (tubeRadius * 1.2), normal.y * (tubeRadius * 1.2), 0.8);
              clipGroup.add(screwMesh);

              charGroup.add(clipGroup);
            }
          }

          // 5. CNC Routing track groove (shows as a grey track inset into the acrylic)
          if (trackMode === 'cnc-groove' || trackMode === 'both') {
            const cncGeom = new THREE.TubeGeometry(spline, Math.max(20, Math.floor(curveLen / 3.5)), tubeRadius * 1.06, 8, isClosed);
            const cncMesh = new THREE.Mesh(cncGeom, cncTrackMat);
            cncMesh.position.z = -grooveDepth; // Set to the depth of the groove
            charGroup.add(cncMesh);
          }

          // 6. Subtle Cut-Mark / Solder Point Badges on Neon Flex
          if (curveLen >= 20) {
            const cutSpacing = 45; // standard ~45-50mm neon cut interval
            const numCutMarks = Math.max(1, Math.floor(curveLen / cutSpacing));
            for (let cm = 1; cm <= numCutMarks; cm++) {
              const u = cm / (numCutMarks + 1);
              const pt = spline.getPointAt(u);
              const tangent = spline.getTangentAt(u);
              const cutMarkGeom = new THREE.CylinderGeometry(tubeRadius * 1.012, tubeRadius * 1.012, 1.6, 16);
              const cutMarkMesh = new THREE.Mesh(cutMarkGeom, cutMarkMat);
              cutMarkMesh.position.set(pt.x, pt.y, baseTubeZ);
              cutMarkMesh.rotation.z = Math.atan2(tangent.y, tangent.x) + Math.PI / 2;
              charGroup.add(cutMarkMesh);
            }
          }

          // 7. Wire Exit Bushing
          if (showWires && strkIdx === 0) {
            const exitPt = pts3d[0];
            const grommetGeom = new THREE.CylinderGeometry(3.5, 3.5, 4, 16);
            const grommetMesh = new THREE.Mesh(grommetGeom, grommetMat);
            grommetMesh.rotation.x = Math.PI / 2;
            grommetMesh.position.set(exitPt.x, exitPt.y, -2);
            charGroup.add(grommetMesh);
          }
        });

        charGroup.position.set(posX, lineYOffset, 0);
        this.export2DShapes.push({
          char: charItem.char,
          acrylic: charItem.shapes,
          base: charItem.shapes,
          offsetX: charGroup.position.x,
          offsetY: charGroup.position.y,
          scaleX: 1,
          scaleY: 1
        });

        const localBox = new THREE.Box3().setFromObject(charGroup);
        const sizeX = localBox.max.x - localBox.min.x;
        const sizeY = localBox.max.y - localBox.min.y;
        if (sizeX > settings.buildPlateWidth || sizeY > settings.buildPlateHeight) {
          hasOversizedLetters = true;
        }

        this.lettersGroup.add(charGroup);

        if (!charItem.box.isEmpty()) {
          const shiftedBox = charItem.box.clone().translate(new THREE.Vector3(charGroup.position.x, charGroup.position.y, 0));
          globalRawBox.union(shiftedBox);
        }

        currentX += charItem.width + letterSpacing;
      }
    }
`;
  lines.splice(startIndex - 1, endIndex - startIndex + 1, replacement);
  fs.writeFileSync('src/app/viewport-3d.ts', lines.join('\n'), 'utf8');
  console.log("Patched successfully!");
} else {
  console.log("Could not find start or end index.", startIndex, endIndex);
}
