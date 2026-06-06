import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import continentCityUrl from '../../../assets/textures/continents/continent_city.png';
import continentDesertUrl from '../../../assets/textures/continents/continent_desert.png';
import continentForestUrl from '../../../assets/textures/continents/continent_forest.png';
import continentSnowUrl from '../../../assets/textures/continents/continent_snow.png';
import continentAboutUrl from '../../../assets/textures/continents/continent_about.png';
import { BIOMES } from './biomeConfig';
import { normalFromLatLon, normalToQuaternion, getPointOnSphere } from './sphereUtils';

const TEXTURE_URLS = [
  continentForestUrl,
  continentDesertUrl,
  continentSnowUrl,
  continentCityUrl,
  continentAboutUrl,
];

const TEXTURE_BY_BIOME = {
  forest: 0,
  desert: 1,
  snow: 2,
  city: 3,
  about: 4,
};

const BIOME_BASE_COLORS = {
  forest: ['#1e3f20', '#2d251e'],
  desert: ['#5c3a21', '#402410'],
  snow: ['#1f2d3d', '#111a24'],
  city: ['#242528', '#161719'],
  about: ['#311442', '#1c0b26'],
};

const useAlphaOnly = (shader) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <map_fragment>',
    `
    #ifdef USE_MAP
      vec4 texelColor = texture2D( map, vMapUv );
      diffuseColor.a *= texelColor.a;
    #endif
    `
  );
};

const tempWorldCenter = new THREE.Vector3();
const tempCameraDir = new THREE.Vector3();
const tempPlanetCenter = new THREE.Vector3();

function createCurvedPatchGeometry(continent, radius, activeOffset = 0) {
  const segmentsX = 42;
  const segmentsY = 32;
  const center = normalFromLatLon(continent.lat, continent.lon);
  const worldUp = new THREE.Vector3(0, 1, 0);
  let tangentX = new THREE.Vector3().crossVectors(worldUp, center).normalize();

  if (tangentX.lengthSq() < 0.001) {
    tangentX = new THREE.Vector3(1, 0, 0);
  }

  let tangentY = new THREE.Vector3().crossVectors(center, tangentX).normalize();
  const twist = new THREE.Quaternion().setFromAxisAngle(center, continent.patchRotation ?? 0);
  tangentX.applyQuaternion(twist);
  tangentY.applyQuaternion(twist);

  const width = THREE.MathUtils.degToRad(continent.widthAngle);
  const height = THREE.MathUtils.degToRad(continent.heightAngle);
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let y = 0; y <= segmentsY; y++) {
    const v = y / segmentsY;
    const offsetY = (v - 0.5) * height;

    for (let x = 0; x <= segmentsX; x++) {
      const u = x / segmentsX;
      const offsetX = (u - 0.5) * width;
      const normal = center
        .clone()
        .addScaledVector(tangentX, Math.tan(offsetX))
        .addScaledVector(tangentY, Math.tan(offsetY))
        .normalize();
      const point = normal.multiplyScalar(radius + activeOffset);

      positions.push(point.x, point.y, point.z);
      uvs.push(u, 1 - v);
    }
  }

  for (let y = 0; y < segmentsY; y++) {
    for (let x = 0; x < segmentsX; x++) {
      const a = y * (segmentsX + 1) + x;
      const b = a + 1;
      const c = a + segmentsX + 1;
      const d = c + 1;

      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}



const createVortexTexture = (colorHex) => {
  const size = 128; // Higher resolution for crisp details
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, size, size);
  
  const cx = size / 2;
  const cy = size / 2;
  
  const r = parseInt(colorHex.slice(1, 3), 16);
  const g = parseInt(colorHex.slice(3, 5), 16);
  const b = parseInt(colorHex.slice(5, 7), 16);
  
  // 1. Draw soft outer glow
  const outerGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, size / 2);
  outerGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.45)`);
  outerGrad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.15)`);
  outerGrad.addColorStop(1.0, `rgba(${r}, ${g}, ${b}, 0.0)`);
  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // 2. Draw swirling spiral arms
  const numArms = 2; // 2 elegant spiral arms
  const maxRadius = size / 2 - 8;
  ctx.lineWidth = 2.0;
  
  for (let arm = 0; arm < numArms; arm++) {
    const armStartAngle = (arm * Math.PI * 2) / numArms;
    ctx.beginPath();
    
    for (let d = 0; d <= 40; d++) {
      const t = d / 40;
      const radius = t * maxRadius;
      // Spiral formula: theta = startAngle + twist * t
      const theta = armStartAngle + t * Math.PI * 1.6; 
      const x = cx + radius * Math.cos(theta);
      const y = cy + radius * Math.sin(theta);
      
      if (d === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, maxRadius);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.75)`);
    grad.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, 0.2)`);
    grad.addColorStop(1.0, `rgba(${r}, ${g}, ${b}, 0.0)`);
    ctx.strokeStyle = grad;
    ctx.stroke();
  }
  
  // 3. Draw energy sparks along the spirals
  for (let arm = 0; arm < numArms; arm++) {
    const armStartAngle = (arm * Math.PI * 2) / numArms;
    for (let i = 0; i < 5; i++) {
      const t = (i + 1.2) / 6.5;
      const radius = t * maxRadius;
      const theta = armStartAngle + t * Math.PI * 1.6 + 0.05;
      const x = cx + radius * Math.cos(theta);
      const y = cy + radius * Math.sin(theta);
      const pSize = (1.0 - t) * 1.8 + 0.6;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * (1.0 - t)})`;
      ctx.beginPath();
      ctx.arc(x, y, pSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // 4. Central bright core
  const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 5);
  innerGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  innerGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.85)');
  innerGrad.addColorStop(1.0, `rgba(${r}, ${g}, ${b}, 0.0)`);
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

function ContinentPatch({ continent, active, onHover, onLeave, onSelect }) {
  const meshRef = useRef();
  const liftGroupRef = useRef();
  const mainMaterialRef = useRef();
  const shadowMaterialRef = useRef();
  const layerMaterialRefs = useRef([]);
  const liftAmountRef = useRef(0);
  const facingRef = useRef(false);
  const { camera } = useThree();
  const maps = useLoader(THREE.TextureLoader, TEXTURE_URLS);
  const sourceTexture = maps[TEXTURE_BY_BIOME[continent.biome]];
  const texture = useMemo(() => sourceTexture.clone(), [sourceTexture]);
  const biome = BIOMES[continent.biome];
  const activeLift = Math.max(continent.hoverLift ?? 0.032, 0.095);
  const liftScale = 1 + activeLift / continent.radius;
  const geometry = useMemo(
    () => createCurvedPatchGeometry(continent, continent.radius, 0),
    [continent]
  );
  const shadowGeometry = useMemo(
    () => createCurvedPatchGeometry(continent, continent.radius - 0.018, 0),
    [continent]
  );
  const raisedLayerGeometries = useMemo(
    () => [0.012, 0.034, 0.058].map((lift) => (
      createCurvedPatchGeometry(continent, continent.radius, lift)
    )),
    [continent]
  );

  const particleRefs = useRef([]);
  const lightRef = useRef();
  const vortexTexture = useMemo(() => createVortexTexture(biome.color), [biome.color]);
  const islandCenter = useMemo(() => getPointOnSphere(continent.normal, continent.radius), [continent]);
  const islandQuaternion = useMemo(() => normalToQuaternion(continent.normal), [continent]);

  useEffect(() => {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const targetLift = active ? 1 : 0;
    const easing = active ? 1 - Math.exp(-delta * 12) : 1 - Math.exp(-delta * 4.2);
    liftAmountRef.current = THREE.MathUtils.lerp(liftAmountRef.current, targetLift, easing);
    const liftAmount = liftAmountRef.current;

    if (liftGroupRef.current) {
      const scale = THREE.MathUtils.lerp(1, liftScale, liftAmount);
      liftGroupRef.current.scale.setScalar(scale);
    }

    if (mainMaterialRef.current) {
      const targetEmissive = new THREE.Color(biome.color);
      mainMaterialRef.current.emissive.lerpColors(new THREE.Color('#000000'), targetEmissive, liftAmount * 0.22);
      mainMaterialRef.current.emissiveIntensity = liftAmount * 1.2;
    }

    if (shadowMaterialRef.current) {
      shadowMaterialRef.current.opacity = liftAmount * 0.55;
    }

    const t = state.clock.getElapsedTime();
    layerMaterialRefs.current.forEach((material, index) => {
      if (!material) return;
      material.opacity = liftAmount * (0.28 + index * 0.08);
      // Pulsing spiritual energy glow in the rock veins
      material.emissiveIntensity = liftAmount * (0.16 + index * 0.08) * (1.0 + Math.sin(t * 3.5) * 0.28);
    });

    // Orbiting particles (Scheme 4) animation - 8 premium particles
    const orbits = [
      { rx: 0.70, rz: 0.75, speed: 1.2, phase: 0, tiltX: 0.1, tiltZ: 0.15, yOffset: 0.02, size: 0.035 },
      { rx: 0.85, rz: 0.78, speed: -0.9, phase: Math.PI * 0.25, tiltX: -0.15, tiltZ: 0.08, yOffset: 0.08, size: 0.045 },
      { rx: 0.78, rz: 0.84, speed: 0.8, phase: Math.PI * 0.5, tiltX: 0.2, tiltZ: -0.1, yOffset: -0.02, size: 0.025 },
      { rx: 0.72, rz: 0.82, speed: -1.4, phase: Math.PI * 0.75, tiltX: -0.05, tiltZ: -0.2, yOffset: 0.12, size: 0.035 },
      { rx: 0.68, rz: 0.72, speed: 1.5, phase: Math.PI, tiltX: -0.1, tiltZ: 0.1, yOffset: 0.06, size: 0.03 },
      { rx: 0.80, rz: 0.74, speed: 1.1, phase: Math.PI * 1.25, tiltX: 0.15, tiltZ: 0.12, yOffset: 0.18, size: 0.04 },
      { rx: 0.82, rz: 0.80, speed: -0.7, phase: Math.PI * 1.5, tiltX: 0.05, tiltZ: -0.15, yOffset: -0.08, size: 0.02 },
      { rx: 0.65, rz: 0.68, speed: -1.8, phase: Math.PI * 1.75, tiltX: -0.1, tiltZ: -0.1, yOffset: 0.14, size: 0.03 }
    ];

    particleRefs.current.forEach((mesh, i) => {
      if (!mesh) return;

      const baseScale = liftAmount;
      const pulse = i % 2 === 1 ? 1.0 + Math.sin(t * 5 + i) * 0.15 : 1.0;
      const orbit = orbits[i];
      if (!orbit) return;
      // Scale particles up by 1.6x so the internal vortex details are readable
      mesh.scale.setScalar(baseScale * pulse * orbit.size * 1.6);

      if (baseScale > 0.001) {
        const expand = 0.85 + 0.15 * liftAmount;
        const theta = t * orbit.speed + orbit.phase;
        
        const x = orbit.rx * expand * Math.cos(theta);
        const z = orbit.rz * expand * Math.sin(theta);
        const y = orbit.yOffset + Math.sin(theta * 2) * 0.04;
        
        const localPos = new THREE.Vector3(x, y, z);
        localPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), orbit.tiltX);
        localPos.applyAxisAngle(new THREE.Vector3(0, 0, 1), orbit.tiltZ);
        
        mesh.position.copy(localPos);
        
        // Spin the individual sprite textures to animate the swirling vortex
        if (mesh.material) {
          mesh.material.rotation = t * (1.8 + (i % 3) * 0.6) * (i % 2 === 0 ? 1 : -1);
        }
      }
    });

    if (lightRef.current) {
      lightRef.current.intensity = 2.8 * liftAmount;
    }

    mesh.localToWorld(tempWorldCenter.copy(continent.normal).multiplyScalar(continent.radius));
    tempPlanetCenter.setFromMatrixPosition(mesh.parent.matrixWorld);
    tempWorldCenter.sub(tempPlanetCenter).normalize();
    tempCameraDir.copy(camera.position).sub(tempPlanetCenter).normalize();
    facingRef.current = tempWorldCenter.dot(tempCameraDir) > 0.08;
  });

  const shouldHandlePointer = () => facingRef.current;

  return (
    <group>
      <mesh geometry={shadowGeometry} raycast={() => null} renderOrder={8}>
        <meshBasicMaterial
          ref={shadowMaterialRef}
          map={texture}
          color="#062f3a"
          transparent
          opacity={0}
          alphaTest={0.08}
          depthWrite={false}
          depthTest
          side={THREE.DoubleSide}
          onBeforeCompile={useAlphaOnly}
        />
      </mesh>



      {raisedLayerGeometries.map((layerGeometry, index) => {
        const colors = BIOME_BASE_COLORS[continent.biome] || ['#1e293b', '#334155'];
        const layerColor = index < 2 ? colors[0] : colors[1];
        return (
          <mesh key={`raised-layer-${index}`} geometry={layerGeometry} raycast={() => null} renderOrder={9 + index}>
            <meshStandardMaterial
              ref={(material) => {
                layerMaterialRefs.current[index] = material;
              }}
              map={texture}
              color={layerColor}
              emissive={biome.glow}
              emissiveIntensity={0}
              roughness={0.9}
              metalness={0.1}
              transparent
              opacity={0}
              alphaTest={0.08}
              depthWrite={false}
              depthTest
              side={THREE.DoubleSide}
              onBeforeCompile={useAlphaOnly}
            />
          </mesh>
        );
      })}

      <group ref={liftGroupRef}>
        <mesh
          ref={meshRef}
          geometry={geometry}
          onPointerOver={(event) => {
            if (!shouldHandlePointer()) return;
            event.stopPropagation();
            onHover?.(continent);
          }}
          onPointerOut={(event) => {
            if (!shouldHandlePointer()) return;
            event.stopPropagation();
            onLeave?.();
          }}
          onClick={(event) => {
            if (!shouldHandlePointer()) return;
            event.stopPropagation();
            onSelect?.(continent);
          }}
          renderOrder={30}
        >
          <meshStandardMaterial
            ref={mainMaterialRef}
            map={texture}
            color="#ffffff"
            emissive="#000000"
            emissiveIntensity={0}
            roughness={0.72}
            metalness={0}
            transparent
            alphaTest={0.08}
            depthWrite
            depthTest
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Orbiting runic rocks and fireflies (Scheme 4) */}
        <group position={islandCenter} quaternion={islandQuaternion}>
          {/* Dynamic spotlight illuminating the island details on hover */}
          <pointLight
            ref={lightRef}
            position={[0, 0.25, 0]}
            color={biome.glow}
            intensity={0}
            distance={1.6}
            decay={2}
          />

          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            return (
              <sprite
                key={`particle-${i}`}
                ref={(el) => {
                  particleRefs.current[i] = el;
                }}
                scale={[0, 0, 0]}
              >
                <spriteMaterial
                  map={vortexTexture}
                  color="#ffffff"
                  transparent
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </sprite>
            );
          })}
        </group>
      </group>
    </group>
  );
}

export default ContinentPatch;
