const fs = require('fs');
let code = fs.readFileSync('src/app/left-sidebar.ts', 'utf8');

const startStr = "@if (store.settings().inputSource === 'neon-flex') {";
let start = code.indexOf(startStr);
if (start === -1) {
  console.log("Start not found");
  process.exit(1);
}

// Find the end by looking for the next @if or <!-- GLOBAL SETTINGS -->
let endStr = "                  <!-- GLOBAL SETTINGS -->";
let end = code.indexOf(endStr, start);
if (end === -1) {
  console.log("End not found");
  process.exit(1);
}

console.log(code.substring(start, start + 100));
console.log("... to ...");
console.log(code.substring(end - 100, end));
