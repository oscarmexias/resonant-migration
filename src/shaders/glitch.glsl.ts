// Vision: Glitch Collapse — Art corrupts under data stress
// FBM base + Voronoi + Monument, progressively breaks down when stress is high

export const vertGLSL = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position,1.0); }
`

export const fragGLSL = /* glsl */ `
precision mediump float;

uniform float uTime;
uniform vec2  uResolution;
uniform vec4  uAtmosphere;
uniform vec4  uCosmos;
uniform vec4  uEarth;
uniform vec4  uEconomy;
uniform vec2  uSocial;
uniform vec2  uCity;
uniform vec2  uSeed;
uniform float uLandmarkType;

varying vec2 vUv;

// Simplex noise
vec3 _mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec2 _mod289(vec2 x){return x-floor(x*(1./289.))*289.;}
vec3 _perm(vec3 x){return _mod289(((x*34.)+1.)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(.211324865,.366025404,-.577350269,.024390244);
  vec2 i=floor(v+dot(v,C.yy)), x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1,0):vec2(0,1);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
  i=_mod289(i);
  vec3 p=_perm(_perm(i.y+vec3(0,i1.y,1))+i.x+vec3(0,i1.x,1));
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
  m=m*m; m=m*m;
  vec3 x=2.*fract(p*C.www)-1., h=abs(x)-.5, ox=floor(x+.5), a0=x-ox;
  m*=1.79284291-.85373472*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.*dot(m,g);
}

float fbm5(vec2 p){float v=0.,a=.5,f=1.;for(int i=0;i<5;i++){v+=a*snoise(p*f);a*=.5;f*=2.;}return v;}
float fbm3(vec2 p){float v=0.,a=.5,f=1.;for(int i=0;i<3;i++){v+=a*snoise(p*f);a*=.5;f*=2.;}return v;}

// SDF helpers
float sdBox(vec2 p,vec2 b){vec2 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,d.y),0.);}
float sdCircle(vec2 p,float r){return length(p)-r;}
float sdCap(vec2 p,vec2 a,vec2 b,float r){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-r;}
float opU(float a,float b){return min(a,b);}

// Monument SDF (full version from domainWarp)
float landmarkSDF(vec2 p, float ltype){
  float d=100.;
  if(ltype<.5){
    float col =sdBox(p-vec2(0.,-.05),vec2(.013,.30));
    float base=sdBox(p-vec2(0.,-.37),vec2(.060,.018));
    float cap =sdBox(p-vec2(0., .26),vec2(.024,.018));
    float wL  =sdCap(p,vec2(-.08,.16),vec2(.0,.24),.008);
    float wR  =sdCap(p,vec2( .08,.16),vec2(.0,.24),.008);
    d=opU(opU(opU(col,base),cap),opU(wL,wR));
  }
  else if(ltype<1.5){
    float lc=sdBox(p-vec2(-.14,-.10),vec2(.028,.26));
    float rc=sdBox(p-vec2( .14,-.10),vec2(.028,.26));
    float lt=sdBox(p-vec2(0.,  .14),vec2(.170,.028));
    float at=sdBox(p-vec2(0.,  .19),vec2(.10, .040));
    float arch=sdCircle(p-vec2(0.,.03),.08);
    float colOnly=opU(lc,rc);
    float cut=max(colOnly, -(arch-.008));
    d=opU(cut, opU(lt,at));
  }
  else if(ltype<2.5){
    float t0=sdBox(p-vec2(  0., .04),vec2(.022,.33));
    float t1=sdBox(p-vec2(-.12,-.04),vec2(.017,.26));
    float t2=sdBox(p-vec2( .12,-.04),vec2(.017,.26));
    float t3=sdBox(p-vec2(-.22,-.12),vec2(.012,.18));
    float t4=sdBox(p-vec2( .22,-.12),vec2(.012,.18));
    float bs=sdBox(p-vec2(0., -.37),vec2(.26,.020));
    d=opU(opU(opU(t0,t1),opU(t2,t3)),opU(t4,bs));
  }
  else if(ltype<3.5){
    float ag=sdBox(p-vec2(0., .23),vec2(.009,.16));
    float mi=sdBox(p-vec2(0.,-.02),vec2(.028,.12));
    float b1=sdCap(p,vec2(-.20,-.38),vec2(-.02,-.06),.011);
    float b2=sdCap(p,vec2( .20,-.38),vec2( .02,-.06),.011);
    float b3=sdCap(p,vec2(-.11,-.20),vec2( .11,-.20),.008);
    float bs=sdBox(p-vec2(0., -.38),vec2(.23,.015));
    d=opU(opU(opU(ag,mi),opU(b1,b2)),opU(b3,bs));
  }
  else if(ltype<4.5){
    float bod=sdBox(p-vec2(0.,-.04),vec2(.058,.30));
    float top=sdBox(p-vec2(0., .22),vec2(.032,.10));
    float nd =sdBox(p-vec2(0., .34),vec2(.010,.06));
    float bs =sdBox(p-vec2(0.,-.37),vec2(.12,.020));
    d=opU(opU(bod,top),opU(nd,bs));
  }
  else{
    float drum=sdBox(p-vec2(0.,-.02),vec2(.13,.10));
    float dome=sdCircle(p-vec2(0.,.08),.14);
    dome=max(dome,-(p.y-.08));
    float lan =sdBox(p-vec2(0., .22),vec2(.022,.07));
    float c1  =sdBox(p-vec2(-.21,-.20),vec2(.026,.18));
    float c2  =sdBox(p-vec2( .21,-.20),vec2(.026,.18));
    float bs  =sdBox(p-vec2(0., -.38),vec2(.27,.020));
    d=opU(opU(opU(dome,drum),opU(lan,c1)),opU(c2,bs));
  }
  return d;
}

// Voronoi
vec2 hash22(vec2 p){
  p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));
  return fract(sin(p)*43758.5453);
}
vec2 voronoi(vec2 p, float t){
  vec2 ip=floor(p), fp=fract(p);
  float md=8.; float id=0.;
  for(int x=-1;x<=1;x++){
    for(int y=-1;y<=1;y++){
      vec2 b=vec2(float(x),float(y));
      vec2 seed=ip+b;
      vec2 o=hash22(seed+uSeed.x*13.7);
      o+=.09*sin(t*.22+o*6.28+uSeed.y*5.1);
      vec2 r=b-fp+o;
      float d=dot(r,r);
      if(d<md){ md=d; id=fract(seed.x*137.1+seed.y*251.3+uSeed.x*19.3); }
    }
  }
  return vec2(sqrt(md), id);
}

void main(){
  vec2 uv=vUv;

  // Normalize signals
  float temp    =clamp((uAtmosphere.x+20.)/65.,0.,1.);
  float windSpd =clamp(uAtmosphere.y/80.,0.,1.);
  float humidity=clamp(uAtmosphere.z/100.,0.,1.);
  float windDir =uAtmosphere.w*3.14159/180.;
  float kp      =clamp(uCosmos.x/9.,0.,1.);
  float isDaylit=uCosmos.z;
  float seismic =clamp(uEarth.x/8.,0.,1.);
  float volat   =clamp(uEconomy.x/100.,0.,1.);
  float conflict=clamp((-uSocial.x+100.)/200.,0.,1.);

  // STRESS AMOUNT (combines kp, volat, conflict)
  float stress=(kp+volat+conflict)/3.;

  // COLLAPSE CYCLE (5 second cycle, stress makes it faster)
  float cycleSpeed=1.+stress*2.;
  float cycle=mod(uTime*cycleSpeed, 5.)/5.; // 0..1 over 5 seconds

  // CORRUPTION AMOUNT (grows over cycle, resets)
  float corr=smoothstep(.2, .9, cycle)*stress;
  corr=clamp(corr, 0., 1.);

  vec2 p=(uv-.5)*2.;
  p.x*=uResolution.x/uResolution.y;

  // BLOCK DISPLACEMENT (UV grid distortion in chunks)
  float blockSize=mix(8., 20., corr);
  vec2 blockID=floor(uv*blockSize);
  vec2 blockOffset=vec2(
    snoise(blockID+vec2(uTime*.3+uSeed.x,0.)),
    snoise(blockID+vec2(0.,uTime*.3+uSeed.y))
  )*corr*.1;
  vec2 glitchUV=uv+blockOffset;
  vec2 glitchP=(glitchUV-.5)*2.;
  glitchP.x*=uResolution.x/uResolution.y;

  // RGB CHANNEL SEPARATION (walk away from each other)
  vec2 rOff=vec2(-corr*.03, 0.);
  vec2 gOff=vec2(0., 0.);
  vec2 bOff=vec2(corr*.03, 0.);

  // BACKGROUND FBM (per channel)
  float lat=uCity.x;
  float absN=abs(lat)/90.;
  vec3 bA=mix(vec3(.02,.28,.08), vec3(.01,.04,.28), absN);
  vec3 bB=mix(vec3(.55,.38,.00), vec3(.00,.22,.32), absN);

  float sl=uTime*.02, md=uTime*.08;
  vec2 co=vec2(uSeed.x*4.2,uSeed.y*3.7);

  // Channel R
  vec2 pR=glitchP+rOff;
  vec2 qR=vec2(fbm5(pR+co+vec2(sl,md)), fbm5(pR+co+vec2(md*-.8,-sl)));
  float bgR=fbm5(pR+qR+co*.3);

  // Channel G
  vec2 pG=glitchP+gOff;
  vec2 qG=vec2(fbm5(pG+co+vec2(sl,md)), fbm5(pG+co+vec2(md*-.8,-sl)));
  float bgG=fbm5(pG+qG+co*.3);

  // Channel B
  vec2 pB=glitchP+bOff;
  vec2 qB=vec2(fbm5(pB+co+vec2(sl,md)), fbm5(pB+co+vec2(md*-.8,-sl)));
  float bgB=fbm5(pB+qB+co*.3);

  vec3 bgR_col=mix(bA,bB,temp+bgR*.5);
  vec3 bgG_col=mix(bA,bB,temp+bgG*.5);
  vec3 bgB_col=mix(bA,bB,temp+bgB*.5);

  // VORONOI CELLS (per channel)
  vec2 voR=voronoi(pR*2.4, uTime);
  vec2 voG=voronoi(pG*2.4, uTime);
  vec2 voB=voronoi(pB*2.4, uTime);

  float vidR=voR.y, vidG=voG.y, vidB=voB.y;
  float sidR=floor(vidR*6.), sidG=floor(vidG*6.), sidB=floor(vidB*6.);

  // Cell colors (corrupted when stress high)
  vec3 cellR=mix(vec3(.5,.2,.1), vec3(1.,.2,.0), sidR/6.);
  vec3 cellG=mix(vec3(.1,.5,.2), vec3(.0,1.,.2), sidG/6.);
  vec3 cellB=mix(vec3(.1,.2,.5), vec3(.0,.2,1.), sidB/6.);

  // Composite cells onto background
  float cellOpR=.3*mix(1., snoise(pR*10.+uTime), corr); // corrupted opacity
  float cellOpG=.3*mix(1., snoise(pG*10.+uTime), corr);
  float cellOpB=.3*mix(1., snoise(pB*10.+uTime), corr);

  vec3 colR=mix(bgR_col, cellR, cellOpR);
  vec3 colG=mix(bgG_col, cellG, cellOpG);
  vec3 colB=mix(bgB_col, cellB, cellOpB);

  // MONUMENT SDF (per channel, breaks apart at high corruption)
  float lscale=.72;
  vec2 lpR=(pR+rOff)/lscale; lpR.y+=.08;
  vec2 lpG=(pG+gOff)/lscale; lpG.y+=.08;
  vec2 lpB=(pB+bOff)/lscale; lpB.y+=.08;

  // SDF with holes (corruption introduces discontinuities)
  float lR=landmarkSDF(lpR, uLandmarkType);
  float lG=landmarkSDF(lpG, uLandmarkType);
  float lB=landmarkSDF(lpB, uLandmarkType);

  // Add holes via noise threshold
  float holeThresh=.4-corr*.5; // more holes at high corruption
  float holeR=step(holeThresh, snoise(lpR*8.+uSeed.x*5.));
  float holeG=step(holeThresh, snoise(lpG*8.+uSeed.y*5.));
  float holeB=step(holeThresh, snoise(lpB*8.+uSeed.x*7.));

  float lFillR=(1.-smoothstep(-.01,.015,lR))*holeR;
  float lFillG=(1.-smoothstep(-.01,.015,lG))*holeG;
  float lFillB=(1.-smoothstep(-.01,.015,lB))*holeB;

  vec3 lColR=vec3(.92,.86,.58)*lFillR;
  vec3 lColG=vec3(.92,.86,.58)*lFillG;
  vec3 lColB=vec3(.92,.86,.58)*lFillB;

  colR+=lColR*.9;
  colG+=lColG*.9;
  colB+=lColB*.9;

  // FINAL RGB ASSEMBLY
  vec3 col=vec3(colR.r, colG.g, colB.b);

  // CORRUPTION NOISE (spreads from edges)
  float edgeDist=min(min(uv.x, 1.-uv.x), min(uv.y, 1.-uv.y));
  float edgeCorr=1.-smoothstep(0., .3, edgeDist);
  float noiseCorr=snoise(uv*50.+uTime*2.)*edgeCorr*corr;
  col+=vec3(noiseCorr*.5);

  // VIGNETTE
  col*=1.-dot(p*.40,p*.40);

  // GAMMA
  col=pow(max(col,0.),vec3(.4545));

  gl_FragColor=vec4(col,1.);
}
`
