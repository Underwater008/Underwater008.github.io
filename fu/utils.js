// ============================================================
// Utility Functions — math, projection, character sampling
// ============================================================
import { LUCKY_CHARS_BY_DENSITY } from './config.js';
import { S } from './state.js';

export function lerp(a, b, t) { return a + (b - a) * t; }
export function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

export function project3D(x, y, z, fov) {
    const scale = fov / (fov + z);
    return {
        screenX: x * scale + window.innerWidth / 2,
        screenY: y * scale + window.innerHeight / 2,
        scale,
    };
}

export function gridToWorld(col, row) {
    return {
        x: (col - S.cols / 2) * S.cellSize,
        y: (row - S.rows / 2) * S.cellSize,
    };
}

export function sampleCharacterShape(char, resolution, fontOverride) {
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

export function selectCharByLuminance(luminance) {
    const idx = Math.floor(luminance * (LUCKY_CHARS_BY_DENSITY.length - 1));
    return LUCKY_CHARS_BY_DENSITY[Math.max(0, Math.min(idx, LUCKY_CHARS_BY_DENSITY.length - 1))];
}

export function lerpColor(luminance) {
    const r = 255;
    const g = Math.floor(45 + luminance * (215 - 45));
    const b = Math.floor(45 - luminance * 45);
    return { r, g, b };
}
