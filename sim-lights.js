const fs = require('fs');

let content = fs.readFileSync('src/app/viewport-3d.ts', 'utf8');

// 1. Add class properties
content = content.replace(
  'private buildPlateMesh!: THREE.Mesh;',
  'private buildPlateMesh!: THREE.Mesh;\n  private wallMesh!: THREE.Mesh;\n  private ambientLight!: THREE.AmbientLight;\n  private dirLight!: THREE.DirectionalLight;\n  private ledGlowLight!: THREE.PointLight;'
);

// 2. Modify initThree to save lights and create wallMesh
const initThreeLightsOld = `    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(200, 500, 300);`;
const initThreeLightsNew = `    // Lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.dirLight.position.set(200, 500, 300);`;
content = content.replace(initThreeLightsOld, initThreeLightsNew);

const afterAxesHelper = `    this.scene.add(axesHelper);`;
const insertWallMesh = `    this.scene.add(axesHelper);

    // Simulation Wall
    const wallGeo = new THREE.PlaneGeometry(5000, 5000);
    const wallMat = new THREE.MeshStandardMaterial({ color: '#1f2937', roughness: 0.9, metalness: 0.1 });
    this.wallMesh = new THREE.Mesh(wallGeo, wallMat);
    // Position wall behind everything
    this.wallMesh.position.z = -10;
    this.wallMesh.visible = false;
    this.scene.add(this.wallMesh);
    
    // LED Glow Light (ambient fallback)
    this.ledGlowLight = new THREE.PointLight(0xffffff, 0, 2000);
    this.ledGlowLight.position.set(0, 0, 50);
    this.scene.add(this.ledGlowLight);
`;
content = content.replace(afterAxesHelper, insertWallMesh);

// 3. Update constructor effect to handle simulation mode
const effectRegex = /effect\(\(\) => \{\s*const isDark = this\.store\.isDarkMode\(\);[\s\S]*?this\.scene\.add\(gridHelper\);\s*\}\s*\}\s*\}\);/;

const newEffect = `effect(() => {
      const isDark = this.store.isDarkMode();
      const isSimulation = this.store.activeTab() === 'simulation';
      const settings = this.store.settings();
      
      if (this.scene) {
        if (isSimulation) {
          this.scene.background = new THREE.Color('#050505'); // Dim room
          this.ambientLight.intensity = 0.05;
          this.dirLight.intensity = 0.05;
          if (this.wallMesh) this.wallMesh.visible = true;
          
          if (settings.ledEnabled) {
            this.ledGlowLight.color.set(settings.ledColor);
            this.ledGlowLight.intensity = 5;
          } else {
            this.ledGlowLight.intensity = 0;
          }
        } else {
          this.scene.background = new THREE.Color(isDark ? '#0f172a' : '#eef2f5');
          if (this.ambientLight) this.ambientLight.intensity = 0.6;
          if (this.dirLight) this.dirLight.intensity = 0.8;
          if (this.wallMesh) this.wallMesh.visible = false;
          if (this.ledGlowLight) this.ledGlowLight.intensity = 0;
        }
        
        const oldGrid = this.scene.children.find(c => c.type === 'GridHelper');
        if (oldGrid) {
          this.scene.remove(oldGrid);
          if (!isSimulation) {
             const gridHelper = new THREE.GridHelper(2000, 40, isDark ? '#4338ca' : '#a5b4fc', isDark ? '#334155' : '#d1d5db');
             gridHelper.material.opacity = 0.4;
             gridHelper.material.transparent = true;
             this.scene.add(gridHelper);
          }
        }
        
        // Update emissive on acrylic materials
        this.updateEmissiveMaterials();
      }
    });`;

content = content.replace(effectRegex, newEffect);

fs.writeFileSync('src/app/viewport-3d.ts', content, 'utf8');
