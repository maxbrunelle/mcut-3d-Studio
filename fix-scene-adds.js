const fs = require('fs');

let content = fs.readFileSync('src/app/viewport-3d.ts', 'utf8');

// Change wallMesh scene.add
content = content.replace(
  /this\.wallMesh\.position\.z = -50;\n\s*this\.wallMesh\.visible = false;\n\s*this\.scene\.add\(this\.wallMesh\);/g,
  'this.wallMesh.position.z = -5;\n    this.wallMesh.visible = false;\n    this.pivotGroup.add(this.wallMesh);'
);

// Change ledGlowLight scene.add
content = content.replace(
  /this\.ledGlowLight\.position\.set\(0, 0, -10\);[^\n]*\n\s*this\.scene\.add\(this\.ledGlowLight\);/g,
  'this.ledGlowLight.position.set(0, 0, 5);\n    this.pivotGroup.add(this.ledGlowLight);'
);

fs.writeFileSync('src/app/viewport-3d.ts', content, 'utf8');
