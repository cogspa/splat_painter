#version 300 es
precision highp float;
precision highp usampler2D;

flat in uint vID;
out uint outID;

void main() {
  // We can also check for alpha discard here if we want to pick only "solid" parts
  // but for now let's just write the ID.
  outID = vID + 1u; // 0 is background
}
