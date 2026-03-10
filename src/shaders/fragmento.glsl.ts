// Vision: Fragmento — 360-cell grid (20×18), monument photo as substrate
//
// 22 signal-driven treatments — each dramatically responds to its designated world signal
//
//  0 · Clear          — monument photo, no overlay
//  1 · Aurora         — Aceternity aurora-background → kp (solar/geomagnetic)
//  2 · Beams          — Aceternity background-beams  → seismic + solarWind
//  3 · AnimGrid       — dillionverma animated-grid   → atencion (trending)
//  4 · RetroGrid      — MagicUI retro-grid           → volatility (economia)
//  5 · Shimmer        — ibelick text-shimmer          → temperature
//  6 · FBM Noise      — minhxthanh shader-background  → toneScore (GDELT)
//  7 · Void           — near-black pulse              → conflict depth
//  8 · Dot Pulse      — Aceternity dot-backgrounds    → isDaylit (day/night)
//  9 · Seismic Ring   — concentric rings              → seismic magnitude
// 10 · Neon Edge      — glowing border                → trendDir (green/red/gold)
// 11 · Matrix Rain    — falling column streaks        → atencion (attention)
// 12 · Grad Sweep     — directional gradient          → windDir + windSpd
// 13 · Starburst      — radial rays                   → kp (ray count scales)
// 14 · Holographic    — HSL rainbow iridescence       → temperature (hue)
// 15 · TV Static      — noise grain                   → volatility (density)
// 16 · Breath Orb     — pulsing soft circle           → seismic (pulse rate)
// 17 · Scan Wave      — sweeping scanline             → solarWind (speed)
// 18 · Diag Stripe    — animated diagonal bands       → windDir + windSpd
// 19 · Corner Heat    — hot/cold corner gradient      → temperature extremes
// 20 · Cross Glow     — perpendicular laser beams     → kp (brightness + wander)
// 21 · Hex Grid       — hexagonal tile pattern        → trendDir (fill color)

export const vertGLSL = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position,1.0); }
`

export const fragGLSL = /* glsl */ `
precision mediump float;

uniform float uTime;
uniform vec2  uResolution;
uniform vec4  uAtmosphere;   // temp, windSpd, humidity, windDir(0-360)
uniform vec4  uCosmos;       // kp, solarWind, isDaylit, sunElev
uniform vec4  uEarth;        // magnitude, distKm, totalLastHour, 0
uniform vec4  uEconomy;      // volatility, trendDir(-1/0/1), 0, 0
uniform vec2  uSocial;       // toneScore, trending.score
uniform vec2  uCity;
uniform vec2  uSeed;
uniform float uLandmarkType;
uniform sampler2D uMonumentTex;
uniform float     uPhotoReady;

varying vec2 vUv;

// Grid config: 20×18 = 360 cells
const float COLS   = 20.0;
const float ROWS   = 18.0;
const float BORDER = 0.025;

// ── Hash / noise helpers ──────────────────────────────────────────────────
float h1(float n)  { return fract(sin(n)*43758.5453); }
float h2(vec2 p)   { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }

float n2(vec2 p){
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.-2.*f);
  return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),
             mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){
  float v=0., a=0.5;
  for(int i=0;i<4;i++){ v+=a*n2(p); a*=0.5; p*=2.; }
  return v;
}

// ── Color helpers ─────────────────────────────────────────────────────────
vec3 hsl2rgb(vec3 c){
  vec3 rgb=clamp(abs(mod(c.x*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);
  return c.z+c.y*(rgb-0.5)*(1.-abs(2.*c.z-1.));
}
float hexDist(vec2 p){
  p=abs(p);
  return max(dot(p,normalize(vec2(1.,1.73))),p.x);
}

// ── 0: Clear ──────────────────────────────────────────────────────────────
vec3 tClear(vec3 photo){
  return photo*1.35; // slightly brighter — unobscured window
}

// ── 1: Aurora — kp drives brightness and color saturation ────────────────
vec3 tAurora(vec2 cuv, float t, float kp){
  float w1=sin(cuv.x*3.14159+t*0.42+uSeed.x*6.28)*.5+.5;
  float w2=cos(cuv.y*2.50   +t*0.31+uSeed.y*6.28)*.5+.5;
  float warp=sin(cuv.x*5.+cuv.y*3.+t*0.65)*0.12;
  vec3 emerald=vec3(0.204,0.827,0.600);
  vec3 teal   =vec3(0.055,0.647,0.914);
  vec3 indigo =vec3(0.510,0.549,0.973);
  // At high kp: vivid purple aurora; at low kp: faint green shimmer
  vec3 col=mix(emerald, teal, w1+warp);
  col=mix(col, indigo, w2*(0.15+kp*0.65));
  float glow=smoothstep(0.15,0.85,w1*w2);
  col*=0.35+glow*(0.3+kp*0.85); // kp 0→dim, 9→blinding
  return col;
}

// ── 2: Beams — seismic brightens, solarWind accelerates ──────────────────
vec3 tBeams(vec2 cuv, float t, float seismic, float solarWind){
  vec3 cyan   =vec3(0.094,0.800,0.988);
  vec3 purple =vec3(0.388,0.267,0.961);
  vec3 magenta=vec3(0.682,0.282,1.000);
  float spd=0.8+solarWind*2.5; // solarWind 0→slow drift, max→racing beams
  float b1=smoothstep(0.08,0.,abs(cuv.x-cuv.y*0.70-mod(t*0.10*spd,2.2)+0.5));
  float b2=smoothstep(0.06,0.,abs(cuv.x+cuv.y*0.55-mod(t*0.077*spd+0.7,2.0)));
  float b3=smoothstep(0.05,0.,abs(cuv.y-0.5-sin(cuv.x*6.+t*0.35)*0.18));
  vec3 col=cyan*b1*0.5+purple*b2*0.5+magenta*b3*0.5;
  col*=0.2+seismic*1.1; // seismic 0→near invisible, 8→blazing
  return col;
}

// ── 3: AnimGrid — atencion drives pulse density and speed ────────────────
vec3 tAnimGrid(vec2 cuv, float t, float atencion){
  vec2 sg=fract(cuv*4.);
  vec2 si=floor(cuv*4.);
  float lines=step(0.92,max(sg.x,sg.y))*0.30;
  float delay=h2(si+uSeed*3.7)*2.0;
  // atencion scales cycle speed: low attention=slow pulse, viral=rapid flash
  float rate=0.3+atencion*2.5;
  float pulse=sin((t*rate+delay))*0.5+0.5;
  float sq=step(0.88,max(sg.x,sg.y))*pulse*(0.2+atencion*0.8);
  return vec3(0.502)*(lines+sq*0.65);
}

// ── 4: RetroGrid — volatility drives scroll speed ────────────────────────
vec3 tRetroGrid(vec2 cuv, float t, float volat){
  float hz=0.30;
  float perp=max(0.001, cuv.y-hz);
  float px=(cuv.x-0.5)/perp*0.28+0.5;
  // volatility 0→gentle 15-sec scroll, max→frantic 2-sec scroll
  float speed=0.067+volat*0.45;
  float py=mod(1.0/perp*0.06-t*speed,1.0);
  float vl=step(0.92,fract(px*7.));
  float hl=step(0.92,fract(py*7.));
  float grid=max(vl,hl)*0.20;
  grid*=smoothstep(hz,hz+0.06,cuv.y)*0.50;
  // color shifts from calm blue to panic red at high volatility
  vec3 col=mix(vec3(0.30,0.70,0.90), vec3(0.90,0.30,0.20), volat);
  return col*grid;
}

// ── 5: Shimmer — temperature drives warm/cool color ──────────────────────
vec3 tShimmer(vec2 cuv, float t, float temp){
  vec3 warmHi=vec3(1.00,0.85,0.48);
  vec3 coolHi=vec3(0.58,0.85,1.00);
  vec3 hi=mix(coolHi,warmHi,temp);
  float delay=h2(floor(cuv*3.)+uSeed)*0.7;
  // temp also drives sweep speed — heat makes shimmer frenetic
  float rate=0.25+temp*0.45;
  float band=mod(t*rate+delay,2.5)-0.3;
  float shine=smoothstep(0.30,0.,abs(cuv.x-band));
  float diagBand=mod(t*(rate-0.05)+delay+0.4,2.5)-0.3;
  float diagShine=smoothstep(0.22,0.,abs((cuv.x+cuv.y*0.55)-diagBand));
  return hi*max(shine,diagShine)*0.95;
}

// ── 6: FBM — toneScore colors (negative=dark red, positive=cyan-green) ───
vec3 tFBM(vec2 cuv, float t, float toneScore){
  float f=fbm(cuv*3.2+vec2(t*0.13+uSeed.x, uSeed.y));
  f+=0.50*fbm(cuv*6.5+vec2(uSeed.y, t*0.09));
  f=clamp(f,0.,1.);
  float stream =sin(cuv.x*8.+t*0.50+f*3.14159)*0.5+0.5;
  float stream2=cos(cuv.y*6.+t*0.35+f*2.0)*0.5+0.5;
  vec3 cyan   =vec3(0.70,0.90,1.00);
  vec3 green  =vec3(0.30,0.80,0.50);
  vec3 magenta=vec3(0.80,0.30,0.90);
  vec3 col=mix(cyan,green,f)*0.5;
  col+=magenta*stream*0.15;
  col+=green*stream2*0.10;
  // Conflict tint: negative toneScore → blood red, very dark
  float neg=clamp((-toneScore+50.)/100.,0.,1.);
  col=mix(col, col*vec3(0.60,0.10,0.10)+vec3(0.12,0.,0.), neg*0.75);
  return col;
}

// ── 7: Void — conflict drains all color, occasional dying ember ──────────
vec3 tVoid(vec2 cuv, float t, float conflict){
  float pulse=sin(t*0.75+h2(floor(cuv*2.)+uSeed)*6.28)*0.5+0.5;
  // High conflict → almost total blackout; low → faint amber ember
  float ember=pulse*(1.-conflict*0.9)*0.10;
  return vec3(ember*0.30, ember*0.18, ember*0.06);
}

// ── 8: Dot Pulse — isDaylit controls brightness and color ────────────────
vec3 tDotPulse(vec2 cuv, float t, float isDaylit){
  vec2 dots=fract(cuv*6.)-0.5;
  // Dots breathe at solar rhythm — faster during day, languid at night
  float rate=0.4+isDaylit*1.2;
  float radius=0.15+0.08*sin(t*rate+h2(floor(cuv*6.)+uSeed)*6.28);
  float dot=smoothstep(radius+0.06,radius-0.01,length(dots));
  vec3 dayCol  =vec3(0.98,0.93,0.68); // warm sunlight
  vec3 nightCol=vec3(0.20,0.25,0.65); // cool indigo night
  return mix(nightCol,dayCol,isDaylit)*dot*(0.55+isDaylit*0.45);
}

// ── 9: Seismic Ring — concentric shockwaves from center ──────────────────
vec3 tSeismicRing(vec2 cuv, float t, float seismic){
  vec2 c=cuv-0.5;
  float d=length(c);
  // High seismic → more rings, faster propagation, brighter
  float ringCount=8.0+seismic*18.0;
  float speed=1.5+seismic*7.0;
  float rings=sin(d*ringCount-t*speed)*0.5+0.5;
  rings=pow(rings,2.0-seismic*1.5);
  float fade=smoothstep(0.52,0.02,d);
  vec3 calm =vec3(0.15,0.55,0.35); // green — minor tremor
  vec3 major=vec3(1.00,0.25,0.05); // red-orange — major quake
  return mix(calm,major,seismic)*rings*fade*(0.35+seismic*0.65);
}

// ── 10: Neon Edge — glowing inner border, color = economia trend ─────────
vec3 tNeonEdge(vec2 cuv, float t, float trendDir){
  float edgeDist=min(min(cuv.x,1.-cuv.x),min(cuv.y,1.-cuv.y));
  float pulse=sin(t*2.0)*0.5+0.5;
  float glow=smoothstep(0.28,0.,edgeDist)*(0.55+0.45*pulse);
  // Second inner ring for depth
  float inner=smoothstep(0.10,0.,edgeDist)*0.4;
  vec3 upCol  =vec3(0.05,1.00,0.40); // vivid green — economy rising
  vec3 downCol=vec3(1.00,0.15,0.15); // alarm red   — economy falling
  vec3 neutCol=vec3(1.00,0.85,0.15); // gold        — neutral/flat
  vec3 col;
  if(trendDir>0.5)       col=upCol;
  else if(trendDir<-0.5) col=downCol;
  else                   col=neutCol;
  return col*(glow+inner);
}

// ── 11: Matrix Rain — falling columns, atencion drives speed + density ───
vec3 tMatrixRain(vec2 cuv, float t, float atencion){
  float colIdx=floor(cuv.x*8.);
  // At max atencion the rain falls 5x faster — frantic global viral moment
  float speed=0.3+atencion*3.5;
  float offset=h1(colIdx+uSeed.x*17.3)*5.0;
  float y=fract(cuv.y-t*speed*(0.5+h1(colIdx)*0.5)+offset);
  float head =smoothstep(0.10,0.,y);
  float trail=smoothstep(0.55,0.,y)*0.45;
  float val=head+trail;
  vec3 bright=vec3(0.05,1.00,0.40);
  vec3 dim   =vec3(0.00,0.25,0.08);
  return mix(dim,bright,head)*val*(0.35+atencion*0.65);
}

// ── 12: Grad Sweep — gradient follows wind direction + speed ─────────────
vec3 tGradSweep(vec2 cuv, float t, float windDir, float windSpd){
  float angle=windDir*6.28318; // 0-1 → 0-2π
  vec2 dir=vec2(sin(angle),cos(angle));
  float speed=0.06+windSpd*0.55;
  float sweep=fract(dot(cuv-0.5,dir)*1.4+t*speed);
  // Warm→cool gradient that moves with wind
  vec3 c1=vec3(0.95,0.50,0.10); // amber
  vec3 c2=vec3(0.10,0.50,0.95); // sky blue
  float wave=smoothstep(0.,0.5,sweep)-smoothstep(0.5,1.,sweep);
  return mix(c1,c2,wave+0.5)*0.75;
}

// ── 13: Starburst — ray count = 4+kp*10, sharper spikes at high kp ───────
vec3 tStarburst(vec2 cuv, float t, float kp){
  vec2 c=cuv-0.5;
  float d=length(c);
  float angle=atan(c.y,c.x);
  float rays=4.0+kp*10.0;
  float star=abs(sin(angle*rays*0.5+t*(0.3+kp*0.4)));
  star=pow(star,2.5-kp*2.0); // low kp=fat blobs, high kp=sharp spikes
  float fade=smoothstep(0.50,0.02,d);
  vec3 solarCol=mix(vec3(1.0,0.75,0.15),vec3(0.65,0.35,1.0),kp);
  return solarCol*star*fade*(0.30+kp*0.70);
}

// ── 14: Holographic — HSL rainbow, hue offset by temperature ─────────────
vec3 tHolographic(vec2 cuv, float t, float temp){
  // Cold=blue (0.65), hot=red/gold (0.0)
  float baseHue=mix(0.65,0.02,temp);
  float interference=sin((cuv.x+cuv.y)*14.+t*0.6)*0.5+0.5;
  float hue=fract(baseHue+cuv.x*0.25+cuv.y*0.15+t*0.05+interference*0.12);
  // Saturation ramps up at temperature extremes
  float sat=0.55+abs(temp-0.5)*0.8;
  vec3 col=hsl2rgb(vec3(hue, sat, 0.52));
  return col*(0.55+interference*0.45);
}

// ── 15: TV Static — noise grain, volatility drives density/intensity ──────
vec3 tTVStatic(vec2 cuv, float t, float volat){
  // Fast flicker: different every frame at 24 fps
  float sta=h2(cuv*vec2(37.1,19.7)+vec2(floor(t*24.),uSeed.x));
  // Horizontal scan lines
  float scan=step(0.55,fract(cuv.y*22.))*0.18;
  float intensity=0.05+volat*0.85; // market calm→quiet snow; crisis→blizzard
  float val=sta*intensity+scan*(0.05+volat*0.15);
  // Monochrome static with slight warmth
  return vec3(val*0.92,val*0.87,val*0.78);
}

// ── 16: Breath Orb — pulsing glow, seismic controls pulse rate ───────────
vec3 tBreathOrb(vec2 cuv, float t, float seismic){
  vec2 c=cuv-0.5;
  float d=length(c);
  // Calm earth→slow breath; active→rapid trembling pulse
  float rate=0.4+seismic*5.0;
  float breath=sin(t*rate)*0.5+0.5;
  float radius=0.12+breath*0.18;
  float orb =smoothstep(radius+0.08,radius-0.04,d);
  float glow=smoothstep(radius+0.40,0.,d)*0.25;
  vec3 calm   =vec3(0.25,0.55,1.00);
  vec3 tremor =vec3(1.00,0.35,0.05);
  vec3 col=mix(calm,tremor,seismic);
  return col*(orb+glow)*(0.45+seismic*0.55);
}

// ── 17: Scan Wave — sweeping scanline, solarWind drives speed ────────────
vec3 tScanWave(vec2 cuv, float t, float solarWind){
  // solarWind 0→glacial sweep (once per 10s), max→rapid (5x/s)
  float speed=0.10+solarWind*0.75;
  float wavePos=fract(t*speed);
  float scan =smoothstep(0.06,0.,abs(cuv.x-wavePos));
  float echo =smoothstep(0.04,0.,abs(cuv.x-fract(wavePos-0.14)))*0.30;
  float trail=smoothstep(0.25,0.,cuv.x-wavePos+0.01)*0.08;
  vec3 plasmaCol=mix(vec3(1.0,0.65,0.10),vec3(1.0,0.95,0.80),solarWind);
  return plasmaCol*(scan+echo+trail);
}

// ── 18: Diag Stripe — animated diagonal bands, wind angle + speed ─────────
vec3 tDiagStripe(vec2 cuv, float t, float windDir, float windSpd){
  float angle=windDir*3.14159; // 0-1 → 0-π (half circle covers all directions)
  float cosA=cos(angle), sinA=sin(angle);
  float proj=(cuv.x-0.5)*cosA+(cuv.y-0.5)*sinA;
  float speed=0.08+windSpd*0.55;
  float stripe=fract(proj*7.+t*speed);
  // Band sharpness: strong wind → crisp edges; light breeze → soft
  float sharpness=2.0+windSpd*6.0;
  float band=pow(smoothstep(0.48,0.38,abs(stripe-0.5)),sharpness)*0.8;
  vec3 col=mix(vec3(0.12,0.22,0.42),vec3(0.45,0.65,0.95),windSpd*0.7+band*0.3);
  return col*band;
}

// ── 19: Corner Heat — temperature gradient between corners ────────────────
vec3 tCornerHeat(vec2 cuv, float t, float temp){
  // High temp: hot spot at top-right corner
  // Low temp: cold spot at bottom-left corner
  float hotDist =length(cuv-vec2(1.,1.));
  float coldDist=length(cuv-vec2(0.,0.));
  float anim=sin(t*0.25)*0.04;
  vec3 hotCol =vec3(1.0, 0.20+anim, 0.02);
  vec3 coldCol=vec3(0.02,0.18+anim, 1.0);
  vec3 neutral=vec3(0.08,0.08,0.10);
  float hotInfluence =clamp((1.-hotDist*1.6)*temp, 0.,1.);
  float coldInfluence=clamp((1.-coldDist*1.6)*(1.-temp), 0.,1.);
  vec3 col=neutral;
  col=mix(col, hotCol,  hotInfluence);
  col=mix(col, coldCol, coldInfluence);
  // At extreme temps (near 0 or 1) boost intensity dramatically
  float extreme=abs(temp-0.5)*2.0;
  return col*(0.45+extreme*0.65);
}

// ── 20: Cross Glow — perpendicular beams, kp drives brightness + wander ──
vec3 tCrossGlow(vec2 cuv, float t, float kp){
  vec2 c=cuv-0.5;
  // Beams wander at high kp — erratic solar storm behavior
  float wander=kp*0.18;
  float hBeam=smoothstep(0.045,0.,abs(c.y-sin(t*0.55)*wander));
  float vBeam=smoothstep(0.045,0.,abs(c.x-cos(t*0.40)*wander));
  // Secondary ghost beams at 45° for high kp
  float dBeam1=smoothstep(0.030,0.,abs(c.x-c.y-cos(t*0.3)*wander))*kp*0.5;
  float dBeam2=smoothstep(0.030,0.,abs(c.x+c.y-sin(t*0.35)*wander))*kp*0.5;
  float brightness=0.20+kp*0.80; // faint at kp=0, blinding at kp=9
  vec3 col=vec3(hBeam+vBeam+dBeam1+dBeam2)*brightness;
  return col*mix(vec3(1.0,0.92,0.85),vec3(0.60,0.35,1.0),kp);
}

// ── 21: Hex Grid — trendDir sets fill color; volatility pulses fills ───────
vec3 tHexGrid(vec2 cuv, float t, float trendDir, float volat){
  vec2 hUV=cuv*5.;
  vec2 r=vec2(1.,1.73);
  vec2 h=r*0.5;
  vec2 a=mod(hUV,r)-h;
  vec2 b=mod(hUV-h,r)-h;
  vec2 gv; if(dot(a,a)<dot(b,b)) gv=a; else gv=b;
  float d=hexDist(gv);
  float edge=smoothstep(0.47,0.44,d)-smoothstep(0.50,0.47,d);
  float fill=smoothstep(0.44,0.38,d);
  float pulse=sin(t*0.9+h2(floor(hUV)+uSeed)*6.28)*0.5+0.5;
  // Fill pulses faster when market is volatile
  float fillRate=0.15+volat*0.65;
  float fillPulse=sin(t*fillRate+h2(floor(hUV)*2.+uSeed)*6.28)*0.5+0.5;
  vec3 upCol  =vec3(0.00,0.90,0.40);
  vec3 downCol=vec3(0.95,0.12,0.12);
  vec3 neutCol=vec3(0.90,0.72,0.08);
  vec3 trendCol=neutCol;
  if(trendDir>0.5)       trendCol=upCol;
  else if(trendDir<-0.5) trendCol=downCol;
  return trendCol*(edge*0.70+fill*fillPulse*0.35);
}

// ── Main ──────────────────────────────────────────────────────────────────
void main(){
  vec2 uv=vUv;

  // Normalize world signals to 0-1
  float temp      =clamp((uAtmosphere.x+20.)/65.,0.,1.);
  float windSpd   =clamp(uAtmosphere.y/50.,0.,1.);
  float windDir   =clamp(uAtmosphere.w/360.,0.,1.);
  float kp        =clamp(uCosmos.x/9.,0.,1.);
  float solarWind =clamp(uCosmos.y/800.,0.,1.);
  float isDaylit  =uCosmos.z;
  float seismic   =clamp(uEarth.x/8.,0.,1.);
  float volat     =clamp(uEconomy.x/100.,0.,1.);
  float trendDir  =uEconomy.y; // -1, 0, or 1
  float toneScore =uSocial.x;
  float atencion  =clamp(uSocial.y,0.,1.);
  float conflict  =clamp((-toneScore+100.)/200.,0.,1.);

  // ── Grid ─────────────────────────────────────────────────────────────────
  vec2 cellUV  =uv*vec2(COLS,ROWS);
  vec2 cellIdx =floor(cellUV);
  vec2 cellLoc =fract(cellUV);

  bool isBorder=cellLoc.x<BORDER||cellLoc.x>1.-BORDER||
                cellLoc.y<BORDER||cellLoc.y>1.-BORDER;

  // ── Monument photo substrate ──────────────────────────────────────────────
  vec3 photo=vec3(0.030);
  if(uPhotoReady>0.5){
    vec3 raw  =texture2D(uMonumentTex,uv).rgb;
    float luma=dot(raw,vec3(0.299,0.587,0.114));
    photo=mix(raw,vec3(luma),0.40)*0.48; // darkened, slight desaturation
  }

  // ── Cell type — deterministic hash, unique per city via uSeed ─────────────
  // Distribution: Clear=8%, treatments 1-20=4% each, HexGrid=12%
  float ch=h2(cellIdx+uSeed*7.31+vec2(uSeed.y,uSeed.x)*3.17);

  // ── Apply treatment (single if-else chain — avoids int vars on strict drivers)
  vec3 treatment=vec3(0.);
  bool isClear=false;
  if     (ch<0.08){ treatment=tClear(photo);                        isClear=true; }
  else if(ch<0.12)  treatment=tAurora(cellLoc,uTime,kp);
  else if(ch<0.16)  treatment=tBeams(cellLoc,uTime,seismic,solarWind);
  else if(ch<0.20)  treatment=tAnimGrid(cellLoc,uTime,atencion);
  else if(ch<0.24)  treatment=tRetroGrid(cellLoc,uTime,volat);
  else if(ch<0.28)  treatment=tShimmer(cellLoc,uTime,temp);
  else if(ch<0.32)  treatment=tFBM(cellLoc,uTime,toneScore);
  else if(ch<0.36)  treatment=tVoid(cellLoc,uTime,conflict);
  else if(ch<0.40)  treatment=tDotPulse(cellLoc,uTime,isDaylit);
  else if(ch<0.44)  treatment=tSeismicRing(cellLoc,uTime,seismic);
  else if(ch<0.48)  treatment=tNeonEdge(cellLoc,uTime,trendDir);
  else if(ch<0.52)  treatment=tMatrixRain(cellLoc,uTime,atencion);
  else if(ch<0.56)  treatment=tGradSweep(cellLoc,uTime,windDir,windSpd);
  else if(ch<0.60)  treatment=tStarburst(cellLoc,uTime,kp);
  else if(ch<0.64)  treatment=tHolographic(cellLoc,uTime,temp);
  else if(ch<0.68)  treatment=tTVStatic(cellLoc,uTime,volat);
  else if(ch<0.72)  treatment=tBreathOrb(cellLoc,uTime,seismic);
  else if(ch<0.76)  treatment=tScanWave(cellLoc,uTime,solarWind);
  else if(ch<0.80)  treatment=tDiagStripe(cellLoc,uTime,windDir,windSpd);
  else if(ch<0.84)  treatment=tCornerHeat(cellLoc,uTime,temp);
  else if(ch<0.88)  treatment=tCrossGlow(cellLoc,uTime,kp);
  else              treatment=tHexGrid(cellLoc,uTime,trendDir,volat);

  // ── Composite photo + treatment ───────────────────────────────────────────
  vec3 col;
  if(isClear){
    col=treatment; // clear: photo unobscured
  } else {
    col=photo*0.35+treatment;
    col=clamp(col,0.,1.);
  }

  // ── Border ────────────────────────────────────────────────────────────────
  if(isBorder) col=vec3(0.012);

  // ── Vignette ──────────────────────────────────────────────────────────────
  float vig=1.-dot((uv-0.5)*1.1,(uv-0.5)*1.1);
  col*=0.50+vig*0.57;
  col=clamp(col,0.,1.);

  // ── Gamma ─────────────────────────────────────────────────────────────────
  col=pow(col,vec3(0.4545));

  gl_FragColor=vec4(col,1.0);
}
`
