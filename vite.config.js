// vite.config.js
import { defineConfig } from 'vite';
import vitePluginString from 'vite-plugin-string'

module.exports = {
    build: {
      rollupOptions: {
        input: {
          index: 'index.html',
          erose: 'erose/erose.html'
        }
      }
    },

    plugins: [
      vitePluginString()
    ]
  };
