import * as THREE from './node_modules/three/build/three.module.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// scene.background = new THREE.Color(0, 0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

const loader = new GLTFLoader();

let targetScale = window.innerWidth / 1000;
let currentItemLoaded = 0;


let model;

loader.load('./public/3DModels/dice/scene.gltf', (gltf) => {
  model = gltf.scene;
  scene.add(model);
  itemLoaded();
}, undefined, (error) => {
  console.error(error);
});

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);


camera.position.z = 5;

function animate() {
  requestAnimationFrame(animate);

  if (model) {
    model.rotation.y += 0.01;
  }

  renderer.render(scene, camera);
}

animate();

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  
    // Set target scale based on viewport width
    targetScale = window.innerWidth / 1000;
}

window.addEventListener('resize', onWindowResize, false);

// Call onWindowResize() once at the beginning to ensure correct sizing
onWindowResize();

// Loading screen logifc
const loadingScreen = document.getElementById('loading-screen');
const loadingText = document.getElementById('loading-text');
const jobTitle = document.getElementById('job-title');
const progressBar = document.getElementById('progress');
const jobTitles = ['Gamer', 'a Programmer', 'a Technical Artist','a Homo Ludens', 'XIAO'];
let totalItemsToLoad = 1;
let currentJobTitleIndex = 0;

//Loading Screen Finished
function itemLoaded() {
    currentItemLoaded++;
    updateProgressBar();
    
    if (currentItemLoaded >= totalItemsToLoad && currentJobTitleIndex >= jobTitles.length) {
      setTimeout(() => {
        loadingScreen.style.opacity = '0';
        document.getElementById('content-container').style.opacity = '1';
        loadingScreen.style.zIndex = '-1';
      }, 1000);
    }
}

function updateProgressBar() {
  const progress = document.querySelector('#progress');
  const currentWidth = parseInt(window.getComputedStyle(progress).getPropertyValue('width'));
  const newWidth = Math.round(((currentItemLoaded + currentJobTitleIndex) / (totalItemsToLoad + jobTitles.length)) * 100);
  progress.style.width = newWidth + '%';
}

function cycleJobTitles(callback) {
    let cycleInterval = setInterval(() => {
      currentJobTitleIndex++;
      if (currentJobTitleIndex >= jobTitles.length) {
        clearInterval(cycleInterval);
        itemLoaded();
        callback();
      } else {
        // Fade out the previous job title
        jobTitle.classList.add('fade-out');
        setTimeout(() => {
          jobTitle.textContent = jobTitles[currentJobTitleIndex];
          // Fade in the new job title
          jobTitle.classList.remove('fade-out');
          jobTitle.classList.add('fade-in');
          setTimeout(() => {
            jobTitle.classList.remove('fade-in');
          }, 500);
  
          // Add a delay before updating the progress bar
          setTimeout(() => {
            updateProgressBar();
          }, 1000);
        }, 500);
      }
    }, 1500);
  }


cycleJobTitles(() => {
  itemLoaded();
});


const canvas = document.getElementById("drawing-canvas");
const ctx = canvas.getContext("2d");

// Set the canvas size to match the loading screen size
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

canvas.addEventListener("mousemove", (e) => {
  ctx.beginPath();
  ctx.arc(e.clientX, e.clientY, 2, 0, Math.PI * 2);
  ctx.fill();
});

const bgcanvas = document.getElementById('bgcanvas');
const drawingCanvas = document.getElementById('drawing-canvas');

bgcanvas.width = window.innerWidth;
bgcanvas.height = window.innerHeight;
bgcanvas.getContext('2d').drawImage(drawingCanvas, 0, 0, bgcanvas.width, bgcanvas.height);
