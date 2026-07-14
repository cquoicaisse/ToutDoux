// ═══════════════════════════════════════════════════════════
//  Cœur métal liquide — React Three Fiber
//  Sphère déformée par bruit simplex + reflets métalliques.
//  Son agitation reflète les tâches restantes ; il s'apaise
//  quand la journée se vide. Inspiré des techniques de
//  collidingScopes/liquid-logo (MIT).
// ═══════════════════════════════════════════════════════════
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { T } from "../theme.js";

const NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const VERT = NOISE_GLSL + /* glsl */ `
uniform float uTime;
uniform float uActivity;
varying vec3 vNormal;
varying vec3 vPos;
varying float vNoise;
void main(){
  float n = snoise(position * 1.6 + vec3(uTime * 0.35));
  vNoise = n;
  float amp = 0.10 + uActivity * 0.16;
  vec3 displaced = position + normal * n * amp;
  vNormal = normalize(normalMatrix * normal);
  vPos = (modelViewMatrix * vec4(displaced, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}`;

const FRAG = /* glsl */ `
uniform float uTime;
varying vec3 vNormal;
varying vec3 vPos;
varying float vNoise;
void main(){
  vec3 viewDir = normalize(-vPos);
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.2);
  float bands = sin(vPos.y * 9.0 + vNoise * 5.0 + uTime * 1.4) * 0.5 + 0.5;
  vec3 deep   = vec3(0.02, 0.05, 0.10);
  vec3 cyan   = vec3(0.22, 0.74, 0.97);
  vec3 violet = vec3(0.55, 0.49, 0.96);
  vec3 metal  = mix(deep, mix(cyan, violet, bands), 0.35 + bands * 0.35);
  vec3 color  = metal + fresnel * cyan * 1.1;
  color += pow(bands, 8.0) * 0.6;
  gl_FragColor = vec4(color, 0.92);
}`;

function CoreMesh({ activityRef }) {
  const mesh = useRef();
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uActivity: { value: activityRef.current } }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    uniforms.uTime.value = t;
    // lissage doux vers le niveau d'activité courant
    uniforms.uActivity.value += (activityRef.current - uniforms.uActivity.value) * 0.04;
    if (mesh.current) {
      mesh.current.rotation.y = t * 0.25;
      mesh.current.rotation.x = Math.sin(t * 0.18) * 0.25;
    }
  });

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[1, 96, 96]} />
      <shaderMaterial vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} transparent />
    </mesh>
  );
}

export default function LiquidCore({ activity }) {
  const activityRef = useRef(activity);
  activityRef.current = activity;

  const reduced =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      aria-hidden="true"
      style={{
        width: 150,
        height: 150,
        margin: "0 auto",
        filter: `drop-shadow(0 0 28px ${T.cyanGlow})`,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.4], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
        frameloop={reduced ? "demand" : "always"}
        dpr={[1, 2]}
      >
        <CoreMesh activityRef={activityRef} />
      </Canvas>
    </div>
  );
}
