#version 300 es
precision highp float;

layout(location=0) in vec2 aCorner;         // (-1,-1) to (1,1)
layout(location=1) in vec3 iPos;            // per-instance
layout(location=2) in vec3 iCol;            // per-instance
layout(location=3) in float iOpa;           // per-instance
layout(location=4) in float iSize;          // per-instance

uniform mat4 uView;
uniform mat4 uProj;

out vec2 vUv;
out vec3 vCol;
out float vOpa;

void main() {
  // Extract camera right and up vectors from the view matrix to create a billboard
  // The view matrix is [R | T], where R is the rotation.
  // The first row is the right vector, second is the up vector.
  vec3 right = vec3(uView[0][0], uView[1][0], uView[2][0]);
  vec3 up    = vec3(uView[0][1], uView[1][1], uView[2][1]);

  vec3 world = iPos + (right * aCorner.x + up * aCorner.y) * iSize;

  vUv = aCorner * 0.5 + 0.5;
  vCol = iCol;
  vOpa = iOpa;

  gl_Position = uProj * uView * vec4(world, 1.0);
}
