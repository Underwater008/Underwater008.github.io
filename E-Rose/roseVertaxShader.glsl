varying vec3 vPosition;
varying vec2 vUv;
uniform float iAudioData; // New uniform for audio data
uniform float iScale; // New uniform for controlling the scale
uniform sampler2D iOriginalColor; // Original color texture from the model

void main() {
    vUv = uv; // Pass the UV coordinates

    // Sample the original color from the texture
    vec3 originalColor = texture(iOriginalColor, uv).rgb;

    // Determine the blackness of the original color
    float blackness = 1.0 - dot(originalColor, vec3(0.333)); // Average RGB components

    // Apply the audio data to make the black areas move
    vec3 modifiedPosition = position;

    // Calculate displacement direction
    vec3 direction = normalize(vec3(position.xy, 1.0));
    modifiedPosition += direction * iAudioData * blackness * iScale;

    vPosition = modifiedPosition;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(modifiedPosition, 1.0);
}
