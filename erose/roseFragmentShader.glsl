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

// Function to detect edges using a Sobel filter
float edgeDetection(vec2 uv, sampler2D tex) {
    vec2 texelSize = 1.0 / iResolution;
    float threshold = 0.1; // Edge detection threshold, adjust as needed

    float gx =
    -1.0 * texture(tex, uv + vec2(-texelSize.x, -texelSize.y)).r +
    -2.0 * texture(tex, uv + vec2(-texelSize.x,  0.0)).r +
    -1.0 * texture(tex, uv + vec2(-texelSize.x,  texelSize.y)).r +
    1.0 * texture(tex, uv + vec2(texelSize.x, -texelSize.y)).r +
    2.0 * texture(tex, uv + vec2(texelSize.x,  0.0)).r +
    1.0 * texture(tex, uv + vec2(texelSize.x,  texelSize.y)).r;

    float gy =
    -1.0 * texture(tex, uv + vec2(-texelSize.x, -texelSize.y)).r +
    -2.0 * texture(tex, uv + vec2(0.0, -texelSize.y)).r +
    -1.0 * texture(tex, uv + vec2(texelSize.x, -texelSize.y)).r +
    1.0 * texture(tex, uv + vec2(-texelSize.x,  texelSize.y)).r +
    2.0 * texture(tex, uv + vec2(0.0,  texelSize.y)).r +
    1.0 * texture(tex, uv + vec2(texelSize.x,  texelSize.y)).r;

    float edge = length(vec2(gx, gy));
    return edge > threshold ? 1.0 : 0.0;
}

void main() {
    vec2 fragCoord = vUv * iResolution;

    // Sample the original color from the 3D model texture
    vec3 originalColor = texture(iOriginalColor, vUv).rgb;

    // Apply the text effect with the rain effect
    vec3 textRainEffect = text(fragCoord) * rain(fragCoord);

    // Perform edge detection on the original color texture
    float edge = edgeDetection(vUv, iOriginalColor);

    // Red color for edges
    vec3 edgeColor = vec3(1.0, 0.0, 0.0);

    // Combine the effects: if an edge is detected, use the edge color; otherwise, use the combined text and rain effect
    vec3 finalColor = mix(textRainEffect, edgeColor, edge);

    gl_FragColor = vec4(finalColor, 1.0);
}
