// ============================================================
// Fireworks — shell launching, bursting, particle physics, GPU rendering
// ============================================================
import { CONFIG, BLESSING_CATEGORIES, SCENE_FOV } from './config.js';
import { S } from './state.js';
import { lerp } from './utils.js';
import { _dummy, renderAndCompositeGL, updateProjectedGlyphsToGPU } from './renderer.js';
import { setCell } from './grid.js';

export const fwShells = [];
export const fwTrail = [];
export const fwParticles = [];
let fwLaunchTimer = 0;
let fwLaunchCount = 0;

function launchShell() {
    const cat = BLESSING_CATEGORIES[Math.floor(Math.random() * BLESSING_CATEGORIES.length)];
    const launchCol = S.cols * (0.15 + Math.random() * 0.7);
    const targetCol = launchCol + (Math.random() - 0.5) * S.cols * 0.12;
    const start = gridToWorldLocal(launchCol, S.rows + 2);
    const target = gridToWorldLocal(targetCol, S.rows * (0.1 + Math.random() * 0.3));
    const startZ = (Math.random() - 0.5) * S.cellSize * 8;
    fwShells.push({
        x: start.x,
        y: start.y,
        z: startZ,
        startX: start.x,
        startY: start.y,
        startZ,
        targetX: target.x,
        targetY: target.y,
        targetZ: (Math.random() - 0.5) * S.cellSize * 12,
        launchTime: S.globalTime,
        duration: CONFIG.shellRiseDuration * (0.85 + Math.random() * 0.3),
        cat,
    });
    fwLaunchCount++;
}

// Local gridToWorld to avoid circular import with utils
function gridToWorldLocal(col, row) {
    return {
        x: (col - S.cols / 2) * S.cellSize,
        y: (row - S.rows / 2) * S.cellSize,
    };
}

function burstShell(shell) {
    const count = 25 + Math.floor(Math.random() * 35);
    const { chars, r, g, b } = shell.cat;
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = S.cellSize * (0.06 + Math.random() * 0.10);
        fwParticles.push({
            x: shell.x, y: shell.y, z: shell.z,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - S.cellSize * 0.06,
            vz: (Math.random() - 0.5) * speed * 0.5,
            char: chars[Math.floor(Math.random() * chars.length)],
            r, g, b,
            life: 0.6 + Math.random() * 0.3,
            decay: 0.008 + Math.random() * 0.008,
            gravity: S.cellSize * (0.001 + Math.random() * 0.001),
            drag: 0.985,
            trailSegs: [],
            lastTrailTime: S.globalTime,
        });
    }
}

export function initFireworks() {
    fwShells.length = 0;
    fwTrail.length = 0;
    fwParticles.length = 0;
    fwLaunchTimer = 0;
    fwLaunchCount = 0;

    for (let i = 0; i < 2; i++) {
        launchShell();
    }
}

export function updateFireworkPhysics() {
    fwLaunchTimer--;
    if (fwLaunchTimer <= 0) {
        launchShell();
        fwLaunchTimer = fwLaunchCount < 3
            ? 40 + Math.random() * 30
            : 70 + Math.random() * 80;
    }

    const halfW = S.cols * S.cellSize * 0.5;
    const halfH = S.rows * S.cellSize * 0.5;

    // Shells — rise and burst
    let sw = 0;
    for (let i = 0; i < fwShells.length; i++) {
        const s = fwShells[i];
        const t = (S.globalTime - s.launchTime) / s.duration;
        const eased = 1 - Math.pow(1 - Math.min(t, 1), 2);
        s.x = lerp(s.startX, s.targetX, eased);
        s.y = lerp(s.startY, s.targetY, eased);
        s.z = lerp(s.startZ, s.targetZ, eased);

        const trailSpawn = Math.max(1, Math.floor((1 - eased) * 2.8));
        for (let j = 0; j < trailSpawn; j++) {
            fwTrail.push({
                x: s.x + (Math.random() - 0.5) * S.cellSize * 0.35,
                y: s.y + S.cellSize * (0.12 + Math.random() * 0.32),
                z: s.z + (Math.random() - 0.5) * S.cellSize * 0.6,
                vx: (Math.random() - 0.5) * S.cellSize * 0.03,
                vy: S.cellSize * (0.07 + Math.random() * 0.04),
                vz: (Math.random() - 0.5) * S.cellSize * 0.03,
                char: '·',
                r: s.cat.r, g: s.cat.g, b: s.cat.b,
                life: 0.35 + Math.random() * 0.45,
                decay: 0.03 + Math.random() * 0.04,
            });
        }
        if (t >= 1) {
            burstShell(s);
        } else {
            fwShells[sw++] = s;
        }
    }
    fwShells.length = sw;

    // Shell trails
    let trw = 0;
    for (let i = 0; i < fwTrail.length; i++) {
        const t = fwTrail[i];
        t.x += t.vx;
        t.y += t.vy;
        t.z += t.vz;
        t.vx *= 0.95;
        t.vz *= 0.95;
        t.life -= t.decay;
        if (t.life > 0 && t.y <= halfH + S.cellSize * 3) fwTrail[trw++] = t;
    }
    fwTrail.length = trw;

    // Particles
    const FW_TRAIL_INTERVAL = 0.06;
    const FW_MAX_TRAIL_SEGS = 14;
    let pw = 0;
    for (let i = 0; i < fwParticles.length; i++) {
        const p = fwParticles[i];
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vz *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.life -= p.decay;

        if (S.globalTime - p.lastTrailTime >= FW_TRAIL_INTERVAL && p.life > 0.05) {
            p.trailSegs.push({ x: p.x, y: p.y, z: p.z });
            p.lastTrailTime = S.globalTime;
            if (p.trailSegs.length > FW_MAX_TRAIL_SEGS) p.trailSegs.shift();
        }

        if (
            p.life > 0
            && p.y <= halfH + S.cellSize * 6
            && p.x >= -halfW - S.cellSize * 8
            && p.x <= halfW + S.cellSize * 8
            && p.z >= -SCENE_FOV * 0.9
            && p.z <= SCENE_FOV * 1.5
        ) {
            fwParticles[pw++] = p;
        }
    }
    fwParticles.length = pw;
}

export function renderFireworks3D() {
    const glyphs = [];

    for (const s of fwShells) {
        glyphs.push({
            x: s.x, y: s.y, z: s.z,
            char: '·',
            r: s.cat.r, g: s.cat.g, b: s.cat.b,
            alpha: 0.9, size: 1.0, glow: 1.0, blur: 0.9,
        });
    }

    for (const t of fwTrail) {
        glyphs.push({
            x: t.x, y: t.y, z: t.z,
            char: t.char,
            r: t.r, g: t.g, b: t.b,
            alpha: t.life * 0.7,
            size: 0.7 + t.life * 0.3, glow: 0.9, blur: 0.85,
        });
    }

    for (const p of fwParticles) {
        const alpha = Math.max(0.05, p.life * p.life);
        glyphs.push({
            x: p.x, y: p.y, z: p.z,
            char: p.char,
            r: p.r, g: p.g, b: p.b,
            alpha, size: 0.92 + alpha * 0.5, glow: 0.65, blur: 0.62,
        });

        const segCount = p.trailSegs.length;
        for (let ti = 0; ti < segCount; ti++) {
            const seg = p.trailSegs[ti];
            const ageFrac = segCount > 1 ? ti / (segCount - 1) : 1;
            const segAlpha = alpha * (0.2 + ageFrac * 0.6);
            glyphs.push({
                x: seg.x, y: seg.y, z: seg.z,
                char: p.char,
                r: p.r, g: p.g, b: p.b,
                alpha: segAlpha,
                size: 0.6 + ageFrac * 0.35, glow: 0.5, blur: 0.5,
            });
        }
    }

    updateProjectedGlyphsToGPU(glyphs);
}

// Append firework particles to the GPU buffer starting at startIdx (after daji particles)
export function appendFireworksToGPU(startIdx) {
    if (!S.particlesMesh) return;

    const instColor = S.particlesMesh.geometry.attributes.instanceColor;
    const instAlpha = S.particlesMesh.geometry.attributes.instanceAlpha;
    const instUV = S.particlesMesh.geometry.attributes.instanceUV;
    const instScale = S.particlesMesh.geometry.attributes.instanceScale;
    const maxCount = instColor.count;

    let idx = startIdx;

    for (const s of fwShells) {
        if (idx >= maxCount) break;
        _dummy.position.set(s.x, -s.y, -s.z);
        _dummy.updateMatrix();
        S.particlesMesh.setMatrixAt(idx, _dummy.matrix);
        instColor.setXYZ(idx, s.cat.r / 255, s.cat.g / 255, s.cat.b / 255);
        instAlpha.setX(idx, 0.9);
        const uv = S.charToUV['·'];
        if (uv) instUV.setXY(idx, uv.u, uv.v);
        instScale.setX(idx, S.cellSize);
        idx++;
    }

    for (const t of fwTrail) {
        if (idx >= maxCount) break;
        _dummy.position.set(t.x, -t.y, -t.z);
        _dummy.updateMatrix();
        S.particlesMesh.setMatrixAt(idx, _dummy.matrix);
        instColor.setXYZ(idx, t.r / 255, t.g / 255, t.b / 255);
        instAlpha.setX(idx, t.life * 0.7);
        const uv = S.charToUV[t.char];
        if (uv) instUV.setXY(idx, uv.u, uv.v);
        instScale.setX(idx, S.cellSize * (0.7 + t.life * 0.3));
        idx++;
    }

    for (const p of fwParticles) {
        if (idx >= maxCount) break;
        const alpha = Math.max(0.05, p.life * p.life);
        _dummy.position.set(p.x, -p.y, -p.z);
        _dummy.updateMatrix();
        S.particlesMesh.setMatrixAt(idx, _dummy.matrix);
        instColor.setXYZ(idx, p.r / 255, p.g / 255, p.b / 255);
        instAlpha.setX(idx, alpha);
        const uv = S.charToUV[p.char];
        if (uv) instUV.setXY(idx, uv.u, uv.v);
        instScale.setX(idx, S.cellSize * (0.92 + alpha * 0.5));
        idx++;

        const segCount = p.trailSegs.length;
        for (let ti = 0; ti < segCount; ti++) {
            if (idx >= maxCount) break;
            const seg = p.trailSegs[ti];
            const ageFrac = segCount > 1 ? ti / (segCount - 1) : 1;
            const segAlpha = alpha * (0.2 + ageFrac * 0.6);
            const segScale = S.cellSize * (0.6 + ageFrac * 0.35);
            _dummy.position.set(seg.x, -seg.y, -seg.z);
            _dummy.updateMatrix();
            S.particlesMesh.setMatrixAt(idx, _dummy.matrix);
            instColor.setXYZ(idx, p.r / 255, p.g / 255, p.b / 255);
            instAlpha.setX(idx, segAlpha);
            if (uv) instUV.setXY(idx, uv.u, uv.v);
            instScale.setX(idx, segScale);
            idx++;
        }
    }

    S.particlesMesh.count = idx;
    S.particlesMesh.instanceMatrix.needsUpdate = true;
    instColor.needsUpdate = true;
    instAlpha.needsUpdate = true;
    instUV.needsUpdate = true;
    instScale.needsUpdate = true;

    renderAndCompositeGL();
}
