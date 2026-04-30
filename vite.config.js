// vite.config.js
import { defineConfig } from 'vite';
import vitePluginString from 'vite-plugin-string';
import { cpSync, existsSync } from 'fs';
import { resolve } from 'path';

// Copy fu-presentation/public/* → dist/fu-presentation/ at build time.
// fu-presentation keeps its own public/ for standalone `vite` dev; this plugin
// reproduces that layout under the parent's dist output.
const copyFuPresentationAssets = {
  name: 'copy-fu-presentation-assets',
  apply: 'build',
  closeBundle() {
    const src = resolve(__dirname, 'fu-presentation/public');
    const dst = resolve(__dirname, 'dist/fu-presentation');
    if (existsSync(src)) {
      cpSync(src, dst, { recursive: true });
    }
  },
};

const copyUncreditedAssets = {
  name: 'copy-uncredited-assets',
  apply: 'build',
  closeBundle() {
    const src = resolve(__dirname, 'uncredited');
    const dst = resolve(__dirname, 'dist/uncredited');
    if (existsSync(src)) {
      cpSync(src, dst, { recursive: true });
    }
  },
};

module.exports = {
    build: {
      rollupOptions: {
        input: {
          index: 'index.html',
          fireworks: 'fireworks.html',
          erose: 'erose/erose.html',
          udream: 'udream/udream.html',
          stellarune: 'stellarune.html',
          fu: 'fu/index.html',
          fu_gemini: 'fu-gemini/index.html',
          fu_presentation: 'fu-presentation/index.html',
          junk_presentation: 'junk-presentation/index.html',
          uncreditd: 'uncreditd/index.html',
          uncredited_presentation: 'uncredited-presentation/index.html',
        }
      }
    },

    plugins: [
      vitePluginString(),
      copyFuPresentationAssets,
      copyUncreditedAssets,
    ]
  };
