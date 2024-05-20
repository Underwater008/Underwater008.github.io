import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import lottie from 'https://cdn.skypack.dev/lottie-web';
import notesVertexShader from './notesVertexShader.glsl';
import notesFragmentShader from './notesFragmentShader.glsl';


function createWaveformWithCubes(scene, roseAudioAnalyser) {
    // Create parameters for the waveform
    const bufferLength = roseAudioAnalyser.fftSize;
    const lineCount = 5; // Number of lines on each side of the central line
    const lineSpacing = 0.4; // Distance between each line

    // Parameters for controlling the waveform and cubes
    const params = {
        length: 200,        // Length of the waveform
        scale: 0.0001,      // Vertical scale of the waveform
        rotation: { x: 0, y: 0, z: 0 }, // Rotation angles around x, y, z axes in radians
        smoothing: 0.001,   // Size of the smoothing window
        position: { x: 0, y: 0, z: 0 }, // Center position of the waveform
        cubeDensity: 10     // Number of cubes along each line
    };

    // Create the central line geometry and material
    const centralWaveformGeometry = new THREE.BufferGeometry();
    const centralPositions = new Float32Array(bufferLength * 3); // 3 coordinates per vertex (x, y, z)
    centralWaveformGeometry.setAttribute('position', new THREE.BufferAttribute(centralPositions, 3));

    const waveformMaterial = new THREE.LineBasicMaterial({ color: 0x000000 }); // Black color
    const centralWaveformLine = new THREE.Line(centralWaveformGeometry, waveformMaterial);
    scene.add(centralWaveformLine);

    // Function to create additional lines
    function createAdditionalLines(count, spacing) {
        const lines = [];
        for (let i = 1; i <= count; i++) {
            const offset = i * spacing;
            const geometry1 = new THREE.BufferGeometry();
            const geometry2 = new THREE.BufferGeometry();
            const positions1 = new Float32Array(bufferLength * 3);
            const positions2 = new Float32Array(bufferLength * 3);
            geometry1.setAttribute('position', new THREE.BufferAttribute(positions1, 3));
            geometry2.setAttribute('position', new THREE.BufferAttribute(positions2, 3));

            const line1 = new THREE.Line(geometry1, waveformMaterial);
            const line2 = new THREE.Line(geometry2, waveformMaterial);

            line1.position.set(params.position.x + offset, params.position.y, params.position.z);
            line2.position.set(params.position.x - offset, params.position.y, params.position.z);

            scene.add(line1);
            scene.add(line2);
            lines.push({ line: line1, geometry: geometry1, positions: positions1, offsetX: offset });
            lines.push({ line: line2, geometry: geometry2, positions: positions2, offsetX: -offset });
        }
        return lines;
    }

    const additionalLines = createAdditionalLines(lineCount, lineSpacing);

    // Create the time domain data array once, outside the update function
    const timeDomainDataArray = new Uint8Array(bufferLength);

    // Create unique cube geometry and material
    const waveformCubeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const waveformCubeMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Blue color

    // Function to create cubes along the lines
    function createCubesAlongLine(count, density) {
        const cubes = [];
        const step = Math.floor(count / density);
        for (let i = 0; i < count; i += step) {
            const waveformCube = new THREE.Mesh(waveformCubeGeometry, waveformCubeMaterial);
            scene.add(waveformCube);
            cubes.push({ cube: waveformCube, index: i });
        }
        return cubes;
    }

    // Create cubes for the central line and additional lines
    const centralCubes = createCubesAlongLine(bufferLength, params.cubeDensity);
    const additionalCubes = additionalLines.map(() => createCubesAlongLine(bufferLength, params.cubeDensity));

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
            roseAudioAnalyser.getByteTimeDomainData(timeDomainDataArray);

            // Apply moving average filter to smooth the data
            const smoothedData = applyMovingAverage(timeDomainDataArray, params.smoothing);

            for (let i = 0; i < bufferLength; i++) {
                const x = (i / bufferLength) * params.length - (params.length / 2); // Scale x to fit within the specified length
                const y = (smoothedData[i] / 128.0) * params.scale - params.scale / 2; // Scale y to fit within the specified vertical scale
                const z = 0;

                centralPositions[i * 3] = x;
                centralPositions[i * 3 + 1] = y;
                centralPositions[i * 3 + 2] = z;
            }

            centralWaveformGeometry.attributes.position.needsUpdate = true;

            // Update central cubes positions
            centralCubes.forEach(({ cube, index }) => {
                const x = (index / bufferLength) * params.length - (params.length / 2);
                const y = (smoothedData[index] / 128.0) * params.scale - params.scale / 2;
                cube.position.set(x + params.position.x, y + params.position.y, params.position.z);
            });

            // Apply position and rotation to the central waveform line
            centralWaveformLine.position.set(params.position.x, params.position.y, params.position.z);
            centralWaveformLine.rotation.set(params.rotation.x, params.rotation.y, params.rotation.z);

            // Update additional lines and their cubes
            additionalLines.forEach((line, lineIndex) => {
                for (let i = 0; i < bufferLength; i++) {
                    const x = (i / bufferLength) * params.length - (params.length / 2);
                    const y = (smoothedData[i] / 128.0) * params.scale - params.scale / 2;
                    const z = 0;

                    line.positions[i * 3] = x;
                    line.positions[i * 3 + 1] = y;
                    line.positions[i * 3 + 2] = z;
                }

                line.geometry.attributes.position.needsUpdate = true;

                // Update additional cubes positions
                additionalCubes[lineIndex].forEach(({ cube, index }) => {
                    const x = (index / bufferLength) * params.length - (params.length / 2);
                    const y = (smoothedData[index] / 128.0) * params.scale - params.scale / 2;
                    cube.position.set(x + line.offsetX + params.position.x, y + params.position.y, params.position.z);
                });

                // Apply position and rotation to each additional line
                line.line.position.set(params.position.x + line.offsetX, params.position.y, params.position.z);
                line.line.rotation.set(params.rotation.x, params.rotation.y, params.rotation.z);
            });
        }

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            updateWaveform();
            renderer.render(scene, camera);
        }

        // Start the animation loop
        animate();
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
        params.cubeDensity = newParams.cubeDensity !== undefined ? newParams.cubeDensity : params.cubeDensity;

        // Update positions of additional lines if position changes
        if (newParams.position !== undefined) {
            for (const line of additionalLines) {
                line.line.position.set(params.position.x + line.offsetX, params.position.y, params.position.z);
            }
        }
    }

    // Example usage: dynamically change parameters
    setWaveformParams({
        length: 20,
        scale: 0.1,
        rotation: { x: 0, y: Math.PI / 2, z: 0 },
        smoothing: 100,
        position: { x: 0, y: -3, z: 0 },
        cubeDensity: 10
    });

    return {
        setWaveformParams
    };
}

// Example usage
const waveform = createWaveformWithCubes(scene, roseAudioAnalyser);
