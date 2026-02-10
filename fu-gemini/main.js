import * as THREE from 'three';
import gsap from 'gsap';

// --- Configuration & Assets ---
const COLORS = {
    RED: 0xFF2D2D,
    GOLD: 0xFFD700,
    JADE: 0x00FF9F,
    BG: 0x0A0A0A
};

const LUCKY_CHARS = "福禄寿喜财财富贵发金玉宝余丰盛利旺隆昌兴进通达安康宁泰和平顺健喜乐欢庆禧祺嘉春德善仁义忠信孝慧恩爱合圆满美馨雅吉祥瑞如意祝运龙凤麟鹤华成升登高";
const CHAR_ARRAY = LUCKY_CHARS.split('');

// --- State ---
let scene, camera, renderer;
let fuGroup; // The 3D Fu character group
let particles = [];
let fireworks = [];
let isAnimating = true;

// --- Initialization ---
function init() {
    // 1. Setup Three.js
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.BG);
    scene.fog = new THREE.FogExp2(COLORS.BG, 0.05);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Create the "Fu" object (Particle Cloud)
    createFuParticles();

    // 3. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(COLORS.RED, 1, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // 4. Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    setupUI();

    // 5. Start Loop
    animate();
}

// --- The "Fu" Particle System ---
function createFuParticles() {
    // Generate text on a canvas to get positions
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 128; // Low res for "pixel/ASCII" look
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    
    ctx.font = 'bold 100px "Courier New", monospace'; // Use a standard font
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('福', size / 2, size / 2);

    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;

    fuGroup = new THREE.Group();

    // Texture for particles (a simple circle or a character?)
    // Let's use characters from the lucky set as textures for sprites
    
    const materialCache = {};

    for (let y = 0; y < size; y += 2) { // Step 2 for density control
        for (let x = 0; x < size; x += 2) {
            const index = (y * size + x) * 4;
            const r = data[index];
            
            if (r > 128) { // If pixel is bright
                // Map x,y to 3D space centered at 0
                const px = (x - size / 2) * 0.25;
                const py = -(y - size / 2) * 0.25; // Invert Y
                const pz = (Math.random() - 0.5) * 5; // Add thickness

                // Create a text sprite or a simple mesh
                const char = CHAR_ARRAY[Math.floor(Math.random() * CHAR_ARRAY.length)];
                
                if (!materialCache[char]) {
                    materialCache[char] = createCharTexture(char);
                }

                const material = new THREE.SpriteMaterial({ 
                    map: materialCache[char],
                    color: COLORS.RED,
                    transparent: true,
                    opacity: 0.8,
                    blending: THREE.AdditiveBlending
                });

                const sprite = new THREE.Sprite(material);
                sprite.position.set(px, py, pz);
                sprite.scale.set(1.5, 1.5, 1.5);
                
                // Store initial position for animation
                sprite.userData = { 
                    originalPos: new THREE.Vector3(px, py, pz),
                    speed: Math.random() * 0.02 + 0.01
                };

                fuGroup.add(sprite);
                particles.push(sprite);
            }
        }
    }
    
    // Store cache globally for fireworks
    window.materialCache = materialCache;

    scene.add(fuGroup);
    
    // Add a box frame (the "Cube" concept)
    const geometry = new THREE.BoxGeometry(35, 35, 35);
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x333333 }));
    scene.add(line);
    
    // Animate the whole group gently
    gsap.to(fuGroup.rotation, {
        y: Math.PI * 2,
        duration: 20,
        repeat: -1,
        ease: "none"
    });
    
    gsap.to(line.rotation, {
        y: Math.PI * 2,
        duration: 25,
        repeat: -1,
        ease: "none"
    });
}

function createCharTexture(char) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // ctx.fillStyle = '#000000'; // Transparent bg
    // ctx.fillRect(0, 0, 64, 64);
    
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, 32, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

// --- Fireworks System ---
function createFirework(x, y, z) {
    const particleCount = 30; // Fewer particles since they are sprites
    
    for (let i = 0; i < particleCount; i++) {
        const char = CHAR_ARRAY[Math.floor(Math.random() * CHAR_ARRAY.length)];
        // Use cached texture if available
        let texture = window.materialCache && window.materialCache[char];
        if (!texture) texture = createCharTexture(char);

        const material = new THREE.SpriteMaterial({
            map: texture,
            color: COLORS.GOLD,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        const sprite = new THREE.Sprite(material);
        sprite.position.set(x, y, z);
        sprite.scale.set(2, 2, 2);

        // Explosion velocity
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = Math.random() * 0.5 + 0.5;
        
        const velocity = new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.sin(phi) * Math.sin(theta) * speed,
            Math.cos(phi) * speed
        );

        sprite.userData = { velocity: velocity, life: 1.0 };
        scene.add(sprite);
        fireworks.push(sprite);
    }
}

// --- Interaction Logic ---
function setupUI() {
    const screenArrival = document.getElementById('screen-arrival');
    const screenFortune = document.getElementById('screen-fortune');
    const screenWish = document.getElementById('screen-wish');
    const screenKey = document.getElementById('screen-key');

    // 1. Arrival -> Fortune
    screenArrival.addEventListener('click', () => {
        // Haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(50);
        
        screenArrival.classList.add('hidden');
        screenArrival.classList.remove('active');
        
        screenFortune.classList.remove('hidden');
        screenFortune.classList.add('active');
        
        // Trigger fortune animation (e.g., shake text)
        const fortuneMain = document.getElementById('fortune-main');
        fortuneMain.innerText = "Drawing...";
        
        setTimeout(() => {
            fortuneMain.innerText = "大吉"; // Hardcoded for prototype
            document.getElementById('fortune-sub').innerText = "Great Fortune. Your path is clear.";
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            
            // Explosion of fireworks
            for(let i=0; i<5; i++) {
                setTimeout(() => {
                    createFirework((Math.random()-0.5)*20, (Math.random()-0.5)*20, (Math.random()-0.5)*10);
                }, i * 300);
            }
        }, 1500);
    });

    // 2. Celebrate Button -> Fireworks
    document.getElementById('btn-fireworks').addEventListener('click', () => {
        if (navigator.vibrate) navigator.vibrate(50);
        
        // Launch fireworks
        for(let i=0; i<10; i++) {
            createFirework((Math.random()-0.5)*30, (Math.random()-0.5)*30, (Math.random()-0.5)*20);
        }
        
        // Transition to Wish after a delay
        setTimeout(() => {
            screenFortune.classList.add('hidden');
            screenFortune.classList.remove('active');
            screenWish.classList.remove('hidden');
            screenWish.classList.add('active');
        }, 3000);
    });

    // 3. Seal Wish -> Key Reveal
    document.getElementById('btn-seal').addEventListener('click', () => {
        const wish = document.getElementById('wish-input').value;
        if (!wish.trim()) return;

        if (navigator.vibrate) navigator.vibrate(50);

        screenWish.classList.add('hidden');
        screenWish.classList.remove('active');
        screenKey.classList.remove('hidden');
        screenKey.classList.add('active');

        // Mock Key Generation
        setTimeout(() => {
            const mockKey = "L5ez...MockBitcoinKey..." + Math.floor(Math.random() * 10000);
            document.getElementById('btc-key').innerText = mockKey;
            
            // More fireworks
            createFirework(0, 0, 0);
        }, 1000);
    });
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    // Animate particles in the "Fu"
    const time = Date.now() * 0.001;
    particles.forEach((p, i) => {
        // Gentle wave effect
        p.position.z = p.userData.originalPos.z + Math.sin(time * 2 + p.position.x * 0.5) * 1.0;
    });

    // Animate Fireworks
    for (let i = fireworks.length - 1; i >= 0; i--) {
        const sprite = fireworks[i];
        
        sprite.userData.life -= 0.02;
        sprite.material.opacity = sprite.userData.life;
        
        sprite.position.add(sprite.userData.velocity);
        sprite.userData.velocity.y -= 0.01; // Gravity
        
        if (sprite.userData.life <= 0) {
            scene.remove(sprite);
            fireworks.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start
init();
