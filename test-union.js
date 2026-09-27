const ClipperLib = require('clipper-lib');
const insetOuter = [{X: 10, Y: 10}, {X: 90, Y: 10}, {X: 90, Y: 90}, {X: 10, Y: 90}];
const insetHole = [{X: 30, Y: 30}, {X: 30, Y: 70}, {X: 70, Y: 70}, {X: 70, Y: 30}];
const clpr = new ClipperLib.Clipper();
clpr.AddPaths([insetOuter, insetHole], ClipperLib.PolyType.ptSubject, true);
const solution = new ClipperLib.PolyTree();
clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
console.log("Nodes:", solution.Childs().length);
for (let node of solution.Childs()) {
  console.log("Outer:", node.Contour());
  for (let child of node.Childs()) {
    console.log("  Hole:", child.Contour());
  }
}
