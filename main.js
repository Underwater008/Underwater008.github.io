import * as THREE from 'three';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader';

const showLoadingScreen = true;
const firstVisit = localStorage.getItem("firstVisit") === null;

const scene = new THREE.Scene();

const myCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

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
  model.traverse((node) => {
    if (node.isMesh) {
      if (node.material.emissiveMap) {
        node.material.emissiveIntensity = 200;
      }
    }
  });
  
  itemLoaded();
}, undefined, (error) => {
  console.error(error);
});

myCamera.position.x = 30;
myCamera.position.y = 60;
myCamera.position.z = 80;

const myCameraPos = myCamera.position;

function animate() {
  requestAnimationFrame(animate);

  // Update the controls
  controls.update();

  // Render the scene
  renderer.render(scene, myCamera);

  console.log(myCamera.position);
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
    TweenMax.to(model.rotation, 1, {x: x, y: y, z: z});
  }
}


const resetBtn = document.getElementById("reset-btn");
// const stellaruneBtn = document.getElementById("stellarune-btn");
// const freefall2Btn = document.getElementById("freefall2-btn");
const blogsBtn = document.getElementById("blogs-btn");
// const aboutBtn = document.getElementById("About-btn");
const HomoLudenBtn = document.getElementById("homo-ludens");

resetBtn.addEventListener("click", () => {
  resetLandingPage();
  rotateModel(0, 0, 0); // Reset the model's rotation
  TweenMax.to(myCamera.position, 1, { x: 30, y: 60, z: 80 });
});

// stellaruneBtn.addEventListener("click", () => {
//   resetLandingPage();
//   rotateModel(0, Math.PI / 4, 0); // Rotate the model to a certain degree
//   TweenMax.to(myCamera.position, 1, { x: 0, y: 0, z: 5 });
// });

// freefall2Btn.addEventListener("click", () => {
//   resetLandingPage();
//   rotateModel(0, Math.PI / 2, 0); // Rotate the model to another degree
//     TweenMax.to(myCamera.position, 1, { x: 0, y: 0, z: 5 });
// });

blogsBtn.addEventListener("click", () => {
  resetLandingPage();
  rotateModel(0, (3 * Math.PI) / 4, 0); // Rotate the model to another degree
  TweenMax.to(myCamera.position, 1, { x: 0, y: 0, z: 5 });
});

// aboutBtn.addEventListener("click", () => {
//   resetLandingPage();
//   rotateModel(0, (4 * Math.PI) / 4, 0); // Rotate the model to another degree
//   TweenMax.to(myCamera.position, 1, { x: 0, y: 0, z: 5 });
// });

const infoDiv = document.getElementById('homo-ludens-info');
HomoLudenBtn.addEventListener("click", () => {
  if(infoDiv.style.opacity != "0"){
    TweenMax.to(myCamera.position, 2, { x: -7.6, y: 2.58, z: 2.37, ease: Power2.easeInOut });
    rotateModel(0, (4 * Math.PI) / 4, 0); // Rotate the model to another degree
    return;
  }
  resetLandingPage();
  TweenMax.to(myCamera.position, 2, { x: -7.6, y: 2.58, z: 2.37, ease: Power2.easeInOut });
  rotateModel(0, (4 * Math.PI) / 4, 0); // Rotate the model to another degree
  setTimeout(() => {
    infoDiv.style.opacity = "1";
  }, 1500);
});

function resetLandingPage(){
  infoDiv.style.opacity = '0';
}

//////////// Loading screen logic ////////////
const loadingScreen = document.getElementById('loading-screen');
const loadingText = document.getElementById('loading-text');
const jobTitle = document.getElementById('job-title');
const progressBar = document.getElementById('progress');
const jobTitles = ['Gamer', 'a Programmer', 'a Technical Artist', 'a Homo Ludens', 'XIAO'];
let totalItemsToLoad = 1;
let currentJobTitleIndex = 0;

if (firstVisit) {
  cycleJobTitles();
} else {
  jobTitle.innerText = jobTitles[jobTitles.length - 1];
}

//Loading Screen Finished
function appear() {
  const elements = document.querySelectorAll('.transfadein');
  elements.forEach((element) => {
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)'; /* Set the final position */
  });
}

function itemLoaded() {
  currentItemLoaded++;
  updateProgressBar();

  if (currentItemLoaded >= totalItemsToLoad && (!firstVisit || currentJobTitleIndex >= jobTitles.length)) {
    setTimeout(() => {
      loadingText.style.opacity = '0';
      progressBar.style.opacity = '0';
      document.getElementById('content-container').style.opacity = '1';
      loadingScreen.style.zIndex = '-1';

      // Call the appear function after the loading screen is hidden
      appear();
      localStorage.setItem("firstVisit", "false");
    }, 1000);
  }
}

// Progress Bar
function updateProgressBar() {
  const progress = document.querySelector('#progress');
  const currentWidth = parseInt(window.getComputedStyle(progress).getPropertyValue('width'));
  const newWidth = Math.round(((currentItemLoaded + currentJobTitleIndex) / (totalItemsToLoad + (firstVisit ? jobTitles.length : 0))) * 100);
  progress.style.width = newWidth + '%';
}

function cycleJobTitles() {
  let cycleInterval = setInterval(() => {
    currentJobTitleIndex++;
    if (currentJobTitleIndex >= jobTitles.length) {
      clearInterval(cycleInterval);
      itemLoaded();
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


// Draw during Loading Screen
const canvas = document.getElementById("drawing-canvas");
const ctx = canvas.getContext("2d");

let points = [];

function resizeCanvas() {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  tempCanvas.getContext("2d").drawImage(canvas, 0, 0);

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  ctx.drawImage(tempCanvas, 0, 0);
}

// Set the canvas size initially
resizeCanvas();

// Update the canvas size when the window is resized
window.addEventListener("resize", resizeCanvas);

function draw(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();

  points.push({ x, y });
}

function redraw() {
  for (const point of points) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

canvas.addEventListener("mousemove", (e) => {
  draw(e.clientX, e.clientY);
});

canvas.addEventListener("touchmove", (e) => {
  // Prevent scrolling on touch devices
  e.preventDefault();

  // Get the touch position relative to the canvas
  const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
  const touchY = e.touches[0].clientY - canvas.getBoundingClientRect().top;

  draw(touchX, touchY);
});

window.addEventListener("resize", () => {
  redraw();
});

if (!showLoadingScreen) {
  const loadingScreen = document.getElementById('loading-screen');
  loadingScreen.style.display = 'none';
  document.getElementById('content-container').style.opacity = '1';
  appear();
}