const fs = require('fs');

let content = fs.readFileSync('src/app/viewport-3d.ts', 'utf8');

// Find rebuildGeometry and inject updateEmissiveMaterials at the end
content = content.replace(
  /this\.lettersGroup\.add\(group\);\n\s*\}\);\n\n\s*const bbox = new THREE\.Box3\(\)\.setFromObject\(this\.lettersGroup\);/g,
  `this.lettersGroup.add(group);\n    });\n\n    this.updateEmissiveMaterials();\n\n    const bbox = new THREE.Box3().setFromObject(this.lettersGroup);`
);

fs.writeFileSync('src/app/viewport-3d.ts', content, 'utf8');
