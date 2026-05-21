import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

function OrbitingSatellite({ index, total, active, onSelect }) {
  const ref = useRef();
  const phase = (index / total) * Math.PI * 2;

  useFrame(({ clock }) => {
    if (!ref.current) return;

    const t = clock.elapsedTime;
    const radius = active ? 2.85 : 2.65;
    ref.current.position.x = Math.cos(t * 0.35 + phase) * radius;
    ref.current.position.y = Math.sin(t * 0.45 + phase) * 0.7;
    ref.current.position.z = Math.sin(t * 0.35 + phase) * radius;
    ref.current.rotation.x += 0.014;
    ref.current.rotation.y += 0.011;
    ref.current.scale.setScalar(active ? 1.15 : 1);
  });

  return (
    <mesh
      ref={ref}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        document.body.style.cursor = 'auto';
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
    >
      <octahedronGeometry args={[0.14, 0]} />
      <meshStandardMaterial
        color="#f0abfc"
        emissive="#a78bfa"
        emissiveIntensity={active ? 0.75 : 0.35}
        roughness={0.18}
        metalness={0.82}
      />
    </mesh>
  );
}

export default OrbitingSatellite;
