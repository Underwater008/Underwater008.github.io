import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { gsap } from 'gsap';

// Scene setup
const scene = new THREE.Scene();
let width = window.innerWidth;
let height = window.innerHeight;
let aspectRatio = width / height;
const frustumSize = height;

const camera = new THREE.OrthographicCamera(
    frustumSize * aspectRatio / -2,
    frustumSize * aspectRatio / 2,
    frustumSize / 2,
    frustumSize / -2,
    -1000,
    1000
);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
renderer.setClearColor(0xffffff, 1); // Set background color to white
document.body.appendChild(renderer.domElement);

// Create the video texture
const video = document.getElementById('background-video');
const videoTexture = new THREE.VideoTexture(video);
const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
const videoGeometry = new THREE.PlaneGeometry(frustumSize * aspectRatio, frustumSize);
const videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
videoMesh.position.z = -1; // Place the video behind the line
scene.add(videoMesh);

// Function to find black vertex on video geometry and position red line
function findBlackVertexAndPositionLine() {
    // Create a canvas to analyze video frames
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    function analyzeFrame() {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;

        let blackPixelPosition = null;
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const index = (y * canvas.width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                if (r < 10 && g < 10 && b < 10) {
                    blackPixelPosition = { x, y };
                    if (blackPixelPosition.x === 0) {return}
                    if (blackPixelPosition.x === 923) {blackPixelPosition.x += 1}

                    break;
                }
            }
            if (blackPixelPosition) break;
        }

        if (blackPixelPosition) {
            const { x, y } = blackPixelPosition;
            const normalizedX = (x / canvas.width) * 2 - 1;
            const normalizedY = -(y / canvas.height) * 2 + 1;
            const vector = new THREE.Vector3(normalizedX, normalizedY, 0).unproject(camera);
            line.position.x = vector.x;
            console.log(`Black pixel found at (${x}, ${y}), positioned at (${vector.x}, ${vector.y}) in world coordinates`);
        } else {
            console.log('No black pixel found');
        }
    }

    video.addEventListener('timeupdate', analyzeFrame);
    video.addEventListener('seeked', analyzeFrame);
    analyzeFrame();
}

video.addEventListener('loadeddata', () => {
    video.currentTime = 1.7;
    findBlackVertexAndPositionLine();
});

// Create the red vertical line
const lineMaterial = new LineMaterial({
    color: 0x000000, // Change color to black
    linewidth: 4, // Line width in world units
    resolution: new THREE.Vector2(width, height) // Set the resolution for the line thickness
});

const points = [];
const segments = 100;
let segmentHeight = height / (2 * segments) * 1.5;
let startY = height / 1.5;

for (let i = 0; i <= segments; i++) {
    points.push(0, startY - i * segmentHeight, 0);
}

const lineGeometry = new LineGeometry();
lineGeometry.setPositions(points);

const line = new Line2(lineGeometry, lineMaterial);
scene.add(line);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isMouseOver = false;
let isClicked = false;

// Idle animation
function idleAnimation() {
    if (!isMouseOver && !isClicked) {
        gsap.to(line.position, {
            y: '-=80',
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
            duration: 3
        });
    }
}

idleAnimation();

function stopIdleAnimation() {
    gsap.killTweensOf(line.position);
    gsap.to(line.position, { y: 0, duration: 0.5 });
}

function moveLineUp() {
    gsap.to(line.position, {
        y: height,
        duration: 2,
        onComplete: function () {
            line.visible = false;
        }
    });
}

// Mouse events
document.addEventListener('mousemove', (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) / rect.width * 2 - 1;
    mouse.y = -(event.clientY - rect.top) / rect.height * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(line);

    if (intersects.length > 0) {
        if (!isMouseOver) {
            isMouseOver = true;
            document.body.style.cursor = 'pointer'; // Change cursor to pointer
            stopIdleAnimation();
        }
    } else {
        if (isMouseOver) {
            isMouseOver = false;
            document.body.style.cursor = 'default'; // Change cursor back to default
            idleAnimation();
        }
    }
});

document.addEventListener('click', (event) => {
    if (isMouseOver) {
        isClicked = true;
        moveLineUp();
        video.play()
        video.muted = false
    }
});

// Window resize event
window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    aspectRatio = width / height;

    camera.left = frustumSize * aspectRatio / -2;
    camera.right = frustumSize * aspectRatio / 2;
    camera.top = frustumSize / 2;
    camera.bottom = frustumSize / -2;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);

    // Update video geometry to cover full screen
    videoMesh.geometry.dispose();
    videoMesh.geometry = new THREE.PlaneGeometry(frustumSize * aspectRatio, frustumSize);

    // Update line resolution for thickness
    lineMaterial.resolution.set(width, height);

    // Update line points based on new dimensions
    segmentHeight = height / (2 * segments);
    startY = height / 1.5;

    for (let i = 0; i <= segments; i++) {
        points[3 * i + 1] = startY - i * segmentHeight;
    }

    lineGeometry.setPositions(points);
    lineGeometry.attributes.position.needsUpdate = true;

    findBlackVertexAndPositionLine()
});

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
