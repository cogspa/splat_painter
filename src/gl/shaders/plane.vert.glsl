#version 300 es
layout(location=0) in vec3 pos;
uniform mat4 uView;
uniform mat4 uProj;
uniform mat4 uModel;

out vec3 vWorldPos;

void main() {
    vWorldPos = (uModel * vec4(pos, 1.0)).xyz;
    gl_Position = uProj * uView * vec4(vWorldPos, 1.0);
}
