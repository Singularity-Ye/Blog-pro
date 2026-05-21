import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

function Atmosphere({ activeBiomeConfig }) {
  const ref = useRef();

  useFrame(({ clock }) => {
    if (!ref.current) return;

    const pulse = 0.025 + Math.sin(clock.elapsedTime * 1.5) * 0.008;
    ref.current.material.opacity = activeBiomeConfig ? 0.08 + pulse : 0.045 + pulse;
  });

  return (
    <mesh ref={ref} scale={1.045}>
      <sphereGeometry args={[1.76, 48, 32]} />
      <meshBasicMaterial
        color={activeBiomeConfig?.glow || '#93c5fd'}
        transparent
        opacity={0.055}
        depthWrite={false}
        side={2}
      />
    </mesh>
  );
}

export default Atmosphere;
