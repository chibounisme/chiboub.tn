/**
 * WebGL Shaders for StarField rendering
 * Stars are rendered as GPU-accelerated point sprites
 */

export const VERTEX_SHADER = `
attribute float a_angle;
attribute float a_initialPhase;
attribute float a_size;
attribute vec3 a_color;
attribute float a_brightness;
attribute float a_twinkleSpeed;
attribute float a_twinkleOffset;

uniform float u_time;
uniform float u_driftOffset;
uniform vec2 u_resolution;

varying vec3 v_color;
varying float v_alpha;

void main() {
  float maxDist = length(u_resolution * 0.5);
  
  // Calculate depth phase (0 to 1) - continuous warp effect
  float speed = 0.2;
  float depthPhase = mod(a_initialPhase + u_driftOffset * speed, 1.0);
  
  // Calculate travel distance from center
  float travelDist = maxDist * depthPhase;
  
  // Calculate position from center outward
  float x = cos(a_angle) * travelDist;
  float y = sin(a_angle) * travelDist;
  
  // Center the coordinates
  vec2 center = u_resolution * 0.5;
  vec2 pos = center + vec2(x, y);
  
  // Convert to clip space (-1 to 1)
  gl_Position = vec4((pos / u_resolution) * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y *= -1.0; // Flip Y to match Canvas coords
  
  // Size scaling - starts small, grows as it approaches
  float depthSize = 0.1 + depthPhase * 1.4;
  gl_PointSize = a_size * depthSize * (u_resolution.y / 1000.0) * 2.0;
  
  // Alpha fading - fade in from center, fade out at edges
  float depthAlpha = 1.0;
  if (depthPhase < 0.4) {
    float t = depthPhase / 0.4;
    depthAlpha = t * t; // Quadratic ease-in
  } else if (depthPhase > 0.95) {
    depthAlpha = (1.0 - depthPhase) / 0.05;
  }
  
  // Twinkle effect
  float twinkle = sin(u_time * a_twinkleSpeed + a_twinkleOffset) * 0.4 + 0.6;
  
  v_alpha = a_brightness * twinkle * depthAlpha;
  v_color = a_color;
}
`;

export const FRAGMENT_SHADER = `
precision mediump float;
varying vec3 v_color;
varying float v_alpha;

void main() {
  // Soft circle for each star point
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  
  if (dist > 0.5) {
    discard;
  }
  
  // Soft glow edge
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
  
  gl_FragColor = vec4(v_color, v_alpha * alpha);
}
`;
