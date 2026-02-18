import { spawn, execSync } from 'child_process';
import { chromium } from 'playwright';
import { mkdirSync, rmSync, statSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRAMES_DIR = path.join(__dirname, '_frames');
const OUTPUT_GIF = path.join(__dirname, 'fireworks.gif');
const VITE_PORT = 5199;
const WIDTH = 960;
const HEIGHT = 540;
const CAPTURE_FPS = 30;
const DURATION_S = 5.5;
const TOTAL_FRAMES = Math.ceil(CAPTURE_FPS * DURATION_S);
const MS_PER_FRAME = 1000 / CAPTURE_FPS;

async function main() {
  // --- Clean frames dir ---
  rmSync(FRAMES_DIR, { recursive: true, force: true });
  mkdirSync(FRAMES_DIR, { recursive: true });

  // --- Start Vite ---
  console.log('Starting Vite dev server...');
  const vite = spawn('npx', ['vite', 'fu', '--port', String(VITE_PORT)], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const serverUrl = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Vite start timeout')), 20000);
    vite.stdout.on('data', (chunk) => {
      const match = chunk.toString().match(/Local:\s+(http:\/\/localhost:\d+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
    vite.stderr.on('data', (chunk) => {
      // Vite sometimes logs to stderr too
      const match = chunk.toString().match(/Local:\s+(http:\/\/localhost:\d+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
    vite.on('error', (err) => { clearTimeout(timeout); reject(err); });
  });
  console.log(`Vite ready at ${serverUrl}`);

  try {
    // --- Launch browser ---
    const browser = await chromium.launch({
      headless: true,
      args: ['--use-gl=angle', '--use-angle=swiftshader'],
    });
    const context = await browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // --- Inject time control BEFORE page loads ---
    await page.addInitScript(() => {
      let virtualTime = 1000;
      performance.now = () => virtualTime;

      window.__captureCallbacks = [];
      window.requestAnimationFrame = function (cb) {
        window.__captureCallbacks.push(cb);
        return 0;
      };

      window.__stepFrame = function (advanceMs) {
        virtualTime += advanceMs;
        const cbs = window.__captureCallbacks.splice(0);
        for (const cb of cbs) cb(virtualTime);
      };
    });

    // --- Navigate with dev mode ---
    console.log('Loading page...');
    await page.goto(`${serverUrl}/?dev=1`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('#dev-panel', { timeout: 30000 });
    console.log('Page loaded, dev panel ready');

    // --- Step a few arrival frames to warm up renderer ---
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.__stepFrame(16));
    }

    // --- Inject visual overrides ---
    await page.evaluate(() => {
      // Black body background
      document.body.style.background = '#000';

      // Hide HTML overlays
      const devPanel = document.getElementById('dev-panel');
      if (devPanel) devPanel.style.display = 'none';
      const envelope = document.getElementById('envelope-overlay');
      if (envelope) envelope.style.display = 'none';

      // Suppress all canvas 2D text (grid chars, overlay text, calligraphy, blessings)
      CanvasRenderingContext2D.prototype.fillText = function () {};
      CanvasRenderingContext2D.prototype.strokeText = function () {};

      // Override fillRect: black background + suppress scanlines
      const origFillRect = CanvasRenderingContext2D.prototype.fillRect;
      CanvasRenderingContext2D.prototype.fillRect = function (x, y, w, h) {
        // Full-screen fill → force black (but allow gradient burst flash through)
        if (w >= window.innerWidth * 0.9 && h >= window.innerHeight * 0.9) {
          if (typeof this.fillStyle === 'string') {
            this.fillStyle = '#000000';
          }
          origFillRect.call(this, x, y, w, h);
          return;
        }
        // Scanlines: full-width, tiny height, low alpha → suppress
        if (w >= window.innerWidth * 0.9 && h <= 4 && this.globalAlpha < 0.05) {
          return;
        }
        origFillRect.call(this, x, y, w, h);
      };
    });

    // --- Trigger draw state ---
    console.log('Triggering draw state...');
    await page.evaluate(() => {
      document.querySelector('[data-s="draw"]').click();
    });
    // One tiny step so initDrawAnimation() runs in the first frame
    await page.evaluate(() => window.__stepFrame(0.01));

    // --- Capture frames ---
    console.log(`Capturing ${TOTAL_FRAMES} frames at ${CAPTURE_FPS}fps (${DURATION_S}s)...`);
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      await page.evaluate((ms) => window.__stepFrame(ms), MS_PER_FRAME);
      const buffer = await page.screenshot({ type: 'png' });
      writeFileSync(
        path.join(FRAMES_DIR, `frame_${String(i).padStart(4, '0')}.png`),
        buffer,
      );
      if ((i + 1) % 30 === 0) {
        console.log(`  captured ${i + 1}/${TOTAL_FRAMES} frames`);
      }
    }
    console.log('All frames captured.');
    await browser.close();

    // --- Convert to GIF ---
    console.log('Converting to GIF with ffmpeg...');
    const inputPattern = path.join(FRAMES_DIR, 'frame_%04d.png');
    const paletteFile = path.join(FRAMES_DIR, 'palette.png');

    // Pass 1: generate palette
    execSync(
      `ffmpeg -y -framerate ${CAPTURE_FPS} -i "${inputPattern}" ` +
      `-vf "fps=24,palettegen=max_colors=128:stats_mode=full" -update 1 "${paletteFile}"`,
      { stdio: 'inherit' },
    );

    // Pass 2: create GIF
    execSync(
      `ffmpeg -y -framerate ${CAPTURE_FPS} -i "${inputPattern}" -i "${paletteFile}" ` +
      `-lavfi "fps=24 [x]; [x][1:v] paletteuse=dither=sierra2_4a:diff_mode=rectangle" ` +
      `-loop 0 "${OUTPUT_GIF}"`,
      { stdio: 'inherit' },
    );

    const sizeMB = (statSync(OUTPUT_GIF).size / (1024 * 1024)).toFixed(2);
    console.log(`\nDone! GIF saved to: ${OUTPUT_GIF}`);
    console.log(`Size: ${sizeMB} MB`);

  } finally {
    vite.kill('SIGTERM');
    rmSync(FRAMES_DIR, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
