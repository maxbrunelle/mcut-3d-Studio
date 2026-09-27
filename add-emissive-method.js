const fs = require('fs');

let content = fs.readFileSync('src/app/viewport-3d.ts', 'utf8');

const updateEmissiveMethod = `  private updateEmissiveMaterials() {
    if (!this.lettersGroup) return;
    const isSimulation = this.store.activeTab() === 'simulation';
    const settings = this.store.settings();
    
    this.lettersGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Find acrylic materials and update them
        // If it's a multi-material, traverse materials
        const updateMaterial = (mat) => {
          if (mat && mat.userData && mat.userData.isAcrylic) {
            if (isSimulation && settings.ledEnabled) {
              mat.emissive.set(settings.ledColor);
              mat.emissiveIntensity = 2; // Strong glow
            } else {
              mat.emissive.setHex(0x000000);
              mat.emissiveIntensity = 0;
            }
            mat.needsUpdate = true;
          }
        };

        if (Array.isArray(child.material)) {
          child.material.forEach(updateMaterial);
        } else {
          updateMaterial(child.material);
        }
      }
    });
  }

  private initThree() {`;

content = content.replace('  private initThree() {', updateEmissiveMethod);

// I need to make sure we mark acrylic materials with userData.isAcrylic = true when they are created
content = content.replace(/const acrylicMaterial = new THREE.MeshStandardMaterial\(\{(.*?)\}\);/g, 
  "const acrylicMaterial = new THREE.MeshStandardMaterial({$1}); acrylicMaterial.userData.isAcrylic = true;");
content = content.replace(/const coverMaterial = new THREE.MeshStandardMaterial\(\{(.*?)\}\);/g, 
  "const coverMaterial = new THREE.MeshStandardMaterial({$1}); coverMaterial.userData.isAcrylic = true;");
content = content.replace(/const matLight = new THREE.MeshStandardMaterial\(\{(.*?)\}\);/g, 
  "const matLight = new THREE.MeshStandardMaterial({$1}); matLight.userData.isAcrylic = true;");

fs.writeFileSync('src/app/viewport-3d.ts', content, 'utf8');
