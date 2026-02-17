// ============================================================
// ASCII Grid — buffer, rendering, resize, background particles
// ============================================================
import { CONFIG, ALL_LUCKY, SCENE_FOV } from './config.js';
import { S } from './state.js';

// --- Grid Buffer ---
export function clearGrid() {
    S.grid = new Array(S.rows * S.cols).fill(null);
}

export function setCell(col, row, depth, char, r, g, b, alpha) {
    if (col < 0 || col >= S.cols || row < 0 || row >= S.rows) return;
    const idx = row * S.cols + col;
    const existing = S.grid[idx];
    if (existing && existing.depth <= depth) return;
    S.grid[idx] = { char, r, g, b, alpha, depth };
}

// --- Resize ---
export function resize() {
    S.dpr = Math.min(window.devicePixelRatio || 1, 2);
    S.canvas.width = window.innerWidth * S.dpr;
    S.canvas.height = window.innerHeight * S.dpr;
    S.canvas.style.width = window.innerWidth + 'px';
    S.canvas.style.height = window.innerHeight + 'px';
    const vmin = Math.min(window.innerWidth, window.innerHeight);
    S.cellSize = Math.max(10, Math.floor(vmin * 0.028));
    S.cols = Math.floor(window.innerWidth / S.cellSize);
    S.rows = Math.floor(window.innerHeight / S.cellSize);
    S.gridW = S.cols * S.cellSize;
    S.gridH = S.rows * S.cellSize;
    S.offsetX = (window.innerWidth - S.gridW) / 2;
    S.offsetY = (window.innerHeight - S.gridH) / 2;

    if (S.glRenderer) {
        S.glRenderer.setSize(window.innerWidth, window.innerHeight);
        S.glRenderer.setPixelRatio(S.dpr);
        const fov = 2 * Math.atan(window.innerHeight / (2 * SCENE_FOV)) * (180 / Math.PI);
        S.glCamera.fov = fov;
        S.glCamera.aspect = window.innerWidth / window.innerHeight;
        S.glCamera.updateProjectionMatrix();
    }
}

// --- Scanlines ---
function drawScanlines() {
    S.ctx.save();
    S.ctx.globalAlpha = 0.03;
    S.ctx.fillStyle = '#fff';
    for (let y = 0; y < S.canvas.height; y += 4 * S.dpr) {
        S.ctx.fillRect(0, y, S.canvas.width, 1 * S.dpr);
    }
    S.ctx.restore();
}

// --- Render ASCII Grid to Canvas ---
export function renderGrid() {
    const { ctx, dpr, cols, rows, grid, cellSize, offsetX, offsetY } = S;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = CONFIG.bg;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    const fontSize = cellSize;
    ctx.font = `${fontSize}px ${S.chosenFont}, "Courier New", "SF Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = grid[row * cols + col];
            if (!cell) continue;
            const x = offsetX + col * cellSize + cellSize / 2;
            const y = offsetY + row * cellSize + cellSize / 2;
            if (cell.alpha > 0.3) {
                ctx.shadowColor = `rgba(${cell.r}, ${cell.g}, ${cell.b}, ${cell.alpha * 0.6})`;
                ctx.shadowBlur = cellSize * cell.alpha * 1.2;
            } else {
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }
            ctx.fillStyle = `rgba(${cell.r}, ${cell.g}, ${cell.b}, ${cell.alpha})`;
            ctx.fillText(cell.char, x, y);
        }
    }
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.restore();
    drawScanlines();
}

// --- Background Particles ---
const bgParticles = [];

export function initBgParticles() {
    for (let i = 0; i < 40; i++) {
        bgParticles.push({
            col: Math.random() * S.cols,
            row: Math.random() * S.rows,
            vx: (Math.random() - 0.5) * 0.02,
            vy: (Math.random() - 0.5) * 0.02,
            char: ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)],
            alpha: 0.03 + Math.random() * 0.08,
            phase: Math.random() * Math.PI * 2,
            changeTimer: Math.random() * 200,
        });
    }
}

export function updateBgParticles(time) {
    for (const p of bgParticles) {
        p.col += p.vx;
        p.row += p.vy;
        p.changeTimer--;
        if (p.col < 0) p.col += S.cols;
        if (p.col >= S.cols) p.col -= S.cols;
        if (p.row < 0) p.row += S.rows;
        if (p.row >= S.rows) p.row -= S.rows;
        if (p.changeTimer <= 0) {
            p.char = ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)];
            p.changeTimer = 100 + Math.random() * 200;
        }
        const col = Math.floor(p.col);
        const row = Math.floor(p.row);
        const flicker = p.alpha + Math.sin(p.phase + time * 1.5) * 0.02;
        setCell(col, row, 999, p.char, 255, 215, 0, Math.max(0.01, flicker));
    }
}
