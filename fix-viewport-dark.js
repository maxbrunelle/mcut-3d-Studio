const fs = require('fs');
let content = fs.readFileSync('src/app/viewport-3d.ts', 'utf8');

content = content.replace(
  "import { Component, ElementRef, ViewChild, HostListener, inject, effect } from '@angular/core';",
  "import { Component, ElementRef, ViewChild, HostListener, inject, effect } from '@angular/core';"
);

// We need to make sure we store gridHelper and axesHelper if they aren't.
// Actually, let's just use effect inside constructor.

const effectSnippet = `
  constructor() {
    effect(() => {
      if (this.store.settings()) {
        this.updateGeometry();
      }
    });

    effect(() => {
      const isDark = this.store.isDarkMode();
      if (this.scene) {
        this.scene.background = new THREE.Color(isDark ? '#0f172a' : '#eef2f5');
        
        // Find and replace grid helper if we need to change its color
        const oldGrid = this.scene.children.find(c => c.type === 'GridHelper');
        if (oldGrid) {
          this.scene.remove(oldGrid);
          const gridHelper = new THREE.GridHelper(2000, 40, isDark ? '#4338ca' : '#a5b4fc', isDark ? '#334155' : '#d1d5db');
          gridHelper.material.opacity = 0.4;
          gridHelper.material.transparent = true;
          this.scene.add(gridHelper);
        }
      }
    });
  }
`;

// Replace the old constructor/effect
content = content.replace(/constructor\(\)\s*\{\s*effect\(\(\)\s*=>\s*\{\s*if\s*\(this\.store\.settings\(\)\)\s*\{\s*this\.updateGeometry\(\);\s*\}\s*\}\);\s*\}/, effectSnippet);

// We also need to fix left-sidebar.ts to have bg-[#f8fafc] changed to bg-[#f8fafc] dark:bg-slate-900 etc. properly.

fs.writeFileSync('src/app/viewport-3d.ts', content, 'utf8');
