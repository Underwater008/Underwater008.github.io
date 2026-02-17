// ============================================================
// FORTUNE STATE — 大吉 displayed with title morph transitions
// ============================================================
import { CONFIG, ALL_LUCKY } from './config.js';
import { S } from './state.js';
import { lerp, easeInOut, selectCharByLuminance, lerpColor } from './utils.js';
import { setCell } from './grid.js';
import { drawOverlayText, renderAndCompositeGL } from './renderer.js';
import { updateDajiToGPU, getDajiFont, getDajiFontTransition, clearDajiFontTransition,
         autoCycleFontIfIdle } from './daji.js';
import { fwShells, fwTrail, fwParticles, updateFireworkPhysics, appendFireworksToGPU } from './fireworks.js';

export function renderDaji(alpha) {
    const dajiGridSize = Math.min(S.cols, S.rows) * 0.40;
    const centerCol = S.cols / 2;
    const centerRow = S.rows / 2;
    for (const pt of S.dajiShape) {
        const col = Math.floor(centerCol + pt.nx * dajiGridSize * 0.5 * pt.aspect);
        const row = Math.floor(centerRow + pt.ny * dajiGridSize * 0.5);
        const lum = Math.min(1, pt.brightness + 0.08);
        const char = selectCharByLuminance(lum);
        if (char === ' ') continue;
        const color = lerpColor(lum);
        setCell(col, row, 0, char, color.r, color.g, color.b, Math.min(1, (0.3 + lum * 0.7) * alpha));
    }
}

export function updateFortune() {
    updateFireworkPhysics();
    autoCycleFontIfIdle();
}

// --- Fancy 大吉 title morph transitions ---

function drawMorphSparkles(cx, cy, fontSize, t, alpha) {
    const count = 14;
    const spread = fontSize * 1.5;
    for (let i = 0; i < count; i++) {
        const seed = i * 137.508;
        const lifePhase = ((t * 2.5 + i / count) % 1);
        const sparkAlpha = Math.sin(lifePhase * Math.PI) * alpha * 0.6;
        if (sparkAlpha < 0.02) continue;
        const angle = seed + S.globalTime * (1.2 + (i % 3) * 0.4);
        const r = spread * (0.15 + lifePhase * 0.85);
        const sx = cx + Math.cos(angle) * r;
        const sy = cy + Math.sin(angle) * r * 0.3;
        const size = 1 + (1 - lifePhase) * 2.5;
        S.ctx.globalAlpha = sparkAlpha;
        S.ctx.fillStyle = CONFIG.glowGold;
        S.ctx.shadowColor = CONFIG.glowGold;
        S.ctx.shadowBlur = size * 5;
        S.ctx.beginPath();
        S.ctx.arc(sx, sy, size, 0, Math.PI * 2);
        S.ctx.fill();
    }
}

function renderDajiTitleEntrance(stateT, font) {
    const fontSize = S.cellSize * 5;
    const entranceDur = 1.3;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.15;
    const chars = ['大', '吉'];

    if (stateT >= entranceDur) {
        drawOverlayText('大 吉', 0.15, CONFIG.glowGold, 0.9, S.cellSize * 5, font);
        return;
    }

    S.ctx.save();
    S.ctx.scale(S.dpr, S.dpr);
    S.ctx.font = `${fontSize}px ${font}, serif`;
    S.ctx.textAlign = 'center';
    S.ctx.textBaseline = 'middle';

    const totalW = S.ctx.measureText('大 吉').width;
    const w0 = S.ctx.measureText('大').width;
    const w1 = S.ctx.measureText('吉').width;
    const positions = [cx - totalW / 2 + w0 / 2, cx + totalW / 2 - w1 / 2];

    for (let i = 0; i < chars.length; i++) {
        const delay = i * 0.2;
        const dur = entranceDur - delay - 0.1;
        const charT = Math.max(0, Math.min(1, (stateT - delay) / dur));
        if (charT <= 0) continue;

        let scale;
        if (charT < 0.35) {
            scale = lerp(1.8, 0.93, easeInOut(charT / 0.35));
        } else if (charT < 0.6) {
            scale = lerp(0.93, 1.06, easeInOut((charT - 0.35) / 0.25));
        } else {
            scale = lerp(1.06, 1.0, easeInOut((charT - 0.6) / 0.4));
        }

        const alpha = Math.min(0.9, charT * 3);
        const glowMult = 1 + Math.max(0, 1 - charT * 1.5) * 2.5;
        const dropY = Math.max(0, 1 - charT * 2.5) * fontSize * 0.1;

        S.ctx.save();
        S.ctx.translate(positions[i], cy + dropY);
        S.ctx.scale(scale, scale);

        S.ctx.globalAlpha = alpha * 0.35 * glowMult;
        S.ctx.fillStyle = CONFIG.glowGold;
        S.ctx.shadowColor = CONFIG.glowGold;
        S.ctx.shadowBlur = fontSize * 0.25 * glowMult;
        S.ctx.fillText(chars[i], 0, 0);

        S.ctx.globalAlpha = alpha;
        S.ctx.shadowBlur = fontSize * 0.12;
        S.ctx.fillText(chars[i], 0, 0);

        S.ctx.restore();
    }

    S.ctx.shadowBlur = 0;
    S.ctx.shadowColor = 'transparent';
    S.ctx.restore();
}

function renderDajiMorph(t, fadeIn, oldFont, newFont) {
    S.ctx.save();
    S.ctx.scale(S.dpr, S.dpr);

    const fontSize = S.cellSize * 5;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.15;
    const baseAlpha = fadeIn * 0.9;
    const chars = ['大', '吉'];

    S.ctx.font = `${fontSize}px ${oldFont}, serif`;
    S.ctx.textAlign = 'center';
    S.ctx.textBaseline = 'middle';
    const oldTotalW = S.ctx.measureText('大 吉').width;
    const oldW0 = S.ctx.measureText('大').width;
    const oldW1 = S.ctx.measureText('吉').width;
    const oldPos = [cx - oldTotalW / 2 + oldW0 / 2, cx + oldTotalW / 2 - oldW1 / 2];

    S.ctx.font = `${fontSize}px ${newFont}, serif`;
    const newTotalW = S.ctx.measureText('大 吉').width;
    const newW0 = S.ctx.measureText('大').width;
    const newW1 = S.ctx.measureText('吉').width;
    const newPos = [cx - newTotalW / 2 + newW0 / 2, cx + newTotalW / 2 - newW1 / 2];

    const DISSOLVE_END = 0.3;
    const SCRAMBLE_START = 0.1;
    const SCRAMBLE_END = 0.7;
    const FORM_START = 0.45;

    const sparkleEnv = t < 0.15 ? t / 0.15 : (t > 0.85 ? (1 - t) / 0.15 : 1);
    drawMorphSparkles(cx, cy, fontSize, t, baseAlpha * sparkleEnv);

    if (t < DISSOLVE_END) {
        const dt = t / DISSOLVE_END;
        S.ctx.font = `${fontSize}px ${oldFont}, serif`;
        S.ctx.textAlign = 'center';
        S.ctx.textBaseline = 'middle';

        for (let i = 0; i < chars.length; i++) {
            const stagger = i * 0.2;
            const charT = Math.max(0, Math.min(1, (dt - stagger) / (1 - stagger)));
            const shakeX = Math.sin(S.globalTime * 35 + i * 2.7) * charT * fontSize * 0.05;
            const shakeY = Math.cos(S.globalTime * 28 + i * 1.9) * charT * fontSize * 0.035;
            const driftY = -charT * charT * fontSize * 0.1;
            const alpha = baseAlpha * (1 - charT * charT);
            const aber = charT * fontSize * 0.025;
            const px = oldPos[i] + shakeX;
            const py = cy + shakeY + driftY;

            if (aber > 0.5) {
                S.ctx.globalAlpha = alpha * 0.3;
                S.ctx.fillStyle = '#FF4444';
                S.ctx.shadowColor = '#FF4444';
                S.ctx.shadowBlur = fontSize * 0.12;
                S.ctx.fillText(chars[i], px - aber, py);
                S.ctx.fillStyle = '#FFEE44';
                S.ctx.shadowColor = '#FFEE44';
                S.ctx.fillText(chars[i], px + aber, py + aber * 0.3);
            }

            S.ctx.globalAlpha = alpha;
            S.ctx.fillStyle = CONFIG.glowGold;
            S.ctx.shadowColor = CONFIG.glowGold;
            S.ctx.shadowBlur = fontSize * (0.15 + charT * 0.25);
            S.ctx.fillText(chars[i], px, py);
        }
    }

    if (t >= SCRAMBLE_START && t < SCRAMBLE_END) {
        const st = (t - SCRAMBLE_START) / (SCRAMBLE_END - SCRAMBLE_START);
        const speed = lerp(18, 3, st * st);
        const scrambleIdx = Math.floor(S.globalTime * speed);
        const posBlend = easeInOut(st);
        const envelope = st < 0.15 ? st / 0.15 : (st > 0.7 ? (1 - st) / 0.3 : 1);

        S.ctx.font = `${fontSize}px ${st < 0.5 ? oldFont : newFont}, serif`;
        S.ctx.textAlign = 'center';
        S.ctx.textBaseline = 'middle';

        for (let i = 0; i < chars.length; i++) {
            const scramChar = ALL_LUCKY[(scrambleIdx + i * 13) % ALL_LUCKY.length];
            const waveY = Math.sin(S.globalTime * 5 + i * 2.0) * fontSize * 0.035;
            const waveX = Math.cos(S.globalTime * 3.5 + i * 2.5) * fontSize * 0.02;
            const px = lerp(oldPos[i], newPos[i], posBlend) + waveX;
            const py = cy + waveY;
            const pulse = 1 + Math.sin(S.globalTime * 8 + i) * 0.05;

            S.ctx.save();
            S.ctx.translate(px, py);
            S.ctx.scale(pulse, pulse);
            S.ctx.globalAlpha = baseAlpha * envelope * 0.7;
            S.ctx.fillStyle = CONFIG.glowGold;
            S.ctx.shadowColor = CONFIG.glowGold;
            S.ctx.shadowBlur = fontSize * 0.2;
            S.ctx.fillText(scramChar, 0, 0);
            S.ctx.restore();
        }
    }

    if (t >= FORM_START) {
        const ft = (t - FORM_START) / (1 - FORM_START);
        S.ctx.font = `${fontSize}px ${newFont}, serif`;
        S.ctx.textAlign = 'center';
        S.ctx.textBaseline = 'middle';

        for (let i = 0; i < chars.length; i++) {
            const stagger = i * 0.15;
            const charT = Math.max(0, Math.min(1, (ft - stagger) / (1 - stagger)));
            const easedT = easeInOut(charT);

            let scale;
            if (charT < 0.45) {
                scale = easedT / 0.45 * 1.1;
            } else if (charT < 0.7) {
                scale = lerp(1.1, 0.97, easeInOut((charT - 0.45) / 0.25));
            } else {
                scale = lerp(0.97, 1.0, easeInOut((charT - 0.7) / 0.3));
            }

            const riseY = (1 - easedT) * fontSize * 0.12;
            const glowPulse = 1 + Math.sin(charT * Math.PI) * 0.5;

            S.ctx.save();
            S.ctx.translate(newPos[i], cy + riseY);
            S.ctx.scale(scale, scale);

            S.ctx.globalAlpha = baseAlpha * easedT * 0.35 * glowPulse;
            S.ctx.fillStyle = CONFIG.glowGold;
            S.ctx.shadowColor = CONFIG.glowGold;
            S.ctx.shadowBlur = fontSize * 0.3 * glowPulse;
            S.ctx.fillText(chars[i], 0, 0);

            S.ctx.globalAlpha = baseAlpha * easedT;
            S.ctx.shadowBlur = fontSize * 0.12;
            S.ctx.fillText(chars[i], 0, 0);

            S.ctx.restore();
        }
    }

    S.ctx.shadowBlur = 0;
    S.ctx.shadowColor = 'transparent';
    S.ctx.restore();
}

export function renderFortuneOverlay() {
    // Combined GPU render: 大吉 cluster + fireworks in one pass
    const dajiCount = updateDajiToGPU(true);

    if (fwShells.length || fwTrail.length || fwParticles.length) {
        appendFireworksToGPU(dajiCount);
    } else {
        renderAndCompositeGL();
    }

    const fadeIn = Math.min(1, S.stateTime / 0.9);
    const transition = getDajiFontTransition();
    if (transition) {
        const transDur = 1.2;
        const tt = (S.globalTime - transition.startTime) / transDur;
        if (tt >= 1) {
            clearDajiFontTransition();
            drawOverlayText('大 吉', 0.15, CONFIG.glowGold, fadeIn * 0.9, S.cellSize * 5, getDajiFont());
        } else {
            renderDajiMorph(tt, fadeIn, transition.oldFont, getDajiFont());
        }
    } else if (S.stateTime < 1.5) {
        renderDajiTitleEntrance(S.stateTime, getDajiFont());
    } else {
        drawOverlayText('大 吉', 0.15, CONFIG.glowGold, fadeIn * 0.9, S.cellSize * 5, getDajiFont());
    }

    const blessFade = Math.min(1, Math.max(0, (S.stateTime - 0.5) / 0.9));
    drawOverlayText('万事如意 · 心想事成', 0.82, CONFIG.glowRed, blessFade * 0.7, S.cellSize * 1.5);
    drawOverlayText('May all your wishes come true', 0.87, CONFIG.glowGold, blessFade * 0.5, S.cellSize * 1);

    // Hint to swipe up
    const isPanelActive = document.querySelector('.envelope-panel.active');
    if (!isPanelActive && S.stateTime > 2.5 && S.envelopeManager) {
        const hintFade = Math.min(1, (S.stateTime - 2.5) / 0.5);
        const pulse = 0.4 + Math.sin(S.globalTime * 3) * 0.2;
        if (S.envelopeManager.state.wished) {
            drawOverlayText('↑  查看详情  ↑', 0.94, CONFIG.glowGold, hintFade * pulse, S.cellSize * 1);
            drawOverlayText('Swipe Up to View Status', 0.97, CONFIG.glowGold, hintFade * pulse, S.cellSize * 0.8);
        } else {
            drawOverlayText('↑  上滑许愿  ↑', 0.94, CONFIG.glowGold, hintFade * pulse, S.cellSize * 1.2);
            drawOverlayText('Swipe Up to Make a Wish', 0.97, CONFIG.glowGold, hintFade * pulse, S.cellSize * 0.9);
        }
    }
}
