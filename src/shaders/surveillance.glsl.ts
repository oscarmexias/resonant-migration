// Vision: Surveillance — CCTV/Terminal aesthetic
// Scanlines, RGB chromatic aberration, monochrome green phosphor, block pixelation

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

// Simplex noise (same as domainWarp)
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

// SDF helpers
float sdBox(vec2 p,vec2 b){vec2 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,d.y),0.);}
float sdCircle(vec2 p,float r){return length(p)-r;}
float opU(float a,float b){return min(a,b);}

// Voronoi
vec2 hash22(vec2 p){
  p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));
  return fract(sin(p)*43758.5453);
}
vec2 voronoi(vec2 p){
  vec2 ip=floor(p), fp=fract(p);
  float md=8.; float id=0.;
  for(int x=-1;x<=1;x++){
    for(int y=-1;y<=1;y++){
      vec2 b=vec2(float(x),float(y));
      vec2 seed=ip+b;
      vec2 o=hash22(seed+uSeed.x*13.7);
      vec2 r=b-fp+o;
      float d=dot(r,r);
      if(d<md){ md=d; id=fract(seed.x*137.1+seed.y*251.3+uSeed.x*19.3); }
    }
  }
  return vec2(sqrt(md), id);
}

// Monument SDF (wireframe mode — only edges)
float landmarkSDFWire(vec2 p, float ltype){
  float d=100.;
  if(ltype<.5){
    float col =abs(sdBox(p-vec2(0.,-.05),vec2(.013,.30)))-.003;
    float base=abs(sdBox(p-vec2(0.,-.37),vec2(.060,.018)))-.003;
    d=opU(col,base);
  }
  else if(ltype<1.5){
    float lc=abs(sdBox(p-vec2(-.14,-.10),vec2(.028,.26)))-.003;
    float rc=abs(sdBox(p-vec2( .14,-.10),vec2(.028,.26)))-.003;
    d=opU(lc,rc);
  }
  else if(ltype<2.5){
    float t0=abs(sdBox(p-vec2(  0., .04),vec2(.022,.33)))-.003;
    float t1=abs(sdBox(p-vec2(-.12,-.04),vec2(.017,.26)))-.003;
    d=opU(t0,t1);
  }
  else if(ltype<3.5){
    float ag=abs(sdBox(p-vec2(0., .23),vec2(.009,.16)))-.003;
    float mi=abs(sdBox(p-vec2(0.,-.02),vec2(.028,.12)))-.003;
    d=opU(ag,mi);
  }
  else if(ltype<4.5){
    float bod=abs(sdBox(p-vec2(0.,-.04),vec2(.058,.30)))-.003;
    d=bod;
  }
  else{
    float drum=abs(sdBox(p-vec2(0.,-.02),vec2(.13,.10)))-.003;
    float dome=abs(sdCircle(p-vec2(0.,.08),.14))-.003;
    d=opU(drum,dome);
  }
  return d;
}

void main(){
  vec2 uv=vUv;

  // Normalize world signals
  float temp    =clamp((uAtmosphere.x+20.)/65.,0.,1.);
  float windSpd =clamp(uAtmosphere.y/80.,0.,1.);
  float kp      =clamp(uCosmos.x/9.,0.,1.);
  float seismic =clamp(uEarth.x/8.,0.,1.);
  float volat   =clamp(uEconomy.x/100.,0.,1.);
  float conflict=clamp((-uSocial.x+100.)/200.,0.,1.);

  // SEISMIC SHAKE (UV distortion)
  vec2 shake=vec2(
    snoise(vec2(uTime*18.+uSeed.x,0.))*seismic*.008,
    snoise(vec2(0.,uTime*22.+uSeed.y))*seismic*.006
  );
  uv+=shake;

  // PIXELATION (block grid driven by volatility)
  float blockSize=mix(180., 40., volat*volat); // high volat = larger blocks
  vec2 blockUV=floor(uv*blockSize)/blockSize;
  vec2 pixUV=mix(uv, blockUV, volat*.7);

  // RGB CHROMATIC ABERRATION (conflict drives offset)
  float offset=conflict*.012+seismic*.006;
  vec2 rUV=pixUV+vec2(-offset,0.);
  vec2 gUV=pixUV;
  vec2 bUV=pixUV+vec2(offset,0.);

  // ASPECT-CORRECTED COORDS
  vec2 p=(pixUV-.5)*2.;
  p.x*=uResolution.x/uResolution.y;

  // BACKGROUND — FBM noise base
  float noise=fbm3(p*2.+vec2(uTime*.3+uSeed.x,uSeed.y))*1.5;
  noise=noise*.5+.5;

  // VORONOI CELLS — "tracked regions"
  vec2 vo=voronoi(p*3.);
  float vd=vo.x, vid=vo.y;

  // Cell intensity varies by signal (6 types)
  float sid=floor(vid*6.);
  float sigVal=0.;
  if(sid<1.) sigVal=temp;
  else if(sid<2.) sigVal=kp;
  else if(sid<3.) sigVal=volat;
  else if(sid<4.) sigVal=seismic;
  else if(sid<5.) sigVal=conflict;
  else sigVal=windSpd;

  // Bounding box edges around cells (wireframe regions)
  float boxEdge=0.;
  vec2 cellCenter=floor(p*3.)/3.+.166;
  float boxD=sdBox(p-cellCenter, vec2(.14));
  boxEdge=1.-smoothstep(.0,.006,abs(boxD));

  // MONOCHROME BASE
  float luma=noise*.3+sigVal*.4+boxEdge*.5;

  // MONUMENT (wireframe only, from per-channel UV)
  float lscale=.72;
  vec2 lpR=(rUV-.5)*2.; lpR.x*=uResolution.x/uResolution.y; lpR/=lscale; lpR.y+=.08;
  vec2 lpG=(gUV-.5)*2.; lpG.x*=uResolution.x/uResolution.y; lpG/=lscale; lpG.y+=.08;
  vec2 lpB=(bUV-.5)*2.; lpB.x*=uResolution.x/uResolution.y; lpB/=lscale; lpB.y+=.08;

  float wireR=landmarkSDFWire(lpR, uLandmarkType);
  float wireG=landmarkSDFWire(lpG, uLandmarkType);
  float wireB=landmarkSDFWire(lpB, uLandmarkType);

  float monR=1.-smoothstep(0.,.005,wireR);
  float monG=1.-smoothstep(0.,.005,wireG);
  float monB=1.-smoothstep(0.,.005,wireB);

  // MONOCHROME CHANNELS (green phosphor tint)
  float r=luma*.2 + monR*.8;
  float g=luma*.9 + monG*1.2;  // green dominant
  float b=luma*.1 + monB*.4;

  // GREEN TINT saturation driven by temp
  float greenSat=.5+temp*.4;
  g=mix(luma, g, greenSat);

  // SCANLINES (horizontal lines, kp drives flicker)
  float scanY=mod(pixUV.y*uResolution.y, 2.);
  float scanIntensity=kp*.4+.6;
  float scan=step(1., scanY)*scanIntensity;
  r*=scan*.8+.2;
  g*=scan*.8+.2;
  b*=scan*.8+.2;

  // GRAIN (thermal camera noise)
  float grain=snoise(pixUV*uResolution*.5+vec2(uTime*.2))*kp*.08;
  r+=grain; g+=grain; b+=grain;

  // FLICKER (high kp = unstable feed)
  float flicker=snoise(vec2(uTime*8.+uSeed.x,0.))*.5+.5;
  float flickerAmt=kp*kp*.15*flicker;
  r*=1.-flickerAmt; g*=1.-flickerAmt; b*=1.-flickerAmt;

  // TIMESTAMP OVERLAY (fake coordinate readout in corner)
  vec2 cornerUV=uv*vec2(50.,30.); // top-left grid
  float tsBox=step(.5,mod(cornerUV.x,1.))*step(.5,mod(cornerUV.y,1.));
  if(uv.x<.15 && uv.y>.85){
    g+=tsBox*.2*step(mod(uTime*.5,1.),.8); // blinking timestamp region
  }

  // VIGNETTE
  float vig=1.-dot((pixUV-.5)*.8,(pixUV-.5)*.8);
  r*=vig; g*=vig; b*=vig;

  // OUTPUT
  vec3 col=vec3(r,g,b);
  col=clamp(col,0.,1.);
  gl_FragColor=vec4(col,1.);
}
`
