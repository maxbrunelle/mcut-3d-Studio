const fs = require('fs');

let content = fs.readFileSync('src/app/viewport-3d.ts', 'utf8');
content = content.replace(
  /const acrylicMaterial = new THREE.MeshPhysicalMaterial\(\{/g, 
  "const acrylicMaterial = new THREE.MeshPhysicalMaterial({ userData: { isAcrylic: true }, "
);

fs.writeFileSync('src/app/viewport-3d.ts', content, 'utf8');
