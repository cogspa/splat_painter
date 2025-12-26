#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform vec3 uColor;

void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    
    // Thin ring
    float ring = smoothstep(0.9, 0.95, r) - smoothstep(0.98, 1.0, r);
    
    if (ring < 0.1) discard;
    
    outColor = vec4(uColor, 1.0);
}
