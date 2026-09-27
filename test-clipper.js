const ClipperLib = require('clipper-lib');
const outer = [{X: 0, Y: 0}, {X: 10, Y: 0}, {X: 10, Y: 10}, {X: 0, Y: 10}]; // CCW
console.log(ClipperLib.Clipper.Orientation(outer));
const cw = [{X: 0, Y: 0}, {X: 0, Y: 10}, {X: 10, Y: 10}, {X: 10, Y: 0}]; // CW
console.log(ClipperLib.Clipper.Orientation(cw));
