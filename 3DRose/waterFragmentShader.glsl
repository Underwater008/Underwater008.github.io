#define WATER_SPEED 1.0
#define WATER_SCALE 1.0

uniform float iTime;
uniform sampler2D iChannel0; // Distortion texture
uniform sampler2D iChannel1; // Reflection texture
uniform float opacity;
uniform float maxOpacity;
varying vec2 vUv;

void main() {
    // Time-based oscillation
    float t = iTime * WATER_SPEED;

    // Calculate the distortion based on texture and time
    vec2 uv = vUv;
    vec2 uvDistort = uv + vec2(sin(t + uv.y * 10.0) * 0.1, cos(t + uv.x * 10.0) * 0.1);

    // Sample the texture for the water effect
    float distortion = texture2D(iChannel0, uvDistort * WATER_SCALE).r;

    // Apply distortion to the UV coordinates
    uv += distortion * 0.05;

    // Sample the color from the reflection texture
    vec3 reflectionColor = texture2D(iChannel1, uv).rgb;

    // Adjust color for the water effect
    vec3 waterColor = vec3(0.0, 0.5, 0.7); // Base water color
    vec3 color = mix(waterColor, reflectionColor, distortion * 0.5);

    float finalOpacity = opacity * maxOpacity;

    // Set the final fragment color with opacity
    gl_FragColor = vec4(color, finalOpacity);
}
