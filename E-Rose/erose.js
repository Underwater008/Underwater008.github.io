import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Import shaders
import roseVertexShader from './roseVertaxShader.glsl';
import roseFragmentShader from './roseFragmentShader.glsl';

let scene, camera, controls, rotateSpeed, renderer, ambientLight, directionalLight, loader, roseModel;
let roseMaterial;

let audioContext, analyser, dataArray;

setup();
setupAudio();
createRose();
animate();


function setup() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFFFFF); // Black background

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('threeDScene').appendChild(renderer.domElement); // Add to page

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 0.6;
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
}


function setupAudio() {
    const audio = new Audio('../audios/The Chainsmokers - Roses (Audio) ft. ROZES (320).mp3');
    audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    audio.autoplay = true
    audio.loop = true
    audio.play();
}


function createRose() {
    // Load 3D Model with Custom Shader
    loader = new GLTFLoader();
    loader.load('../3DModels/3dRose.glb', function(gltf) {
        roseModel = gltf.scene;
        const material = roseModel.children[0].material;

        const originalTexture = material.map; // Extract the original texture


        roseModel.traverse(function(node) {
            if (node.isMesh) {
                node.material = new THREE.ShaderMaterial({
                    vertexShader: roseVertexShader,
                    fragmentShader: roseFragmentShader,
                    uniforms: {
                        iTime: { value: 0 },
                        iSpeed: { value: 0.01 }, // Initial speed value
                        iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                        iGridSize: { value: 1.0 }, // Initial grid size value
                        iFrequency: { value: 30.0 }, // Initial frequency value
                        iBrightness: { value: 5.0 }, // Initial brightness value
                        iTextScale: { value: 1.0 }, // Initial text scale value
                        iChannel0: { value: new THREE.TextureLoader().load('../images/rainCh1.png') },
                        iChannel1: { value: new THREE.TextureLoader().load('../images/rainCh2.png') },
                        iOriginalColor: { value: originalTexture }, // Set the extracted original texture
                        iAudioData: { value: 0.0 }, // New uniform for audio data
                        iScale: { value: 0.07 } // New uniform for scale

                    }
                });
            }
        });

        scene.add(roseModel);
        console.log('Model loaded successfully');
    }, undefined, function(error) {
        console.error('Error loading model:', error);
    });

}

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
