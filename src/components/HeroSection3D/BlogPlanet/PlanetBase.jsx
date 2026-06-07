import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import oceanAlbedoUrl from '../../../assets/textures/ocean/ocean_albedo.png';
import oceanFoamUrl from '../../../assets/textures/ocean/ocean_foam_mask.png';
import oceanNoiseUrl from '../../../assets/textures/ocean/ocean_noise.png';
import { CONTINENT_PATCHES } from './planetData';
import { normalFromLatLon } from './sphereUtils';

const MAX_LAND_CENTERS = 8;

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vViewNormal;

  void main() {
    vUv = uv;
    vLocalNormal = normalize(position);
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform sampler2D uAlbedoMap;
  uniform sampler2D uNoiseMap;
  uniform sampler2D uFoamMap;
  uniform float uTime;
  uniform vec3 uLandCenters[${MAX_LAND_CENTERS}];
  uniform float uLandWidths[${MAX_LAND_CENTERS}];

  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vViewNormal;

  vec3 getBlendWeights(vec3 normal) {
    vec3 weights = pow(abs(normal), vec3(4.0));
    return weights / max(weights.x + weights.y + weights.z, 0.0001);
  }

  vec3 sampleTriplanar(sampler2D map, vec3 normal, float scale, vec2 offset) {
    vec3 weights = getBlendWeights(normal);
    vec3 p = normal * scale;
    vec3 xSample = texture2D(map, p.yz + offset).rgb;
    vec3 ySample = texture2D(map, p.xz + offset * vec2(-0.7, 0.9)).rgb;
    vec3 zSample = texture2D(map, p.xy + offset * vec2(0.6, -0.8)).rgb;
    return xSample * weights.x + ySample * weights.y + zSample * weights.z;
  }

  vec3 sampleUv(sampler2D map, vec2 uv, float scale, vec2 offset) {
    return texture2D(map, uv * scale + offset).rgb;
  }

  float sampleTriplanarR(sampler2D map, vec3 normal, float scale, vec2 offset) {
    vec3 weights = getBlendWeights(normal);
    vec3 p = normal * scale;
    float xSample = texture2D(map, p.yz + offset).r;
    float ySample = texture2D(map, p.xz + offset * vec2(-0.7, 0.9)).r;
    float zSample = texture2D(map, p.xy + offset * vec2(0.6, -0.8)).r;
    return xSample * weights.x + ySample * weights.y + zSample * weights.z;
  }

  float sampleUvR(sampler2D map, vec2 uv, float scale, vec2 offset) {
    return texture2D(map, uv * scale + offset).r;
  }

  float getLandMask(vec3 normal, float widthScale, float edgeDot) {
    float mask = 0.0;

    for (int i = 0; i < ${MAX_LAND_CENTERS}; i++) {
      float dotValue = dot(normal, uLandCenters[i]);
      float startDot = 1.0 - uLandWidths[i] * widthScale;
      float localMask = smoothstep(startDot, edgeDot, dotValue);
      mask = max(mask, localMask * step(0.001, uLandWidths[i]));
    }

    return clamp(mask, 0.0, 1.0);
  }

  void main() {
    vec3 normal = normalize(vLocalNormal);
    vec2 flowA = vec2(uTime * 0.026, uTime * 0.010);
    vec2 flowB = vec2(-uTime * 0.052, uTime * 0.032);
    vec2 flowFoam = vec2(uTime * 0.026, -uTime * 0.014);

    float seamSafe = 1.0;
    float seamMask = 1.0 - seamSafe;
    vec3 uvAlbedo = sampleUv(uAlbedoMap, vUv, 3.0, flowA);
    vec3 triAlbedo = sampleTriplanar(uAlbedoMap, normal, 3.0, flowA);
    float uvNoiseA = sampleUvR(uNoiseMap, vUv, 3.0, flowA);
    float uvNoiseB = sampleUvR(uNoiseMap, vUv, 6.0, flowB);
    float triNoiseA = sampleTriplanarR(uNoiseMap, normal, 1.75, flowA * 0.72);
    float triNoiseB = sampleTriplanarR(uNoiseMap, normal, 2.4, flowB * 0.55);
    vec3 albedo = mix(triAlbedo, uvAlbedo, seamSafe);
    float noiseA = mix(uvNoiseA, mix(uvNoiseA, triNoiseA, 0.22), seamMask);
    float noiseB = mix(uvNoiseB, mix(uvNoiseB, triNoiseB, 0.16), seamMask);
    float ripple = smoothstep(0.48, 0.88, noiseA * 0.62 + noiseB * 0.38);
    float shelf = getLandMask(normal, 0.92, 0.972);
    float shallows = getLandMask(normal, 0.58, 0.986);
    float lagoon = getLandMask(normal, 0.34, 0.996);
    float openSea = 1.0 - shelf;

    vec3 deep = vec3(0.043, 0.373, 0.647);
    vec3 mid = vec3(0.086, 0.545, 0.816);
    vec3 shelfColor = mid;
    vec3 shallow = vec3(0.404, 0.835, 0.969);
    vec3 coastColor = vec3(0.722, 0.953, 1.0);

    float latitudeGlow = smoothstep(0.0, 0.82, abs(normal.y)) * 0.08;
    float basinShadow = smoothstep(0.46, 0.88, sampleTriplanarR(uNoiseMap, normal, 1.08, vec2(-uTime * 0.006, uTime * 0.004)));
    vec3 ocean = mix(deep, mid, 0.48 + noiseA * 0.16 + latitudeGlow);
    ocean = mix(ocean, deep * 0.92, basinShadow * openSea * 0.34);
    ocean = mix(ocean, albedo, 0.48);
    ocean = mix(ocean, shelfColor, smoothstep(0.08, 0.72, shelf) * 0.48);
    ocean = mix(ocean, shallow, smoothstep(0.14, 0.86, shallows) * 0.72);
    ocean = mix(ocean, coastColor, smoothstep(0.36, 0.96, lagoon) * 0.42);

    float uvFoam = sampleUvR(uFoamMap, vUv, 3.0, flowFoam);
    float triFoam = sampleTriplanarR(uFoamMap, normal, 2.05, flowFoam * 0.55);
    float foamTexture = mix(uvFoam, mix(uvFoam, triFoam, 0.12), seamMask);
    float foam = smoothstep(0.76, 0.95, foamTexture) * smoothstep(0.28, 0.96, shallows);
    float glint = ripple * (0.058 + shelf * 0.042);
    float fresnel = pow(1.0 - abs(vViewNormal.z), 2.25) * 0.18;

    ocean += vec3(0.70, 0.96, 1.0) * glint * mix(1.0, 0.64, seamMask);
    ocean = mix(ocean, vec3(0.88, 0.98, 1.0), foam * 0.48 * mix(1.0, 0.42, seamMask));
    ocean += vec3(0.42, 0.82, 1.0) * fresnel;

    gl_FragColor = vec4(clamp(ocean, 0.0, 1.0), 1.0);
  }
`;

function createLandUniforms() {
  const centers = [];
  const widths = [];

  CONTINENT_PATCHES.slice(0, MAX_LAND_CENTERS).forEach((continent) => {
    centers.push(normalFromLatLon(continent.lat, continent.lon));
    widths.push(continent.coastWidth);
  });

  while (centers.length < MAX_LAND_CENTERS) {
    centers.push(new THREE.Vector3(0, 0, -1));
    widths.push(0);
  }

  return { centers, widths };
}

function PlanetBase({ radius = 1.72, onHover, onLeave }) {
  const materialRef = useRef();
  const [albedoMap, noiseMap, foamMap] = useLoader(THREE.TextureLoader, [
    oceanAlbedoUrl,
    oceanNoiseUrl,
    oceanFoamUrl,
  ]);
  const { centers, widths } = useMemo(() => createLandUniforms(), []);
  const uniforms = useMemo(() => ({
    uAlbedoMap: { value: albedoMap },
    uNoiseMap: { value: noiseMap },
    uFoamMap: { value: foamMap },
    uTime: { value: 0 },
    uLandCenters: { value: centers },
    uLandWidths: { value: widths },
  }), [albedoMap, centers, foamMap, noiseMap, widths]);

  useEffect(() => {
    [albedoMap, noiseMap, foamMap].forEach((texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.colorSpace = texture === albedoMap ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.anisotropy = 4;
      texture.needsUpdate = true;
    });
  }, [albedoMap, foamMap, noiseMap]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <mesh
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover?.();
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        onHover?.();
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onLeave?.();
      }}
    >
      <sphereGeometry args={[radius, 72, 72]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}

export default PlanetBase;
