const fs = require('fs');

let content = fs.readFileSync('src/app/left-sidebar.ts', 'utf8');

const methods = `
  exportSTL() {
    window.dispatchEvent(new CustomEvent('export-stl'));
  }
  
  exportSVGAcrylic() {
    window.dispatchEvent(new CustomEvent('export-svg-acrylic'));
  }
  
  exportSVGBase() {
    window.dispatchEvent(new CustomEvent('export-svg-base'));
  }
`;

const insertIndex = content.lastIndexOf('}');
if (insertIndex !== -1) {
  content = content.substring(0, insertIndex) + methods + content.substring(insertIndex);
  fs.writeFileSync('src/app/left-sidebar.ts', content, 'utf8');
  console.log("Methods added successfully.");
} else {
  console.error("Could not find class end");
}
