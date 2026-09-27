const fs = require('fs');

let content = fs.readFileSync('src/app/viewport-3d.ts', 'utf8');

content = content.replace(
  /this\.wallMesh\.position\.z = -5;/g,
  'this.wallMesh.position.z = -50;'
);

content = content.replace(
  /this\.ledGlowLight\.position\.set\(0, 0, 5\);/g,
  'this.ledGlowLight.position.set(0, 0, -20);'
);

fs.writeFileSync('src/app/viewport-3d.ts', content, 'utf8');
