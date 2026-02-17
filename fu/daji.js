// ============================================================
// 大吉 Cluster — 3D particle cluster, tooltip, font cycling
// ============================================================
import { CONFIG, CALLI_FONTS, CHAR_BLESSINGS, SCENE_FOV } from './config.js';
import { S } from './state.js';
import { lerp, easeInOut, project3D, selectCharByLuminance, lerpColor } from './utils.js';
import { _dummy, renderAndCompositeGL } from './renderer.js';

// --- Daji title font cycling ---
let dajiFontIdx = 0;
let dajiFontTransition = null; // { oldFont, startTime }
let dajiFontAutoTimer = 0;
const DAJI_AUTO_INTERVAL = 4.5;

export function getDajiFont() { return CALLI_FONTS[dajiFontIdx]; }
export function getDajiFontTransition() { return dajiFontTransition; }
export function clearDajiFontTransition() { dajiFontTransition = null; }

export function cycleDajiFont(dir) {
    const oldFont = CALLI_FONTS[dajiFontIdx];
    let newIdx;
    do { newIdx = Math.floor(Math.random() * CALLI_FONTS.length); } while (newIdx === dajiFontIdx && CALLI_FONTS.length > 1);
    dajiFontIdx = newIdx;
    dajiFontTransition = { oldFont, startTime: S.globalTime };
    dajiFontAutoTimer = S.globalTime;
}

export function autoCycleFontIfIdle() {
    if (!dajiFontTransition && S.stateTime > 6 && S.globalTime - dajiFontAutoTimer > DAJI_AUTO_INTERVAL) {
        dajiFontAutoTimer = S.globalTime;
        cycleDajiFont(1);
    }
}

// --- 3D Daji Cluster ---
let daji3DParticles = [];
let daji3DEntryTime = 0;
let daji3DFromSeed = false;
export let hoveredIdx = -1;

export function initDaji3D(seedParticles) {
    daji3DParticles = [];
    hoveredIdx = -1;
    hideTooltip();
    if (Array.isArray(seedParticles) && seedParticles.length > 0) {
        daji3DParticles = seedParticles.map((p) => ({ ...p }));
        daji3DFromSeed = true;
        daji3DEntryTime = S.globalTime;
        return;
    }
    if (!S.fontsReady) return;

    const spread = Math.min(S.cols, S.rows) * 0.40 * S.cellSize;
    const depth = spread * 0.4;

    for (const pt of S.dajiShape) {
        const lum = Math.min(1, pt.brightness + 0.08);
        const char = selectCharByLuminance(lum);
        if (char === ' ') continue;
        const color = lerpColor(lum);

        daji3DParticles.push({
            baseX: pt.nx * spread * 0.5 * pt.aspect,
            baseY: pt.ny * spread * 0.5,
            origZ: (Math.random() - 0.5) * depth,
            char,
            fontIdx: Math.random() < 0.7 ? Math.floor(Math.random() * CALLI_FONTS.length) : null,
            r: color.r, g: color.g, b: color.b,
            alpha: 0.3 + lum * 0.7,
            lum,
            phase: Math.random() * Math.PI * 2,
        });
    }
    daji3DEntryTime = S.globalTime;
}

// Replaces render3DDaji with GPU rendering
export function updateDajiToGPU(skipRender) {
    if (!S.particlesMesh) return 0;
    if (!daji3DParticles.length) {
        S.particlesMesh.count = 0;
        return 0;
    }

    const spread = Math.min(S.cols, S.rows) * 0.40 * S.cellSize;
    const entryT = Math.min(1, (S.globalTime - daji3DEntryTime) / 1.2);
    const zInflate = daji3DFromSeed ? 1 : easeInOut(entryT);
    const blendT = daji3DFromSeed ? Math.min(1, (S.globalTime - daji3DEntryTime) / 0.6) : 1;
    const breatheDelay = daji3DFromSeed ? 0 : 0.5;
    const breatheRamp = daji3DFromSeed
        ? 1
        : Math.min(1, Math.max(0, (S.globalTime - daji3DEntryTime - breatheDelay) / 0.8));
    const breatheAmp = spread * 0.06 * breatheRamp;

    const instColor = S.particlesMesh.geometry.attributes.instanceColor;
    const instAlpha = S.particlesMesh.geometry.attributes.instanceAlpha;
    const instUV = S.particlesMesh.geometry.attributes.instanceUV;
    const instScale = S.particlesMesh.geometry.attributes.instanceScale;

    const maxCount = instColor.count;
    const count = Math.min(daji3DParticles.length, maxCount);

    const clusterH = spread * 0.5;
    const highlightPos = Math.sin(S.globalTime * 0.8) * 0.3;

    for (let i = 0; i < count; i++) {
        const p = daji3DParticles[i];
        const z = p.origZ * zInflate + Math.sin(S.globalTime * 1.5 + p.phase) * breatheAmp;
        const isHovered = i === hoveredIdx;
        const hoverPush = isHovered ? -80 : 0;

        _dummy.position.set(p.baseX, -p.baseY, -(z + hoverPush));
        _dummy.updateMatrix();
        S.particlesMesh.setMatrixAt(i, _dummy.matrix);

        let alpha = p.alpha * Math.max(0.2, 1.25);
        alpha = Math.min(0.8, alpha);
        if (isHovered) alpha = 1.0;

        const yNorm = clusterH > 0 ? p.baseY / clusterH : 0;
        const gradT = Math.max(0, Math.min(1, (yNorm + 1) * 0.5));
        const hDist = Math.abs(yNorm - highlightPos);
        const highlight = Math.max(0, 1 - hDist * 3);

        const metalR = Math.min(255, Math.floor(lerp(255, 180, gradT) + highlight * 55));
        const metalG = Math.min(255, Math.floor(lerp(225, 130, gradT) + highlight * 40));
        const metalB = Math.min(255, Math.floor(lerp(50, 10, gradT) + highlight * 50));

        const gr = lerp(p.r, metalR, blendT) / 255;
        const gg = lerp(p.g, metalG, blendT) / 255;
        const gb = lerp(p.b, metalB, blendT) / 255;

        instColor.setXYZ(i, isHovered ? 1.0 : gr, isHovered ? 0.97 : gg, isHovered ? 0.86 : gb);
        instAlpha.setX(i, alpha);

        const uv = (p.fontIdx != null && S.charToUV[p.char + '|' + p.fontIdx]) || S.charToUV[p.char];
        if (uv) instUV.setXY(i, uv.u, uv.v);

        let scale = S.cellSize * 1.1;
        if (isHovered) scale *= 2.2;
        instScale.setX(i, scale);
    }

    S.particlesMesh.count = count;
    S.particlesMesh.instanceMatrix.needsUpdate = true;
    instColor.needsUpdate = true;
    instAlpha.needsUpdate = true;
    instUV.needsUpdate = true;
    instScale.needsUpdate = true;

    if (!skipRender) renderAndCompositeGL();
    return count;
}

// --- Tooltip ---
const tooltip = document.createElement('div');
Object.assign(tooltip.style, {
    position: 'fixed',
    pointerEvents: 'none',
    opacity: '0',
    transition: 'opacity 0.2s ease',
    background: 'rgba(10, 10, 10, 0.92)',
    border: '1px solid rgba(255, 215, 0, 0.4)',
    borderRadius: '8px',
    padding: '14px 18px',
    textAlign: 'center',
    fontFamily: '"Courier New", "SF Mono", monospace',
    zIndex: '100',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    boxShadow: '0 0 24px rgba(255, 45, 45, 0.15), 0 0 8px rgba(255, 215, 0, 0.1)',
    maxWidth: '220px',
    minWidth: '140px',
});
tooltip.innerHTML = '<div id="tt-char" style="font-size:36px;color:#FFD700;margin-bottom:6px;text-shadow:0 0 12px rgba(255,215,0,0.5)"></div>'
    + '<div id="tt-phrase" style="font-size:15px;color:#FF2D2D;margin-bottom:4px"></div>'
    + '<div id="tt-english" style="font-size:11px;color:#FFD700;opacity:0.65"></div>';
document.body.appendChild(tooltip);

function showTooltip(char, screenX, screenY) {
    const blessing = CHAR_BLESSINGS[char];
    if (!blessing) { hideTooltip(); return; }

    document.getElementById('tt-char').textContent = char;
    document.getElementById('tt-phrase').textContent = blessing.phrase;
    document.getElementById('tt-english').textContent = blessing.english;

    const ttW = 200;
    const ttH = 110;
    let left = screenX - ttW / 2;
    let top = screenY - ttH - 30;

    left = Math.max(8, Math.min(window.innerWidth - ttW - 8, left));
    if (top < 8) top = screenY + 40;

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.style.opacity = '1';
}

export function hideTooltip() {
    tooltip.style.opacity = '0';
}

export function updateHover(clientX, clientY) {
    if (daji3DParticles.length === 0) { hoveredIdx = -1; hideTooltip(); return; }

    const spread = Math.min(S.cols, S.rows) * 0.40 * S.cellSize;
    const entryT = Math.min(1, (S.globalTime - daji3DEntryTime) / 1.2);
    const zInflate = daji3DFromSeed ? 1 : easeInOut(entryT);
    const blendT = daji3DFromSeed ? Math.min(1, (S.globalTime - daji3DEntryTime) / 0.6) : 1;
    const breatheAmp = spread * 0.06 * (daji3DFromSeed ? blendT : zInflate);

    let bestIdx = -1, bestDist = Infinity;

    for (let i = 0; i < daji3DParticles.length; i++) {
        const p = daji3DParticles[i];
        if (!CHAR_BLESSINGS[p.char]) continue;
        const z = p.origZ * zInflate + Math.sin(S.globalTime * 1.5 + p.phase) * breatheAmp;
        const proj = project3D(p.baseX, p.baseY, z, SCENE_FOV);
        const dx = proj.screenX - clientX;
        const dy = proj.screenY - clientY;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
        }
    }

    const threshold = S.cellSize * 2.5;
    if (bestDist > threshold * threshold) {
        hoveredIdx = -1;
        hideTooltip();
        return;
    }

    if (bestIdx !== hoveredIdx) {
        hoveredIdx = bestIdx;
        const p = daji3DParticles[bestIdx];
        const z = p.origZ * zInflate + Math.sin(S.globalTime * 1.5 + p.phase) * breatheAmp;
        const proj = project3D(p.baseX, p.baseY, z, SCENE_FOV);
        showTooltip(p.char, proj.screenX, proj.screenY);
    }
}

export function resetHover() {
    hoveredIdx = -1;
    hideTooltip();
}
