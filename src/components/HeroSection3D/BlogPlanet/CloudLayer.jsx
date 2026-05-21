import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function CloudLayer() {
  const ref = useRef();
  const cloudGeometry = useMemo(() => {
    const geometry = new THREE.IcosahedronGeometry(1.83, 3);
    const pos = geometry.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const fade = Math.sin(x * 4.8 + z * 3.1) + Math.cos(y * 5.2);
      const scale = fade > 0.35 ? 1.006 : 0.992;

      pos.setXYZ(i, x * scale, y * scale, z * scale);
    }

    geometry.computeVertexNormals();
    return geometry;
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.0018;
    ref.current.rotation.x += 0.0004;
  });

  return (
    <mesh ref={ref} geometry={cloudGeometry}>
      <meshBasicMaterial
        color="#e0f2fe"
        transparent
        opacity={0.075}
        depthWrite={false}
        wireframe
      />
    </mesh>
  );
}

export default CloudLayer;
