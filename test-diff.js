const ClipperLib = require('clipper-lib');
const clpr = new ClipperLib.Clipper();

// Original: Outer 0-100 (CCW), Hole 40-60 (CW)
const origOuter = [{X: 0, Y: 0}, {X: 100, Y: 0}, {X: 100, Y: 100}, {X: 0, Y: 100}];
const origHole = [{X: 40, Y: 40}, {X: 40, Y: 60}, {X: 60, Y: 60}, {X: 60, Y: 40}];

// Inset: Outer 10-90 (CCW), Hole 30-70 (CW)
const insetOuter = [{X: 10, Y: 10}, {X: 90, Y: 10}, {X: 90, Y: 90}, {X: 10, Y: 90}];
const insetHole = [{X: 30, Y: 30}, {X: 30, Y: 70}, {X: 70, Y: 70}, {X: 70, Y: 30}];

clpr.AddPaths([origOuter, origHole], ClipperLib.PolyType.ptSubject, true);
clpr.AddPaths([insetOuter, insetHole], ClipperLib.PolyType.ptClip, true);

const solution = new ClipperLib.PolyTree();
clpr.Execute(ClipperLib.ClipType.ctDifference, solution, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);

console.log("Nodes:", solution.Childs().length);
for (let node of solution.Childs()) {
  console.log("Outer:", node.Contour());
  for (let child of node.Childs()) {
    console.log("  Hole:", child.Contour());
  }
}
