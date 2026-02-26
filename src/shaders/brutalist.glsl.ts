// Vision: Brutalist — One violent gesture, minimal, harsh, no smoothing
// Single bold SDF shape with hard edges and stark lighting

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
// Interaction uniforms (Brutalist protagonist: click position)
uniform vec2 uClickPos; // 0-1 normalized click position

varying vec2 vUv;

// SDF primitives (NO smoothing)
float sdBox(vec2 p,vec2 b){vec2 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,d.y),0.);}
float sdCircle(vec2 p,float r){return length(p)-r;}
float sdSegment(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h);}
float sdEquilateralTriangle(vec2 p){const float k=sqrt(3.);p.x=abs(p.x)-1.;p.y=p.y+1./k;if(p.x+k*p.y>0.)p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.;p.x-=clamp(p.x,-2.,0.);return -length(p)*sign(p.y);}

float opU(float a,float b){return min(a,b);}

// Hash for random per signal
float hash(float n){return fract(sin(n)*43758.5453);}

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

  // DETERMINE DOMINANT SIGNAL (highest value)
  float maxSig=max(max(max(max(max(temp,kp),seismic),volat),conflict),humidity);
  int shapeType=0;
  if(maxSig==temp) shapeType=0;       // Vertical blade
  else if(maxSig==kp) shapeType=1;    // Expanding ring
  else if(maxSig==volat) shapeType=2; // Jagged zigzag
  else if(maxSig==seismic) shapeType=3; // Cracked block
  else if(maxSig==conflict) shapeType=4; // Spike array
  else shapeType=5;                    // Horizontal bar

  // SHAPE SCALE (signal value → size)
  float scale=mix(.3, 1.5, maxSig);

  // ROTATION (stress-driven, snapped to 90° increments)
  float stress=(kp+volat+conflict)/3.;
  float rotAngle=floor(stress*4.)*1.5708; // 0, 90, 180, 270 degrees in radians
  float ca=cos(rotAngle), sa=sin(rotAngle);
  vec2 pRot=vec2(ca*p.x-sa*p.y, sa*p.x+ca*p.y);

  // POSITION OFFSET (CLICK POSITION determines shape placement)
  // Convert click from 0-1 to -1 to 1 screen space
  vec2 clickWorld=(uClickPos-.5)*2.;
  clickWorld.x*=uResolution.x/uResolution.y;
  // If no click yet (0,0), use time-based offset as fallback
  bool hasClick=length(uClickPos)>.01;
  vec2 offset=hasClick ? -clickWorld : vec2(
    sin(uTime*.4+uSeed.x),
    cos(uTime*.3+uSeed.y)
  )*.3*maxSig;
  vec2 pFinal=pRot/scale+offset;

  // SHAPE SDF
  float d=100.;

  if(shapeType==0){
    // Vertical blade (temp)
    d=sdBox(pFinal, vec2(.08, .8));
  }
  else if(shapeType==1){
    // Expanding ring (kp)
    float ringRadius=.5+maxSig*.5;
    float ringWidth=.06;
    d=abs(sdCircle(pFinal, ringRadius))-ringWidth;
  }
  else if(shapeType==2){
    // Jagged zigzag (volat)
    float seg1=sdSegment(pFinal, vec2(-.6,-.4), vec2(-.2,.4));
    float seg2=sdSegment(pFinal, vec2(-.2,.4), vec2(.2,-.4));
    float seg3=sdSegment(pFinal, vec2(.2,-.4), vec2(.6,.4));
    d=min(min(seg1,seg2),seg3)-.04;
  }
  else if(shapeType==3){
    // Cracked block (seismic)
    float block=sdBox(pFinal, vec2(.5,.5));
    float crack1=sdSegment(pFinal, vec2(-.5,-.2), vec2(.5,.2))-.01;
    float crack2=sdSegment(pFinal, vec2(-.3,-.5), vec2(.3,.5))-.01;
    d=min(min(block,crack1),crack2);
  }
  else if(shapeType==4){
    // Spike array (conflict)
    float spike1=sdEquilateralTriangle((pFinal-vec2(-.4,0.))*.5);
    float spike2=sdEquilateralTriangle((pFinal-vec2(0.,0.))*.5);
    float spike3=sdEquilateralTriangle((pFinal-vec2(.4,0.))*.5);
    d=min(min(spike1,spike2),spike3);
  }
  else{
    // Horizontal bar (humidity)
    d=sdBox(pFinal, vec2(.8, .08));
  }

  // HARD FILL (step, NO smoothstep)
  float fill=step(d, 0.);

  // HARSH LIGHTING (single directional light, hard shadows)
  vec2 lightDir=normalize(vec2(.6,.8));
  float lightDot=dot(normalize(vec2(sign(d)*1., 0.)), lightDir);
  float lit=step(.0, lightDot);

  // BASE COLOR (pure white shape on void background)
  vec3 shapeCol=vec3(1.);
  shapeCol*=mix(.3, 1., lit); // hard shadow

  // SIGNAL COLOR TINT (harsh, unsaturated)
  vec3 sigTint;
  if(shapeType==0) sigTint=mix(vec3(.3,.5,1.), vec3(1.,.4,.1), temp);
  else if(shapeType==1) sigTint=vec3(.2,.6,1.)*kp+vec3(.8);
  else if(shapeType==2) sigTint=vec3(1.,.9,.0)*volat+vec3(.2);
  else if(shapeType==3) sigTint=vec3(1.,.3,.0)*seismic+vec3(.3);
  else if(shapeType==4) sigTint=vec3(1.,.1,.0)*conflict+vec3(.4);
  else sigTint=vec3(.2,.8,.9)*humidity+vec3(.4);

  shapeCol*=sigTint;

  // BACKGROUND (pure black void)
  vec3 bgCol=vec3(0.);

  // COMPOSITE (hard edge, NO anti-aliasing)
  vec3 col=mix(bgCol, shapeCol, fill);

  gl_FragColor=vec4(col,1.);
}
`
