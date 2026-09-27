const fs = require('fs');
let code = fs.readFileSync('src/app/left-sidebar.ts', 'utf8');

const regex = /neonScriptFonts = computed\(\(\) => \{[\s\S]*?\}\);\s*selectNeonFlexSource\(\) \{[\s\S]*?\}\s*updateNeonText\(event: Event\) \{[\s\S]*?\}\s*selectNeonFont\(fontId: string\) \{[\s\S]*?\}\s*selectNeonColor\(hex: string\) \{[\s\S]*?\}\s*selectNeonRouting\(mode: string\) \{[\s\S]*?\}\s*setNeonBackplateStyle\(style: NeonBackplateStyle\) \{[\s\S]*?\}\s*setNeonBackplateMaterial\(mat: NeonBackplateMaterial\) \{[\s\S]*?\}\s*toggleNeonBackplateHoles\(event: Event\) \{[\s\S]*?\}/g;

code = code.replace(regex, '');

fs.writeFileSync('src/app/left-sidebar.ts', code, 'utf8');
console.log("Neon flex methods removed");
