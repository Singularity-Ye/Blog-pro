import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import continentCityUrl from '../../../assets/textures/continents/continent_city.png';
import continentDesertUrl from '../../../assets/textures/continents/continent_desert.png';
import continentGreenUrl from '../../../assets/textures/continents/continent_green.png';
import continentSnowUrl from '../../../assets/textures/continents/continent_snow.png';
import { BIOMES } from './biomeConfig';
import { normalFromLatLon } from './sphereUtils';

const TEXTURE_URLS = [
  continentGreenUrl,
  continentDesertUrl,
  continentSnowUrl,
  continentCityUrl,
];

const TEXTURE_BY_BIOME = {
  forest: 0,
  desert: 1,
  snow: 2,
  city: 3,
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

function ContinentPatch({ continent, active, onHover, onLeave, onSelect }) {
  const meshRef = useRef();
  const liftGroupRef = useRef();
  const mainMaterialRef = useRef();
  const shadowMaterialRef = useRef();
  const glowMaterialRef = useRef();
  const layerMaterialRefs = useRef([]);
  const liftAmountRef = useRef(0);
  const facingRef = useRef(false);
  const { camera } = useThree();
  const maps = useLoader(THREE.TextureLoader, TEXTURE_URLS);
  const sourceTexture = maps[TEXTURE_BY_BIOME[continent.biome]];
  const texture = useMemo(() => sourceTexture.clone(), [sourceTexture]);
  const biome = BIOMES[continent.biome];
  const activeLift = Math.max(continent.hoverLift ?? 0.032, 0.105);
  const liftScale = 1 + activeLift / continent.radius;
  const geometry = useMemo(
    () => createCurvedPatchGeometry(continent, continent.radius, 0),
    [continent]
  );
  const shadowGeometry = useMemo(
    () => createCurvedPatchGeometry(continent, continent.radius + 0.006, 0),
    [continent]
  );
  const raisedLayerGeometries = useMemo(
    () => [0.018, 0.038, 0.06, 0.082].map((lift) => (
      createCurvedPatchGeometry(continent, continent.radius, lift)
    )),
    [continent]
  );
  const glowGeometry = useMemo(
    () => createCurvedPatchGeometry(continent, continent.radius + 0.052, 0.014),
    [continent]
  );

  useEffect(() => {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame((_, delta) => {
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
      mainMaterialRef.current.emissiveIntensity = liftAmount * 0.12;
    }

    if (shadowMaterialRef.current) {
      shadowMaterialRef.current.opacity = liftAmount * 0.34;
    }

    layerMaterialRefs.current.forEach((material, index) => {
      if (!material) return;
      material.opacity = liftAmount * (0.18 + index * 0.075);
      material.emissiveIntensity = liftAmount * (0.04 + index * 0.018);
    });

    if (glowMaterialRef.current) {
      glowMaterialRef.current.opacity = liftAmount * 0.2;
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
      <mesh geometry={shadowGeometry} raycast={() => null}>
        <meshBasicMaterial
          ref={shadowMaterialRef}
          map={texture}
          color="#062f3a"
          transparent
          opacity={0}
          alphaTest={0.08}
          depthWrite={false}
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-5}
          polygonOffsetUnits={-5}
        />
      </mesh>

      {raisedLayerGeometries.map((layerGeometry, index) => (
        <mesh key={`raised-layer-${index}`} geometry={layerGeometry} raycast={() => null}>
          <meshStandardMaterial
            ref={(material) => {
              layerMaterialRefs.current[index] = material;
            }}
            map={texture}
            color={index < 2 ? '#1b6b63' : '#4d986b'}
            emissive={biome.glow}
            emissiveIntensity={0}
            roughness={0.9}
            metalness={0}
            transparent
            opacity={0}
            alphaTest={0.08}
            depthWrite={false}
            side={THREE.DoubleSide}
            polygonOffset
            polygonOffsetFactor={2 + index}
            polygonOffsetUnits={2 + index}
          />
        </mesh>
      ))}

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
        >
          <meshStandardMaterial
            ref={mainMaterialRef}
            map={texture}
            color="#ffffff"
            emissive={biome.glow}
            emissiveIntensity={0}
            roughness={0.72}
            metalness={0}
            transparent
            alphaTest={0.08}
            depthWrite
            side={THREE.DoubleSide}
            polygonOffset
            polygonOffsetFactor={-8}
            polygonOffsetUnits={-8}
          />
        </mesh>

        <mesh geometry={glowGeometry} raycast={() => null}>
          <meshBasicMaterial
            ref={glowMaterialRef}
            map={texture}
            color={biome.glow}
            transparent
            opacity={0}
            alphaTest={0.08}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  );
}

export default ContinentPatch;
