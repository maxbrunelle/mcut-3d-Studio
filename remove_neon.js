const fs = require('fs');
let code = fs.readFileSync('src/app/left-sidebar.ts', 'utf8');

// Remove the button
const buttonStart = code.indexOf('<!-- Neon Flex Mode -->');
if (buttonStart !== -1) {
  const buttonEnd = code.indexOf('</button>', buttonStart) + '</button>'.length;
  code = code.substring(0, buttonStart) + code.substring(buttonEnd);
}

// Remove the panel
const panelStart = code.indexOf("@if (store.settings().inputSource === 'neon-flex') {");
if (panelStart !== -1) {
  const panelEnd = code.indexOf('<!-- SVG / Vector Upload Mode -->', panelStart);
  if (panelEnd !== -1) {
    code = code.substring(0, panelStart) + code.substring(panelEnd);
  }
}

fs.writeFileSync('src/app/left-sidebar.ts', code, 'utf8');
console.log("Neon flex UI removed from sidebar");
