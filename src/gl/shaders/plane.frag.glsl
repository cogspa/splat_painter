#version 300 es
precision highp float;

in vec3 vWorldPos;
out vec4 outColor;

uniform vec3 uColor;
uniform vec3 uPlaneAxis; // (1,0,0) for X, etc.

void main() {
    // Determine 2D coordinates on the plane based on active axis
    vec2 p;
    if (uPlaneAxis.x > 0.5) p = vWorldPos.yz;
    else if (uPlaneAxis.y > 0.5) p = vWorldPos.xz;
    else p = vWorldPos.xy;

    // Grid logic
    vec2 grid = abs(fract(p - 0.5) - 0.5) / fwidth(p);
    float line = min(grid.x, grid.y);
    float mask = 1.0 - min(line, 1.0);
    
    // Large grid every 1 unit
    float edge = 0.05;
    float check = step(0.98, fract(p.x)) + step(0.98, fract(p.y));
    
    vec3 col = uColor;
    float alpha = 0.05 + mask * 0.2;
    
    // Main axes highlight
    if (abs(p.x) < 0.02 || abs(p.y) < 0.02) {
        alpha += 0.3;
    }

    outColor = vec4(col, alpha);
}
