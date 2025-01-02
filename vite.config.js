// vite.config.js
import { defineConfig } from 'vite';
import vitePluginString from 'vite-plugin-string'

module.exports = {
    build: {
      rollupOptions: {
        input: {
          index: 'index.html',
          fireworks: 'fireworks.html',
          erose: 'erose/erose.html',
          udream: 'udream/udream.html',
        }
      }
    },

    plugins: [
      vitePluginString()
    ]
  };
