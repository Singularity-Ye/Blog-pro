import { useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import desertRockUrl from '../../../assets/textures/biomes/desert_rock_albedo.png';

function RockMaterial({ color }) {
  const map = useLoader(THREE.TextureLoader, desertRockUrl);

  useEffect(() => {
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    map.repeat.set(1.4, 1.4);
    map.needsUpdate = true;
  }, [map]);

  return (
    <meshStandardMaterial
      color={color}
      map={map}
      roughness={0.88}
      metalness={0}
      flatShading
    />
  );
}

function Boulder({ position, scale, color }) {
  return (
    <mesh position={position} rotation={[0.2, 0.45, -0.1]} scale={scale}>
      <dodecahedronGeometry args={[0.095, 0]} />
      <RockMaterial color={color} />
    </mesh>
  );
}

function VoxelRock({ scale = 1, active = false, variant = 0 }) {
  const color = active ? '#fde68a' : '#9a8769';
  const dark = active ? '#fef3c7' : '#756958';

  return (
    <group scale={scale} position={[0, active ? 0.025 : 0, 0]}>
      {variant % 3 === 0 && (
        <>
          <Boulder position={[0, 0.07, 0]} scale={[1, 0.82, 0.9]} color={color} />
          <Boulder position={[0.08, 0.045, -0.04]} scale={[0.58, 0.5, 0.6]} color={dark} />
        </>
      )}
      {variant % 3 === 1 && (
        <>
          <Boulder position={[-0.04, 0.06, 0.02]} scale={[0.78, 0.68, 0.7]} color={dark} />
          <Boulder position={[0.055, 0.08, -0.025]} scale={[0.95, 0.78, 0.85]} color={color} />
          <Boulder position={[0.11, 0.035, 0.045]} scale={[0.45, 0.38, 0.48]} color={dark} />
        </>
      )}
      {variant % 3 === 2 && (
        <>
          <Boulder position={[0, 0.085, 0]} scale={[1.05, 0.55, 0.75]} color={color} />
          <Boulder position={[-0.08, 0.045, -0.035]} scale={[0.52, 0.42, 0.5]} color={dark} />
          <Boulder position={[0.075, 0.04, 0.055]} scale={[0.4, 0.34, 0.42]} color="#b89b6a" />
        </>
      )}
    </group>
  );
}

export default VoxelRock;
