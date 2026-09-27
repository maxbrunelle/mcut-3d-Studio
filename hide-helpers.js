const fs = require('fs');
let content = fs.readFileSync('src/app/viewport-3d.ts', 'utf8');

const effectCodeOld = `          this.scene.background = new THREE.Color('#050505'); // Dim room
          this.ambientLight.intensity = 0.05;
          this.dirLight.intensity = 0.05;
          if (this.wallMesh) this.wallMesh.visible = true;`;

const effectCodeNew = `          this.scene.background = new THREE.Color('#050505'); // Dim room
          this.ambientLight.intensity = 0.05;
          this.dirLight.intensity = 0.05;
          if (this.wallMesh) this.wallMesh.visible = true;
          if (this.buildPlateMesh) this.buildPlateMesh.visible = false;
          const axes = this.scene.children.find(c => c.type === 'AxesHelper');
          if (axes) axes.visible = false;`;

content = content.replace(effectCodeOld, effectCodeNew);

const effectCodeOld2 = `          this.scene.background = new THREE.Color(isDark ? '#0f172a' : '#eef2f5');
          if (this.ambientLight) this.ambientLight.intensity = 0.6;
          if (this.dirLight) this.dirLight.intensity = 0.8;
          if (this.wallMesh) this.wallMesh.visible = false;`;

const effectCodeNew2 = `          this.scene.background = new THREE.Color(isDark ? '#0f172a' : '#eef2f5');
          if (this.ambientLight) this.ambientLight.intensity = 0.6;
          if (this.dirLight) this.dirLight.intensity = 0.8;
          if (this.wallMesh) this.wallMesh.visible = false;
          if (this.buildPlateMesh) this.buildPlateMesh.visible = settings.showBuildPlate;
          const axes = this.scene.children.find(c => c.type === 'AxesHelper');
          if (axes) axes.visible = true;`;

content = content.replace(effectCodeOld2, effectCodeNew2);

fs.writeFileSync('src/app/viewport-3d.ts', content, 'utf8');
