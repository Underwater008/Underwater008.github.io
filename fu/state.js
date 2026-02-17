// ============================================================
// Shared Mutable State
// All modules import S and read/mutate it directly.
// ============================================================
import { CALLI_FONTS } from './config.js';

export const S = {
    // Canvas
    canvas: null,
    ctx: null,

    // Grid layout (set by resize)
    cellSize: 0,
    cols: 0,
    rows: 0,
    gridW: 0,
    gridH: 0,
    offsetX: 0,
    offsetY: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 2),

    // Grid buffer
    grid: [],

    // Three.js
    glRenderer: null,
    glScene: null,
    glCamera: null,
    particlesMesh: null,
    charToUV: {},

    // Timing
    globalTime: 0,
    stateTime: 0,
    stateStartGlobal: 0,

    // State machine
    state: 'arrival',
    drawToFortuneSeed: null,

    // Shape data
    fuShape: [],
    dajiShape: [],
    fontsReady: false,
    chosenFont: CALLI_FONTS[Math.floor(Math.random() * CALLI_FONTS.length)],

    // Envelope
    envelopeManager: null,
};
