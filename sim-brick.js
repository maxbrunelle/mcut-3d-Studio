const fs = require('fs');

let content = fs.readFileSync('src/app/viewport-3d.ts', 'utf8');

const brickFunc = `
function createBrickTextures() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = 1024;
  normalCanvas.height = 1024;
  const nCtx = normalCanvas.getContext('2d');

  if (!ctx || !nCtx) return { texture: null, normalMap: null };

  // Base mortar
  ctx.fillStyle = '#1c1918';
  ctx.fillRect(0, 0, 1024, 1024);
  
  // Normal map mortar (flat)
  nCtx.fillStyle = 'rgb(128, 128, 255)';
  nCtx.fillRect(0, 0, 1024, 1024);
  
  // Darker, realistic brick colors
  const brickColors = ['#4a332d', '#523731', '#422c26', '#4a2f29', '#3d2621', '#5e3a32'];
  
  const rows = 24;
  const cols = 12;
  const brickH = 1024 / rows;
  const brickW = 1024 / cols;
  const mortar = 6;
  
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2 === 0) ? 0 : brickW / 2;
    for (let c = -1; c < cols + 1; c++) {
      ctx.fillStyle = brickColors[Math.floor(Math.random() * brickColors.length)];
      const x = c * brickW + offset + mortar/2;
      const y = r * brickH + mortar/2;
      const w = brickW - mortar;
      const h = brickH - mortar;
      
      // Color
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x, y, w, h * 0.15); // Top shadow
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(x, y + h * 0.85, w, h * 0.15); // Bottom highlight

      // Normal map
      const grad = nCtx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, 'rgb(128, 160, 255)'); 
      grad.addColorStop(1, 'rgb(128, 96, 255)'); 
      nCtx.fillStyle = grad;
      nCtx.fillRect(x, y, w, h);
      
      nCtx.fillStyle = 'rgb(160, 128, 255)'; // Right edge
      nCtx.fillRect(x + w - 3, y, 3, h);
      nCtx.fillStyle = 'rgb(96, 128, 255)'; // Left edge
      nCtx.fillRect(x, y, 3, h);
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  texture.colorSpace = THREE.SRGBColorSpace;
  
  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(10, 10);

  return { texture, normalMap };
}

@Component({`;

content = content.replace('@Component({', brickFunc);

const oldSetup = `    // Simulation Wall
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
    this.scene.add(this.ledGlowLight);`;

const newSetup = `    // Simulation Wall
    const { texture: brickTex, normalMap: brickNormal } = createBrickTextures();
    const wallGeo = new THREE.PlaneGeometry(5000, 5000);
    const wallMat = new THREE.MeshStandardMaterial({ 
      color: '#ffffff', 
      map: brickTex || null,
      normalMap: brickNormal || null,
      roughness: 0.9, 
      metalness: 0.0 
    });
    this.wallMesh = new THREE.Mesh(wallGeo, wallMat);
    // Position wall behind everything
    this.wallMesh.position.z = -10;
    this.wallMesh.visible = false;
    this.scene.add(this.wallMesh);
    
    // LED Glow Light (ambient fallback)
    this.ledGlowLight = new THREE.PointLight(0xffffff, 0, 3500, 1.2);
    this.ledGlowLight.position.set(0, 0, -2); // Behind the sign to wash the wall
    this.scene.add(this.ledGlowLight);`;

content = content.replace(oldSetup, newSetup);

fs.writeFileSync('src/app/viewport-3d.ts', content, 'utf8');
