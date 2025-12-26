#version 300 es
layout(location=0) in vec2 aCorner;
uniform mat4 uView;
uniform mat4 uProj;
uniform vec3 uPos;
uniform float uSize;

out vec2 vUv;

void main() {
    vec3 right = vec3(uView[0][0], uView[1][0], uView[2][0]);
    vec3 up    = vec3(uView[0][1], uView[1][1], uView[2][1]);

    vec3 world = uPos + (right * aCorner.x + up * aCorner.y) * uSize;
    vUv = aCorner * 0.5 + 0.5;
    gl_Position = uProj * uView * vec4(world, 1.0);
}
