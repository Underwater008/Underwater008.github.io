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
    // Draw phase: seconds before 福 bursts into particles
    fuExplodeDelay: 2.0,
    // Draw phase: independent timing controls (seconds)
    fuRiseDuration: 0.8,
    fuShrinkDuration: 0.8,
    fuShrinkEndScale: 0.18,
    // Draw camera timing (seconds): quick pullback, then hold until burst
    fuCameraPullbackDuration: 0.45,
    fuCameraReturnDuration: 0.7,
    // Firework shell rise time (seconds) before burst
    shellRiseDuration: 2.5,
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
const SCENE_FOV = 500;

function gridToWorld(col, row) {
    return {
        x: (col - cols / 2) * cellSize,
        y: (row - rows / 2) * cellSize,
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
let daji3DFromSeed = false;
let hoveredIdx = -1;

function initDaji3D(seedParticles) {
    daji3DParticles = [];
    hoveredIdx = -1;
    daji3DFromSeed = false;
    hideTooltip();
    if (Array.isArray(seedParticles) && seedParticles.length > 0) {
        daji3DParticles = seedParticles.map((p) => ({ ...p }));
        daji3DFromSeed = true;
        daji3DEntryTime = globalTime;
        return;
    }
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

    const spread = Math.min(cols, rows) * 0.40 * cellSize;
    const entryT = Math.min(1, (globalTime - daji3DEntryTime) / 1.2);
    // When entering from seed, z is already correct — no inflate animation
    const zInflate = daji3DFromSeed ? 1 : easeInOut(entryT);
    // Blend timer: 0→1 over 0.6s — used to transition from seed look to metallic look
    const blendT = daji3DFromSeed ? Math.min(1, (globalTime - daji3DEntryTime) / 0.6) : 1;
    // Breathing delays until blend is mostly done, then eases in over 0.8s
    const breatheDelay = 0.5;
    const breatheRamp = daji3DFromSeed
        ? Math.min(1, Math.max(0, (globalTime - daji3DEntryTime - breatheDelay) / 0.8))
        : zInflate;
    const breatheAmp = spread * 0.06 * breatheRamp;

    const projected = [];
    for (let i = 0; i < daji3DParticles.length; i++) {
        const p = daji3DParticles[i];
        const z = p.origZ * zInflate + Math.sin(globalTime * 1.5 + p.phase) * breatheAmp;
        const isHovered = i === hoveredIdx;
        const hoverPush = isHovered ? -80 : 0;
        const proj = project3D(p.baseX, p.baseY, z + hoverPush, SCENE_FOV);
        const stableScale = SCENE_FOV / (SCENE_FOV + p.origZ);

        projected.push({
            idx: i, z, baseY: p.baseY,
            screenX: proj.screenX, screenY: proj.screenY, scale: proj.scale,
            stableScale,
            char: p.char, alpha: p.alpha, lum: p.lum, isHovered,
            seedR: p.r, seedG: p.g, seedB: p.b,
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
        let alpha = p.alpha * Math.max(0.2, p.stableScale * 1.25);

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

        const metalR = Math.min(255, Math.floor(lerp(255, 180, gradT) + highlight * 55));
        const metalG = Math.min(255, Math.floor(lerp(225, 130, gradT) + highlight * 40));
        const metalB = Math.min(255, Math.floor(lerp(50, 10, gradT) + highlight * 50));

        // Blend from seed colors to metallic gradient
        const gr = Math.round(lerp(p.seedR, metalR, blendT));
        const gg = Math.round(lerp(p.seedG, metalG, blendT));
        const gb = Math.round(lerp(p.seedB, metalB, blendT));

        ctx.font = `${fontSize}px "Courier New", "SF Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (p.isHovered) {
            ctx.shadowColor = '#FFF8DC';
            ctx.shadowBlur = fontSize * 0.9;
        } else if (alpha > 0.3) {
            ctx.shadowColor = `rgba(${gr}, ${gg}, ${gb}, ${alpha * 0.5})`;
            ctx.shadowBlur = fontSize * lerp(0.65, 0.4, blendT);
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

    const spread = Math.min(cols, rows) * 0.40 * cellSize;
    const entryT = Math.min(1, (globalTime - daji3DEntryTime) / 1.2);
    const zInflate = daji3DFromSeed ? 1 : easeInOut(entryT);
    const blendT = daji3DFromSeed ? Math.min(1, (globalTime - daji3DEntryTime) / 0.6) : 1;
    const breatheAmp = spread * 0.06 * (daji3DFromSeed ? blendT : zInflate);

    let bestIdx = -1, bestDist = Infinity;

    for (let i = 0; i < daji3DParticles.length; i++) {
        const p = daji3DParticles[i];
        if (!CHAR_BLESSINGS[p.char]) continue;
        const z = p.origZ * zInflate + Math.sin(globalTime * 1.5 + p.phase) * breatheAmp;
        const proj = project3D(p.baseX, p.baseY, z, SCENE_FOV);
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
        const z = p.origZ * zInflate + Math.sin(globalTime * 1.5 + p.phase) * breatheAmp;
        const proj = project3D(p.baseX, p.baseY, z, SCENE_FOV);
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

function renderProjectedGlyphs(glyphs) {
    if (glyphs.length === 0) return;

    const projected = [];
    for (const g of glyphs) {
        const proj = project3D(g.x, g.y, g.z, SCENE_FOV);
        const fontSize = cellSize * (g.size || 1) * proj.scale;
        if (fontSize < 2) continue;
        const alpha = Math.min(1, (g.alpha || 0) * Math.max(0.2, proj.scale * 1.25));
        if (alpha <= 0.01) continue;
        projected.push({
            screenX: proj.screenX,
            screenY: proj.screenY,
            z: g.z,
            char: g.char,
            r: g.r,
            g: g.g,
            b: g.b,
            alpha,
            fontSize,
            glow: g.glow || 0,
            blur: g.blur || 0.5,
        });
    }
    if (projected.length === 0) return;

    projected.sort((a, b) => b.z - a.z);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let lastFontSize = 0;
    for (const p of projected) {
        const rounded = Math.round(p.fontSize);
        if (rounded !== lastFontSize) {
            ctx.font = `${rounded}px "Courier New", "SF Mono", monospace`;
            lastFontSize = rounded;
        }
        if (p.glow > 0 && p.alpha > 0.3) {
            ctx.shadowColor = `rgba(${p.r}, ${p.g}, ${p.b}, ${Math.min(1, p.alpha * p.glow)})`;
            ctx.shadowBlur = rounded * p.blur;
        } else {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = `rgb(${p.r}, ${p.g}, ${p.b})`;
        ctx.fillText(p.char, p.screenX, p.screenY);
    }
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.restore();
}

// ============================================================
// STATE MACHINE
// ============================================================
let state = 'arrival';
let stateTime = 0;
let globalTime = 0;
let stateStartGlobal = 0;
let drawToFortuneSeed = null;

function changeState(newState) {
    state = newState;
    stateStartGlobal = globalTime;
    stateTime = 0;
    if (newState === 'draw') initDrawAnimation();
    if (newState === 'fortune') {
        if (drawToFortuneSeed && drawToFortuneSeed.length > 0) {
            initDaji3D(drawToFortuneSeed);
            drawToFortuneSeed = null;
        } else {
            initDaji3D();
        }
    }
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
// DRAW — 福 launches like firework → burst → reform into 大吉
// ============================================================
let morphParticles = [];
let launchTrail = [];
let burstFlash = 0;

// Draw phase timing
const DRAW_LAUNCH = CONFIG.fuExplodeDelay;
const DRAW_RISE = CONFIG.fuRiseDuration;
const DRAW_SHRINK = CONFIG.fuShrinkDuration;
const DRAW_SHRINK_END_SCALE = CONFIG.fuShrinkEndScale;
const DRAW_CAMERA_PULLBACK = CONFIG.fuCameraPullbackDuration;
const DRAW_CAMERA_RETURN = CONFIG.fuCameraReturnDuration;
const DRAW_SCATTER = DRAW_LAUNCH + 0.7;
const DRAW_REFORM = DRAW_SCATTER + 0.9;
const DRAW_SETTLE = DRAW_REFORM + 0.25;

function initDrawAnimation() {
    morphParticles = [];
    launchTrail = [];
    burstFlash = 0;
    drawToFortuneSeed = null;
    if (!fontsReady) return;

    const spread = Math.min(cols, rows) * 0.40 * cellSize;
    const depth = spread * 0.4;
    const dajiTargets = dajiShape.map(pt => ({
        x: pt.nx * spread * 0.5 * pt.aspect,
        y: pt.ny * spread * 0.5,
        z: (Math.random() - 0.5) * depth,
        brightness: pt.brightness,
    }));

    // Burst origin — where 福 explodes (upper area)
    const burstOrigin = gridToWorld(cols / 2, rows * 0.22);

    for (let i = 0; i < dajiTargets.length; i++) {
        const tgt = dajiTargets[i];
        const angle = Math.random() * Math.PI * 2;
        const scatterRadius = spread * (0.24 + Math.random() * 0.36);
        const scatterLift = spread * (0.06 + Math.random() * 0.24);

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
            active: false,
        });
    }
}

function updateDraw() {
    updateBgParticles(globalTime);

    const t = stateTime;

    // --- LAUNCH: trail sparks behind rising 福 ---
    if (t < DRAW_LAUNCH) {
        const riseT = Math.min(1, t / Math.max(0.001, DRAW_RISE));
        const launchT = easeInOut(riseT);
        const fuRow = lerp(rows * 0.5, rows * 0.22, launchT);
        const fuCol = cols / 2;
        const fuPos = gridToWorld(fuCol, fuRow);
        if (Math.random() < 0.6) {
            launchTrail.push({
                x: fuPos.x + (Math.random() - 0.5) * cellSize * 4,
                y: fuPos.y + cellSize * (0.9 + Math.random() * 2.2),
                z: (Math.random() - 0.5) * cellSize * 3,
                vx: (Math.random() - 0.5) * cellSize * 0.08,
                vy: cellSize * (0.08 + Math.random() * 0.12),
                vz: (Math.random() - 0.5) * cellSize * 0.06,
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
                // Scatter outward from burst point
                const st = (t - DRAW_LAUNCH) / (DRAW_SCATTER - DRAW_LAUNCH);
                const eased = 1 - Math.pow(1 - st, 2);
                p.x = lerp(p.startX, p.scatterX, eased);
                p.y = lerp(p.startY, p.scatterY, eased) + st * st * cellSize * 0.9;
                p.z = lerp(p.startZ, p.scatterZ, eased);
                p.scrambleTimer -= 1;
                if (p.scrambleTimer <= 0) {
                    p.char = ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)];
                    p.scrambleTimer = 2 + Math.random() * 3;
                }
            } else if (t < DRAW_REFORM) {
                // Reform into 大吉
                const st = (t - DRAW_SCATTER) / (DRAW_REFORM - DRAW_SCATTER);
                const eased = easeInOut(st);
                p.x = lerp(p.scatterX, p.targetX, eased);
                p.y = lerp(p.scatterY, p.targetY, eased);
                p.z = lerp(p.scatterZ, p.targetZ, eased);
                const wobble = (1 - eased) * cellSize * 0.8;
                p.x += Math.sin(p.phase + globalTime * 4) * wobble;
                p.y += Math.cos(p.phase + globalTime * 3) * wobble;
                p.z += Math.sin(p.phase * 0.7 + globalTime * 3.2) * wobble * 1.4;
                p.scrambleTimer -= 1;
                if (p.scrambleTimer <= 0) {
                    p.char = st > 0.4
                        ? p.finalChar
                        : ALL_LUCKY[Math.floor(Math.random() * ALL_LUCKY.length)];
                    p.scrambleTimer = 2 + st * 12;
                }
            } else {
                // Settle
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
    for (let i = launchTrail.length - 1; i >= 0; i--) {
        const s = launchTrail[i];
        s.x += s.vx;
        s.y += s.vy;
        s.z += s.vz;
        s.vx *= 0.98;
        s.vz *= 0.98;
        s.life -= s.decay;
        const worldBottom = (rows * 0.5 + 2) * cellSize;
        if (s.life <= 0 || s.y >= worldBottom) { launchTrail.splice(i, 1); continue; }
    }

    if (t >= DRAW_SETTLE + 0.3) {
        const seeded = buildDajiSeedFromMorph();
        drawToFortuneSeed = seeded.length > 0 ? seeded : null;
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
            origZ: p.z,
            char,
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
            x: s.x,
            y: s.y,
            z: s.z,
            char: s.char,
            r: 255,
            g: Math.floor(190 + s.life * 65),
            b: Math.floor(35 + s.life * 40),
            alpha: s.life * 0.68,
            size: 0.72 + s.life * 0.35,
            glow: 0.9,
            blur: 0.8,
        });
    }

    for (const p of morphParticles) {
        if (!p.active) continue;
        const gp = p.brightness;
        const drawR = 255;
        const drawG = 180 + gp * 75;
        const drawB = gp * 50;
        let r = drawR, g = drawG, b = drawB;
        let alpha, size = 0.95 + gp * 0.45;
        if (t < DRAW_SCATTER) {
            alpha = 0.45 + gp * 0.35;
        } else if (t < DRAW_REFORM) {
            alpha = 0.5 + gp * 0.42;
        } else {
            const settleSt = Math.min(1, (t - DRAW_REFORM) / (DRAW_SETTLE - DRAW_REFORM));
            // Blend colors toward seed values (lerpColor) so last frame matches fortune entry
            const lum = Math.min(1, gp + 0.08);
            const seed = lerpColor(lum);
            r = lerp(drawR, seed.r, settleSt);
            g = lerp(drawG, seed.g, settleSt);
            b = lerp(drawB, seed.b, settleSt);
            // Blend alpha toward seed alpha
            const seedAlpha = 0.3 + lum * 0.7;
            const pulseAlpha = Math.min(1, (0.5 + gp * 0.5) * (1 + Math.sin(settleSt * Math.PI) * 0.3));
            alpha = lerp(pulseAlpha, seedAlpha, settleSt);
            // Blend size toward fortune's baseFontSize ratio (1.1)
            size = lerp(size, 1.1, settleSt);
        }
        glyphs.push({
            x: p.x,
            y: p.y,
            z: p.z,
            char: p.char,
            r: Math.round(r),
            g: Math.round(g),
            b: Math.round(b),
            alpha,
            size,
            glow: 0.7,
            blur: 0.65,
        });
    }

    renderProjectedGlyphs(glyphs);
}

function renderDrawOverlay() {
    const t = stateTime;
    renderDrawParticles3D(t);

    // Launch: draw 福 rising upward and shrinking
    if (t < DRAW_LAUNCH) {
        const riseT = Math.min(1, t / Math.max(0.001, DRAW_RISE));
        const shrinkT = Math.min(1, t / Math.max(0.001, DRAW_SHRINK));
        const riseEased = easeInOut(riseT);
        const shrinkEased = easeInOut(shrinkT);

        ctx.save();
        ctx.scale(dpr, dpr);

        const vmin = Math.min(window.innerWidth, window.innerHeight);
        const baseSize = vmin * 0.55;
        const fuSize = baseSize * lerp(1, DRAW_SHRINK_END_SCALE, shrinkEased);
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight * lerp(0.5, 0.2, riseEased);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${fuSize}px ${chosenFont}, serif`;

        // Glow intensifies as it rises
        const intensity = 1 + riseT * 2.5;
        ctx.globalAlpha = Math.min(1, 0.3 * intensity);
        ctx.shadowColor = CONFIG.glowGold;
        ctx.shadowBlur = fuSize * 0.2 * intensity;
        ctx.fillStyle = CONFIG.glowGold;
        ctx.fillText('福', cx, cy);

        ctx.globalAlpha = 1;
        ctx.shadowBlur = fuSize * 0.08 * intensity;
        ctx.fillText('福', cx, cy);

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // Burst flash
    if (burstFlash > 0) {
        ctx.save();
        ctx.scale(dpr, dpr);
        const bx = window.innerWidth / 2;
        const by = window.innerHeight * 0.22;
        const radius = Math.min(window.innerWidth, window.innerHeight) * 0.4 * burstFlash;
        const gradient = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
        gradient.addColorStop(0, `rgba(255, 255, 220, ${burstFlash * 0.8})`);
        gradient.addColorStop(0.4, `rgba(255, 215, 0, ${burstFlash * 0.4})`);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.restore();
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
const fwTrail = [];
const fwParticles = [];
let fwLaunchTimer = 0;
let fwLaunchCount = 0;

function launchShell() {
    const cat = BLESSING_CATEGORIES[Math.floor(Math.random() * BLESSING_CATEGORIES.length)];
    const launchCol = cols * (0.15 + Math.random() * 0.7);
    const targetCol = launchCol + (Math.random() - 0.5) * cols * 0.12;
    const start = gridToWorld(launchCol, rows + 2);
    const target = gridToWorld(targetCol, rows * (0.1 + Math.random() * 0.3));
    const startZ = (Math.random() - 0.5) * cellSize * 8;
    fwShells.push({
        x: start.x,
        y: start.y,
        z: startZ,
        startX: start.x,
        startY: start.y,
        startZ,
        targetX: target.x,
        targetY: target.y,
        targetZ: (Math.random() - 0.5) * cellSize * 12,
        launchTime: globalTime,
        duration: CONFIG.shellRiseDuration * (0.85 + Math.random() * 0.3),
        cat,
    });
    fwLaunchCount++;
}

function burstShell(shell) {
    const count = 25 + Math.floor(Math.random() * 35);
    const { chars, r, g, b } = shell.cat;
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = cellSize * (0.12 + Math.random() * 0.22);
        fwParticles.push({
            x: shell.x, y: shell.y, z: shell.z,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - cellSize * 0.04,
            vz: (Math.random() - 0.5) * speed * 0.7,
            char: chars[Math.floor(Math.random() * chars.length)],
            r, g, b,
            life: 0.6 + Math.random() * 0.4,
            decay: 0.006 + Math.random() * 0.01,
            gravity: cellSize * (0.0015 + Math.random() * 0.001),
            drag: 0.987,
        });
    }
}

function initFireworks() {
    fwShells.length = 0;
    fwTrail.length = 0;
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

    const halfW = cols * cellSize * 0.5;
    const halfH = rows * cellSize * 0.5;

    // Shells — rise and burst (time-based with ease-out)
    for (let i = fwShells.length - 1; i >= 0; i--) {
        const s = fwShells[i];
        const t = (globalTime - s.launchTime) / s.duration;
        // Ease-out: fast launch, decelerates toward apex (like a real firework)
        const eased = 1 - Math.pow(1 - Math.min(t, 1), 2);
        s.x = lerp(s.startX, s.targetX, eased);
        s.y = lerp(s.startY, s.targetY, eased);
        s.z = lerp(s.startZ, s.targetZ, eased);

        // Tail density adapts to speed — denser near launch, lighter near apex
        const trailSpawn = Math.max(1, Math.floor((1 - eased) * 2.8));
        for (let j = 0; j < trailSpawn; j++) {
            fwTrail.push({
                x: s.x + (Math.random() - 0.5) * cellSize * 0.35,
                y: s.y + cellSize * (0.12 + Math.random() * 0.32),
                z: s.z + (Math.random() - 0.5) * cellSize * 0.6,
                vx: (Math.random() - 0.5) * cellSize * 0.03,
                vy: cellSize * (0.07 + Math.random() * 0.04),
                vz: (Math.random() - 0.5) * cellSize * 0.03,
                char: '·',
                r: s.cat.r,
                g: s.cat.g,
                b: s.cat.b,
                life: 0.35 + Math.random() * 0.45,
                decay: 0.03 + Math.random() * 0.04,
            });
        }
        if (t >= 1) {
            burstShell(s);
            fwShells.splice(i, 1);
        }
    }

    // Shell trails — drift and fade
    for (let i = fwTrail.length - 1; i >= 0; i--) {
        const t = fwTrail[i];
        t.x += t.vx;
        t.y += t.vy;
        t.z += t.vz;
        t.vx *= 0.95;
        t.vz *= 0.95;
        t.life -= t.decay;
        if (t.life <= 0 || t.y > halfH + cellSize * 3) fwTrail.splice(i, 1);
    }

    // Particles — drift, fade, fall
    for (let i = fwParticles.length - 1; i >= 0; i--) {
        const p = fwParticles[i];
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vz *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.life -= p.decay;
        if (
            p.life <= 0
            || p.y > halfH + cellSize * 6
            || p.x < -halfW - cellSize * 8
            || p.x > halfW + cellSize * 8
            || p.z < -SCENE_FOV * 0.9
            || p.z > SCENE_FOV * 1.5
        ) {
            fwParticles.splice(i, 1);
        }
    }
}

function renderFireworks3D() {
    const glyphs = [];

    for (const s of fwShells) {
        glyphs.push({
            x: s.x,
            y: s.y,
            z: s.z,
            char: '·',
            r: s.cat.r,
            g: s.cat.g,
            b: s.cat.b,
            alpha: 0.9,
            size: 1.0,
            glow: 1.0,
            blur: 0.9,
        });
    }

    for (const t of fwTrail) {
        glyphs.push({
            x: t.x,
            y: t.y,
            z: t.z,
            char: t.char,
            r: t.r,
            g: t.g,
            b: t.b,
            alpha: t.life * 0.7,
            size: 0.7 + t.life * 0.3,
            glow: 0.9,
            blur: 0.85,
        });
    }

    for (const p of fwParticles) {
        const alpha = Math.max(0.05, p.life * p.life);
        glyphs.push({
            x: p.x,
            y: p.y,
            z: p.z,
            char: p.char,
            r: p.r,
            g: p.g,
            b: p.b,
            alpha,
            size: 0.92 + alpha * 0.5,
            glow: 0.65,
            blur: 0.62,
        });
    }

    renderProjectedGlyphs(glyphs);
}

function renderFireworksOverlay() {
    renderFireworks3D();

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

    // Camera follow during draw launch
    let camShift = 0;
    if (state === 'draw') {
        if (stateTime < DRAW_LAUNCH) {
            if (stateTime < DRAW_CAMERA_PULLBACK) {
                const pullbackT = Math.min(1, stateTime / Math.max(0.001, DRAW_CAMERA_PULLBACK));
                camShift = -easeInOut(pullbackT) * cellSize * 3;
            } else {
                camShift = -cellSize * 3;
            }
        } else {
            const returnT = Math.min(1, (stateTime - DRAW_LAUNCH) / Math.max(0.001, DRAW_CAMERA_RETURN));
            camShift = -(1 - easeInOut(returnT)) * cellSize * 3;
        }
        offsetY += camShift;
    }

    renderGrid();

    if (camShift !== 0) offsetY -= camShift;

    switch (state) {
        case 'arrival':  renderArrivalOverlay(); break;
        case 'draw':     renderDrawOverlay(); break;
        case 'fortune':  renderFortuneOverlay(); break;
        case 'fireworks': renderFireworksOverlay(); break;
    }

    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
