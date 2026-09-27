const fs = require('fs');
let content = fs.readFileSync('src/app/viewport-3d.ts', 'utf8');

content = content.replace(
  /const acrylicMaterial = new THREE\.MeshPhysicalMaterial\(\{\s*userData: \{ isAcrylic: true \},\s*/g,
  'const acrylicMaterial = new THREE.MeshPhysicalMaterial({\n      '
);

content = content.replace(
  /const bodyMaterial = new THREE\.MeshStandardMaterial\(\{/g,
  'acrylicMaterial.userData.isAcrylic = true;\n\n    const bodyMaterial = new THREE.MeshStandardMaterial({'
);

fs.writeFileSync('src/app/viewport-3d.ts', content, 'utf8');
