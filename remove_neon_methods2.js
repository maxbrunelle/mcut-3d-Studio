const fs = require('fs');
let code = fs.readFileSync('src/app/left-sidebar.ts', 'utf8');

const startIndex = code.indexOf('neonScriptFonts = computed(() => {');
if (startIndex !== -1) {
  // Find where it ends. Maybe around toggleNeonBackplateHoles?
  const endIndexStr = 'toggleNeonBackplateHoles(event: Event) {';
  const endIndex = code.indexOf(endIndexStr);
  if (endIndex !== -1) {
    const endBlock = code.indexOf('}', endIndex) + 1;
    code = code.substring(0, startIndex) + code.substring(endBlock);
  }
}

fs.writeFileSync('src/app/left-sidebar.ts', code, 'utf8');
console.log("Neon flex methods removed 2");
