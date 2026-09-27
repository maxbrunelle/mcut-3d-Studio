import * as THREE from 'three';

const camera = new THREE.PerspectiveCamera();
camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);
console.log("Front (+Z):", new THREE.Euler().setFromQuaternion(camera.quaternion));

camera.position.set(100, 0, 0);
camera.lookAt(0, 0, 0);
console.log("Right (+X):", new THREE.Euler().setFromQuaternion(camera.quaternion));

camera.position.set(0, 100, 0);
camera.lookAt(0, 0, 0);
console.log("Top (+Y):", new THREE.Euler().setFromQuaternion(camera.quaternion));

