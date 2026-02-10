// ============================================================
// 福 Cube — 3D ASCII Fortune Experience
// State machine: arrival → draw → fortune → (fireworks, etc.)
// ============================================================

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// --- Configuration ---
const CONFIG = {
    bg: '#CC0000',
    glowRed: '#FF2D2D',
    glowGold: '#FFD700',
    glowGreen: '#00FF9F',
    // Transition durations (ms) — spec families: 250, 450, 900
    scatterDur: 450,
    scrambleDur: 900,
    convergeDur: 450,
    settleDur: 250,
};

const LUCKY_CHARS_BY_DENSITY = [
    ' ', '·', '一', '人', '十', '大', '吉', '平', '安', '和',
    '春', '利', '兴', '旺', '发', '金', '贵', '富', '财', '寿',
    '禄', '喜', '龙', '凤', '福',
];

const ALL_LUCKY = '福禄寿喜财富贵发金玉宝余丰盛利旺隆昌兴进安康宁泰和平顺健乐欢庆禧祺嘉春德善仁义忠信孝慧恩爱合圆满美馨雅吉祥瑞如意祝运龙凤麟鹤华成升登高';

const CHAR_BLESSINGS = {
    '一': { phrase: '一帆风顺', english: 'Smooth sailing in all endeavors' },
    '人': { phrase: '人寿年丰', english: 'Long life and abundant harvests' },
    '十': { phrase: '十全十美', english: 'Perfection in every way' },
    '大': { phrase: '大吉大利', english: 'Great luck and great profit' },
    '吉': { phrase: '吉祥如意', english: 'Good fortune as you wish' },
    '平': { phrase: '四季平安', english: 'Peace through all four seasons' },
    '安': { phrase: '岁岁平安', english: 'Peace and safety year after year' },
    '和': { phrase: '和气生财', english: 'Harmony brings prosperity' },
    '春': { phrase: '春风得意', english: 'Success on the spring breeze' },
    '利': { phrase: '开岁大利', english: 'Great profit in the new year' },
    '兴': { phrase: '兴旺发达', english: 'Flourishing and thriving' },
    '旺': { phrase: '人丁兴旺', english: 'A growing and prosperous family' },
    '发': { phrase: '恭喜发财', english: 'Wishing you great prosperity' },
    '金': { phrase: '金玉满堂', english: 'Gold and jade fill the hall' },
    '贵': { phrase: '荣华富贵', english: 'Glory, splendor, and riches' },
    '富': { phrase: '富贵有余', english: 'Wealth and abundance to spare' },
    '财': { phrase: '财源广进', english: 'Wealth flowing from all directions' },
    '寿': { phrase: '福寿双全', english: 'Both blessings and longevity' },
    '禄': { phrase: '高官厚禄', english: 'High rank and generous reward' },
    '喜': { phrase: '双喜临门', english: 'Double happiness at the door' },
    '龙': { phrase: '龙马精神', english: 'The vigor of dragons and horses' },
    '凤': { phrase: '龙凤呈祥', english: 'Dragon and phoenix bring fortune' },
    '福': { phrase: '福星高照', english: 'The star of fortune shines bright' },
};

// --- Calligraphy Fonts ---
const CALLI_FONTS = [
    // Google Fonts
    '"Zhi Mang Xing"',              // 指芒星 — running script
    '"Liu Jian Mao Cao"',           // 柳建毛草 — grass script
    '"Ma Shan Zheng"',              // 马善政 — bold brush
    // Chinese Webfont Project (中文网字计划)
    '"TsangerZhoukeZhengdabangshu"', // 仓耳周珂正大榜书 — banner calligraphy
    '"hongleixingshu"',              // 鸿雷行书简体 — running script
    '"qiantubifengshouxieti"',       // 千图笔锋手写体 — brush stroke
    '"slideyouran"',                 // 演示悠然小楷 — elegant regular script
    '"峄山碑篆体"',                    // 峄山碑篆体 — seal script
];
const chosenFont = CALLI_FONTS[Math.floor(Math.random() * CALLI_FONTS.length)];

// --- Math ---
function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

// --- 3D Projection ---
function project3D(x, y, z, fov) {
    const scale = fov / (fov + z);
    return {
        screenX: x * scale + window.innerWidth / 2,
        screenY: y * scale + window.innerHeight / 2,
        scale,
    };
}

// --- Responsive Grid ---
let cellSize, cols, rows, gridW, gridH, offsetX, offsetY;
let dpr = Math.min(window.devicePixelRatio || 1, 2);

function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    const vmin = Math.min(window.innerWidth, window.innerHeight);
    cellSize = Math.max(10, Math.floor(vmin * 0.028));
    cols = Math.floor(window.innerWidth / cellSize);
    rows = Math.floor(window.innerHeight / cellSize);
    gridW = cols * cellSize;
    gridH = rows * cellSize;
    offsetX = (window.innerWidth - gridW) / 2;
    offsetY = (window.innerHeight - gridH) / 2;
}
window.addEventListener('resize', resize);
resize();

// --- Grid Buffer (for ASCII elements: bg particles, 大吉, morph) ---
let grid = [];
function clearGrid() {
    grid = new Array(rows * cols).fill(null);
}
function setCell(col, row, depth, char, r, g, b, alpha) {
    if (col < 0 || col >= cols || row < 0 || row >= rows) return;
    const idx = row * cols + col;
    const existing = grid[idx];
    if (existing && existing.depth <= depth) return;
    grid[idx] = { char, r, g, b, alpha, depth };
}

// --- Character Sampling (for morph source + 大吉 target) ---
function sampleCharacterShape(char, resolution, fontOverride) {
    const off = document.createElement('canvas');
    const octx = off.getContext('2d');
    const charCount = [...char].length;
    const w = resolution * charCount;
    const h = resolution;
    off.width = w;
    off.height = h;

    octx.fillStyle = '#000';
    octx.fillRect(0, 0, w, h);
    octx.fillStyle = '#fff';
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    const font = fontOverride || '"SimSun", "STSong", "Songti SC", "Noto Serif SC", serif';
    octx.font = `bold ${Math.floor(resolution * 0.85)}px ${font}`;
    octx.fillText(char, w / 2, h / 2);

    const imageData = octx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const points = [];
    const step = charCount > 1 ? 2 : 1;
    for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
            const idx = (y * w + x) * 4;
            const brightness = data[idx] / 255;
            if (brightness > 0.1) {
                points.push({
                    nx: (x / w) * 2 - 1,
                    ny: (y / h) * 2 - 1,
                    brightness,
                    aspect: charCount,
                });
            }
        }
    }
    return points;
}

function selectCharByLuminance(luminance) {
    const idx = Math.floor(luminance * (LUCKY_CHARS_BY_DENSITY.length - 1));
    return LUCKY_CHARS_BY_DENSITY[Math.max(0, Math.min(idx, LUCKY_CHARS_BY_DENSITY.length - 1))];
}

function lerpColor(luminance) {
    const r = 255;
    const g = Math.floor(45 + luminance * (215 - 45));
    const b = Math.floor(45 - luminance * 45);
    return { r, g, b };
}

// --- Shape Data (sampled after fonts load) ---
let fuShape = [];
let dajiShape = [];
let fontsReady = false;

// Force-load the chosen font (unicode-range fonts won't load without DOM text)
document.fonts.load(`64px ${chosenFont}`, '福大吉').then(() => {
    fuShape = sampleCharacterShape('福', 64, chosenFont);
    dajiShape = sampleCharacterShape('大吉', 48);
    fontsReady = true;
});

// --- 3D Daji Cluster ---
let daji3DParticles = [];
let daji3DEntryTime = 0;
let hoveredIdx = -1;

function initDaji3D() {
    daji3DParticles = [];
    hoveredIdx = -1;
    hideTooltip();
    if (!fontsReady) return;

    const spread = Math.min(cols, rows) * 0.40 * cellSize;
    const depth = spread * 0.4;

    for (const pt of dajiShape) {
        const lum = Math.min(1, pt.brightness + 0.08);
        const char = selectCharByLuminance(lum);
        if (char === ' ') continue;
        const color = lerpColor(lum);

        daji3DParticles.push({
            baseX: pt.nx * spread * 0.5 * pt.aspect,
            baseY: pt.ny * spread * 0.5,
            origZ: (Math.random() - 0.5) * depth,
            char,
            r: color.r, g: color.g, b: color.b,
            alpha: 0.3 + lum * 0.7,
            lum,
            phase: Math.random() * Math.PI * 2,
        });
    }
    daji3DEntryTime = globalTime;
}

function render3DDaji() {
    if (daji3DParticles.length === 0) return;
    ctx.save();
    ctx.scale(dpr, dpr);

    const fov = 500;
    const spread = Math.min(cols, rows) * 0.40 * cellSize;
    const breatheAmp = spread * 0.06;
    const entryT = Math.min(1, (globalTime - daji3DEntryTime) / 1.2);
    const zInflate = easeInOut(entryT);

    const projected = [];
    for (let i = 0; i < daji3DParticles.length; i++) {
        const p = daji3DParticles[i];
        const z = p.origZ * zInflate + Math.sin(globalTime * 1.5 + p.phase) * breatheAmp * zInflate;
        const isHovered = i === hoveredIdx;
        const hoverPush = isHovered ? -80 : 0;
        const proj = project3D(p.baseX, p.baseY, z + hoverPush, fov);

        projected.push({
            idx: i, z, baseY: p.baseY,
            screenX: proj.screenX, screenY: proj.screenY, scale: proj.scale,
            char: p.char, alpha: p.alpha, lum: p.lum, isHovered,
        });
    }

    // Sort back to front
    projected.sort((a, b) => b.z - a.z);

    const baseFontSize = cellSize * 1.1;
    const centerY = window.innerHeight / 2;
    const clusterH = spread * 0.5;
    // Moving highlight band for metallic reflection
    const highlightPos = Math.sin(globalTime * 0.8) * 0.3;

    for (const p of projected) {
        let fontSize = baseFontSize * p.scale;
        let alpha = p.alpha * p.scale;

        if (p.isHovered) {
            fontSize *= 2.2;
            alpha = 1;
        }
        if (fontSize < 3) continue;

        // Gold metallic gradient based on vertical position
        const yNorm = clusterH > 0 ? (p.screenY - centerY) / clusterH : 0;
        const gradT = Math.max(0, Math.min(1, (yNorm + 1) * 0.5));
        const hDist = Math.abs(yNorm - highlightPos);
        const highlight = Math.max(0, 1 - hDist * 3);

        const gr = Math.min(255, Math.floor(lerp(255, 180, gradT) + highlight * 55));
        const gg = Math.min(255, Math.floor(lerp(225, 130, gradT) + highlight * 40));
        const gb = Math.min(255, Math.floor(lerp(50, 10, gradT) + highlight * 50));

        ctx.font = `${fontSize}px "Courier New", "SF Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (p.isHovered) {
            ctx.shadowColor = '#FFF8DC';
            ctx.shadowBlur = fontSize * 0.9;
        } else if (alpha > 0.3) {
            ctx.shadowColor = `rgba(${gr}, ${gg}, ${gb}, ${alpha * 0.5})`;
            ctx.shadowBlur = fontSize * 0.4;
        } else {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = Math.min(1, alpha);
        ctx.fillStyle = p.isHovered
            ? '#FFF8DC'
            : `rgb(${gr}, ${gg}, ${gb})`;
        ctx.fillText(p.char, p.screenX, p.screenY);
    }

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.restore();
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

function hideTooltip() {
    tooltip.style.opacity = '0';
}

function updateHover(clientX, clientY) {
    if (daji3DParticles.length === 0) { hoveredIdx = -1; hideTooltip(); return; }

    const fov = 500;
    const spread = Math.min(cols, rows) * 0.40 * cellSize;
    const breatheAmp = spread * 0.06;
    const entryT = Math.min(1, (globalTime - daji3DEntryTime) / 1.2);
    const zInflate = easeInOut(entryT);

    let bestIdx = -1, bestDist = Infinity;

    for (let i = 0; i < daji3DParticles.length; i++) {
        const p = daji3DParticles[i];
        if (!CHAR_BLESSINGS[p.char]) continue;
        const z = p.origZ * zInflate + Math.sin(globalTime * 1.5 + p.phase) * breatheAmp * zInflate;
        const proj = project3D(p.baseX, p.baseY, z, fov);
        const dx = proj.screenX - clientX;
        const dy = proj.screenY - clientY;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
        }
    }

    const threshold = cellSize * 2.5;
    if (bestDist > threshold * threshold) {
        hoveredIdx = -1;
        hideTooltip();
        return;
    }

    if (bestIdx !== hoveredIdx) {
        hoveredIdx = bestIdx;
        const p = daji3DParticles[bestIdx];
        const z = p.origZ * zInflate + Math.sin(globalTime * 1.5 + p.phase) * breatheAmp * zInflate;
        const proj = project3D(p.baseX, p.baseY, z, fov);
        showTooltip(p.char, proj.screenX, proj.screenY);
    }
}

// --- Background Particles ---
const bgParticles = [];
function initBgParticles() {
    for (let i = 0; i < 40; i++) {
        bgParticles.push({
            col: Math.random() * cols,
            row: Math.random() * rows,
            vx: (Math.random() - 0.5) * 0.02,
            vy: (Math.random() - 0.5) * 0.02,
            char: ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)],
            alpha: 0.03 + Math.random() * 0.08,
            phase: Math.random() * Math.PI * 2,
            changeTimer: Math.random() * 200,
        });
    }
}
initBgParticles();

function updateBgParticles(time) {
    for (const p of bgParticles) {
        p.col += p.vx;
        p.row += p.vy;
        p.changeTimer--;
        if (p.col < 0) p.col += cols;
        if (p.col >= cols) p.col -= cols;
        if (p.row < 0) p.row += rows;
        if (p.row >= rows) p.row -= rows;
        if (p.changeTimer <= 0) {
            p.char = ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)];
            p.changeTimer = 100 + Math.random() * 200;
        }
        const col = Math.floor(p.col);
        const row = Math.floor(p.row);
        const flicker = p.alpha + Math.sin(p.phase + time * 1.5) * 0.02;
        setCell(col, row, 999, p.char, 0, 255, 159, Math.max(0.01, flicker));
    }
}

// --- Scanlines ---
function drawScanlines() {
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = '#fff';
    for (let y = 0; y < canvas.height; y += 4 * dpr) {
        ctx.fillRect(0, y, canvas.width, 1 * dpr);
    }
    ctx.restore();
}

// --- Render ASCII Grid to Canvas ---
function renderGrid() {
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = CONFIG.bg;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    const fontSize = cellSize;
    ctx.font = `${fontSize}px "Courier New", "SF Mono", monospace`;
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

// --- Draw the calligraphy 福 directly on canvas ---
function drawCalligraphyFu(alpha) {
    ctx.save();
    ctx.scale(dpr, dpr);

    const vmin = Math.min(window.innerWidth, window.innerHeight);
    const fuSize = vmin * 0.55;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${fuSize}px ${chosenFont}, serif`;

    // Outer glow layer
    ctx.globalAlpha = alpha * 0.3;
    ctx.shadowColor = CONFIG.glowGold;
    ctx.shadowBlur = fuSize * 0.15;
    ctx.fillStyle = CONFIG.glowGold;
    ctx.fillText('福', cx, cy);

    // Main character
    ctx.globalAlpha = alpha;
    ctx.shadowColor = CONFIG.glowGold;
    ctx.shadowBlur = fuSize * 0.06;
    ctx.fillStyle = CONFIG.glowGold;
    ctx.fillText('福', cx, cy);

    ctx.shadowBlur = 0;
    ctx.restore();
}

// --- Draw text overlay ---
function drawOverlayText(text, yFraction, color, alpha, size, fontOverride) {
    ctx.save();
    ctx.scale(dpr, dpr);
    const fontSize = size || Math.max(12, cellSize * 1.2);
    const font = fontOverride || '"Courier New", "SF Mono", monospace';
    ctx.font = `${fontSize}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color || CONFIG.glowGreen;
    ctx.globalAlpha = alpha || 0.6;
    ctx.shadowColor = color || CONFIG.glowGreen;
    ctx.shadowBlur = fontSize * 0.4;
    ctx.fillText(text, window.innerWidth / 2, window.innerHeight * yFraction);
    ctx.shadowBlur = 0;
    ctx.restore();
}

// ============================================================
// STATE MACHINE
// ============================================================
let state = 'arrival';
let stateTime = 0;
let globalTime = 0;
let stateStartGlobal = 0;

function changeState(newState) {
    state = newState;
    stateStartGlobal = globalTime;
    stateTime = 0;
    if (newState === 'draw') initDrawAnimation();
    if (newState === 'fortune') initDaji3D();
    if (newState === 'fireworks') { hoveredIdx = -1; hideTooltip(); initFireworks(); }
}

// ============================================================
// ARRIVAL — Calligraphy 福 with neon glow + hint
// ============================================================
function updateArrival() {
    updateBgParticles(globalTime);
}

function renderArrivalOverlay() {
    // Calligraphy 福
    const fadeIn = Math.min(1, stateTime / 1.0);
    drawCalligraphyFu(fadeIn);

    // Title text
    const textFade = Math.min(1, stateTime / 1.5);
    drawOverlayText('新年纳福', 0.15, CONFIG.glowGold, textFade * 0.8, cellSize * 2);
    drawOverlayText('A Blessing Awaits', 0.20, CONFIG.glowGold, textFade * 0.5, cellSize * 1.1);

    // Swipe hint
    const hintFade = Math.min(1, Math.max(0, (stateTime - 1.5) / 0.5));
    const pulse = 0.4 + Math.sin(globalTime * 3) * 0.2;
    drawOverlayText('↑  上滑抽签  ↑', 0.88, CONFIG.glowGreen, hintFade * pulse, cellSize * 1.3);
    drawOverlayText('Swipe Up to Draw Fortune', 0.92, CONFIG.glowGreen, hintFade * pulse * 0.6, cellSize * 0.9);
}

// ============================================================
// DRAW — 福 dissolves → scatter → scramble → 大吉 converges
// ============================================================
let morphParticles = [];

function initDrawAnimation() {
    morphParticles = [];
    if (!fontsReady) return;

    const centerCol = cols / 2;
    const centerRow = rows / 2;

    // Source: positions sampled from calligraphy 福
    const fuGridSize = Math.min(cols, rows) * 0.55;
    const fuPoints = fuShape.map(pt => ({
        col: centerCol + pt.nx * fuGridSize * 0.5,
        row: centerRow + pt.ny * fuGridSize * 0.5,
        brightness: pt.brightness,
    }));

    // Target: positions for 大吉
    const dajiGridSize = Math.min(cols, rows) * 0.40;
    const dajiTargets = dajiShape.map(pt => ({
        col: centerCol + pt.nx * dajiGridSize * 0.5 * pt.aspect,
        row: centerRow + pt.ny * dajiGridSize * 0.5,
        brightness: pt.brightness,
    }));

    const maxCount = Math.max(fuPoints.length, dajiTargets.length);

    for (let i = 0; i < maxCount; i++) {
        const src = fuPoints[i % fuPoints.length];
        const tgt = dajiTargets[i % dajiTargets.length];
        const dx = src.col - centerCol;
        const dy = src.row - centerRow;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        morphParticles.push({
            col: src.col, row: src.row,
            startCol: src.col, startRow: src.row,
            targetCol: tgt.col, targetRow: tgt.row,
            vx: (dx / dist) * (2 + Math.random() * 4) + (Math.random() - 0.5) * 3,
            vy: (dy / dist) * (2 + Math.random() * 4) + (Math.random() - 0.5) * 3,
            char: ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)],
            scrambleTimer: 0,
            finalChar: selectCharByLuminance(tgt.brightness),
            brightness: tgt.brightness,
            phase: Math.random() * Math.PI * 2,
        });
    }
}

function updateDraw() {
    updateBgParticles(globalTime);

    const t = stateTime;
    const scatterEnd = CONFIG.scatterDur / 1000;
    const scrambleEnd = scatterEnd + CONFIG.scrambleDur / 1000;
    const convergeEnd = scrambleEnd + CONFIG.convergeDur / 1000;
    const settleEnd = convergeEnd + CONFIG.settleDur / 1000;

    for (const p of morphParticles) {
        if (t < scatterEnd) {
            const st = t / scatterEnd;
            p.col = p.startCol + p.vx * st * 8;
            p.row = p.startRow + p.vy * st * 8;
            p.scrambleTimer -= 1;
            if (p.scrambleTimer <= 0) {
                p.char = ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)];
                p.scrambleTimer = 2 + Math.random() * 3;
            }
        } else if (t < scrambleEnd) {
            const st = (t - scatterEnd) / (scrambleEnd - scatterEnd);
            const scatteredCol = p.startCol + p.vx * 8;
            const scatteredRow = p.startRow + p.vy * 8;
            const midCol = lerp(scatteredCol, p.targetCol, easeInOut(st) * 0.5);
            const midRow = lerp(scatteredRow, p.targetRow, easeInOut(st) * 0.5);
            p.col = midCol + Math.sin(p.phase + globalTime * 5) * (1 - st) * 2;
            p.row = midRow + Math.cos(p.phase + globalTime * 4) * (1 - st) * 2;
            p.scrambleTimer -= 1;
            if (p.scrambleTimer <= 0) {
                p.char = Math.random() < st * st
                    ? p.finalChar
                    : ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)];
                p.scrambleTimer = 2 + st * 15;
            }
        } else if (t < convergeEnd) {
            const st = (t - scrambleEnd) / (convergeEnd - scrambleEnd);
            const eased = easeInOut(st);
            const scatteredCol = p.startCol + p.vx * 8;
            const scatteredRow = p.startRow + p.vy * 8;
            p.col = lerp(lerp(scatteredCol, p.targetCol, 0.5), p.targetCol, eased);
            p.row = lerp(lerp(scatteredRow, p.targetRow, 0.5), p.targetRow, eased);
            if (st > 0.3) p.char = p.finalChar;
        } else {
            p.col = p.targetCol;
            p.row = p.targetRow;
            p.char = p.finalChar;
        }

        const col = Math.floor(p.col);
        const row = Math.floor(p.row);
        const color = lerpColor(p.brightness);

        let alpha;
        if (t < scatterEnd) {
            alpha = 0.5 + p.brightness * 0.3;
        } else if (t >= convergeEnd) {
            const settleSt = Math.min(1, (t - convergeEnd) / (settleEnd - convergeEnd));
            alpha = Math.min(1, (0.5 + p.brightness * 0.5) * (1 + Math.sin(settleSt * Math.PI) * 0.3));
        } else {
            alpha = 0.4 + p.brightness * 0.5;
        }

        setCell(col, row, 0, p.char, color.r, color.g, color.b, Math.min(1, alpha));
    }

    if (t >= settleEnd + 0.3) changeState('fortune');
}

function renderDrawOverlay() {
    // Fade out the calligraphy 福 during scatter phase
    const scatterEnd = CONFIG.scatterDur / 1000;
    if (stateTime < scatterEnd) {
        const fadeOut = 1 - easeInOut(stateTime / scatterEnd);
        drawCalligraphyFu(fadeOut);
    }
}

// ============================================================
// FORTUNE — 大吉 displayed
// ============================================================
function renderDaji(alpha) {
    const dajiGridSize = Math.min(cols, rows) * 0.40;
    const centerCol = cols / 2;
    const centerRow = rows / 2;
    for (const pt of dajiShape) {
        const col = Math.floor(centerCol + pt.nx * dajiGridSize * 0.5 * pt.aspect);
        const row = Math.floor(centerRow + pt.ny * dajiGridSize * 0.5);
        const lum = Math.min(1, pt.brightness + 0.08);
        const char = selectCharByLuminance(lum);
        if (char === ' ') continue;
        const color = lerpColor(lum);
        setCell(col, row, 0, char, color.r, color.g, color.b, Math.min(1, (0.3 + lum * 0.7) * alpha));
    }
}

function updateFortune() {
    updateBgParticles(globalTime);
}

function renderFortuneOverlay() {
    // 3D character cluster (rendered directly on canvas, between grid and overlay text)
    render3DDaji();

    const fadeIn = Math.min(1, stateTime / 0.9);
    drawOverlayText('大 吉', 0.15, CONFIG.glowGold, fadeIn * 0.9, cellSize * 3);

    const blessFade = Math.min(1, Math.max(0, (stateTime - 0.5) / 0.9));
    drawOverlayText('万事如意 · 心想事成', 0.82, CONFIG.glowRed, blessFade * 0.7, cellSize * 1.5);
    drawOverlayText('May all your wishes come true', 0.87, CONFIG.glowGold, blessFade * 0.5, cellSize * 1);

    if (stateTime > 2.5) {
        const hintFade = Math.min(1, (stateTime - 2.5) / 0.5);
        const pulse = 0.3 + Math.sin(globalTime * 3) * 0.2;
        drawOverlayText('↑  继续  ↑', 0.94, CONFIG.glowGreen, hintFade * pulse, cellSize * 1);
    }
}

// ============================================================
// FIREWORKS — Lucky character bursts across the screen
// ============================================================

const BLESSING_CATEGORIES = [
    { chars: '福禄寿喜财', r: 255, g: 45, b: 45 },         // 五福 — red
    { chars: '财富贵发金玉宝余丰盛利旺', r: 255, g: 215, b: 0 }, // Wealth — gold
    { chars: '安康宁泰和平顺健', r: 0, g: 255, b: 159 },    // Peace — jade
    { chars: '喜乐欢庆禧祺嘉春', r: 255, g: 120, b: 80 },   // Joy — warm
    { chars: '德善仁义忠信孝慧恩', r: 255, g: 200, b: 50 },  // Virtue — amber
    { chars: '爱合圆满美馨雅', r: 255, g: 130, b: 180 },     // Love — pink
    { chars: '吉祥瑞如意祝运', r: 180, g: 255, b: 80 },      // Auspicious — lime
    { chars: '龙凤麟鹤华', r: 255, g: 180, b: 50 },          // Mythical — orange
    { chars: '成升登高', r: 80, g: 220, b: 255 },             // Achievement — cyan
];

const fwShells = [];
const fwParticles = [];
let fwLaunchTimer = 0;
let fwLaunchCount = 0;

function launchShell() {
    const cat = BLESSING_CATEGORIES[Math.floor(Math.random() * BLESSING_CATEGORIES.length)];
    fwShells.push({
        col: cols * (0.15 + Math.random() * 0.7),
        row: rows + 2,
        targetRow: rows * (0.1 + Math.random() * 0.3),
        vy: -(0.35 + Math.random() * 0.15),
        cat,
    });
    fwLaunchCount++;
}

function burstShell(shell) {
    const count = 25 + Math.floor(Math.random() * 35);
    const { chars, r, g, b } = shell.cat;
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = 0.12 + Math.random() * 0.22;
        fwParticles.push({
            col: shell.col, row: shell.row,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.04,
            char: chars[Math.floor(Math.random() * chars.length)],
            r, g, b,
            life: 1.0,
            decay: 0.004 + Math.random() * 0.007,
            gravity: 0.0015 + Math.random() * 0.001,
            drag: 0.987,
        });
    }
}

function initFireworks() {
    fwShells.length = 0;
    fwParticles.length = 0;
    fwLaunchTimer = 0;
    fwLaunchCount = 0;
}

function updateFireworks() {
    updateBgParticles(globalTime);
    renderDaji(0.15 + Math.sin(globalTime * 0.8) * 0.05);

    // Auto-launch on a timer (frames)
    fwLaunchTimer--;
    if (fwLaunchTimer <= 0) {
        const burst = fwLaunchCount < 3 ? 1 : (Math.random() < 0.3 ? 2 : 1);
        for (let i = 0; i < burst; i++) launchShell();
        fwLaunchTimer = fwLaunchCount < 3
            ? 15 + Math.random() * 20
            : 35 + Math.random() * 55;
    }

    // Shells — rise and burst
    for (let i = fwShells.length - 1; i >= 0; i--) {
        const s = fwShells[i];
        s.row += s.vy;
        s.vy *= 0.995;
        const sc = Math.floor(s.col), sr = Math.floor(s.row);
        setCell(sc, sr, 1, '·', s.cat.r, s.cat.g, s.cat.b, 0.7);
        for (let t = 1; t <= 3; t++) {
            const tr = sr + t;
            if (tr < rows) setCell(sc, tr, 2, '·', s.cat.r, s.cat.g, s.cat.b, 0.25 / t);
        }
        if (s.row <= s.targetRow) {
            burstShell(s);
            fwShells.splice(i, 1);
        }
    }

    // Particles — drift, fade, fall
    for (let i = fwParticles.length - 1; i >= 0; i--) {
        const p = fwParticles[i];
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.col += p.vx;
        p.row += p.vy;
        p.life -= p.decay;
        if (p.life <= 0 || p.row >= rows || p.col < -5 || p.col > cols + 5) {
            fwParticles.splice(i, 1);
            continue;
        }
        const alpha = p.life * p.life; // quadratic fade
        setCell(Math.floor(p.col), Math.floor(p.row), 0,
            p.char, p.r, p.g, p.b, Math.max(0.05, alpha));
    }
}

function renderFireworksOverlay() {
    const fadeIn = Math.min(1, stateTime / 1.5);
    drawOverlayText('恭喜发财', 0.08, CONFIG.glowGold, fadeIn * 0.7, cellSize * 2);
    drawOverlayText('Prosperity & Fortune', 0.13, CONFIG.glowGold, fadeIn * 0.4, cellSize * 1);

    if (stateTime > 3) {
        const hintFade = Math.min(1, (stateTime - 3) / 0.5);
        const pulse = 0.3 + Math.sin(globalTime * 3) * 0.2;
        drawOverlayText('↑  继续  ↑', 0.94, CONFIG.glowGreen, hintFade * pulse, cellSize * 1);
    }
}

// ============================================================
// SWIPE / TAP / HOVER
// ============================================================
let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
let touchMoved = false;

canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartTime = performance.now();
    touchMoved = false;
    if (state === 'fortune') updateHover(t.clientX, t.clientY);
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (Math.abs(t.clientX - touchStartX) > 10 || Math.abs(t.clientY - touchStartY) > 10) {
        touchMoved = true;
    }
    if (state === 'fortune') updateHover(t.clientX, t.clientY);
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
    hoveredIdx = -1;
    hideTooltip();
    const dy = touchStartY - e.changedTouches[0].clientY;
    const dt = performance.now() - touchStartTime;
    if (dy > 50 && dt < 500) handleSwipeUp();
}, { passive: true });

// Desktop hover
canvas.addEventListener('mousemove', (e) => {
    if (state === 'fortune') updateHover(e.clientX, e.clientY);
});
canvas.addEventListener('mouseleave', () => {
    hoveredIdx = -1;
    hideTooltip();
});

canvas.addEventListener('click', (e) => {
    if (state === 'fortune' && hoveredIdx >= 0) return;
    handleSwipeUp();
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleSwipeUp();
    }
});

function handleSwipeUp() {
    if (state === 'arrival' && fontsReady) {
        changeState('draw');
    } else if (state === 'fortune') {
        changeState('fireworks');
    }
}

// ============================================================
// MAIN LOOP
// ============================================================
const startTime = performance.now();

function frame(now) {
    globalTime = (now - startTime) / 1000;
    stateTime = globalTime - stateStartGlobal;

    clearGrid();

    switch (state) {
        case 'arrival':  updateArrival(); break;
        case 'draw':     updateDraw(); break;
        case 'fortune':  updateFortune(); break;
        case 'fireworks': updateFireworks(); break;
    }

    renderGrid();

    switch (state) {
        case 'arrival':  renderArrivalOverlay(); break;
        case 'draw':     renderDrawOverlay(); break;
        case 'fortune':  renderFortuneOverlay(); break;
        case 'fireworks': renderFireworksOverlay(); break;
    }

    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
