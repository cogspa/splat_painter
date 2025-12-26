#version 300 es
precision highp float;

layout(location=0) in vec2 aCorner;
layout(location=1) in vec3 iPos;
layout(location=4) in float iSize;
// The ID can be passed as an attribute or derived from instance ID
// For consistency with other shaders, let's use an explicit ID if we want,
// but for now let's just use gl_InstanceID.

uniform mat4 uView;
uniform mat4 uProj;

flat out uint vID;

void main() {
  vec3 right = vec3(uView[0][0], uView[1][0], uView[2][0]);
  vec3 up    = vec3(uView[0][1], uView[1][1], uView[2][1]);

  vec3 world = iPos + (right * aCorner.x + up * aCorner.y) * iSize;
  
  vID = uint(gl_InstanceID);
  gl_Position = uProj * uView * vec4(world, 1.0);
}
