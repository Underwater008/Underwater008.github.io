import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// Camera setup
const scale = 0.5;  // Smaller scale for a closer view
const aspectRatio = window.innerWidth / window.innerHeight;
const frustumSize = 10;  // Adjust this value as needed for your scene size

const left = frustumSize * aspectRatio / -2 * scale;
const right = frustumSize * aspectRatio / 2 * scale;
const top = frustumSize / 2 * scale;
const bottom = frustumSize / -2 * scale;
const near = 0.1;  // Closer near clipping plane
const far = 2000;  // Sufficiently distant far clipping plane

const camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
camera.position.set(0, 0, 500);
camera.lookAt(scene.position);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('threeDScene').appendChild(renderer.domElement);

// Create cubes
const particlesCount = 27; // 3*3*3
const cubeSize = 5;
const step = Math.cbrt(particlesCount);
const gridSpacing = cubeSize / step;
const cubeGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
cubeGeometry.center();
const originalMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
//const hoverMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

const cubes = [];

const halfStep = (step - 1) / 2;
for (let x = 0; x < step; x++) {
    for (let y = 0; y < step; y++) {
        for (let z = 0; z < step; z++) {
            const cube = new THREE.Mesh(cubeGeometry, originalMaterial.clone());
            cube.position.set(
                (x - halfStep) * gridSpacing,
                (y - halfStep) * gridSpacing,
                (z - halfStep) * gridSpacing
            );
            cube.targetScale = 1;  // Target scale for smooth transition
            scene.add(cube);
            cubes.push(cube);
        }
    }
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.1;

const raycaster = new THREE.Raycaster(undefined, undefined, 0, undefined);
const mouse = new THREE.Vector2();
let hitPoint = new THREE.Vector3();
let hasHit = false; // Flag to check if there was a hit

window.addEventListener('mousemove', (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubes);

    if (intersects.length > 0) {
        hitPoint.copy(intersects[0].point);
        hasHit = true;
    } else {
        hasHit = false;
    }
});

function animate() {
    requestAnimationFrame(animate);

    const maxScale = 2; // Maximum scale for the hovered cube
    const influenceRadius = 3; // Radius within which other cubes will be affected
    const falloffRate = 0.5; // Controls the rate at which the scale effect diminishes

    cubes.forEach(cube => {
        if (hasHit) {
            const distance = cube.position.distanceTo(hitPoint);
            if (distance < influenceRadius) {
                // Calculate scale based on distance using an exponential falloff
                const scale = maxScale * Math.exp(-falloffRate * distance);
                cube.targetScale = Math.max(1, scale);
            } else {
                cube.targetScale = 1; // Outside of influence radius, revert to original size
            }
        } else {
            cube.targetScale = 1; // No hit, all cubes revert to original size
        }

        // Smoothly interpolate towards the target scale
        cube.scale.lerp(new THREE.Vector3(cube.targetScale, cube.targetScale, cube.targetScale), 0.1);
    });

    renderer.render(scene, camera);
    controls.update();
}

animate();

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumHeight = camera.top - camera.bottom; // Retain the original frustum height

    // Adjust frustum dimensions to maintain the same scale
    camera.left = -frustumHeight * aspect / 2;
    camera.right = frustumHeight * aspect / 2;
    camera.top = frustumHeight / 2;
    camera.bottom = -frustumHeight / 2;

    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}