import { useCallback, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BIOMES } from './biomeConfig';
import PlanetSurface from './PlanetSurface';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function BlogPlanet({ activeBiome, onBiomeHover, onBiomeSelect, onNavigate }) {
  const { gl } = useThree();
  const groupRef = useRef();
  const navigateTimerRef = useRef(null);
  const draggingRef = useRef(false);
  const draggedRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const currentScaleRef = useRef(1.04);
  const targetScaleRef = useRef(1.04);

  const zoomPlanet = useCallback((deltaY) => {
    const direction = deltaY > 0 ? -1 : 1;
    targetScaleRef.current = clamp(targetScaleRef.current + direction * 0.055, 0.86, 1.36);
  }, []);

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

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        targetScaleRef.current = 1.04;
      }
    };

    const handleWheel = (event) => {
      if (!draggingRef.current) return;

      event.preventDefault();
      event.stopPropagation();
      zoomPlanet(event.deltaY);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    window.addEventListener('keydown', handleKeyDown);
    gl.domElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      window.removeEventListener('keydown', handleKeyDown);
      gl.domElement.removeEventListener('wheel', handleWheel);

      if (navigateTimerRef.current) {
        window.clearTimeout(navigateTimerRef.current);
      }
      document.body.style.cursor = 'auto';
    };
  }, [gl.domElement, zoomPlanet]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    if (!draggingRef.current) {
      group.rotation.y += velocityRef.current.y + 0.00045;
      group.rotation.x = clamp(group.rotation.x + velocityRef.current.x, -0.65, 0.65);
      velocityRef.current.x *= 0.92;
      velocityRef.current.y *= 0.92;
    }

    currentScaleRef.current = THREE.MathUtils.lerp(
      currentScaleRef.current,
      targetScaleRef.current,
      0.12
    );
    group.scale.setScalar(currentScaleRef.current);
  });

  const handlePointerDown = (event) => {
    event.stopPropagation();
    event.nativeEvent?.preventDefault?.();
    draggingRef.current = true;
    draggedRef.current = false;
    lastPointerRef.current = {
      x: event.nativeEvent?.clientX ?? event.clientX,
      y: event.nativeEvent?.clientY ?? event.clientY,
    };
    velocityRef.current = { x: 0, y: 0 };
    document.body.style.cursor = 'grabbing';
  };

  const handleWheel = (event) => {
    if (!draggingRef.current) return;

    event.stopPropagation();
    event.nativeEvent?.preventDefault?.();
    zoomPlanet(event.deltaY);
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
      scale={1.04}
      onPointerDown={handlePointerDown}
      onWheel={handleWheel}
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
