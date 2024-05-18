#define WATER_SPEED 1.0

uniform float iTime;
varying vec3 vLocalPosition;
varying vec2 vUv;

void main() {
    // Time-based oscillation
    float t = iTime * WATER_SPEED;

    // Calculate the 3D distortion based on local position and time
    vec3 pos = position;
    vec3 posDistort = pos + vec3(sin(t + pos.y * 10.0) * 0.1, cos(t + pos.x * 10.0) * 0.1, sin(t + pos.z * 10.0) * 0.1);

    // Apply the distortion to the vertex position
    vec4 modelViewPosition = modelViewMatrix * vec4(posDistort, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;

    vLocalPosition = position;
    vUv = uv;
}
