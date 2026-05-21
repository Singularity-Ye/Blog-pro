import { useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import leafCanopyUrl from '../../../assets/textures/biomes/leaf_canopy_albedo.png';

function LeafMaterial({ active, color }) {
  const map = useLoader(THREE.TextureLoader, leafCanopyUrl);

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
      color={active ? '#f0fdf4' : color}
      map={map}
      roughness={0.76}
      metalness={0}
      flatShading
    />
  );
}

function TreeA({ active }) {
  return (
    <>
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.024, 0.034, 0.15, 5]} />
        <meshStandardMaterial color="#6b3f1d" roughness={0.86} metalness={0} flatShading />
      </mesh>
      <mesh position={[0, active ? 0.22 : 0.2, 0]}>
        <coneGeometry args={[0.13, 0.22, 5]} />
        <LeafMaterial active={active} color="#47b942" />
      </mesh>
      <mesh position={[0, active ? 0.34 : 0.31, 0]}>
        <coneGeometry args={[0.095, 0.2, 5]} />
        <LeafMaterial active={active} color="#2f8f2f" />
      </mesh>
    </>
  );
}

function TreeB({ active }) {
  return (
    <>
      <mesh position={[0, 0.065, 0]}>
        <boxGeometry args={[0.05, 0.13, 0.05]} />
        <meshStandardMaterial color="#70421f" roughness={0.86} metalness={0} flatShading />
      </mesh>
      <mesh position={[-0.035, active ? 0.19 : 0.17, 0.01]} rotation={[0, 0.35, 0]}>
        <boxGeometry args={[0.16, 0.11, 0.15]} />
        <LeafMaterial active={active} color="#55b947" />
      </mesh>
      <mesh position={[0.04, active ? 0.27 : 0.24, -0.02]} rotation={[0.15, -0.2, 0.1]}>
        <boxGeometry args={[0.13, 0.11, 0.13]} />
        <LeafMaterial active={active} color="#3b9d37" />
      </mesh>
    </>
  );
}

function TreeC({ active }) {
  return (
    <>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.022, 0.03, 0.12, 5]} />
        <meshStandardMaterial color="#5b371a" roughness={0.86} metalness={0} flatShading />
      </mesh>
      <mesh position={[0.04, active ? 0.15 : 0.135, 0]}>
        <dodecahedronGeometry args={[0.085, 0]} />
        <LeafMaterial active={active} color="#68c64f" />
      </mesh>
      <mesh position={[-0.045, active ? 0.19 : 0.17, -0.015]}>
        <dodecahedronGeometry args={[0.095, 0]} />
        <LeafMaterial active={active} color="#47b942" />
      </mesh>
      <mesh position={[0, active ? 0.27 : 0.24, 0.03]}>
        <dodecahedronGeometry args={[0.075, 0]} />
        <LeafMaterial active={active} color="#2f8f2f" />
      </mesh>
    </>
  );
}

function VoxelTree({ scale = 1, active = false, variant = 0 }) {
  const Variant = [TreeA, TreeB, TreeC][variant % 3];

  return (
    <group scale={scale}>
      <Variant active={active} />
      <mesh position={[0.08, active ? 0.055 : 0.045, -0.055]} scale={0.7}>
        <dodecahedronGeometry args={[0.045, 0]} />
        <LeafMaterial active={active} color="#55b947" />
      </mesh>
    </group>
  );
}

export default VoxelTree;
