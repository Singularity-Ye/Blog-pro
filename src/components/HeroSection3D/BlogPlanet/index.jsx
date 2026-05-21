import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BIOMES } from './biomeConfig';
import PlanetSurface from './PlanetSurface';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function BlogPlanet({ activeBiome, onBiomeHover, onBiomeSelect, onNavigate }) {
  const groupRef = useRef();
  const navigateTimerRef = useRef(null);
  const draggingRef = useRef(false);
  const draggedRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!draggingRef.current || !groupRef.current) return;

      const dx = event.clientX - lastPointerRef.current.x;
      const dy = event.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: event.clientX, y: event.clientY };

      if (Math.abs(dx) + Math.abs(dy) > 3) {
        draggedRef.current = true;
      }

      groupRef.current.rotation.y += dx * 0.006;
      groupRef.current.rotation.x = clamp(
        groupRef.current.rotation.x + dy * 0.004,
        -0.65,
        0.65
      );

      velocityRef.current = {
        x: dy * 0.004,
        y: dx * 0.006,
      };
    };

    const endDrag = () => {
      draggingRef.current = false;
      window.setTimeout(() => {
        draggedRef.current = false;
      }, 80);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);

      if (navigateTimerRef.current) {
        window.clearTimeout(navigateTimerRef.current);
      }
      document.body.style.cursor = 'auto';
    };
  }, []);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    if (!draggingRef.current) {
      group.rotation.y += velocityRef.current.y + 0.00045;
      group.rotation.x = clamp(group.rotation.x + velocityRef.current.x, -0.65, 0.65);
      velocityRef.current.x *= 0.92;
      velocityRef.current.y *= 0.92;
    }
  });

  const handlePointerDown = (event) => {
    event.stopPropagation();
    draggingRef.current = true;
    draggedRef.current = false;
    lastPointerRef.current = {
      x: event.nativeEvent?.clientX ?? event.clientX,
      y: event.nativeEvent?.clientY ?? event.clientY,
    };
    velocityRef.current = { x: 0, y: 0 };
    document.body.style.cursor = 'grabbing';
  };

  const selectBiome = (biomeKey) => {
    if (draggedRef.current) return;

    const biome = BIOMES[biomeKey];
    if (!biome) return;

    onBiomeSelect?.(biomeKey);

    if (navigateTimerRef.current) {
      window.clearTimeout(navigateTimerRef.current);
    }

    navigateTimerRef.current = window.setTimeout(() => {
      onNavigate?.(biome.href);
    }, 300);
  };

  return (
    <group
      ref={groupRef}
      position={[1.12, -0.03, 0]}
      rotation={[0.03, -0.18, 0]}
      scale={0.9}
      onPointerDown={handlePointerDown}
      onPointerOver={() => {
        if (!draggingRef.current) document.body.style.cursor = 'grab';
      }}
      onPointerOut={() => {
        if (!draggingRef.current) document.body.style.cursor = 'auto';
      }}
    >
      <PlanetSurface
        activeBiome={activeBiome}
        onBiomeHover={onBiomeHover}
        onBiomeSelect={selectBiome}
      />
    </group>
  );
}

export default BlogPlanet;
