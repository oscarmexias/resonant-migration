// Vision: Testigo — monument witnessed through real-world atmospheric conditions
//
// DESIGN PRINCIPLE: Every city looks different. Effects use real-world data:
//   CDMX vs London vs Dubai vs Tromsø produce visibly distinct images.
//
//  clima.temp        → colour grade: cold blue (−20°C) ↔ warm amber (+45°C)
//                      + frost edges below 5°C, heat-haze UV shimmer above 30°C
//  clima.windSpd+Dir → ambient sway (only above 12 m/s)
//  clima.precipitation → ACTUAL rain mm/h — NOT humidity (humidity = haze only)
//  clima.humidity    → atmospheric haze only (milky veil, no rain streaks)
//  cosmos.kp         → aurora curtains at night (faint at kp=1, full at kp=9)
//  cosmos.solarWind  → EM scan-line interference
//  cosmos.isDaylit   → night/day grade, stars, moon
//  cosmos.sunElev    → golden-hour warmth band near horizon
//  tierra.seismic    → camera shake + shockwave rings
//  economia.volat    → chromatic aberration, film grain
//  economia.trendDir → green / red highlight cast
//  social.toneScore  → warm vs. cold emotional palette

export const vertGLSL = /* glsl */`
varying vec2 vUv;
void main(){ vUv=uv; gl_Position=vec4(position,1.0); }
`

export const fragGLSL = /* glsl */`
precision mediump float;

uniform float uTime;
uniform vec2  uResolution;
uniform vec4  uAtmosphere;    // temp(°C), windSpd(m/s), humidity(0-100), windDir(0-360)
uniform float uPrecipitation; // mm/h — actual rainfall right now (0 = dry)
uniform vec4  uCosmos;        // kp(0-9), solarWind(km/s), isDaylit(0/1), sunElev(−1..1)
uniform vec4  uEarth;         // magnitude, distKm, totalLastHour, 0
uniform vec4  uEconomy;       // volatility(0-100), trendDir(−1/0/1), 0, 0
uniform vec2  uSocial;        // toneScore, trending.score
uniform vec2  uCity;
uniform vec2  uSeed;
uniform float uLandmarkType;
uniform sampler2D uMonumentTex;
uniform float     uPhotoReady;
uniform float     uMicLevel;
uniform float     uShakeIntensity;
uniform float     uGyroBeta;
uniform float     uGyroGamma;

varying vec2 vUv;

float h1(float n){ return fract(sin(n)*43758.5453); }
float h2(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float n2(vec2 p){
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.-2.*f);
  return mix(mix(h2(i),h2(i+vec2(1.,0.)),f.x),
             mix(h2(i+vec2(0.,1.)),h2(i+vec2(1.,1.)),f.x),f.y);
}

void main(){
  vec2 uv=vUv;

  // ── Normalise signals ─────────────────────────────────────────────────────
  // All mapped to 0-1 across realistic worldwide ranges
  float temp     = clamp((uAtmosphere.x+20.)/65.,0.,1.); // −20°C → +45°C
  float windSpd  = clamp(uAtmosphere.y/25.,0.,1.);        // 0→25 m/s (strong wind=1)
  float humidity = clamp(uAtmosphere.z/100.,0.,1.);
  float windDir  = clamp(uAtmosphere.w/360.,0.,1.);
  float kp       = clamp(uCosmos.x/9.,0.,1.);
  float solarWnd = clamp(uCosmos.y/800.,0.,1.);
  float isDaylit = uCosmos.z;
  float sunElev  = uCosmos.w;
  float seismic  = clamp(uEarth.x/8.,0.,1.);
  float volat    = clamp(uEconomy.x/100.,0.,1.);
  float trendDir = uEconomy.y;
  float toneScore= uSocial.x;
  float atencion = clamp(uSocial.y,0.,1.);

  // Derived weather signals
  float haze = humidity*humidity*0.55;          // atmospheric haze from humidity
  // Rain from ACTUAL precipitation data (mm/h): 0=dry, 0.1=drizzle, 2=moderate, 10=heavy
  float rain  = clamp(uPrecipitation/6.0, 0., 1.); // 6mm/h = heavy rain = full effect

  // ── UV distortion ─────────────────────────────────────────────────────────
  vec2 distUV=uv;

  // Wind sway — only above 12 m/s (0.48 normalised); calm/average cities are static
  float wA=windDir*6.28318;
  float sway=max(0.,windSpd-0.48)*0.022;
  distUV.x+=sin(uv.y*18.+uTime*(0.8+windSpd*5.)+uSeed.x)*sway*sin(wA);
  distUV.y+=sin(uv.x*14.+uTime*(0.6+windSpd*4.)+uSeed.y)*sway*abs(cos(wA))*0.5;

  // Seismic tremor — only from actual earthquake data
  float shakeTot=seismic*0.020;
  distUV.x+=sin(uTime*52.+uSeed.x*29.)*shakeTot;
  distUV.y+=cos(uTime*47.+uSeed.y*23.)*shakeTot;

  // Heat haze — vertical shimmer above 25°C; zero below
  float hotness=clamp((temp-0.68)/0.32,0.,1.); // 0 at 24°C, 1 at 45°C
  float hzAmt=hotness*hotness*0.012*sin(uv.x*45.+uTime*1.8+n2(uv*2.)*3.14159);
  distUV.y+=hzAmt;

  // Gyroscope parallax
  distUV.x+=uGyroGamma*0.004;
  distUV.y+=uGyroBeta*0.003;

  // ── Monument photo (chromatic aberration driven by volatility+seismic) ────
  vec3 photo=vec3(0.015,0.018,0.025);

  if(uPhotoReady<0.5){
    // Placeholder: gradient sky + faint arch silhouette
    float sv=uv.y*0.07+0.012;
    photo=vec3(sv*0.36, sv*0.42, sv);
    float arch=0.42+sin(uv.x*3.14159)*0.10+sin(uv.x*8.)*0.03;
    float silh=1.-smoothstep(arch, arch+0.04, uv.y);
    photo=mix(photo, vec3(0.006,0.006,0.008), silh*0.78);
  } else {
    // RGB split — economy volatility widens the split, seismic adds jitter
    float aberr=volat*0.014+seismic*0.008+uMicLevel*0.004;
    float cr=texture2D(uMonumentTex, distUV+vec2(aberr,0.)).r;
    float cg=texture2D(uMonumentTex, distUV).g;
    float cb=texture2D(uMonumentTex, distUV-vec2(aberr,0.)).b;
    photo=vec3(cr,cg,cb);
  }

  vec3 col=photo;

  // ── Temperature colour grade — ALWAYS active across full range ────────────
  // −20°C: deep cold blue  |  20°C: neutral  |  45°C: hot amber
  float coldness=clamp(1.-temp/0.62,0.,1.);   // strong below ~20°C
  float warmness=clamp((temp-0.62)/0.38,0.,1.); // strong above ~40°C
  float midday  =clamp(1.-abs(temp-0.62)/0.38,0.,1.); // peak at ~20°C
  vec3 coldGrade=vec3(0.75,0.85,1.10); // icy blue lift
  vec3 warmGrade=vec3(1.15,0.95,0.72); // amber push
  vec3 neutGrade=vec3(0.95,0.97,0.99);
  vec3 tempGrade=mix(neutGrade, coldGrade, coldness*0.70);
  tempGrade     =mix(tempGrade, warmGrade, warmness*0.70);
  col*=tempGrade;

  // ── Day / Night — dramatic difference ────────────────────────────────────
  float luma=dot(col,vec3(0.299,0.587,0.114));
  if(isDaylit<0.5){
    // Night: significant desaturation + deep blue cast + darken
    vec3 nightVer=vec3(luma*0.44+0.007, luma*0.50+0.016, luma*0.70+0.044);
    col=mix(col, nightVer, 0.78);
    col*=0.55;
  } else {
    // Golden hour: sunElev near 0 = horizon = orange-red warmth
    float dawnDusk=1.-abs(sunElev);
    float golden=dawnDusk*dawnDusk*dawnDusk; // cubic: very narrow band
    vec3 goldenHr=vec3(1.22,0.88,0.54);
    col=mix(col, col*goldenHr, golden*0.65);
  }

  // ── Atmospheric haze — humidity creates visible veil ─────────────────────
  // Even at 50% humidity there's a noticeable milky lift
  vec3 hazeCol=mix(vec3(0.55,0.60,0.68), vec3(0.48,0.52,0.58), isDaylit);
  col=mix(col, col*0.85+hazeCol*0.15, haze*0.50);

  // ── Rain — streaks, droplets, wet ground ──────────────────────────────────
  if(rain>0.01){
    float rainSpd=4.0+windSpd*10.0;
    float slant=sin(windDir*6.28318)*windSpd*0.30;

    float cx=floor(uv.x*80.)/80.;
    float ph=h2(vec2(cx,uSeed.x*5.3));
    float ry=fract((uv.y-uv.x*slant)+uTime*rainSpd*(0.45+ph*0.55));
    float streak=(1.-ry)*(1.-ry);
    streak*=step(0.64, fract(cx*60.+uSeed.y*41.));
    streak*=0.5+ph*0.5;

    float dx=h2(vec2(floor(uv.x*40.),uSeed.x+floor(uTime*8.)));
    float dy=h2(vec2(floor(uv.y*40.),uSeed.y+floor(uTime*8.)));
    float drop=smoothstep(0.964,1.0, dx*dy);

    float ri=rain*(isDaylit<0.5 ? 0.60 : 0.42);
    col+=vec3(0.10,0.18,0.32)*streak*ri*0.55;
    col+=vec3(0.40,0.55,0.78)*drop*ri*0.40;

    // Wet ground mirror at bottom
    float wetLine=smoothstep(0.55,1.0,uv.y)*rain*0.55;
    vec2 reflUV=vec2(uv.x+sin(uv.y*20.+uTime*0.3)*0.006, 1.-uv.y);
    vec3 refl=vec3(0.025,0.032,0.050);
    if(uPhotoReady>0.5) refl=texture2D(uMonumentTex,reflUV).rgb*vec3(0.55,0.68,0.88)*0.42;
    col=mix(col, refl+col*0.62, wetLine);
  }

  // ── Stars — clear nights (visible from kp=0; brighter with more clearness) ─
  if(isDaylit<0.5){
    float clearness=clamp(1.-rain*1.4-haze*0.5,0.,1.);
    if(clearness>0.05){
      float sg=h2(floor(uv*180.)+uSeed*5.1);
      float thresh=0.978-clearness*0.024;
      if(sg>thresh){
        float tw=sin(uTime*(1.8+sg*7.)+sg*37.7)*0.5+0.5;
        float br=(sg-thresh)/(1.-thresh);
        float skyFade=smoothstep(0.65,0.0,uv.y);
        col+=vec3(0.68,0.78,1.00)*br*tw*clearness*skyFade*0.60;
      }
    }
  }

  // ── Moon — appears every clear night, arc set by sunElev ─────────────────
  if(isDaylit<0.5 && rain<0.50){
    float mx=0.68+uSeed.x*0.20;
    float my=0.12+abs(sunElev+0.35)*0.28;
    float md=length(uv-vec2(mx,my));
    float mglow=smoothstep(0.30,0.0,md)*(1.-rain*2.0);
    float mdisc=smoothstep(0.030,0.018,md);
    col+=vec3(0.76,0.83,0.95)*mglow*0.18*(1.-rain);
    col+=vec3(0.90,0.92,0.98)*mdisc*0.45*(1.-rain);
  }

  // ── Aurora — scales continuously from kp=0 (barely visible) to kp=9 ──────
  // Night only; rain dims it
  if(kp>0.25 && isDaylit<0.5){
    float aStr=smoothstep(0.25,1.0,kp);  // only meaningful geomagnetic activity
    float a1=sin(uv.x*3.14+uTime*0.22+uSeed.x*6.28)*0.5+0.5;
    float a2=cos(uv.x*2.10+uTime*0.16+uSeed.y*4.00)*0.5+0.5;
    float a3=sin(uv.x*5.00+uTime*0.30+(uSeed.x+uSeed.y)*3.14)*0.5+0.5;
    float curtain=a1*a2*smoothstep(0.65,0.0,uv.y)*(1.-rain*0.70);
    vec3 aGreen =vec3(0.06,0.95,0.46);
    vec3 aPurple=vec3(0.58,0.18,1.00);
    vec3 aRed   =vec3(0.96,0.10,0.26);
    vec3 aCol=mix(aGreen,aPurple,a1);
    aCol=mix(aCol,aRed, a3*kp*0.55);
    col+=aCol*curtain*aStr*0.55;
    col=mix(col, col+vec3(0.,0.04,0.01), aStr*a1*0.12);
  }

  // ── Solar EM interference — proportional to solarWind ────────────────────
  if(solarWnd>0.45){
    float emStr=smoothstep(0.45,1.0,solarWnd);
    float scanLine=floor(uv.y*220.+uTime*solarWnd*14.);
    float scan=h1(scanLine*0.14+uSeed.x)*emStr*0.25;
    float sX=h2(vec2(floor(uv.x*165.),floor(uTime*33.)))*emStr*0.12;
    col+=vec3(scan+sX)*emStr;
  }

  // ── Frost — below 5°C (temp < 0.38) edge crystallisation ─────────────────
  if(temp<0.38){
    float coldness2=(0.38-temp)/0.38;
    float edgeDist=min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y));
    float fNoise=n2(uv*24.+uSeed*8.5)*0.55+n2(uv*52.+uSeed*16.)*0.45;
    float frostMask=smoothstep(0.28,0.0, edgeDist-fNoise*0.07)*coldness2;
    vec3 frostCol=vec3(0.65,0.82,0.97)+vec3(fNoise*0.14,fNoise*0.07,0.0);
    col=mix(col, frostCol, frostMask*0.68);
  }

  // ── Seismic rings — only when there is actual seismic data ───────────────
  if(seismic>0.05){
    float sd=length(uv-0.5);
    float ringVal=pow(sin(sd*25.-uTime*(3.+seismic*10.))*0.5+0.5, 4.0)*seismic;
    col+=vec3(0.38,0.18,0.04)*ringVal*seismic*0.28;
  }

  // ── Economic film grain + colour cast — always present ────────────────────
  float baseGrain=0.015+volat*0.12; // minimum grain even in calm markets
  float grain=(h2(uv*vec2(317.,201.)+vec2(floor(uTime*24.),uSeed.x))-0.5)*baseGrain;
  col+=vec3(grain);
  if(trendDir>0.5){
    col.g+=col.g*0.05; col.r*=0.95;
  } else if(trendDir<-0.5){
    col.r+=col.r*0.06; col.g*=0.93;
  }

  // ── Social tone — toneScore shifts palette continuously ──────────────────
  float negTone=clamp((-toneScore+50.)/100.,0.,1.);
  float posTone=clamp((toneScore-50.)/50.,0.,1.);
  col=mix(col, col*vec3(0.84,0.76,0.74), negTone*0.30);  // conflict: cold/red
  col=mix(col, col*vec3(0.98,1.02,0.97), posTone*0.15);  // peace: slight warmth

  // ── Vignette ─────────────────────────────────────────────────────────────
  float vig=1.-dot((uv-0.5)*1.10,(uv-0.5)*1.10);
  col*=0.46+vig*0.62;

  col=clamp(col,0.,1.);
  col=pow(col,vec3(0.4545));
  gl_FragColor=vec4(col,1.0);
}
`
