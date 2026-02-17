// ============================================================
// 福 Cube — 3D ASCII Fortune Experience
// State machine: arrival → draw → fortune
// ============================================================
import { CONFIG, CALLI_FONTS } from './config.js';
import { S } from './state.js';
import { sampleCharacterShape, easeInOut } from './utils.js';
import { clearGrid, resize, renderGrid, initBgParticles, updateBgParticles } from './grid.js';
import { initThreeJS, drawCalligraphyFu, drawOverlayText } from './renderer.js';
import { initDaji3D } from './daji.js';
import { initFireworks } from './fireworks.js';
import { initDrawAnimation, updateDraw, renderDrawOverlay,
         DRAW_CAMERA_PULLBACK, DRAW_CAMERA_RETURN } from './draw.js';
import { updateFortune, renderFortuneOverlay } from './fortune.js';
import { initInput } from './input.js';
import { EnvelopeManager } from './envelope.js';

// --- Initialize canvas ---
S.canvas = document.getElementById('c');
S.ctx = S.canvas.getContext('2d');

// --- Initial resize ---
window.addEventListener('resize', resize);
resize();

// --- Background particles ---
initBgParticles();

// --- State Machine ---
function changeState(newState) {
    S.state = newState;
    S.stateStartGlobal = S.globalTime;
    S.stateTime = 0;
    if (newState === 'draw') initDrawAnimation();
    if (newState === 'fortune') {
        if (S.drawToFortuneSeed && S.drawToFortuneSeed.length > 0) {
            initDaji3D(S.drawToFortuneSeed);
            S.drawToFortuneSeed = null;
        } else {
            initDaji3D();
        }
        initFireworks();
    }
}

// --- Swipe handler ---
function handleSwipeUp() {
    if (S.state === 'arrival' && S.fontsReady) {
        changeState('draw');
    } else if (S.state === 'fortune') {
        if (S.envelopeManager) {
            S.envelopeManager.show();
        }
    }
}

// --- Input ---
initInput(handleSwipeUp);

// --- Font loading + initialization ---
Promise.all(
    CALLI_FONTS.map(f => document.fonts.load(`64px ${f}`, '福大吉'))
).then(() => {
    S.fuShape = sampleCharacterShape('福', 64, S.chosenFont);
    S.dajiShape = sampleCharacterShape('大吉', 64);
    S.fontsReady = true;
    initThreeJS();

    S.envelopeManager = new EnvelopeManager({
        onOpen: () => {
            if (S.state === 'arrival') changeState('draw');
        },
        onWish: () => {
            initFireworks();
        }
    });

    // --- Dev tool (load with ?dev=1) ---
    if (new URLSearchParams(window.location.search).has('dev')) {
        import('./dev.js').then(m => m.initDevTool({ changeState }));
    }
});

// ============================================================
// ARRIVAL — Calligraphy 福 with neon glow + hint
// ============================================================
function updateArrival() {
    updateBgParticles(S.globalTime);
}

function renderArrivalOverlay() {
    const fadeIn = Math.min(1, S.stateTime / 1.0);
    drawCalligraphyFu(fadeIn);

    const textFade = Math.min(1, S.stateTime / 1.5);
    drawOverlayText('新年纳福', 0.15, CONFIG.glowGold, textFade * 0.8, S.cellSize * 2);
    drawOverlayText('A Blessing Awaits', 0.20, CONFIG.glowGold, textFade * 0.5, S.cellSize * 1.1);

    const hintFade = Math.min(1, Math.max(0, (S.stateTime - 1.5) / 0.5));
    const pulse = 0.4 + Math.sin(S.globalTime * 3) * 0.2;
    const hopPhase = S.globalTime % 3.0;
    let hopOffset = 0;
    if (hopPhase < 0.9) {
        const decay = 1 - hopPhase / 0.9;
        hopOffset = -Math.abs(Math.sin(hopPhase / 0.9 * Math.PI * 3)) * 0.012 * decay;
    }
    drawOverlayText('↑  上滑抽签  ↑', 0.88 + hopOffset, CONFIG.glowGold, hintFade * pulse, S.cellSize * 1.6);
    drawOverlayText('Swipe Up to Draw Fortune', 0.92 + hopOffset, CONFIG.glowGold, hintFade * pulse, S.cellSize * 1.1);
}

// ============================================================
// MAIN LOOP
// ============================================================
const startTime = performance.now();
const DRAW_LAUNCH = CONFIG.fuExplodeDelay;

function frame(now) {
    S.globalTime = (now - startTime) / 1000;
    S.stateTime = S.globalTime - S.stateStartGlobal;

    clearGrid();

    switch (S.state) {
        case 'arrival':   updateArrival(); break;
        case 'draw':      updateBgParticles(S.globalTime); updateDraw(changeState); break;
        case 'fortune':   updateBgParticles(S.globalTime); updateFortune(); break;
    }

    // Camera follow during draw launch
    let camShift = 0;
    if (S.state === 'draw') {
        if (S.stateTime < DRAW_LAUNCH) {
            if (S.stateTime < DRAW_CAMERA_PULLBACK) {
                const pullbackT = Math.min(1, S.stateTime / Math.max(0.001, DRAW_CAMERA_PULLBACK));
                camShift = -easeInOut(pullbackT) * S.cellSize * 3;
            } else {
                camShift = -S.cellSize * 3;
            }
        } else {
            const returnT = Math.min(1, (S.stateTime - DRAW_LAUNCH) / Math.max(0.001, DRAW_CAMERA_RETURN));
            camShift = -(1 - easeInOut(returnT)) * S.cellSize * 3;
        }
        S.offsetY += camShift;
    }

    renderGrid();

    if (camShift !== 0) S.offsetY -= camShift;

    // Reset particle count — overlays will set it if they have particles
    if (S.particlesMesh) S.particlesMesh.count = 0;

    // State overlays update GPU data and composite Three.js at the right point
    switch (S.state) {
        case 'arrival':   renderArrivalOverlay(); break;
        case 'draw':      renderDrawOverlay(); break;
        case 'fortune':   renderFortuneOverlay(); break;
    }

    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
