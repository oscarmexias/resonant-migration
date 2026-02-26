// El Ojo — Monument Shader: Signal Awakening
//
// LAYER 0 (base)   → Monument photo (sampler2D) — dark + desaturated,
//                    brightens progressively as signals arrive
// LAYER 1 (middle) → SDF archetype — glowing skeleton with signal-driven effects
//                    (economia → gold shimmer, cosmos → expanded halo)
// LAYER 2 (front)  → Per-signal atmospheric overlays:
//                    (clima → color temp, tierra → seismic rings,
//                     atencion → noise scatter, eventos → warm/cool tint)

export const vertGLSL = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position,1.0); }
`

export const fragGLSL = /* glsl */ `
precision mediump float;

uniform float     uTime;
uniform vec2      uResolution;
uniform vec2      uSeed;
uniform float     uLandmarkType;  // 0-5 SDF archetype

uniform sampler2D uMonumentTex;   // real photo, or black if unavailable
uniform float     uPhotoReady;    // 0->1 fade-in when texture is loaded

// 6 signal activations (0.0 = not loaded, 1.0 = fully loaded)
uniform float uSignalClima;
uniform float uSignalCosmos;
uniform float uSignalTierra;
uniform float uSignalEconomia;
uniform float uSignalAtencion;
uniform float uSignalEventos;

varying vec2 vUv;

// ─── Simplex noise 2D (Ashima, pure arithmetic) ──────────────────────────
vec3 _mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 _mod289(vec2 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 _perm(vec3 x){ return _mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865, 0.366025404, -0.577350269, 0.024390244);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = _mod289(i);
  vec3 p = _perm(_perm(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x  = 2.0 * fract(p * C.www) - 1.0;
  vec3 h  = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291 - 0.85373472 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x   + h.x  * x0.y;
  g.yz = a0.yz * x12.xz  + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// ─── SDF primitives ───────────────────────────────────────────────────────
float sdBox(vec2 p, vec2 b){
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
float sdCircle(vec2 p, float r){ return length(p) - r; }
float sdCap(vec2 p, vec2 a, vec2 b, float r){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}
float opU(float a, float b){ return min(a, b); }

// ─── 6 Monument archetypes ────────────────────────────────────────────────
//  0  Column / Obelisk      (CDMX Angel, Cairo, DC, Rome, Buenos Aires)
//  1  Arch / Gate           (Madrid, Berlin, Paris Arc, India Gate)
//  2  Multiple towers       (Barcelona Sagrada Familia, Moscow, Dubai)
//  3  Conical tower / Spire (Paris Eiffel, Tokyo, CN Tower, Seattle)
//  4  Skyscraper            (NYC, Chicago, HK, Shanghai, Singapore)
//  5  Dome                  (London, Rome, Istanbul, Washington DC)

float landmarkSDF(vec2 p, float ltype){
  float d = 100.0;

  if(ltype < 0.5){
    // 0: Column + wings at top
    float col  = sdBox(p - vec2(0.0,  -0.05), vec2(0.013, 0.30));
    float base = sdBox(p - vec2(0.0,  -0.37), vec2(0.060, 0.018));
    float cap  = sdBox(p - vec2(0.0,   0.26), vec2(0.024, 0.018));
    float wL   = sdCap(p, vec2(-0.08, 0.16), vec2(0.0, 0.24), 0.008);
    float wR   = sdCap(p, vec2( 0.08, 0.16), vec2(0.0, 0.24), 0.008);
    d = opU(opU(opU(col, base), cap), opU(wL, wR));
  }
  else if(ltype < 1.5){
    // 1: Arch / Gate — two columns + lintel + attic
    float lc   = sdBox(p - vec2(-0.14, -0.10), vec2(0.028, 0.26));
    float rc   = sdBox(p - vec2( 0.14, -0.10), vec2(0.028, 0.26));
    float lt   = sdBox(p - vec2( 0.0,   0.14), vec2(0.170, 0.028));
    float at   = sdBox(p - vec2( 0.0,   0.19), vec2(0.10,  0.040));
    float arch = sdCircle(p - vec2(0.0, 0.03), 0.08);
    float colOnly = opU(lc, rc);
    float cut  = max(colOnly, -(arch - 0.008));
    d = opU(cut, opU(lt, at));
  }
  else if(ltype < 2.5){
    // 2: Three towers / spires
    float t0 = sdBox(p - vec2( 0.0,   0.04), vec2(0.022, 0.33));
    float t1 = sdBox(p - vec2(-0.12, -0.04), vec2(0.017, 0.26));
    float t2 = sdBox(p - vec2( 0.12, -0.04), vec2(0.017, 0.26));
    float t3 = sdBox(p - vec2(-0.22, -0.12), vec2(0.012, 0.18));
    float t4 = sdBox(p - vec2( 0.22, -0.12), vec2(0.012, 0.18));
    float bs = sdBox(p - vec2( 0.0,  -0.37), vec2(0.26,  0.020));
    d = opU(opU(opU(t0, t1), opU(t2, t3)), opU(t4, bs));
  }
  else if(ltype < 3.5){
    // 3: Conical tower / Eiffel — wide base, thin spire
    float ag = sdBox(p - vec2(0.0,   0.23), vec2(0.009, 0.16));
    float mi = sdBox(p - vec2(0.0,  -0.02), vec2(0.028, 0.12));
    float b1 = sdCap(p, vec2(-0.20, -0.38), vec2(-0.02, -0.06), 0.011);
    float b2 = sdCap(p, vec2( 0.20, -0.38), vec2( 0.02, -0.06), 0.011);
    float b3 = sdCap(p, vec2(-0.11, -0.20), vec2( 0.11, -0.20), 0.008);
    float bs = sdBox(p - vec2(0.0,  -0.38), vec2(0.23,  0.015));
    d = opU(opU(opU(ag, mi), opU(b1, b2)), opU(b3, bs));
  }
  else if(ltype < 4.5){
    // 4: Skyscraper — body + crown + spire
    float bod = sdBox(p - vec2(0.0, -0.04), vec2(0.058, 0.30));
    float top = sdBox(p - vec2(0.0,  0.22), vec2(0.032, 0.10));
    float nd  = sdBox(p - vec2(0.0,  0.34), vec2(0.010, 0.06));
    float bs  = sdBox(p - vec2(0.0, -0.37), vec2(0.12,  0.020));
    d = opU(opU(bod, top), opU(nd, bs));
  }
  else{
    // 5: Dome — drum + dome + lantern + colonnade
    float drum = sdBox(p - vec2(0.0, -0.02), vec2(0.13, 0.10));
    float dome = sdCircle(p - vec2(0.0, 0.08), 0.14);
    dome = max(dome, -(p.y - 0.08)); // upper half only
    float lan  = sdBox(p - vec2(0.0,  0.22), vec2(0.022, 0.07));
    float c1   = sdBox(p - vec2(-0.21, -0.20), vec2(0.026, 0.18));
    float c2   = sdBox(p - vec2( 0.21, -0.20), vec2(0.026, 0.18));
    float bs   = sdBox(p - vec2(0.0,  -0.38), vec2(0.27, 0.020));
    d = opU(opU(opU(dome, drum), opU(lan, c1)), opU(c2, bs));
  }
  return d;
}

// ─── Main ──────────────────────────────────────────────────────────────────
void main(){
  vec2 uv = vUv;
  vec2 p  = (uv - 0.5) * 2.0;
  p.x    *= uResolution.x / uResolution.y;

  // ── totalSignals helper ─────────────────────────────────────────────────
  float totalSignals = (uSignalClima + uSignalCosmos + uSignalTierra
                      + uSignalEconomia + uSignalAtencion + uSignalEventos) / 6.0;

  // ========================================================================
  // LAYER 0 — Monument photo
  // ========================================================================
  // Cover-fit UV: preserve aspect ratio, fill viewport
  vec2 texRes = uResolution; // treat output as 1:1 mapping; aspect already in p
  // We want cover-fit: scale uv so the image fills the viewport while
  // maintaining a 1:1 source aspect ratio assumption (photo is portrait/square).
  // Cover formula: remap vUv so the shorter axis fills 1.0
  float aspect = uResolution.x / uResolution.y;
  vec2 coverUV = uv;
  if(aspect > 1.0){
    // wider than tall — crop vertically
    float scale = aspect;
    coverUV.y = (uv.y - 0.5) / scale + 0.5;
  } else {
    // taller than wide — crop horizontally
    float scale = 1.0 / aspect;
    coverUV.x = (uv.x - 0.5) / scale + 0.5;
  }

  vec4 photoSample = texture2D(uMonumentTex, coverUV);
  // Desaturate photo
  float luminance  = dot(photoSample.rgb, vec3(0.299, 0.587, 0.114));
  // Brightness driven by how many signals have arrived
  float photoBright = luminance * mix(0.08, 0.65, totalSignals);
  vec3  photoCol    = vec3(photoBright) * uPhotoReady;

  vec3 col = photoCol;

  // ========================================================================
  // LAYER 1 — SDF archetype
  // ========================================================================
  // Monument centered, scale 0.68, breathing: sin(uTime * 0.6) * 0.012
  float breatheOffset = sin(uTime * 0.6) * 0.012;
  float lscale = 0.68 + breatheOffset;
  vec2  lp = p / lscale;
  lp.y += 0.08; // slightly above center

  float lSDF = landmarkSDF(lp, uLandmarkType);

  // Fill (interior)
  float lFill = 1.0 - smoothstep(-0.01, 0.015, lSDF);

  // Aura (soft glow) — cosmos expands the halo radius
  float lAura = exp(-max(lSDF, 0.0) * 28.0);

  // Halo (wide presence) — uSignalCosmos expands halo radius
  // mix(18., 6., uSignalCosmos): tight at 18, expands to 6 falloff with cosmos
  float lHalo = exp(-max(lSDF, 0.0) * mix(18.0, 6.0, uSignalCosmos)) * 0.25;

  // Monument color: cold blue-white base, warming as signals arrive
  vec3 lBaseCol = mix(vec3(0.30, 0.42, 0.80), vec3(0.92, 0.88, 0.72), totalSignals * 0.6);

  // uSignalEconomia → gold shimmer overlay
  float economiaShimmer = snoise(lp * 6.0 + uTime * 1.2) * 0.5 + 0.5;
  economiaShimmer *= uSignalEconomia;
  vec3 goldShimmer = vec3(1.0, 0.84, 0.35) * economiaShimmer * 0.65;

  // uSignalCosmos → aurora tint on halo
  vec3 cosmosCol = mix(vec3(0.20, 0.60, 1.00), vec3(0.60, 0.20, 1.00),
                       snoise(lp * 2.0 + uTime * 0.3) * 0.5 + 0.5);
  vec3 lCol = lBaseCol + goldShimmer;

  col += lCol * (lFill * 0.85 + lAura * 0.55);
  col += lCol * lHalo;
  // Cosmos aurora on halo
  col += cosmosCol * lHalo * uSignalCosmos * 1.2;

  // ========================================================================
  // LAYER 2 — Signal effects
  // ========================================================================

  // uSignalClima: color temperature overlay
  // climaTemp is a placeholder 0.5 (no WorldState data in this shader)
  float climaTemp = 0.5;
  vec3 climaCool  = vec3(0.4, 0.6, 1.0);
  vec3 climaWarm  = vec3(1.0, 0.7, 0.3);
  vec3 climaOverlay = mix(climaCool, climaWarm, climaTemp) * 0.18 * uSignalClima;
  col += climaOverlay;

  // uSignalTierra: seismic rings expanding from monument base
  // Seismic ring math — same pattern as domainWarp.glsl lines 330-338
  float tierraIntensity = uSignalTierra * 0.6;
  float rw = 0.007 + tierraIntensity * 0.013;
  float rA = mod(uTime * (0.68 + tierraIntensity * 0.62), 1.6);
  float gA = exp(-abs(abs(length(p) - rA) - rw) * 85.0)
           * (1.0 - rA / 1.6) * tierraIntensity * 0.9;
  col += vec3(gA * 1.4, gA * 0.22, 0.0);
  float rB = mod(uTime * (0.68 + tierraIntensity * 0.62) + 0.62, 1.6);
  float gB = exp(-abs(abs(length(p) - rB) - rw * 0.7) * 85.0)
           * (1.0 - rB / 1.6) * tierraIntensity * 0.5;
  col += vec3(gB * 0.9, gB * 0.11, 0.0);

  // uSignalAtencion: fine noise scatter
  float atencionScatter = snoise(p * 18.0 + uTime * 0.4) * 0.06 * uSignalAtencion;
  col += vec3(atencionScatter * 0.8, atencionScatter * 0.9, atencionScatter);

  // uSignalEventos: warm/cool tint driven by eventos value
  // eventos → 1.0 = active (warm), eventos → 0.0 = quiet (cool)
  vec3 eventosCool = vec3(0.05, 0.10, 0.28);
  vec3 eventosWarm = vec3(0.28, 0.12, 0.04);
  vec3 eventosOverlay = mix(eventosCool, eventosWarm, uSignalEventos) * 0.14 * uSignalEventos;
  col += eventosOverlay;

  // ========================================================================
  // Post-processing
  // ========================================================================
  // Vignette
  col *= 1.0 - dot(p * 0.45, p * 0.45);

  // Reinhard tone mapping
  col = col / (col + 1.0);

  // Gamma correction
  col = pow(max(col, 0.0), vec3(0.4545));

  gl_FragColor = vec4(col, 1.0);
}
`
