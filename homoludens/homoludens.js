function appear() {
  const elements = document.querySelectorAll('.transfadein');
  elements.forEach((element) => {
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)'; /* Set the final position */
  });
}

appear();

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// const scene = new THREE.Scene();

// const myCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

const loader = new GLTFLoader();

// Rotate control
const controls = new OrbitControls(myCamera, renderer.domElement);
controls.enablePan = false;

let targetScale = window.innerWidth / 1000;
let currentItemLoaded = 0;

let model;

loader.load('./3DModels/cozy_campfire_-_shape_key_animation/scene.gltf', (gltf) => {
  model = gltf.scene;
  scene.add(model);
  model.position.x = -5;
  const fireLight = new THREE.PointLight(0xCD3B40, 2, 50);
  model.add(fireLight);

  myCamera.position.x = 30;
  myCamera.position.y = 60;
  myCamera.position.z = 80;

  model.traverse((node) => {
    if (node.isMesh) {
      if (node.material.emissiveMap) {
        node.material.emissiveIntensity = 200;
      }
    }
  });
  // resetLandingPage();
  // rotateModel(0, (4 * Math.PI) / 4, 0); // Rotate the model to another degree
  // TweenMax.to(myCamera.position, 1, { x: -10.9, y: 3.7, z: 3.4 });
  // infoDiv.style.display = 'block';
  itemLoaded();
}, undefined, (error) => {
  console.error(error);
});

function animate() {
  requestAnimationFrame(animate);

  // Update the controls
  controls.update();

  // Render the scene
  renderer.render(scene, myCamera);
}

// Call the animate function
animate();

function onWindowResize() {
  myCamera.aspect = window.innerWidth / window.innerHeight;
  myCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Set target scale based on viewport width
  targetScale = window.innerWidth / 1000;
}

window.addEventListener('resize', onWindowResize, false);

// Call onWindowResize() once at the beginning to ensure correct sizing
onWindowResize();

// Rotate the model based on selection
function rotateModel(x, y, z) {
  if (model) {
    TweenMax.to(model.rotation, 1, { x: x, y: y, z: z });
  }
}


const resetBtn = document.getElementById("reset-btn");
const stellaruneBtn = document.getElementById("stellarune-btn");
const freefall2Btn = document.getElementById("freefall2-btn");
const blogsBtn = document.getElementById("blogs-btn");
const aboutBtn = document.getElementById("About-btn");
const HomoLudenBtn = document.getElementById("homo-ludens");

resetBtn.addEventListener("click", () => {
  resetLandingPage();
  rotateModel(0, 0, 0); // Reset the model's rotation
  TweenMax.to(myCamera.position, 1, { x: 30, y: 60, z: 80 });
});

stellaruneBtn.addEventListener("click", () => {
  resetLandingPage();
  rotateModel(0, Math.PI / 4, 0); // Rotate the model to a certain degree
  TweenMax.to(myCamera.position, 1, { x: 0, y: 0, z: 5 });
});

freefall2Btn.addEventListener("click", () => {
  resetLandingPage();
  rotateModel(0, Math.PI / 2, 0); // Rotate the model to another degree
  TweenMax.to(myCamera.position, 1, { x: 0, y: 0, z: 5 });
});

blogsBtn.addEventListener("click", () => {
  resetLandingPage();
  rotateModel(0, (3 * Math.PI) / 4, 0); // Rotate the model to another degree
  TweenMax.to(myCamera.position, 1, { x: 0, y: 0, z: 5 });
});

aboutBtn.addEventListener("click", () => {
  resetLandingPage();
  rotateModel(0, (4 * Math.PI) / 4, 0); // Rotate the model to another degree
  TweenMax.to(myCamera.position, 1, { x: 0, y: 0, z: 5 });
});

const infoDiv = document.getElementById('homo-ludens-info');
HomoLudenBtn.addEventListener("click", () => {
  resetLandingPage();
  rotateModel(0, (4 * Math.PI) / 4, 0); // Rotate the model to another degree
  TweenMax.to(myCamera.position, 1, { x: -10.9, y: 3.7, z: 3.4 });
  infoDiv.style.display = 'block';
});

function resetLandingPage() {
  infoDiv.style.display = 'none';
}