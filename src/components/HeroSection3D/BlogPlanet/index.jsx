import { useCallback, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BIOMES } from './biomeConfig';
import PlanetSurface from './PlanetSurface';
import { useHandTracking } from '../../../utils/useHandTracking';

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

  // Hand tracking state
  const { handDetected, cursor, isPinching } = useHandTracking();
  const wasGrabbingRef = useRef(false);
  const prevCursorRef = useRef({ x: 0, y: 0 });
  const smoothedCursorRef = useRef({ x: 0, y: 0 });
  const cursorVelocityRef = useRef({ x: 0, y: 0 });
  const wasHandDetectedRef = useRef(false);

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

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // Smoothly interpolate hand cursor coordinates inside R3F frame loop to achieve 60+ FPS motion updates.
    // We use a spring-damper system to interpolate the 30 FPS camera tracking coordinate input,
    // which generates continuous motion coordinates at native monitor refresh rates and absorbs jitter.
    const dt = Math.min(delta, 0.1); // Clamp dt to prevent layout explosion on frame drops
    if (handDetected) {
      if (!wasHandDetectedRef.current) {
        wasHandDetectedRef.current = true;
        smoothedCursorRef.current = { ...cursor };
        cursorVelocityRef.current = { x: 0, y: 0 };
      } else {
        const stiffness = 280; // High stiffness for responsive hand following
        const damping = 22;    // Damping to prevent spring oscillation
        
        const forceX = -stiffness * (smoothedCursorRef.current.x - cursor.x) - damping * cursorVelocityRef.current.x;
        const forceY = -stiffness * (smoothedCursorRef.current.y - cursor.y) - damping * cursorVelocityRef.current.y;
        
        cursorVelocityRef.current.x += forceX * dt;
        cursorVelocityRef.current.y += forceY * dt;
        
        smoothedCursorRef.current.x += cursorVelocityRef.current.x * dt;
        smoothedCursorRef.current.y += cursorVelocityRef.current.y * dt;
      }
      state.pointer.set(smoothedCursorRef.current.x, smoothedCursorRef.current.y);

      // Force React Three Fiber to run its raycasting event loop by dispatching a synthetic pointermove event.
      // This is crucial because when the physical mouse is stationary, R3F does not trigger hover tests for hand tracking.
      // R3F reads event.offsetX/Y to compute normalized coordinates, so we must inject these properties.
      const canvasEl = state.gl.domElement;
      if (canvasEl) {
        const rect = canvasEl.getBoundingClientRect();
        const clientX = rect.left + (smoothedCursorRef.current.x + 1) * rect.width / 2;
        const clientY = rect.top + (1 - smoothedCursorRef.current.y) * rect.height / 2;
        const offsetX = (smoothedCursorRef.current.x + 1) * rect.width / 2;
        const offsetY = (1 - smoothedCursorRef.current.y) * rect.height / 2;

        const ev = new PointerEvent('pointermove', {
          clientX,
          clientY,
          bubbles: true,
          cancelable: true,
        });

        // Define read-only properties on the event object
        Object.defineProperties(ev, {
          offsetX: { value: offsetX },
          offsetY: { value: offsetY },
        });

        canvasEl.dispatchEvent(ev);
      }
    } else {
      wasHandDetectedRef.current = false;
    }

    // Hand-grabbing rotation (only active when not hovering any biome to avoid interaction conflict)
    if (handDetected && activeBiome === null) {
      const isGrab = isPinching; // Only pinch is used for dragging/rotation as fist clenching is retired
      if (isGrab) {
        if (!wasGrabbingRef.current) {
          wasGrabbingRef.current = true;
          prevCursorRef.current = { ...smoothedCursorRef.current };
        } else {
          const dx = smoothedCursorRef.current.x - prevCursorRef.current.x;
          const dy = smoothedCursorRef.current.y - prevCursorRef.current.y;

          group.rotation.y += dx * 2.4;
          group.rotation.x = clamp(
            group.rotation.x - dy * 2.0,
            -0.65,
            0.65
          );

          velocityRef.current = {
            x: -dy * 2.0,
            y: dx * 2.4,
          };

          prevCursorRef.current = { ...smoothedCursorRef.current };
        }
      } else {
        wasGrabbingRef.current = false;
      }
    } else {
      wasGrabbingRef.current = false;
    }

    // Rotation physics (inertia on mouse or hand release)
    if (!draggingRef.current && !wasGrabbingRef.current) {
      group.rotation.y += velocityRef.current.y + 0.00045;
      group.rotation.x = clamp(group.rotation.x + velocityRef.current.x, -0.65, 0.65);
      velocityRef.current.x *= 0.97; // Lowered friction (from 0.92 to 0.97) for long-lasting cosmic spin
      velocityRef.current.y *= 0.97;
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
