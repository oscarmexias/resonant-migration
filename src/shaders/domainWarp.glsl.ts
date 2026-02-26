// El Ojo — Shader v3: 3 capas composited
//
// LAYER 0 (fondo)   → Domain Warp FBM — atmósfera/humor de la ciudad
// LAYER 1 (medio)   → Voronoi orgánico — cada celda = una señal de datos,
//                     textura interna biológica (finge reaction-diffusion)
// LAYER 2 (frente)  → Monumento SDF — 6 arquetipos de landmarks, centrado,
//                     animado con los datos, identidad geográfica de la ciudad

export const vertGLSL = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position,1.0); }
`

export const fragGLSL = /* glsl */ `
precision mediump float;

uniform float uTime;
uniform vec2  uResolution;
uniform vec4  uAtmosphere;   // x=temp, y=windSpd, z=humidity, w=windDir
uniform vec4  uCosmos;       // x=kp,   y=solarWind, z=isDaylight, w=sunElev
uniform vec4  uEarth;        // x=seismicMag, y=dist, z=quakeActivity, w=0
uniform vec4  uEconomy;      // x=volatility, y=trendDir, z=0, w=0
uniform vec2  uSocial;       // x=toneScore(-100..100), y=trendIntensity
uniform vec2  uCity;         // x=lat, y=lng
uniform vec2  uSeed;         // x=seedA, y=seedB  (0..1 cada uno)
uniform float uLandmarkType; // 0-5 arquetipo del monumento

varying vec2 vUv;

// ─── Simplex noise 2D (Ashima, aritmética pura) ───────────────────────────
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

// ─── SDF primitives ───────────────────────────────────────────────────────
float sdBox(vec2 p,vec2 b){vec2 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,d.y),0.);}
float sdCircle(vec2 p,float r){return length(p)-r;}
float sdCap(vec2 p,vec2 a,vec2 b,float r){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-r;}
float opU(float a,float b){return min(a,b);}

// ─── 6 Arquetipos de monumentos ───────────────────────────────────────────
//  0  Columna / Obelisco      (CDMX Ángel, Cairo, DC, Roma, Buenos Aires)
//  1  Arco / Puerta           (Madrid, Berlín, París Arc, India Gate)
//  2  Torres múltiples        (Barcelona Sagrada Família, Moscú, Dubai)
//  3  Torre cónica / Aguja    (París Eiffel, Tokio, CN Tower, Seattle)
//  4  Rascacielos             (NYC, Chicago, HK, Shanghái, Singapore)
//  5  Cúpula                  (Londres, Roma, Estambul, Washington DC)

float landmarkSDF(vec2 p, float ltype){
  float d=100.;

  if(ltype<.5){
    // 0: Columna + alas en lo alto
    float col =sdBox(p-vec2(0.,-.05),vec2(.013,.30));
    float base=sdBox(p-vec2(0.,-.37),vec2(.060,.018));
    float cap =sdBox(p-vec2(0., .26),vec2(.024,.018));
    float wL  =sdCap(p,vec2(-.08,.16),vec2(.0,.24),.008);
    float wR  =sdCap(p,vec2( .08,.16),vec2(.0,.24),.008);
    d=opU(opU(opU(col,base),cap),opU(wL,wR));
  }
  else if(ltype<1.5){
    // 1: Arco / Puerta — dos columnas + dintel + ático
    float lc=sdBox(p-vec2(-.14,-.10),vec2(.028,.26));
    float rc=sdBox(p-vec2( .14,-.10),vec2(.028,.26));
    float lt=sdBox(p-vec2(0.,  .14),vec2(.170,.028));
    float at=sdBox(p-vec2(0.,  .19),vec2(.10, .040));
    // Abertura: círculo cortado en columnas (aproximado)
    float arch=sdCircle(p-vec2(0.,.03),.08);
    float gate=opU(opU(lc,rc),opU(lt,at));
    // cut arch: max(gate, -arch+eps) sólo donde las columnas existen
    float colOnly=opU(lc,rc);
    float cut=max(colOnly, -(arch-.008));
    d=opU(cut, opU(lt,at));
  }
  else if(ltype<2.5){
    // 2: Tres torres / chapiteles
    float t0=sdBox(p-vec2(  0., .04),vec2(.022,.33));
    float t1=sdBox(p-vec2(-.12,-.04),vec2(.017,.26));
    float t2=sdBox(p-vec2( .12,-.04),vec2(.017,.26));
    float t3=sdBox(p-vec2(-.22,-.12),vec2(.012,.18));
    float t4=sdBox(p-vec2( .22,-.12),vec2(.012,.18));
    float bs=sdBox(p-vec2(0., -.37),vec2(.26,.020));
    d=opU(opU(opU(t0,t1),opU(t2,t3)),opU(t4,bs));
  }
  else if(ltype<3.5){
    // 3: Torre cónica / Eiffel — base ancha, aguja fina
    float ag=sdBox(p-vec2(0., .23),vec2(.009,.16));
    float mi=sdBox(p-vec2(0.,-.02),vec2(.028,.12));
    float b1=sdCap(p,vec2(-.20,-.38),vec2(-.02,-.06),.011);
    float b2=sdCap(p,vec2( .20,-.38),vec2( .02,-.06),.011);
    float b3=sdCap(p,vec2(-.11,-.20),vec2( .11,-.20),.008);
    float bs=sdBox(p-vec2(0., -.38),vec2(.23,.015));
    d=opU(opU(opU(ag,mi),opU(b1,b2)),opU(b3,bs));
  }
  else if(ltype<4.5){
    // 4: Rascacielos — cuerpo + remate + aguja
    float bod=sdBox(p-vec2(0.,-.04),vec2(.058,.30));
    float top=sdBox(p-vec2(0., .22),vec2(.032,.10));
    float nd =sdBox(p-vec2(0., .34),vec2(.010,.06));
    float bs =sdBox(p-vec2(0.,-.37),vec2(.12,.020));
    d=opU(opU(bod,top),opU(nd,bs));
  }
  else{
    // 5: Cúpula — tambor + cúpula + linterna + columnata
    float drum=sdBox(p-vec2(0.,-.02),vec2(.13,.10));
    // cúpula: semicírculo
    float dome=sdCircle(p-vec2(0.,.08),.14);
    dome=max(dome,-(p.y-.08)); // solo mitad superior
    float lan =sdBox(p-vec2(0., .22),vec2(.022,.07));
    float c1  =sdBox(p-vec2(-.21,-.20),vec2(.026,.18));
    float c2  =sdBox(p-vec2( .21,-.20),vec2(.026,.18));
    float bs  =sdBox(p-vec2(0., -.38),vec2(.27,.020));
    d=opU(opU(opU(dome,drum),opU(lan,c1)),opU(c2,bs));
  }
  return d;
}

// ─── Voronoi (distancia + ID de celda) ───────────────────────────────────
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
      o+=.09*sin(t*.22+o*6.28+uSeed.y*5.1); // deriva lenta
      vec2 r=b-fp+o;
      float d=dot(r,r);
      if(d<md){ md=d; id=fract(seed.x*137.1+seed.y*251.3+uSeed.x*19.3); }
    }
  }
  return vec2(sqrt(md), id);
}

// ─── Main ─────────────────────────────────────────────────────────────────
void main(){
  vec2 uv=vUv;
  vec2 p=(uv-.5)*2.;
  p.x*=uResolution.x/uResolution.y;

  // Señales normalizadas
  float temp    =clamp((uAtmosphere.x+20.)/65.,0.,1.);
  float windSpd =clamp(uAtmosphere.y/80.,0.,1.);
  float windDir =uAtmosphere.w*3.14159/180.;
  float humidity=clamp(uAtmosphere.z/100.,0.,1.);
  float kp      =clamp(uCosmos.x/9.,0.,1.);
  float isDaylit=uCosmos.z;
  float sunElev =uCosmos.w;
  float seismic =clamp(uEarth.x/8.,0.,1.);
  float quakeAct=clamp(uEarth.z/20.,0.,1.);
  float volat   =clamp(uEconomy.x/100.,0.,1.);
  float conflict=clamp((-uSocial.x+100.)/200.,0.,1.);

  float lat=uCity.x, lng=uCity.y;
  float absN=abs(lat)/90.; // 0=ecuador,1=polo
  float hemi=lat>=0.?1.:-1.;
  float sA=uSeed.x, sB=uSeed.y;

  // Bioma por latitud
  float iT=smoothstep(.32,.18,absN);           // tropical
  float iD=smoothstep(.18,.32,absN)*smoothstep(.50,.36,absN); // desértico
  float iP=smoothstep(.36,.50,absN)*smoothstep(.72,.58,absN); // templado
  float iA=smoothstep(.58,.72,absN);            // ártico

  vec3 bA=vec3(.02,.28,.08)*iT+vec3(.30,.12,.01)*iD
         +vec3(.03,.08,.30)*iP+vec3(.01,.04,.28)*iA;
  vec3 bB=vec3(.55,.38,.00)*iT+vec3(.62,.22,.02)*iD
         +vec3(.08,.22,.12)*iP+vec3(.00,.22,.32)*iA;

  // Velocidad temporal por bioma + hora del día
  float dayF=isDaylit*clamp(sunElev*.6+.55,0.,1.);
  float spd=mix(1.,.35,absN)*mix(.55,1.,dayF);
  float sl=uTime*.005*spd, md=uTime*.028*spd, ft=uTime*.17*spd;

  // ===================================================================
  // LAYER 0 — FBM Domain Warp (fondo atmosférico)
  // ===================================================================
  vec2 co=vec2(sA*4.2,sB*3.7); // offset único de ciudad
  vec2 wv=vec2(cos(windDir),sin(windDir))*windSpd*.15;
  float ws=mix(.3,1.5,max(kp,volat))+conflict*.4;

  vec2 q=vec2(fbm5(p+co+vec2(sl,md)+wv),
              fbm5(p+co+vec2(md*hemi*.8,-sl)));
  vec2 r=vec2(fbm5(p+q+co*.5+vec2(1.7+ft*.10,9.2+sA*5.)),
              fbm5(p+q+co*.5+vec2(8.3+ft*.08,2.8+sB*4.)));
  float bg1=fbm5(p+ws*r+wv+co*.3);
  float bg2=fbm3(p*1.6+r*.8+sl*.5);

  vec3 bgCol=mix(bA,bB,temp);
  bgCol+=mix(bA,bB,temp+bg1*.5)*.5;
  bgCol+=vec3(bg2*.10*kp,bg2*.05,bg2*.13*(1.-temp));
  // Noche dramática
  bgCol=mix(bgCol*.25+vec3(0.,0.,.06),bgCol,dayF);
  bgCol=mix(bgCol,bgCol*vec3(1.4,.7,.6),conflict*.45);
  bgCol*=mix(.72,1.22,humidity);

  // Aurora
  float aurStr=absN*absN;
  float aurZ=smoothstep(.5,1.,uv.y);
  float aurW=fbm3(vec2(p.x*3.+sl*2.+sA,md));
  float aurH=snoise(vec2(p.x*2.+sl+sB,kp*4.))*.5+.5;
  vec3 aurN=mix(vec3(0.,.80,.35),vec3(.35,0.,.80),aurH);
  vec3 aurS=mix(vec3(0.,.70,.80),vec3(.80,0.,.55),aurH);
  bgCol+=mix(aurS,aurN,step(0.,hemi))*aurZ*kp*aurStr*.8*(aurW*.5+.5);

  // ===================================================================
  // LAYER 1 — Voronoi Orgánico (señales de datos por celda)
  // ===================================================================
  // Escala de celdas: trópico=pocas grandes, ártico=más pequeñas
  float vsc=mix(2.4,4.2,absN);
  vec2 vo=voronoi(p*vsc, uTime);
  float vd=vo.x, vid=vo.y; // distancia a borde, ID de celda 0..1

  // 6 señales → 6 tipos de celda
  float sid=floor(vid*6.);
  vec3  sigCol;
  float sigVal;

  if(sid<1.){          // Temperatura
    sigVal=temp;
    sigCol=mix(vec3(.05,.18,.60),vec3(.80,.22,.02),temp);
  } else if(sid<2.){   // Kp / Actividad solar
    sigVal=kp;
    sigCol=mix(vec3(.02,.04,.15),vec3(.10,.85,1.),kp*kp);
  } else if(sid<3.){   // Volatilidad económica
    sigVal=volat;
    sigCol=mix(vec3(.04,.14,.04),vec3(.85,.62,.00),volat);
  } else if(sid<4.){   // Sismos
    sigVal=max(seismic,quakeAct*.5);
    sigCol=mix(vec3(.05,.02,.02),vec3(1.,.28,.00),seismic*1.4);
  } else if(sid<5.){   // Conflicto global
    sigVal=conflict;
    sigCol=mix(vec3(.06,.18,.06),vec3(.75,.05,.05),conflict);
  } else {             // Humedad / atmósfera
    sigVal=humidity;
    sigCol=mix(vec3(.22,.12,.03),vec3(.03,.35,.40),humidity);
  }

  // Textura biológica interna (imita reaction-diffusion sin simulación)
  vec2 btp=p*11.+vec2(vid*7.3,vid*4.1)+vec2(sl*.6,0.);
  float bio=fbm3(btp)*.5+.5;
  // Latido de celda — cada señal pulsa a su ritmo
  float pulse=sin(uTime*(.4+sigVal*1.3)+vid*6.28)*.5+.5;

  vec3 cellCol=sigCol*mix(.45,1.35,bio);
  cellCol*=mix(.65,1.25,pulse*max(sigVal,.15));

  // Borde de celda — brillo como pared de célula viva
  float ew=.028+volat*.018+conflict*.012;
  float edge=1.-smoothstep(0.,ew,vd);
  vec3  edgeCol=sigCol*2.2+vec3(.08);

  // Compositar voronoi sobre fondo
  float cellOp=mix(.28,.58,sigVal)*mix(.75,1.,dayF);
  vec3 col=mix(bgCol, cellCol, cellOp);
  col=mix(col, edgeCol, edge*.55);

  // ===================================================================
  // LAYER 2 — Monumento SDF
  // ===================================================================
  // El monumento "respira" con la actividad global
  float breathe=kp*.7+seismic*.5+volat*.3;
  float lscale=.72; // escala del monumento en canvas
  vec2  lp=p/lscale;
  lp.y+=.08; // centrado ligeramente arriba del centro
  // Pulso de tamaño leve
  lp/=(1.+breathe*.012);

  float lSDF=landmarkSDF(lp, uLandmarkType);

  // Relleno de forma (interior)
  float lFill=1.-smoothstep(-.01,.015,lSDF);
  // Aura exterior (glow suave)
  float lAura=exp(-max(lSDF,0.)*28.)*mix(.6,1.,breathe);
  // Halo ancho (presencia)
  float lHalo=exp(-max(lSDF,0.)*7.)*.20;

  // Color del monumento: cálido/dorado de día, frío/cian de noche + tormenta
  vec3 lDayCol =vec3(.92,.86,.58);  // dorado cálido
  vec3 lNightCol=vec3(.50,.72,1.00); // azul-blanco frío
  vec3 lCol=mix(lDayCol, lNightCol, kp*.55+(1.-isDaylit)*.55);
  // Conflicto → monumento se tensa hacia rojo-naranja
  lCol=mix(lCol, vec3(1.,.36,.05), conflict*.42);
  // Volatilidad → flickering en los bordes
  float flick=(volat>.45)?snoise(p*14.+vec2(ft*3.,0.))*volat*.25:0.;

  col+=lCol*(lFill*.90+lAura*.60+lHalo+flick*lFill);

  // ===================================================================
  // Anillos sísmicos desde el monumento
  // ===================================================================
  if(seismic>.04){
    float rw=.007+seismic*.013;
    float rA=mod(uTime*(.42+seismic*.38),1.4);
    float gA=exp(-abs(abs(length(p)-rA)-rw)*85.)*(1.-rA/1.4)*seismic*.9;
    col+=vec3(gA*1.4,gA*.22,0.);
    float rB=mod(uTime*(.42+seismic*.38)+.55,1.4);
    float gB=exp(-abs(abs(length(p)-rB)-rw*.7)*85.)*(1.-rB/1.4)*seismic*.5;
    col+=vec3(gB*.9,gB*.11,0.);
  }

  // ===================================================================
  // Post-processing
  // ===================================================================
  // Viñeta
  col*=1.-dot(p*.40,p*.40);
  // Reinhard + gamma
  col=col/(col+vec3(1.));
  col=pow(max(col,0.),vec3(.4545));

  gl_FragColor=vec4(col,1.);
}
`
