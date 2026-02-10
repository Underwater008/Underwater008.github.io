# Fu Cube (Gemini Version)

This is a prototype implementation of the "Fu Cube" digital experience, designed by Gemini.

## Features
- **3D ASCII Art**: The character "福" (Fu) is rendered as a 3D volume of smaller lucky characters (particles).
- **Interactive Flow**: Tap to reveal -> Draw Fortune -> Celebrate (Fireworks) -> Make a Wish -> Reveal Key.
- **Visual Style**: "Terminal Meets Temple" - Neon Red, Gold, and Jade colors on a dark background with scanline effects.
- **Tech Stack**: Vanilla HTML/CSS/JS with Three.js and GSAP (via Vite imports).

## How to Run
Since this project uses ES modules (`import * as THREE...`), it needs to be served via a local web server.

1.  Run `npm install` in the root directory (if not done).
2.  Run `npm run dev` in the root directory.
3.  Navigate to `http://localhost:5173/fu-gemini/` (port may vary).

## Design Choices
- **Procedural Generation**: Instead of loading a static model, the "Fu" character is generated procedurally by scanning a 2D text render and placing 3D sprites.
- **Performance**: Uses `THREE.Sprite` for text particles to ensure smooth performance on mobile devices.
- **Aesthetic**: Focuses on a cyber-spiritual vibe with blinking cursors, glitch text, and particle fireworks.
