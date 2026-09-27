const fs = require('fs');
let code = fs.readFileSync('src/app/left-sidebar.ts', 'utf8');

const target = `                    <!-- Acrylic Mounting Method (Inline CNC vs Surface) -->`;
const index = code.indexOf(target);
if (index !== -1) {
  // Find where this div ends
  const blockStart = code.indexOf('<div class="space-y-1">', index);
  // Actually I can just replace the description and add the slider after it.
  const pTagEnd = code.indexOf('</p>', blockStart) + 4;
  
  const sliderHtml = `
                      @if ((store.settings().neonMountingTrack || 'both') === 'cnc-groove') {
                        <div class="pt-2">
                          <ng-container *ngTemplateOutlet="sliderParam; context: { label: 'Groove Depth', key: 'neonCncGrooveDepth', value: store.settings().neonCncGrooveDepth || 2, min: 1, max: Math.min(store.settings().neonBackplateThickness || 5, 8), step: 0.5, unit: 'mm' }"></ng-container>
                        </div>
                      }`;
  
  code = code.slice(0, pTagEnd) + sliderHtml + code.slice(pTagEnd);
  fs.writeFileSync('src/app/left-sidebar.ts', code, 'utf8');
  console.log("Patched groove slider");
}
