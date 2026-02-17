// ============================================================
// Input Handling — touch, mouse, keyboard, wheel
// ============================================================
import { S } from './state.js';
import { cycleDajiFont, updateHover, resetHover } from './daji.js';

let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
let touchMoved = false;
let touchHoldTimer = null;
let touchLastX = 0, touchLastY = 0;
let mouseStartY = 0, mouseDown = false;
let mouseHoldTimer = null;

export function initInput(handleSwipeUp) {
    S.canvas.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        touchLastX = t.clientX;
        touchLastY = t.clientY;
        touchStartTime = performance.now();
        touchMoved = false;
        if (touchHoldTimer) clearTimeout(touchHoldTimer);
        if (S.state === 'fortune') {
            touchHoldTimer = setTimeout(() => {
                if (!touchMoved) updateHover(touchLastX, touchLastY);
            }, 250);
        }
    }, { passive: true });

    S.canvas.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        touchLastX = t.clientX;
        touchLastY = t.clientY;
        if (Math.abs(t.clientX - touchStartX) > 10 || Math.abs(t.clientY - touchStartY) > 10) {
            touchMoved = true;
            if (touchHoldTimer) { clearTimeout(touchHoldTimer); touchHoldTimer = null; }
        }
        if (S.state === 'fortune') updateHover(t.clientX, t.clientY);
    }, { passive: true });

    S.canvas.addEventListener('touchend', (e) => {
        if (touchHoldTimer) { clearTimeout(touchHoldTimer); touchHoldTimer = null; }
        resetHover();
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = touchStartY - e.changedTouches[0].clientY;
        const dt = performance.now() - touchStartTime;
        if (S.state === 'fortune' && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && dt < 500) {
            cycleDajiFont(dx > 0 ? 1 : -1);
        } else if (dy > 50 && dt < 500) {
            handleSwipeUp();
        }
    }, { passive: true });

    // Desktop hover — only show tooltip while mouse button is held
    S.canvas.addEventListener('mousemove', (e) => {
        if (S.state === 'fortune' && mouseDown) updateHover(e.clientX, e.clientY);
    });
    S.canvas.addEventListener('mouseleave', () => {
        resetHover();
    });

    // Desktop mouse drag (swipe up) + hold-to-show tooltip
    S.canvas.addEventListener('mousedown', (e) => {
        mouseStartY = e.clientY;
        mouseDown = true;
        if (mouseHoldTimer) clearTimeout(mouseHoldTimer);
        if (S.state === 'fortune') {
            mouseHoldTimer = setTimeout(() => {
                updateHover(e.clientX, e.clientY);
            }, 250);
        }
    });
    S.canvas.addEventListener('mouseup', (e) => {
        if (mouseHoldTimer) { clearTimeout(mouseHoldTimer); mouseHoldTimer = null; }
        resetHover();
        if (mouseDown) {
            const dy = mouseStartY - e.clientY;
            if (dy > 50) handleSwipeUp();
        }
        mouseDown = false;
    });

    // Desktop scroll wheel (swipe up)
    S.canvas.addEventListener('wheel', (e) => {
        if (e.deltaY < -30) handleSwipeUp();
    }, { passive: true });

    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            handleSwipeUp();
        }
        if (S.state === 'fortune') {
            if (e.code === 'ArrowLeft') { e.preventDefault(); cycleDajiFont(-1); }
            if (e.code === 'ArrowRight') { e.preventDefault(); cycleDajiFont(1); }
        }
    });
}
