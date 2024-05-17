// vite.config.js
import { defineConfig } from 'vite';
import vitePluginString from 'vite-plugin-string'

module.exports = {
    build: {
      rollupOptions: {
        input: {
          index: 'index.html',
          homoludens: 'homoludens.html',
          xiaoblogs: 'xiaoblogs.html',
          threeDRose: 'ThreeDRose.html'
        }
      }
    },

    plugins: [
      vitePluginString()
    ]
  };
