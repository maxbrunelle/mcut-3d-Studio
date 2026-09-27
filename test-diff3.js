const ClipperLib = require('clipper-lib');
const origOuter = [{X: 0, Y: 0}, {X: 100, Y: 0}, {X: 100, Y: 100}, {X: 0, Y: 100}];
const origHole = [{X: 40, Y: 40}, {X: 40, Y: 60}, {X: 60, Y: 60}, {X: 60, Y: 40}];
const insetOuter = [{X: 10, Y: 10}, {X: 90, Y: 10}, {X: 90, Y: 90}, {X: 10, Y: 90}];
const insetHole = [{X: 30, Y: 30}, {X: 30, Y: 70}, {X: 70, Y: 70}, {X: 70, Y: 30}];
const clpr = new ClipperLib.Clipper();
clpr.AddPaths([origOuter, origHole], ClipperLib.PolyType.ptSubject, true);
clpr.AddPaths([insetOuter, insetHole], ClipperLib.PolyType.ptClip, true);
const solution = new ClipperLib.PolyTree();
clpr.Execute(ClipperLib.ClipType.ctDifference, solution, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
const format = (n) => JSON.stringify(n.Contour());
for (let n of solution.Childs()) {
  console.log("OUTER", format(n));
  for (let c of n.Childs()) {
    console.log("  HOLE", format(c));
    for (let g of c.Childs()) {
      console.log("    INNER", format(g));
    }
  }
}
