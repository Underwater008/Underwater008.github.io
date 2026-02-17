// ============================================================
// DRAW STATE — 福 launches like firework → burst → reform into 大吉
// ============================================================
import { CONFIG, ALL_LUCKY, CALLI_FONTS } from './config.js';
import { S } from './state.js';
import { lerp, easeInOut, gridToWorld, selectCharByLuminance, lerpColor } from './utils.js';
import { updateProjectedGlyphsToGPU } from './renderer.js';

// Draw phase timing
const DRAW_LAUNCH = CONFIG.fuExplodeDelay;
const DRAW_RISE = CONFIG.fuRiseDuration;
const DRAW_SHRINK = CONFIG.fuShrinkDuration;
const DRAW_SHRINK_END_SCALE = CONFIG.fuShrinkEndScale;
export const DRAW_CAMERA_PULLBACK = CONFIG.fuCameraPullbackDuration;
export const DRAW_CAMERA_RETURN = CONFIG.fuCameraReturnDuration;
const DRAW_SCATTER = DRAW_LAUNCH + 1.2;
const DRAW_REFORM = DRAW_SCATTER + 1.1;
const DRAW_SETTLE = DRAW_REFORM + 0.4;

let morphParticles = [];
let launchTrail = [];
let burstFlash = 0;

export function initDrawAnimation() {
    morphParticles = [];
    launchTrail = [];
    burstFlash = 0;
    S.drawToFortuneSeed = null;
    if (!S.fontsReady) return;

    const spread = Math.min(S.cols, S.rows) * 0.40 * S.cellSize;
    const depth = spread * 0.4;
    const dajiTargets = S.dajiShape.map(pt => ({
        x: pt.nx * spread * 0.5 * pt.aspect,
        y: pt.ny * spread * 0.5,
        z: (Math.random() - 0.5) * depth,
        brightness: pt.brightness,
    }));

    const burstOrigin = gridToWorld(S.cols / 2, S.rows * 0.22);

    for (let i = 0; i < dajiTargets.length; i++) {
        const tgt = dajiTargets[i];
        const angle = Math.random() * Math.PI * 2;
        const scatterRadius = spread * (0.8 + Math.random() * 1.2);
        const scatterLift = spread * (0.1 + Math.random() * 0.4);

        morphParticles.push({
            x: burstOrigin.x,
            y: burstOrigin.y,
            z: 0,
            startX: burstOrigin.x,
            startY: burstOrigin.y,
            startZ: 0,
            scatterX: burstOrigin.x + Math.cos(angle) * scatterRadius,
            scatterY: burstOrigin.y + Math.sin(angle) * scatterRadius * 0.6 + scatterLift,
            scatterZ: (Math.random() - 0.5) * depth * 1.6,
            targetX: tgt.x,
            targetY: tgt.y,
            targetZ: tgt.z,
            char: ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)],
            scrambleTimer: 0,
            finalChar: selectCharByLuminance(tgt.brightness),
            brightness: tgt.brightness,
            phase: Math.random() * Math.PI * 2,
            fontIdx: Math.random() < 0.7 ? Math.floor(Math.random() * CALLI_FONTS.length) : null,
            active: false,
        });
    }
}

export function updateDraw(changeState) {
    const t = S.stateTime;

    // --- LAUNCH: trail sparks behind rising 福 ---
    if (t < DRAW_LAUNCH) {
        const riseT = Math.min(1, t / Math.max(0.001, DRAW_RISE));
        const launchT = easeInOut(riseT);
        const fuRow = lerp(S.rows * 0.5, S.rows * 0.22, launchT);
        const fuCol = S.cols / 2;
        const fuPos = gridToWorld(fuCol, fuRow);
        if (Math.random() < 0.6) {
            launchTrail.push({
                x: fuPos.x + (Math.random() - 0.5) * S.cellSize * 4,
                y: fuPos.y + S.cellSize * (0.9 + Math.random() * 2.2),
                z: (Math.random() - 0.5) * S.cellSize * 3,
                vx: (Math.random() - 0.5) * S.cellSize * 0.08,
                vy: S.cellSize * (0.08 + Math.random() * 0.12),
                vz: (Math.random() - 0.5) * S.cellSize * 0.06,
                char: ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)],
                life: 1,
                decay: 0.015 + Math.random() * 0.025,
            });
        }
    }

    // --- BURST FLASH ---
    if (t >= DRAW_LAUNCH && t < DRAW_LAUNCH + 0.15) {
        burstFlash = 1 - (t - DRAW_LAUNCH) / 0.15;
        for (const p of morphParticles) p.active = true;
    } else if (t >= DRAW_LAUNCH + 0.15) {
        burstFlash = 0;
    }

    // --- Morph particles: scatter → reform → settle ---
    if (t >= DRAW_LAUNCH) {
        for (const p of morphParticles) {
            if (!p.active) continue;

            if (t < DRAW_SCATTER) {
                const st = (t - DRAW_LAUNCH) / (DRAW_SCATTER - DRAW_LAUNCH);
                const eased = 1 - Math.pow(1 - st, 2);
                p.x = lerp(p.startX, p.scatterX, eased);
                p.y = lerp(p.startY, p.scatterY, eased) + eased * S.cellSize * 6.0;
                p.z = lerp(p.startZ, p.scatterZ, eased);

                const wobble = st * S.cellSize * 0.8;
                p.x += Math.sin(p.phase + S.globalTime * 4) * wobble;
                p.y += Math.cos(p.phase + S.globalTime * 3) * wobble;
                p.z += Math.sin(p.phase * 0.7 + S.globalTime * 3.2) * wobble * 1.4;

                p.scrambleTimer -= 1;
                if (p.scrambleTimer <= 0) {
                    p.char = ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)];
                    p.scrambleTimer = 2 + Math.random() * 3;
                }
            } else if (t < DRAW_REFORM) {
                const st = (t - DRAW_SCATTER) / (DRAW_REFORM - DRAW_SCATTER);
                const eased = easeInOut(st);
                p.x = lerp(p.scatterX, p.targetX, eased);
                p.y = lerp(p.scatterY + S.cellSize * 6.0, p.targetY, eased);
                p.z = lerp(p.scatterZ, p.targetZ, eased);
                const wobble = (1 - eased) * S.cellSize * 0.8;
                p.x += Math.sin(p.phase + S.globalTime * 4) * wobble;
                p.y += Math.cos(p.phase + S.globalTime * 3) * wobble;
                p.z += Math.sin(p.phase * 0.7 + S.globalTime * 3.2) * wobble * 1.4;
                p.scrambleTimer -= 1;
                if (p.scrambleTimer <= 0) {
                    p.char = st > 0.4
                        ? p.finalChar
                        : ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)];
                    p.scrambleTimer = 2 + st * 12;
                }
            } else {
                const settleT = Math.min(1, (t - DRAW_REFORM) / Math.max(0.001, DRAW_SETTLE - DRAW_REFORM));
                const eased = easeInOut(settleT);

                p.x = lerp(p.x, p.targetX, eased);
                p.y = lerp(p.y, p.targetY, eased);
                p.z = lerp(p.z, p.targetZ, eased);
                p.char = p.finalChar;
            }
        }
    }

    // --- Update trail sparks ---
    const worldBottom = (S.rows * 0.5 + 2) * S.cellSize;
    let tw = 0;
    for (let i = 0; i < launchTrail.length; i++) {
        const s = launchTrail[i];
        s.x += s.vx;
        s.y += s.vy;
        s.z += s.vz;
        s.vx *= 0.98;
        s.vz *= 0.98;
        s.life -= s.decay;
        if (s.life > 0 && s.y < worldBottom) launchTrail[tw++] = s;
    }
    launchTrail.length = tw;

    if (t >= DRAW_SETTLE + 0.3) {
        const seeded = buildDajiSeedFromMorph();
        S.drawToFortuneSeed = seeded.length > 0 ? seeded : null;

        changeState('fortune');
    }
}

function buildDajiSeedFromMorph() {
    const seeded = [];
    for (const p of morphParticles) {
        if (!p.active) continue;
        const lum = Math.min(1, p.brightness + 0.08);
        const char = p.finalChar || selectCharByLuminance(lum);
        if (char === ' ') continue;
        const color = lerpColor(lum);
        seeded.push({
            baseX: p.x,
            baseY: p.y,
            origZ: p.targetZ,
            char,
            fontIdx: p.fontIdx,
            r: color.r,
            g: color.g,
            b: color.b,
            alpha: 0.3 + lum * 0.7,
            lum,
            phase: p.phase,
        });
    }
    return seeded;
}

function renderDrawParticles3D(t) {
    const glyphs = [];

    for (const s of launchTrail) {
        glyphs.push({
            x: s.x, y: s.y, z: s.z,
            char: s.char,
            r: 255,
            g: Math.floor(190 + s.life * 65),
            b: Math.floor(35 + s.life * 40),
            alpha: s.life * 0.68,
            size: 0.72 + s.life * 0.35,
            glow: 0.9, blur: 0.8,
        });
    }

    const spread = Math.min(S.cols, S.rows) * 0.40 * S.cellSize;
    const breatheAmp = spread * 0.06;

    for (const p of morphParticles) {
        if (!p.active) continue;
        const gp = p.brightness;
        const drawR = 255;
        const drawG = 180 + gp * 75;
        const drawB = gp * 50;
        let r = drawR, g = drawG, b = drawB;
        let alpha, size = 0.95 + gp * 0.45;

        if (t < DRAW_SCATTER) {
            const st = (t - DRAW_LAUNCH) / (DRAW_SCATTER - DRAW_LAUNCH);
            const fade = 1 - st;
            const flicker = Math.sin(S.globalTime * 25 + p.phase * 3) * 0.25 * fade;
            alpha = Math.min(1, Math.max(0.1, (0.6 + gp * 0.3) + flicker));
            const sizeWobble = Math.sin(S.globalTime * 18 + p.phase * 2) * 0.3 * fade;
            size *= (1 + sizeWobble);
        } else if (t < DRAW_REFORM) {
            const st = (t - DRAW_SCATTER) / (DRAW_REFORM - DRAW_SCATTER);
            const fade = st;
            const pulse = Math.sin(S.globalTime * 8 + p.phase) * 0.2 * fade;
            alpha = Math.min(1, Math.max(0.2, (0.6 + gp * 0.3) + pulse));
            const breathe = Math.sin(S.globalTime * 6 + p.phase) * 0.15 * fade;
            size *= (1 + breathe);
        } else {
            const settleSt = Math.min(1, (t - DRAW_REFORM) / (DRAW_SETTLE - DRAW_REFORM));
            const lum = Math.min(1, gp + 0.08);
            const seed = lerpColor(lum);
            r = lerp(drawR, seed.r, settleSt);
            g = lerp(drawG, seed.g, settleSt);
            b = lerp(drawB, seed.b, settleSt);
            const seedAlpha = 0.3 + lum * 0.7;
            const pulseAlpha = Math.min(1, (0.5 + gp * 0.5) * (1 + Math.sin(settleSt * Math.PI) * 0.3));
            alpha = lerp(pulseAlpha, seedAlpha, settleSt);
            size = lerp(size, 1.1, settleSt);
        }

        let breatheMix = 0;
        if (t >= DRAW_REFORM) {
            breatheMix = 1;
        } else if (t > DRAW_SCATTER) {
            const reformProgress = (t - DRAW_SCATTER) / (DRAW_REFORM - DRAW_SCATTER);
            breatheMix = Math.max(0, reformProgress - 0.5) * 2;
        }

        const breathing = Math.sin(S.globalTime * 1.5 + p.phase) * breatheAmp;
        const renderZ = p.z + breathing * breatheMix;

        glyphs.push({
            x: p.x, y: p.y, z: renderZ,
            char: p.char,
            fontIdx: p.fontIdx,
            r: Math.round(r), g: Math.round(g), b: Math.round(b),
            alpha, size, glow: 0.7, blur: 0.65,
        });
    }

    updateProjectedGlyphsToGPU(glyphs);
}

export function renderDrawOverlay() {
    const t = S.stateTime;
    renderDrawParticles3D(t);

    // Launch: draw 福 rising upward and shrinking
    if (t < DRAW_LAUNCH) {
        const riseT = Math.min(1, t / Math.max(0.001, DRAW_RISE));
        const shrinkT = Math.min(1, t / Math.max(0.001, DRAW_SHRINK));
        const riseEased = easeInOut(riseT);
        const shrinkEased = easeInOut(shrinkT);

        S.ctx.save();
        S.ctx.scale(S.dpr, S.dpr);

        const vmin = Math.min(window.innerWidth, window.innerHeight);
        const baseSize = vmin * 0.55;
        const fuSize = baseSize * lerp(1, DRAW_SHRINK_END_SCALE, shrinkEased);
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight * lerp(0.5, 0.2, riseEased);

        S.ctx.textAlign = 'center';
        S.ctx.textBaseline = 'middle';
        S.ctx.font = `${fuSize}px ${S.chosenFont}, serif`;

        const intensity = 1 + riseT * 2.5;
        S.ctx.globalAlpha = Math.min(1, 0.3 * intensity);
        S.ctx.shadowColor = CONFIG.glowGold;
        S.ctx.shadowBlur = fuSize * 0.2 * intensity;
        S.ctx.fillStyle = CONFIG.glowGold;
        S.ctx.fillText('福', cx, cy);

        S.ctx.globalAlpha = 1;
        S.ctx.shadowBlur = fuSize * 0.08 * intensity;
        S.ctx.fillText('福', cx, cy);

        S.ctx.shadowBlur = 0;
        S.ctx.restore();
    }

    // Burst flash
    if (burstFlash > 0) {
        S.ctx.save();
        S.ctx.scale(S.dpr, S.dpr);
        const bx = window.innerWidth / 2;
        const by = window.innerHeight * 0.22;
        const radius = Math.min(window.innerWidth, window.innerHeight) * 0.4 * burstFlash;
        const gradient = S.ctx.createRadialGradient(bx, by, 0, bx, by, radius);
        gradient.addColorStop(0, `rgba(255, 255, 220, ${burstFlash * 0.8})`);
        gradient.addColorStop(0.4, `rgba(255, 215, 0, ${burstFlash * 0.4})`);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        S.ctx.fillStyle = gradient;
        S.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        S.ctx.restore();
    }
}
