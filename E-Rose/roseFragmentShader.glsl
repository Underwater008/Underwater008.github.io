uniform float iTime;
uniform vec2 iResolution;
uniform float iSpeed;
uniform float iGridSize;
uniform float iFrequency;
uniform float iBrightness;
uniform float iTextScale;
uniform sampler2D iChannel0; // Text texture
uniform sampler2D iChannel1; // Noise texture
uniform sampler2D iOriginalColor; // Original color texture from the model
varying vec2 vUv;

float text(vec2 fragCoord) {
    vec2 uv = mod(fragCoord.xy, iGridSize) / iGridSize;
    vec2 block = fragCoord.xy / iGridSize;
    uv = uv * (iTextScale + 1.0); // Scale the letters up more significantly
    uv += floor(texture(iChannel1, block / iResolution + iTime * 0.002).xy * iGridSize); // Randomize letters
    uv *= 0.0625; // Bring back into 0-1 range for text sampling
    uv = clamp(uv, 0.0, 1.0); // Ensure uv coordinates stay within the texture range
    return texture(iChannel0, uv).r;
}

vec3 rain(vec2 fragCoord) {
    fragCoord.x -= mod(fragCoord.x, iGridSize); // Use iGridSize uniform

    float offset = sin(fragCoord.x * iFrequency); // Use iFrequency uniform
    float speed = cos(fragCoord.x * 6.0) * 0.3 + 0.7;

    // Adjust speed and direction of the rain
    float y = fract(fragCoord.y / iResolution.y - iTime * speed * iSpeed + offset); // Use iSpeed uniform
    return vec3(0.1, 1.0, 0.35) / (y * iBrightness); // Use iBrightness uniform
}

void main() {
    vec2 fragCoord = vUv * iResolution;

    // Sample the original color from the 3D model texture
    vec3 originalColor = texture(iOriginalColor, vUv).rgb;

    // Apply the text effect with the rain effect
    vec3 textRainEffect = text(fragCoord) * rain(fragCoord);

    // Combine the effects
    vec3 finalColor = originalColor + textRainEffect;

    gl_FragColor = vec4(finalColor, 1.0);
}
