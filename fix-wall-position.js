const fs = require('fs');
let content = fs.readFileSync('src/app/viewport-3d.ts', 'utf8');

// Move wall back to -50
content = content.replace(
  /this\.wallMesh\.position\.z = -10;/g,
  'this.wallMesh.position.z = -50;'
);

// LED Glow light position to -10 (between sign and wall)
content = content.replace(
  /this\.ledGlowLight\.position\.set\(0, 0, -2\);/g,
  'this.ledGlowLight.position.set(0, 0, -10);'
);

fs.writeFileSync('src/app/viewport-3d.ts', content, 'utf8');
