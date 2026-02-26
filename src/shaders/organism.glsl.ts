// Vision: Organism — Bio-horror, living tissue, pulsing membranes, vein structures
// Voronoi cells as biological tissue with organic texture and visceral colors

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

float fbm3(vec2 p){float v=0.,a=.5,f=1.;for(int i=0;i<3;i++){v+=a*snoise(p*f);a*=.5;f*=2.;}return v;}

// Voronoi with cell ID
vec2 hash22(vec2 p){
  p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));
  return fract(sin(p)*43758.5453);
}
vec2 voronoi(vec2 p, float pulseRate){
  vec2 ip=floor(p), fp=fract(p);
  float md=8.; float id=0.; vec2 cellPos=vec2(0.);
  for(int x=-1;x<=1;x++){
    for(int y=-1;y<=1;y++){
      vec2 b=vec2(float(x),float(y));
      vec2 seed=ip+b;
      vec2 o=hash22(seed+uSeed.x*13.7);
      // Organic drift (breathing motion)
      o+=.08*sin(uTime*pulseRate+o*6.28+uSeed.y*5.1);
      vec2 r=b-fp+o;
      float d=dot(r,r);
      if(d<md){ md=d; id=fract(seed.x*137.1+seed.y*251.3+uSeed.x*19.3); cellPos=seed; }
    }
  }
  return vec2(sqrt(md), id);
}

// SDF for veins (line segments)
float sdSegment(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h);}

float sdCircle(vec2 p,float r){return length(p)-r;}

void main(){
  vec2 uv=vUv;
  vec2 p=(uv-.5)*2.;
  p.x*=uResolution.x/uResolution.y;

  // Normalize signals
  float temp    =clamp((uAtmosphere.x+20.)/65.,0.,1.);
  float kp      =clamp(uCosmos.x/9.,0.,1.);
  float seismic =clamp(uEarth.x/8.,0.,1.);
  float volat   =clamp(uEconomy.x/100.,0.,1.);
  float conflict=clamp((-uSocial.x+100.)/200.,0.,1.);
  float humidity=clamp(uAtmosphere.z/100.,0.,1.);

  // PULSE RATE (kp drives heartbeat speed)
  float pulseRate=1.5+kp*3.; // 1.5-4.5 Hz

  // VORONOI CELLS (biological cells)
  vec2 vo=voronoi(p*3.5, pulseRate);
  float vd=vo.x, vid=vo.y;

  // CELL PULSE (independent per cell)
  float cellPulse=sin(uTime*pulseRate+vid*6.28)*.5+.5;

  // TISSUE TEXTURE (organic, reaction-diffusion style via FBM)
  vec2 texUV=p*8.+vec2(vid*7.3,vid*4.1)+vec2(uTime*.3,0.);
  float bio=fbm3(texUV)*.5+.5;

  // MEMBRANE THICKNESS VARIATION (volat)
  float membraneThick=.02+volat*.03;

  // TISSUE COLOR (temp gradient: cold = blue/purple, hot = red/pink)
  vec3 coldFlesh=vec3(.3,.2,.5); // bruise purple
  vec3 hotFlesh =vec3(.8,.3,.3); // inflamed red
  vec3 tissueCol=mix(coldFlesh, hotFlesh, temp);

  // BLOOD/INFLAMMATION overlay (conflict)
  vec3 bloodCol=vec3(.7,.05,.05);
  tissueCol=mix(tissueCol, bloodCol, conflict*.6);

  // BILE/SICKNESS tint (if volat high)
  if(volat>.6){
    vec3 bileCol=vec3(.6,.7,.2);
    tissueCol=mix(tissueCol, bileCol, (volat-.6)*2.5);
  }

  // APPLY TEXTURE
  tissueCol*=mix(.5, 1.3, bio);

  // APPLY PULSE (cell contracts/expands)
  tissueCol*=mix(.7, 1.2, cellPulse);

  // MEMBRANE EDGES (cell walls)
  float edge=1.-smoothstep(0., membraneThick, vd);
  vec3 membraneCol=tissueCol*1.8+vec3(.1);

  // COMPOSITE
  vec3 col=mix(tissueCol, membraneCol, edge*.7);

  // VEINS (connecting cells — perlin worm paths)
  float veinDist=100.;
  // Worm 1 (horizontal-ish)
  vec2 worm1Start=vec2(-1., sin(uTime*.5+uSeed.x)*.5);
  vec2 worm1End  =vec2( 1., sin(uTime*.5+uSeed.y+1.2)*.5);
  float worm1=sdSegment(p, worm1Start, worm1End);
  veinDist=min(veinDist, worm1);

  // Worm 2 (vertical-ish)
  vec2 worm2Start=vec2(cos(uTime*.4+uSeed.y)*.5, -1.);
  vec2 worm2End  =vec2(cos(uTime*.4+uSeed.x+2.1)*.5,  1.);
  float worm2=sdSegment(p, worm2Start, worm2End);
  veinDist=min(veinDist, worm2);

  // Vein width (pulsing)
  float veinWidth=.015+cellPulse*.008;
  float vein=1.-smoothstep(0., veinWidth, veinDist);

  vec3 veinCol=mix(vec3(.3,.05,.05), vec3(.8,.1,.1), conflict);
  col=mix(col, veinCol, vein*.6);

  // MONUMENT AS CORE ORGAN (pulsing heart at center)
  vec2 coreP=p;
  coreP.y+=.08;
  float coreDist=length(coreP);
  float coreSize=.35+cellPulse*.05; // breathes
  float core=1.-smoothstep(coreSize-.1, coreSize, coreDist);

  vec3 coreCol=vec3(.9,.2,.2)*mix(.8, 1.4, cellPulse);
  col=mix(col, coreCol, core*.7);

  // CONVULSION (seismic drives UV distortion waves)
  vec2 convulseUV=p+vec2(
    sin(p.y*10.+uTime*2.)*seismic*.05,
    sin(p.x*10.+uTime*2.)*seismic*.05
  );
  // Re-sample texture at distorted UV (subtle effect)
  float convulseTex=fbm3(convulseUV*8.+uTime*.3)*.5+.5;
  col*=mix(1., convulseTex, seismic*.3);

  // GLOSSINESS/WETNESS (humidity → specular highlights)
  float specular=pow(max(dot(normalize(p), normalize(vec2(-.5,.8))),0.), 16.);
  col+=vec3(specular)*humidity*.4;

  // VIGNETTE
  float vig=1.-dot(p*.6,p*.6);
  col*=vig;

  // GAMMA
  col=pow(max(col,0.),vec3(.4545));

  gl_FragColor=vec4(col,1.);
}
`
