import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import lottie from 'https://cdn.skypack.dev/lottie-web';

// Import shaders
import roseVertexShader from './roseVertaxShader.glsl';
import roseFragmentShader from './roseFragmentShader.glsl';
import notesVertexShader from './notesVertexShader.glsl';
import notesFragmentShader from './notesFragmentShader.glsl';

let scene, camera, controls, rotateSpeed, renderer, ambientLight, directionalLight, loader, roseModel;
let roseMaterial;

const grid = [];
const maxCubes = 5036; // Maximum number of cubes to handle
// Control variables
const movementSpeed = 0.01; // Speed at which cubes move
const generationThreshold = 135; // Threshold for generating a new cube based on roseAudio data
const directionX = -1; // Direction for x-axis movement (-1 for left, 1 for right)
const directionY = 0; // Direction for y-axis movement (-1 for down, 1 for up)
const directionZ = 0; // Direction for z-axis movement (-1 for backward, 1 for forward)
const spacing = 0.1; // Spacing between cubes
const yRange = 0.1; // Range for random x position
const beatInterval = 20; // Interval in milliseconds (e.g., 250ms for a 4/4 beat at 240 BPM)

const roseAudio = new Audio('../audios/The Chainsmokers - Roses (Audio) ft. ROZES (320).mp3');
const roseAudioContext = new AudioContext();
const roseAudioSource = roseAudioContext.createMediaElementSource(roseAudio);
const roseAudioAnalyser = roseAudioContext.createAnalyser();
roseAudioSource.connect(roseAudioAnalyser);
roseAudioAnalyser.connect(roseAudioContext.destination);
roseAudioAnalyser.fftSize = 256;
const roseAudioBufferLength = roseAudioAnalyser.frequencyBinCount;
const roseAudioDataArray = new Uint8Array(roseAudioBufferLength);
roseAudio.autoplay = true
roseAudio.loop = true
roseAudio.play();

let animationContainer, audioButtonAnimation;

setup();
createRose();
createCubeGrid(3, 0.18)
setupAudioButton()
animate();


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

function setupAudioButton() {

    animationContainer = document.getElementById('lottie-container');
    audioButtonAnimation = lottie.loadAnimation({
        container: animationContainer,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        path: '../images/eroseAudioWave.json' // Path to your Lottie JSON file
    });

    function syncState(){
        requestAnimationFrame(syncState);
        // Check the state of the roseAudio and adjust the animation accordingly
        if (roseAudio.paused) {
            audioButtonAnimation.pause(); // Ensure the animation is paused if the roseAudio is paused
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
    loader.load('../3DModels/3dRose.glb', function(gltf) {
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
                        iChannel0: { value: new THREE.TextureLoader().load('../images/rainCh1.png') },
                        iChannel1: { value: new THREE.TextureLoader().load('../images/rainCh2.png') },
                        iOriginalColor: { value: originalTexture }, // Set the extracted original texture
                        iAudioData: { value: 0.0 }, // New uniform for roseAudio data
                        iScale: { value: 0.2 }, // New uniform for scale
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

    function updateRose(){
        requestAnimationFrame(updateRose)

        if (roseModel) {
            roseModel.rotation.y += rotateSpeed; // Rotate model
            roseModel.traverse(function(node) {
                if (node.isMesh && node.material.uniforms) {
                    node.material.uniforms.iTime.value += 0.05; // Update time uniform
                    roseAudioAnalyser.getByteFrequencyData(roseAudioDataArray);
                    const average = roseAudioDataArray.reduce((sum, value) => sum + value) / roseAudioDataArray.length;
                    node.material.uniforms.iAudioData.value = average / 256.0; // Normalize the average to a 0.0 - 1.0 range

                }
            });
        }
    }

    updateRose()
}

function createCubeGrid(size, cubeSize) {
    const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const randomColor = new THREE.Color(Math.random(), Math.random(), Math.random());

    let lastCubeTime = performance.now(); // Timestamp of the last cube generation

    function addCube(yPosition, zPosition) {
        const randomY = (Math.random() - 0.5) * yRange * 2; // Random x position within [-xRange, xRange]
        const cubeMaterial = new THREE.ShaderMaterial({
            vertexShader: notesVertexShader,
            fragmentShader: notesFragmentShader,
        })
        let cloneMaterial = cubeMaterial.clone()
        const cube = new THREE.Mesh(geometry, cloneMaterial);
        cube.position.set(0, yPosition + randomY - 1.5, -(zPosition - 1.5));
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

        // Get roseAudio data
        roseAudioAnalyser.getByteFrequencyData(roseAudioDataArray);

        // Generate cubes at specific time intervals
        if (currentTime - lastCubeTime >= beatInterval) {
            lastCubeTime = currentTime; // Update the timestamp of the last cube generation
            let cubesGenerated = 0;
            for (let i = 0; i < roseAudioDataArray.length; i += Math.floor(roseAudioDataArray.length / (size * size))) {
                const value = roseAudioDataArray[i];
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

// Animation
function animate() {
    requestAnimationFrame(animate);

    controls.update();

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
        if (roseAudioContext.state === 'suspended') {
            roseAudioContext.resume().then(() => {
                console.log('AudioContext resumed');
            });
        }

        // Pause or resume the roseAudio if the model is clicked
        if (clickedObject.parent === roseModel) {
            if (roseAudio.paused) {
                roseAudio.play();
                rotateSpeed = 0.001;
            } else {
                rotateSpeed = 0.0;
                roseAudio.pause();
                audioButtonAnimation.goToAndStop(0, true); // Reset animation to the first frame
            }
        }
    }


}

// Toggle roseAudio and reset animation on click
animationContainer.addEventListener('click', function() {
    if (roseAudio.paused) {
        roseAudio.play();
        audioButtonAnimation.play();
        rotateSpeed = 0.001;
        roseAudioContext.resume().then(() => {
            console.log('AudioContext resumed');
        });

    } else {
        roseAudio.pause();
        audioButtonAnimation.goToAndStop(0, true); // Reset animation to the first frame
        rotateSpeed = 0.001;

    }

});

// Create waveform
function createWaveformWithCubes(scene, roseAudioAnalyser) {
    // Create parameters for the waveform
    const bufferLength = roseAudioAnalyser.fftSize;

    // Parameters for controlling the waveform
    const params = {
        length: 200,        // Length of the waveform
        scale: 0.01,        // Vertical scale of the waveform
        rotation: { x: 0, y: 0, z: 0 }, // Rotation angles around x, y, z axes in radians
        smoothing: 0.001,   // Size of the smoothing window
        position: { x: 0, y: 0, z: 0 } // Center position of the waveform
    };

    // Create the central line geometry and material
    const centralWaveformGeometry = new THREE.BufferGeometry();
    const centralPositions = new Float32Array(bufferLength * 3); // 3 coordinates per vertex (x, y, z)
    centralWaveformGeometry.setAttribute('position', new THREE.BufferAttribute(centralPositions, 3));

    //const waveformMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF }); // Black color
    const waveformMaterial = new THREE.LineBasicMaterial({ color: 0xFF0000 }); // Black color
    const centralWaveformLine = new THREE.Line(centralWaveformGeometry, waveformMaterial);
    scene.add(centralWaveformLine);

    // Function to apply a simple moving average filter
    function applyMovingAverage(data, windowSize) {
        const smoothedData = new Float32Array(data.length);
        for (let i = 0; i < data.length; i++) {
            let sum = 0;
            let count = 0;
            for (let j = -Math.floor(windowSize / 2); j <= Math.floor(windowSize / 2); j++) {
                if (i + j >= 0 && i + j < data.length) {
                    sum += data[i + j];
                    count++;
                }
            }
            smoothedData[i] = sum / count;
        }
        return smoothedData;
    }

    // Function to update the waveform lines and animate
    function updateWaveformAndAnimate() {
        function updateWaveform() {
            const timeDomainDataArray = new Uint8Array(bufferLength);
            roseAudioAnalyser.getByteTimeDomainData(timeDomainDataArray);

            // Apply moving average filter to smooth the data
            const smoothedData = applyMovingAverage(timeDomainDataArray, params.smoothing);

            for (let i = 0; i < bufferLength; i++) {
                const x = (i / bufferLength) * params.length - (params.length / 2); // Scale x to fit within the specified length
                const y = 0
                const z = (smoothedData[i] / 128.0) * params.scale - params.scale / 2; // Scale y to fit within the specified vertical scale;

                centralPositions[i * 3] = x;
                centralPositions[i * 3 + 1] = y;
                centralPositions[i * 3 + 2] = z;
            }

            centralWaveformGeometry.attributes.position.needsUpdate = true;

            // Apply position and rotation to the central waveform line
            centralWaveformLine.position.set(params.position.x, params.position.y, params.position.z);
            centralWaveformLine.rotation.set(params.rotation.x, params.rotation.y, params.rotation.z);
        }

        // Animation loop
        function animateWaveform() {
            requestAnimationFrame(animateWaveform);
            updateWaveform();
            renderer.render(scene, camera);
        }

        // Start the animation loop
        animateWaveform();
    }

    // Call the function to update waveform and start the animation
    updateWaveformAndAnimate();

    // Function to update parameters
    function setWaveformParams(newParams) {
        params.length = newParams.length !== undefined ? newParams.length : params.length;
        params.scale = newParams.scale !== undefined ? newParams.scale : params.scale;
        params.rotation = newParams.rotation !== undefined ? newParams.rotation : params.rotation;
        params.smoothing = newParams.smoothing !== undefined ? newParams.smoothing : params.smoothing;
        params.position = newParams.position !== undefined ? newParams.position : params.position;
    }

    // Example usage: dynamically change parameters
    setWaveformParams({
        length: 20,
        scale: 1,
        rotation: { x: 0, y: Math.PI / 2, z: 0 },
        smoothing: 5,
        position: { x: -0.5, y: -0.7, z: 0 }
    });

    return {
        setWaveformParams
    };
}


// Example usage
const waveform = createWaveformWithCubes(scene, roseAudioAnalyser);
