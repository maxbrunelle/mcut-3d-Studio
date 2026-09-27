const fs = require('fs');

let content = fs.readFileSync('src/app/viewport-3d.ts', 'utf8');

const effectBlock = `          const axes = this.scene.children.find(c => c.type === 'AxesHelper');
          if (axes) axes.visible = false;
          
          if (settings.ledEnabled) {`;
          
const replacement = `          const axes = this.scene.children.find(c => c.type === 'AxesHelper');
          if (axes) axes.visible = false;
          if (this.pivotGroup) this.pivotGroup.rotation.x = 0; // Stand up!
          
          if (settings.ledEnabled) {`;

content = content.replace(effectBlock, replacement);


const effectBlock2 = `          const axes = this.scene.children.find(c => c.type === 'AxesHelper');
          if (axes) axes.visible = true;
          if (this.ledGlowLight) this.ledGlowLight.intensity = 0;`;
          
const replacement2 = `          const axes = this.scene.children.find(c => c.type === 'AxesHelper');
          if (axes) axes.visible = true;
          if (this.pivotGroup) this.pivotGroup.rotation.x = -Math.PI / 2; // Lay flat
          if (this.ledGlowLight) this.ledGlowLight.intensity = 0;`;

content = content.replace(effectBlock2, replacement2);

fs.writeFileSync('src/app/viewport-3d.ts', content, 'utf8');
