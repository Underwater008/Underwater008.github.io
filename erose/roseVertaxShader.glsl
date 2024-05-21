varying vec3 vPosition;
varying vec2 vUv;
varying float vMoveDistance;
uniform float iAudioData; // Uniform for audio data
uniform float iScale; // Uniform for controlling the scale
uniform sampler2D iOriginalColor; // Original color texture from the model

void main() {
    vUv = uv; // Pass the UV coordinates

    // Sample the original color from the texture
    vec3 originalColor = texture(iOriginalColor, uv).rgb;

    // Determine the blackness of the original color
    float blackness = 1.0 - dot(originalColor, vec3(0.333)); // Average RGB components

    // Apply the audio data to move all vertices
    vec3 modifiedPosition = position;

    // Move the vertex along its normal vector (local Y-axis)
    modifiedPosition += normal * iAudioData * iScale;

    // Calculate the distance moved
    vMoveDistance = length(modifiedPosition - position);

    vPosition = modifiedPosition;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(modifiedPosition, 1.0);
}
