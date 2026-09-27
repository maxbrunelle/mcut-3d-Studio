const fs = require('fs');
let content = fs.readFileSync('src/app/viewport-3d.ts', 'utf8');

const effectBlock = `
    effect(() => {
      const isDark = this.store.isDarkMode();
      if (this.scene) {
        this.scene.background = new THREE.Color(isDark ? '#0f172a' : '#eef2f5');
        
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
`;

content = content.replace("constructor() {", "constructor() {" + effectBlock);
fs.writeFileSync('src/app/viewport-3d.ts', content, 'utf8');
