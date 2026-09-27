const fs = require('fs');

let content = fs.readFileSync('src/app/viewport-3d.ts', 'utf8');

// Fix 'any' type
content = content.replace(/const updateMaterial = \(mat\) =>/g, "const updateMaterial = (mat: any) =>");

// Fix dirLight shadows
content = content.replace(/dirLight\.castShadow = true;/g, "this.dirLight.castShadow = true;");
content = content.replace(/dirLight\.shadow\.mapSize\.width = 2048;/g, "this.dirLight.shadow.mapSize.width = 2048;");
content = content.replace(/dirLight\.shadow\.mapSize\.height = 2048;/g, "this.dirLight.shadow.mapSize.height = 2048;");
content = content.replace(/this\.scene\.add\(dirLight\);/g, "this.scene.add(this.dirLight);");

fs.writeFileSync('src/app/viewport-3d.ts', content, 'utf8');
