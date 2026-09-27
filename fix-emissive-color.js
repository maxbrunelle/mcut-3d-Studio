const fs = require('fs');

let content = fs.readFileSync('src/app/viewport-3d.ts', 'utf8');

content = content.replace(
  /mat\.emissive\.set\(settings\.ledColor\);/g,
  'mat.emissive.set(settings.ledColor);\n              mat.emissiveIntensity = 5;'
);

content = content.replace(
  /mat\.emissiveIntensity = 5; \/\/ Strong glow\n\s*mat\.emissiveIntensity = 5;/g,
  'mat.emissiveIntensity = 5;'
);

fs.writeFileSync('src/app/viewport-3d.ts', content, 'utf8');
