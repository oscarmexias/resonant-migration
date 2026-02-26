// Vision: Volumetric — Raymarched 3D point cloud
// Data as floating particles in depth with fog

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
// Interaction uniforms (Volumetric protagonist: gyroscope)
uniform float uGyroAlpha; // 0-360
uniform float uGyroBeta;  // -180 to 180
uniform float uGyroGamma; // -90 to 90

varying vec2 vUv;

// Simplex noise 3D
vec4 _mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 _perm(vec4 x){return _mod289(((x*34.)+1.)*x);}
vec4 _taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);
  const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=_mod289(i);
  vec4 p=_perm(_perm(_perm(i.z+vec4(0.,i1.z,i2.z,1.))
                          +i.y+vec4(0.,i1.y,i2.y,1.))
                          +i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;
  vec4 s1=floor(b1)*2.+1.;
  vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=_taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
  m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

// Hash for point positions
float hash13(vec3 p){
  p=fract(p*vec3(443.537,537.247,631.421));
  p+=dot(p,p.yzx+19.19);
  return fract((p.x+p.y)*p.z);
}

void main(){
  vec2 uv=vUv;
  vec2 p=(uv-.5)*2.;
  p.x*=uResolution.x/uResolution.y;

  // Normalize signals
  float temp    =clamp((uAtmosphere.x+20.)/65.,0.,1.);
  float windDir =uAtmosphere.w*3.14159/180.;
  float kp      =clamp(uCosmos.x/9.,0.,1.);
  float isDaylit=uCosmos.z;
  float seismic =clamp(uEarth.x/8.,0.,1.);
  float volat   =clamp(uEconomy.x/100.,0.,1.);
  float conflict=clamp((-uSocial.x+100.)/200.,0.,1.);
  float humidity=clamp(uAtmosphere.z/100.,0.,1.);

  // CAMERA ROTATION (based on time + wind direction + GYROSCOPE CONTROL)
  // Convert gyro angles to radians and use them to control camera
  float gyroAlphaRad=uGyroAlpha*3.14159/180.;
  float gyroBetaRad=uGyroBeta*3.14159/180.;
  float gyroGammaRad=uGyroGamma*3.14159/180.;

  // Base rotation + gyro alpha controls horizontal rotation
  float camAngle=uTime*.12+windDir+gyroAlphaRad*.5;
  float camDist=2.5;
  // Gyro beta controls vertical position (tilt up/down)
  float camHeight=1.+gyroBetaRad*.3;
  vec3 ro=vec3(cos(camAngle)*camDist, camHeight, sin(camAngle)*camDist);
  vec3 lookAt=vec3(0.,0.,0.);
  vec3 fwd=normalize(lookAt-ro);
  vec3 right=normalize(cross(vec3(0.,1.,0.),fwd));
  vec3 up=cross(fwd,right);
  // Gyro gamma adds roll/twist to the view direction
  vec3 rd=normalize(fwd+p.x*right+p.y*up);
  // Apply gamma roll rotation to rd
  float cosG=cos(gyroGammaRad*.2);
  float sinG=sin(gyroGammaRad*.2);
  vec3 rdRolled=vec3(rd.x*cosG-rd.y*sinG, rd.x*sinG+rd.y*cosG, rd.z);
  rd=rdRolled;

  // RAYMARCH SETTINGS
  int maxSteps=48; // balanced for performance
  float maxDist=5.;
  float t=0.;

  vec3 col=vec3(0.);

  // RAYMARCH LOOP
  for(int i=0;i<48;i++){
    if(t>maxDist) break;

    vec3 pos=ro+rd*t;

    // POINT DENSITY via 3D noise
    float density=0.;

    // Layer 1: General scatter (volat drives chaos) - INCREASED
    float scatter=snoise(pos*2.+vec3(uSeed.x*5.,uSeed.y*3.,uTime*.2));
    density+=max(0., scatter)*1.5*max(volat, .3);

    // Layer 2: Upper volume (kp drives density) - INCREASED
    if(pos.y>.2){
      density+=kp*1.2*smoothstep(.2,1.8,pos.y);
    }

    // Layer 3: Monument dense cluster at center - INCREASED + LARGER
    float distToCenter=length(pos);
    if(distToCenter<1.2){
      density+=2.0*smoothstep(1.2,.0,distToCenter);
    }

    // Layer 4: Seismic vertical displacement - INCREASED
    float vertWave=snoise(vec3(pos.x*4., pos.z*4., uTime*.3+uSeed.y))*seismic;
    density+=max(0., vertWave)*1.2;

    // Base ambient density so we always see something
    density+=.15;

    // POINT COLOR
    vec3 pointCol;
    if(distToCenter<1.2){
      // Monument core: golden bright
      pointCol=vec3(1.,.86,.48);
    } else {
      // Data signals: temp gradient
      pointCol=mix(vec3(.15,.48,1.), vec3(1.,.62,.22), temp);
      // Conflict tint
      pointCol=mix(pointCol, vec3(1.,.25,.15), conflict*.5);
    }

    // ACCUMULATE COLOR - more visible
    float alpha=density*.25;
    col+=pointCol*alpha;

    // STEP FORWARD
    t+=.06; // smaller steps for more detail
  }

  // FOG (humidity drives density)
  float fogDensity=.3+humidity*.5;
  float fogFactor=exp(-t*fogDensity);
  vec3 fogCol=mix(vec3(.01,.02,.08), vec3(.08,.06,.02), temp);
  col=mix(fogCol, col, fogFactor);

  // BACKGROUND GRADIENT (subtle)
  float bgGrad=smoothstep(-.5,1., p.y);
  vec3 bgCol=mix(vec3(.00,.01,.05), vec3(.02,.04,.10), bgGrad);
  col+=bgCol*.3;

  // VIGNETTE
  float vig=1.-dot(p*.5,p*.5);
  col*=vig;

  // GAMMA
  col=pow(max(col,0.),vec3(.4545));

  gl_FragColor=vec4(col,1.);
}
`
