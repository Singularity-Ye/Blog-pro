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
  const facingRef = useRef(false);
  const { camera } = useThree();
  const maps = useLoader(THREE.TextureLoader, TEXTURE_URLS);
  const sourceTexture = maps[TEXTURE_BY_BIOME[continent.biome]];
  const texture = useMemo(() => sourceTexture.clone(), [sourceTexture]);
  const biome = BIOMES[continent.biome];
  const activeLift = active ? continent.hoverLift ?? 0.032 : 0;
  const geometry = useMemo(
    () => createCurvedPatchGeometry(continent, continent.radius, activeLift),
    [activeLift, continent]
  );
  const glowGeometry = useMemo(
    () => createCurvedPatchGeometry(continent, continent.radius + 0.04, activeLift + 0.006),
    [activeLift, continent]
  );

  useEffect(() => {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.localToWorld(tempWorldCenter.copy(continent.normal).multiplyScalar(continent.radius));
    tempPlanetCenter.setFromMatrixPosition(mesh.parent.matrixWorld);
    tempWorldCenter.sub(tempPlanetCenter).normalize();
    tempCameraDir.copy(camera.position).sub(tempPlanetCenter).normalize();
    facingRef.current = tempWorldCenter.dot(tempCameraDir) > 0.08;
  });

  const shouldHandlePointer = () => facingRef.current;

  return (
    <group>
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
          map={texture}
          color="#ffffff"
          emissive={active ? biome.glow : '#000000'}
          emissiveIntensity={active ? 0.12 : 0}
          roughness={0.72}
          metalness={0}
          transparent
          alphaTest={0.08}
          depthWrite
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>

      {active && (
        <mesh geometry={glowGeometry}>
          <meshBasicMaterial
            color={biome.glow}
            transparent
            opacity={0.13}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
}

export default ContinentPatch;
