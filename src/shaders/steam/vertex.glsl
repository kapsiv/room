uniform float uTime;
uniform sampler2D uPerlinTexture;

varying vec2 vUv;

vec2 rotate2D(vec2 value, float angle) {
  float s = sin(angle);
  float c = cos(angle);

  return mat2(c, -s, s, c) * value;
}

void main() {
  vec3 newPosition = position;

  float twistPerlin = texture2D(
    uPerlinTexture,
    vec2(0.5, uv.y * 0.2 - uTime * 0.01)
  ).r;
  float angle = twistPerlin * 3.0;
  newPosition.xz = rotate2D(newPosition.xz, angle);

  vec2 windOffset = vec2(
    texture2D(uPerlinTexture, vec2(0.25, uTime * 0.01)).r - 0.5,
    texture2D(uPerlinTexture, vec2(0.75, uTime * 0.01)).r - 0.5
  );
  windOffset *= pow(uv.y, 2.0) * 1.5;
  newPosition.xz += windOffset;

  vUv = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
