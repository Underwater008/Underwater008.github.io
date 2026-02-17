// ============================================================
// Three.js Setup + Canvas Overlay Rendering
// ============================================================
import * as THREE from 'three';
import { CONFIG, CALLI_FONTS, LUCKY_CHARS_BY_DENSITY, ALL_LUCKY, CHAR_BLESSINGS,
         ATLAS_COLS, ATLAS_ROWS, CELL_PX, SCENE_FOV } from './config.js';
import { S } from './state.js';
import vertexShader from './particleVertex.glsl?raw';
import fragmentShader from './particleFragment.glsl?raw';

// Shared dummy object for setMatrixAt (avoid per-frame allocation)
export const _dummy = new THREE.Object3D();

export function initThreeJS() {
    // 1. Renderer
    S.glRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    S.glRenderer.setSize(window.innerWidth, window.innerHeight);
    S.glRenderer.setPixelRatio(S.dpr);

    // 2. Camera — FOV matches the original project3D(x,y,z,SCENE_FOV) projection
    const fov = 2 * Math.atan(window.innerHeight / (2 * SCENE_FOV)) * (180 / Math.PI);
    S.glCamera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 3000);
    S.glCamera.position.set(0, 0, SCENE_FOV);
    S.glCamera.lookAt(0, 0, 0);

    // 3. Scene
    S.glScene = new THREE.Scene();

    // 4. Texture Atlas
    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = ATLAS_COLS * CELL_PX;
    atlasCanvas.height = ATLAS_ROWS * CELL_PX;
    const actx = atlasCanvas.getContext('2d');

    // Black background — avoids premultiplication issues, R channel = intensity
    actx.fillStyle = '#000';
    actx.fillRect(0, 0, atlasCanvas.width, atlasCanvas.height);

    // Collect all unique characters
    const uniqueChars = new Set([
        ...LUCKY_CHARS_BY_DENSITY,
        ...ALL_LUCKY.split(''),
        ...Object.keys(CHAR_BLESSINGS),
        '·'
    ]);

    actx.font = `bold ${Math.floor(CELL_PX * 0.7)}px "Courier New", "SF Mono", monospace`;
    actx.textAlign = 'center';
    actx.textBaseline = 'middle';
    actx.fillStyle = '#FFFFFF';

    actx.shadowColor = 'white';
    actx.shadowBlur = CELL_PX * 0.12;

    let idx = 0;
    uniqueChars.forEach(char => {
        if (idx >= ATLAS_COLS * ATLAS_ROWS) return;
        const col = idx % ATLAS_COLS;
        const row = Math.floor(idx / ATLAS_COLS);
        const x = col * CELL_PX + CELL_PX / 2;
        const y = row * CELL_PX + CELL_PX / 2;

        actx.fillText(char, x, y);

        S.charToUV[char] = {
            u: col / ATLAS_COLS,
            v: 1.0 - (row + 1) / ATLAS_ROWS
        };
        idx++;
    });

    // Bake calligraphy font variants for cluster characters
    const clusterChars = LUCKY_CHARS_BY_DENSITY.filter(c => c !== ' ');
    for (let fi = 0; fi < CALLI_FONTS.length; fi++) {
        actx.font = `bold ${Math.floor(CELL_PX * 0.7)}px ${CALLI_FONTS[fi]}, "Courier New", monospace`;
        for (const char of clusterChars) {
            if (idx >= ATLAS_COLS * ATLAS_ROWS) break;
            const col = idx % ATLAS_COLS;
            const row = Math.floor(idx / ATLAS_COLS);
            const x = col * CELL_PX + CELL_PX / 2;
            const y = row * CELL_PX + CELL_PX / 2;
            actx.fillText(char, x, y);
            S.charToUV[char + '|' + fi] = {
                u: col / ATLAS_COLS,
                v: 1.0 - (row + 1) / ATLAS_ROWS
            };
            idx++;
        }
    }

    const atlasTexture = new THREE.CanvasTexture(atlasCanvas);
    atlasTexture.magFilter = THREE.LinearFilter;
    atlasTexture.minFilter = THREE.LinearFilter;

    // 5. InstancedMesh
    const MAX_PARTICLES = 4000;
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            atlas: { value: atlasTexture },
            cellSize: { value: new THREE.Vector2(1 / ATLAS_COLS, 1 / ATLAS_ROWS) }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        blendEquation: THREE.AddEquation,
        depthWrite: false,
        depthTest: false
    });

    S.particlesMesh = new THREE.InstancedMesh(geometry, material, MAX_PARTICLES);

    // Allocate attributes
    const instanceColor = new Float32Array(MAX_PARTICLES * 3);
    const instanceAlpha = new Float32Array(MAX_PARTICLES);
    const instanceUV = new Float32Array(MAX_PARTICLES * 2);
    const instanceScale = new Float32Array(MAX_PARTICLES);

    S.particlesMesh.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(instanceColor, 3));
    S.particlesMesh.geometry.setAttribute('instanceAlpha', new THREE.InstancedBufferAttribute(instanceAlpha, 1));
    S.particlesMesh.geometry.setAttribute('instanceUV', new THREE.InstancedBufferAttribute(instanceUV, 2));
    S.particlesMesh.geometry.setAttribute('instanceScale', new THREE.InstancedBufferAttribute(instanceScale, 1));

    S.particlesMesh.frustumCulled = false;
    S.glScene.add(S.particlesMesh);
}

// Render Three.js particles and composite onto the Canvas 2D
export function renderAndCompositeGL() {
    if (!S.glRenderer || !S.glScene || !S.glCamera) return;
    S.glRenderer.render(S.glScene, S.glCamera);
    S.ctx.save();
    S.ctx.setTransform(1, 0, 0, 1, 0, 0);
    S.ctx.globalCompositeOperation = 'lighter';
    S.ctx.drawImage(S.glRenderer.domElement, 0, 0);
    S.ctx.restore();
}

// Updates GPU buffers for generic particle list (Launch, Morph, Fireworks)
export function updateProjectedGlyphsToGPU(glyphs) {
    if (!S.particlesMesh) return;
    if (!glyphs.length) {
        S.particlesMesh.count = 0;
        return;
    }

    const instColor = S.particlesMesh.geometry.attributes.instanceColor;
    const instAlpha = S.particlesMesh.geometry.attributes.instanceAlpha;
    const instUV = S.particlesMesh.geometry.attributes.instanceUV;
    const instScale = S.particlesMesh.geometry.attributes.instanceScale;

    const maxCount = S.particlesMesh.geometry.getAttribute('instanceColor').count;
    const count = Math.min(glyphs.length, maxCount);

    for (let i = 0; i < count; i++) {
        const g = glyphs[i];

        _dummy.position.set(g.x, -g.y, -g.z);
        _dummy.updateMatrix();
        S.particlesMesh.setMatrixAt(i, _dummy.matrix);

        instColor.setXYZ(i, g.r / 255, g.g / 255, g.b / 255);
        instAlpha.setX(i, g.alpha);

        const uv = (g.fontIdx != null && S.charToUV[g.char + '|' + g.fontIdx]) || S.charToUV[g.char];
        if (uv) instUV.setXY(i, uv.u, uv.v);

        instScale.setX(i, S.cellSize * (g.size || 1));
    }

    S.particlesMesh.count = count;
    S.particlesMesh.instanceMatrix.needsUpdate = true;
    instColor.needsUpdate = true;
    instAlpha.needsUpdate = true;
    instUV.needsUpdate = true;
    instScale.needsUpdate = true;

    renderAndCompositeGL();
}

// --- Draw the calligraphy 福 directly on canvas ---
export function drawCalligraphyFu(alpha) {
    S.ctx.save();
    S.ctx.scale(S.dpr, S.dpr);

    const vmin = Math.min(window.innerWidth, window.innerHeight);
    const fuSize = vmin * 0.55;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    S.ctx.textAlign = 'center';
    S.ctx.textBaseline = 'middle';
    S.ctx.font = `${fuSize}px ${S.chosenFont}, serif`;

    // Outer glow layer
    S.ctx.globalAlpha = alpha * 0.3;
    S.ctx.shadowColor = CONFIG.glowGold;
    S.ctx.shadowBlur = fuSize * 0.15;
    S.ctx.fillStyle = CONFIG.glowGold;
    S.ctx.fillText('福', cx, cy);

    // Main character
    S.ctx.globalAlpha = alpha;
    S.ctx.shadowColor = CONFIG.glowGold;
    S.ctx.shadowBlur = fuSize * 0.06;
    S.ctx.fillStyle = CONFIG.glowGold;
    S.ctx.fillText('福', cx, cy);

    S.ctx.shadowBlur = 0;
    S.ctx.restore();
}

// --- Draw text overlay ---
export function drawOverlayText(text, yFraction, color, alpha, size, fontOverride) {
    S.ctx.save();
    S.ctx.scale(S.dpr, S.dpr);
    const fontSize = size || Math.max(12, S.cellSize * 1.2);
    const font = fontOverride || '"Courier New", "SF Mono", monospace';
    S.ctx.font = `${fontSize}px ${font}`;
    S.ctx.textAlign = 'center';
    S.ctx.textBaseline = 'middle';
    S.ctx.fillStyle = color || CONFIG.glowGreen;
    S.ctx.globalAlpha = alpha ?? 0.6;
    S.ctx.shadowColor = color || CONFIG.glowGreen;
    S.ctx.shadowBlur = fontSize * 0.4;
    S.ctx.fillText(text, window.innerWidth / 2, window.innerHeight * yFraction);
    S.ctx.shadowBlur = 0;
    S.ctx.restore();
}
