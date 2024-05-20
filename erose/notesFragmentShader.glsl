uniform sampler2D iOriginalColor;
varying vec2 vUv;

void main() {
    vec3 originalColor = texture2D(iOriginalColor, vUv).rgb;
    gl_FragColor = vec4(originalColor, 1.0);
}
