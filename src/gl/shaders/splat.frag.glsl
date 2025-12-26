#version 300 es
precision highp float;

in vec2 vUv;
in vec3 vCol;
in float vOpa;

out vec4 outColor;

void main() {
  vec2 p = vUv * 2.0 - 1.0;      // Map UV to -1..1
  float r2 = dot(p, p);
  
  if (r2 > 1.0) discard;

  // Gaussian-ish falloff for smooth splats
  float alpha = exp(-r2 * 4.0) * vOpa;
  
  // Premultiplied alpha or standard? Let's use standard for now.
  outColor = vec4(vCol, alpha);
}
