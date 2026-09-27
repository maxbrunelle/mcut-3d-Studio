const { Helper } = require('dxf');
const helper = new Helper('0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF\n');
console.log(helper.toSVG());
