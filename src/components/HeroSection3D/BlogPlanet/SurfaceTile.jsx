import { useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import desertSandUrl from '../../../assets/textures/biomes/desert_sand_albedo.png';
import forestGroundUrl from '../../../assets/textures/biomes/forest_ground_albedo.png';
import snowUrl from '../../../assets/textures/biomes/snow_albedo.png';
import { BIOMES } from './biomeConfig';
import { getPointOnSphere, normalToQuaternion } from './sphereUtils';

function SurfaceTile({ tile, active, onHover, onLeave, onSelect }) {
  const biome = BIOMES[tile.biome];
  const [forestMap, desertMap, snowMap] = useLoader(THREE.TextureLoader, [
    forestGroundUrl,
    desertSandUrl,
    snowUrl,
  ]);
  const position = getPointOnSphere(tile.normal, tile.radius);
  const quaternion = normalToQuaternion(tile.normal);
  const height = active ? tile.height * 1.34 : tile.height;
  const textureMap = {
    forest: forestMap,
    desert: desertMap,
    snow: snowMap,
  }[tile.biome];

  useEffect(() => {
    [forestMap, desertMap, snowMap].forEach((texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      texture.repeat.set(1.15, 1.15);
      texture.needsUpdate = true;
    });
  }, [desertMap, forestMap, snowMap]);

  return (
    <group position={position} quaternion={quaternion}>
      <mesh
        position={[0, active ? height * 1.7 : height, 0]}
        rotation={[-Math.PI / 2, 0, tile.twist]}
        scale={[tile.stretchX, tile.stretchZ, 1]}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover?.(tile);
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          onLeave?.();
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect?.(tile);
        }}
      >
        <circleGeometry args={[tile.size, 8]} />
        <meshStandardMaterial
          color={textureMap ? '#ffffff' : biome.color}
          map={textureMap}
          emissive={active ? biome.glow : '#000000'}
          emissiveIntensity={active ? 0.12 : 0}
          roughness={0.78}
          metalness={0}
          flatShading
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
    </group>
  );
}

export default SurfaceTile;
