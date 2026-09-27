import * as THREE from 'three';

const camera = new THREE.PerspectiveCamera();
camera.position.set(100, 0, 0); // Right side
camera.lookAt(0, 0, 0);

// We want to see the Right face.
// The Right face is at rotateY(90deg) translateZ(28px).
// So to face the viewer, the cube needs to rotate -90deg around Y.
// Let's see what CSS rotateY(-90deg) does:
// Since CSS Y is down, a positive rotation around Y (down) turns the front face to the right (from viewer's perspective).
// So rotateY(90deg) makes the left face visible.
// rotateY(-90deg) makes the right face visible.
// Wait, is that true?
// Let's test the math.
