const fs = require('fs');
let content = fs.readFileSync('src/app/viewport-3d.ts', 'utf8');

content = content.replace(/acrylicMaterial\.userData\.isAcrylic = true;/g, "acrylicMaterial.userData = { isAcrylic: true };");

fs.writeFileSync('src/app/viewport-3d.ts', content, 'utf8');
