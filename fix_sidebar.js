const fs = require('fs');
let code = fs.readFileSync('src/app/left-sidebar.ts', 'utf8');

const regex = /neonBackplateStyles: \{ id: NeonBackplateStyle; name: string; desc: string \}[\s\S]*\}\s*\n$/;
code = code.replace(regex, '}');

fs.writeFileSync('src/app/left-sidebar.ts', code, 'utf8');
console.log("Fixed sidebar");
