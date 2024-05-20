// notesVertexShader.glsl

// Varying to pass UV coordinates to the fragment shader
varying vec2 vUv;

void main() {
    // Pass the UV coordinates to the fragment shader
    vUv = uv;

    // Calculate the vertex position in clip space
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
