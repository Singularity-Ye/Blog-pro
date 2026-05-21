import { useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import snowUrl from '../../../assets/textures/biomes/snow_albedo.png';

function SnowMaterial() {
  const map = useLoader(THREE.TextureLoader, snowUrl);

  useEffect(() => {
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    map.repeat.set(1.25, 1.25);
    map.needsUpdate = true;
  }, [map]);

  return (
    <meshStandardMaterial
      color="#ffffff"
      map={map}
      roughness={0.58}
      metalness={0}
      flatShading
    />
  );
}

function Peak({ position, scale, color }) {
  return (
    <mesh position={position} scale={scale}>
      <coneGeometry args={[0.15, 0.34, 5]} />
      <meshStandardMaterial color={color} roughness={0.84} metalness={0} flatShading />
    </mesh>
  );
}

function SnowCap({ position, scale }) {
  return (
    <mesh position={position} scale={scale}>
      <coneGeometry args={[0.08, 0.15, 5]} />
      <SnowMaterial />
    </mesh>
  );
}

function VoxelMountain({ scale = 1, active = false, variant = 0 }) {
  const lift = active ? 0.035 : 0;
  const rock = active ? '#e2e8f0' : '#b8c7d8';

  return (
    <group scale={scale}>
      {variant % 3 === 0 && (
        <>
          <Peak position={[0, 0.13 + lift, 0]} scale={[1, 1, 1]} color={rock} />
          <SnowCap position={[0, 0.29 + lift, 0]} scale={[0.9, 1, 0.9]} />
          <Peak position={[0.1, 0.09 + lift, -0.045]} scale={[0.58, 0.72, 0.58]} color="#8da1b7" />
        </>
      )}
      {variant % 3 === 1 && (
        <>
          <Peak position={[-0.055, 0.12 + lift, 0.02]} scale={[0.82, 0.9, 0.82]} color={rock} />
          <SnowCap position={[-0.055, 0.255 + lift, 0.02]} scale={[0.68, 0.8, 0.68]} />
          <Peak position={[0.07, 0.145 + lift, -0.035]} scale={[0.92, 1.12, 0.92]} color="#9caec4" />
          <SnowCap position={[0.07, 0.315 + lift, -0.035]} scale={[0.7, 0.78, 0.7]} />
        </>
      )}
      {variant % 3 === 2 && (
        <>
          <mesh position={[0, 0.045 + lift, 0]} scale={[1.35, 0.28, 1.05]}>
            <dodecahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial color="#8da1b7" roughness={0.82} metalness={0} flatShading />
          </mesh>
          <Peak position={[0.02, 0.15 + lift, 0]} scale={[0.92, 1.08, 0.92]} color={rock} />
          <SnowCap position={[0.02, 0.31 + lift, 0]} scale={[0.72, 0.86, 0.72]} />
        </>
      )}
    </group>
  );
}

export default VoxelMountain;
