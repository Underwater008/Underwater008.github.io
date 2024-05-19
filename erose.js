import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import lottie from 'https://cdn.skypack.dev/lottie-web';

// Import shaders
import roseVertexShader from './roseVertaxShader.glsl';
import roseFragmentShader from './roseFragmentShader.glsl';

let scene, camera, controls, rotateSpeed, renderer, ambientLight, directionalLight, loader, roseModel;
let roseMaterial;

const grid = [];
const maxCubes = 1024; // Maximum number of cubes to handle
// Control variables
const movementSpeed = 0.01; // Speed at which cubes move
const generationThreshold = 100; // Threshold for generating a new cube based on audio data
const directionX = 1; // Direction for x-axis movement (-1 for left, 1 for right)
const directionY = 0; // Direction for y-axis movement (-1 for down, 1 for up)
const directionZ = 0; // Direction for z-axis movement (-1 for backward, 1 for forward)
const spacing = 0.15; // Spacing between cubes
const yRange = 0.5; // Range for random x position
const beatInterval = 600; // Interval in milliseconds (e.g., 250ms for a 4/4 beat at 240 BPM)

let audio, source, audioContext, analyser, dataArray, bufferLength;

let audioButtonAnimation, audioButtonPlane;


setup();
setupAudio();
createRose();
createCubeGrid(4, 0.18)
animate();
setupAudioButton()

//createDisplays(1, 1, 'video', './videos/3D_Rose_Result.mp4')

function setup() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFFFFF); // Black background

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('threeDScene').appendChild(renderer.domElement); // Add to page

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 2;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    controls = new OrbitControls(camera, renderer.domElement);
    rotateSpeed = 0.001
    controls.update();

    // Add Lighting
    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    document.addEventListener('mousedown', onDocumentMouseDown, false);

}

function setupAudio() {
    audio = new Audio('./audios/The Chainsmokers - Roses (Audio) ft. ROZES (320).mp3');
    audioContext = new AudioContext();
    source = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 256;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    audio.autoplay = true
    audio.loop = true
    audio.play();
}

function setupAudioButton() {
    let animationContainer = document.getElementById('lottie-container');
    audioButtonAnimation = lottie.loadAnimation({
        container: animationContainer,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        path: '../images/eroseAudioWave.json' // Path to your Lottie JSON file
    });

    // Start the audio and animation together
    audioButtonAnimation.addEventListener('DOMLoaded', function() {
        audio.play();
        audioButtonAnimation.play();
    });

    // Toggle audio and reset animation on click
    animationContainer.addEventListener('click', function() {
        if (!audio.paused) {
            audio.pause();
            audioButtonAnimation.goToAndStop(0, true); // Reset animation to the first frame
        } else {
            audio.play();
            audioButtonAnimation.play();
            rotateSpeed = 0.001;
        }
    });

    function syncState(){
        requestAnimationFrame(syncState);
        // Check the state of the audio and adjust the animation accordingly
        if (audio.paused) {
            audioButtonAnimation.pause(); // Ensure the animation is paused if the audio is paused
            rotateSpeed = 0.0
        } else {
            if (audioButtonAnimation.isPaused) {
                audioButtonAnimation.play(); // Resume animation only if it was paused
            }
        }
    }

    syncState()
}

function createRose() {
    // Load 3D Model with Custom Shader
    loader = new GLTFLoader();
    loader.load('./3DModels/3dRose.glb', function(gltf) {
        roseModel = gltf.scene;
        roseMaterial = roseModel.children[0].material;

        const originalTexture = roseMaterial.map; // Extract the original texture


        roseModel.traverse(function(node) {
            if (node.isMesh) {
                node.material = new THREE.ShaderMaterial({
                    vertexShader: roseVertexShader,
                    fragmentShader: roseFragmentShader,
                    uniforms: {
                        iTime: { value: 0 },
                        iSpeed: { value: 0.01 }, // Initial speed value
                        iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                        iGridSize: { value: 8.0 }, // Initial grid size value
                        iFrequency: { value: 30.0 }, // Initial frequency value
                        iBrightness: { value: 5.0 }, // Initial brightness value
                        iTextScale: { value: 8.0 }, // Initial text scale value
                        iChannel0: { value: new THREE.TextureLoader().load('./images/rainCh1.png') },
                        iChannel1: { value: new THREE.TextureLoader().load('./images/rainCh2.png') },
                        iOriginalColor: { value: originalTexture }, // Set the extracted original texture
                        iAudioData: { value: 0.0 }, // New uniform for audio data
                        iScale: { value: 0.2 } // New uniform for scale

                    }
                });
            }
        });

        roseModel.scale.set(4, 4, 4)
        scene.add(roseModel);
        console.log('Model loaded successfully');
    }, undefined, function(error) {
        console.error('Error loading model:', error);
    });

}

function createCubeGrid(size, cubeSize) {
    const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Set color to black
    let lastCubeTime = performance.now(); // Timestamp of the last cube generation

    function addCube(yPosition, zPosition) {
        const randomY = (Math.random() - 0.5) * yRange * 2; // Random x position within [-xRange, xRange]
        const cube = new THREE.Mesh(geometry, cubeMaterial);
        cube.position.set(0, yPosition + randomY - 0.5, zPosition - 1.2);
        scene.add(cube);
        grid.push(cube);

        // Limit the number of cubes in the grid
        if (grid.length > maxCubes) {
            const oldCube = grid.shift();
            scene.remove(oldCube);
        }
    }

    function animateCubes() {
        requestAnimationFrame(animateCubes);

        const currentTime = performance.now(); // Current timestamp

        // Get audio data
        analyser.getByteFrequencyData(dataArray);

        // Generate cubes at specific time intervals
        if (currentTime - lastCubeTime >= beatInterval) {
            lastCubeTime = currentTime; // Update the timestamp of the last cube generation
            let cubesGenerated = 0;
            for (let i = 0; i < dataArray.length; i += Math.floor(dataArray.length / (size * size))) {
                const value = dataArray[i];
                if (value > generationThreshold) { // Threshold for generating a new cube
                    const yPosition = (i % size) * cubeSize;
                    const zPosition = Math.floor(i / size) * spacing;
                    addCube(yPosition, zPosition);
                    cubesGenerated++;
                }
            }
        }

        // Move existing cubes based on direction and speed
        grid.forEach(cube => {
            cube.position.x += movementSpeed * directionX;
            cube.position.y += movementSpeed * directionY;
            cube.position.z += movementSpeed * directionZ;
        });

        // Remove cubes that move out of view
        for (let i = grid.length - 1; i >= 0; i--) {
            if (Math.abs(grid[i].position.x) > 10 || Math.abs(grid[i].position.y) > 10 || Math.abs(grid[i].position.z) > 10) {
                scene.remove(grid[i]);
                grid.splice(i, 1);
            }
        }

        renderer.render(scene, camera);
    }

    animateCubes();
}

// function createDisplays(width, height, sourceType, source) {
//     let textureVid = document.createElement("video");
//     textureVid.src = './videos/3D_Rose_Result.mp4'; // Path to the MP4 video file converted from GIF
//     textureVid.loop = true;
//     textureVid.muted = true; // Important for autoplay in most browsers
//     textureVid.autoplay = true; // Attempt to autoplay the video
//     textureVid.play(); // Ensure the video plays
//
// // Create a video texture from the video element
//     let videoTexture = new THREE.VideoTexture(textureVid);
//     videoTexture.format = THREE.RGBFormat;
//     videoTexture.minFilter = THREE.LinearFilter; // Using LinearFilter for better quality
//     videoTexture.magFilter = THREE.LinearFilter;
//     videoTexture.generateMipmaps = false;
//
// // Create a mesh using a sphere geometry and the video texture
//     let geometry = new THREE.PlaneGeometry(1, 1); // Use more segments for a smoother sphere
//     let material = new THREE.MeshBasicMaterial({ map: videoTexture });
//     let mesh = new THREE.Mesh(geometry, material);
//     scene.add(mesh);
//     mesh.position.set(-1, 0, 0)
// }

// Animation
function animate() {
    requestAnimationFrame(animate);

    controls.update();

    if (roseModel) {
        roseModel.rotation.y += rotateSpeed; // Rotate model
        roseModel.traverse(function(node) {
            if (node.isMesh && node.material.uniforms) {
                node.material.uniforms.iTime.value += 0.05; // Update time uniform
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((sum, value) => sum + value) / dataArray.length;
                node.material.uniforms.iAudioData.value = average / 256.0; // Normalize the average to a 0.0 - 1.0 range

            }
        });
    }

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function onDocumentMouseDown(event) {
    event.preventDefault();

    // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        // Check if the first intersected object is the rose model
        const clickedObject = intersects[0].object;

        // Ensure AudioContext is resumed on user gesture
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('AudioContext resumed');
            });
        }

        // Pause or resume the audio if the model is clicked
        if (clickedObject.parent === roseModel || clickedObject === audioButtonPlane) {
            if (audio.paused) {
                audio.play();
                rotateSpeed = 0.001;
            } else {
                rotateSpeed = 0.0;
                audio.pause();
                audioButtonAnimation.goToAndStop(0, true); // Reset animation to the first frame
            }
        }
    }
}

