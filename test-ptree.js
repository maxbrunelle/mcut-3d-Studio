const ClipperLib = require('clipper-lib');
function polyTreeToShapes(polyTree, scale) {
  const shapes = [];
  const nodes = polyTree.Childs(); // Level 1 (Outer)
  for (const outerNode of nodes) {
    const shape = {};
    shape.outer = outerNode.Contour();
    shape.holes = [];
    const holeNodes = outerNode.Childs(); // Level 2 (Holes)
    for (const holeNode of holeNodes) {
      shape.holes.push(holeNode.Contour());
      // WAIT! What about holeNode.Childs()?
      if (holeNode.Childs().length > 0) {
        console.log("WARNING: Nested shapes found! Level 3 exists!");
      }
    }
    shapes.push(shape);
  }
  return shapes;
}
