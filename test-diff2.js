const ClipperLib = require('clipper-lib');
const origHole = [{X: 40, Y: 40}, {X: 40, Y: 60}, {X: 60, Y: 60}, {X: 60, Y: 40}];
const insetHole = [{X: 30, Y: 30}, {X: 30, Y: 70}, {X: 70, Y: 70}, {X: 70, Y: 30}];
console.log("origHole CCW?", ClipperLib.Clipper.Orientation(origHole));
console.log("insetHole CCW?", ClipperLib.Clipper.Orientation(insetHole));
