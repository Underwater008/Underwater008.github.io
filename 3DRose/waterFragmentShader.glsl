#define WATER_SPEED 1.0
#define WATER_SCALE 1.0

uniform float iTime;
uniform sampler2D iChannel0; // Distortion texture
uniform sampler2D iChannel1; // Reflection texture
uniform float opacity;
uniform float maxOpacity;
varying vec3 vLocalPosition; // Local position from vertex shader
varying vec2 vUv;

vec2 getCubeUV(vec3 position) {
    vec3 absPos = abs(position);
    vec2 uv;

    if (absPos.x >= absPos.y && absPos.x >= absPos.z) {
        uv = position.yz * 0.5 + 0.5; // Normalize to [0, 1]
    } else if (absPos.y >= absPos.x && absPos.y >= absPos.z) {
        uv = position.xz * 0.5 + 0.5; // Normalize to [0, 1]
    } else {
        uv = position.xy * 0.5 + 0.5; // Normalize to [0, 1]
    }

    return uv;
}

float noise(vec3 p) {
    return texture(iChannel0, p.xy).r;
}

void main() {
    // Time-based oscillation
    float t = iTime * WATER_SPEED;

    // Calculate the noise-based 3D distortion
    vec3 pos = vLocalPosition;
    vec3 posDistort = pos + vec3(
    sin(t + noise(pos * 5.0 + vec3(0.0, 1.0, 0.0)) * 2.0) * 0.1,
    cos(t + noise(pos * 5.0 + vec3(1.0, 0.0, 0.0)) * 2.0) * 0.1,
    sin(t + noise(pos * 5.0 + vec3(0.0, 0.0, 1.0)) * 2.0) * 0.1
    );

    // Use the distorted 3D position to sample the texture
    vec2 uv = getCubeUV(posDistort) * WATER_SCALE;
    float distortion = texture2D(iChannel0, uv).r;

    // Apply distortion to the UV coordinates
    uv = getCubeUV(vLocalPosition + distortion * 0.05);

    // Sample the color from the reflection texture
    vec3 reflectionColor = texture2D(iChannel1, uv).rgb;

    // Adjust color for the water effect
    vec3 waterColor = vec3(0.0, 0.5, 0.7); // Base water color
    vec3 color = mix(waterColor, reflectionColor, distortion * 0.5);

    // Calculate the final opacity based on the normalized opacity and max opacity
    float finalOpacity = opacity * maxOpacity;

    // Set the final fragment color with calculated opacity
    gl_FragColor = vec4(color, finalOpacity);
}