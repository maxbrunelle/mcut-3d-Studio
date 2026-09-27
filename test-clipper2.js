const ClipperLib = require('clipper-lib');
const co = new ClipperLib.ClipperOffset();
const solution = new ClipperLib.PolyTree();
const path = [{X:0,Y:0}, {X:100,Y:0}, {X:100,Y:100}, {X:0,Y:100}];
co.AddPath(path, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
co.Execute(solution, 10);

const nodes = solution.Childs();
const contour = nodes[0].Contour();
console.log(typeof contour);
console.log(Array.isArray(contour));
