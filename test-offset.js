const ClipperLib = require('clipper-lib');
const co = new ClipperLib.ClipperOffset();
const outer = [{X: 0, Y: 0}, {X: 100, Y: 0}, {X: 100, Y: 100}, {X: 0, Y: 100}]; // CCW (Orientation=true)
const hole = [{X: 40, Y: 40}, {X: 40, Y: 60}, {X: 60, Y: 60}, {X: 60, Y: 40}]; // CW (Orientation=false)
// What if JoinType is jtRound but hole is CW?
co.AddPaths([outer], ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
co.AddPaths([hole], ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
const solution = new ClipperLib.PolyTree();
co.Execute(solution, -10);
for (let node of solution.Childs()) {
  for (let child of node.Childs()) {
    console.log("Hole size:", child.Contour().length);
  }
}
