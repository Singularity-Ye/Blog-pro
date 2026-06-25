import { useCallback, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BIOMES } from './biomeConfig';
import PlanetSurface from './PlanetSurface';
import { useHandTracking, TRACKING_MODES } from '../../../utils/useHandTracking';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function BlogPlanet({ activeBiome, onBiomeHover, onBiomeSelect, onNavigate, rotationMode = 'joystick' }) {
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
  const { handDetected, cursor, isPinching, trackingMode } = useHandTracking();
  const prevCursorRef = useRef({ x: 0, y: 0 });
  const smoothedCursorRef = useRef({ x: 0, y: 0 });
  const wasHandDetectedRef = useRef(false);
  const wasPinchingRef = useRef(false);
  const pinchStartPosRef = useRef({ x: 0, y: 0 });

  const zoomPlanet = useCallback((deltaY) => {
    const direction = deltaY > 0 ? -1 : 1;
    targetScaleRef.current = clamp(targetScaleRef.current + direction * 0.055, 0.86, 1.36);
  }, []);

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!event.isTrusted) return;
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
    // We use a stable first-order low-pass filter (exponential LERP) to interpolate coordinate input,
    // which runs smoothly at native monitor refresh rates and completely avoids physical spring overshoot/instability.
    const dt = Math.min(delta, 0.1); // Clamp dt to prevent layout explosion on frame drops
    if (handDetected) {
      if (!wasHandDetectedRef.current) {
        wasHandDetectedRef.current = true;
        smoothedCursorRef.current = { ...cursor };
        prevCursorRef.current = { ...cursor };
      } else {
        // 1. Exponential LERP smoothing for raycasting cursor
        const lambda = 18; // Speed coefficient
        const alpha = 1 - Math.exp(-lambda * dt);
        smoothedCursorRef.current.x += (cursor.x - smoothedCursorRef.current.x) * alpha;
        smoothedCursorRef.current.y += (cursor.y - smoothedCursorRef.current.y) * alpha;

        // 2. Rotation control based on rotationMode
        if (rotationMode === 'pinch') {
          // Pinch & Drag rotation (replicates mouse grab feeling)
          if (isPinching) {
            if (!wasPinchingRef.current) {
              wasPinchingRef.current = true;
              pinchStartPosRef.current = { x: cursor.x, y: cursor.y };
            } else {
              // Calculate delta in NDC coordinates
              const dx = cursor.x - pinchStartPosRef.current.x;
              const dy = cursor.y - pinchStartPosRef.current.y;
              
              // Rotate the planet group
              group.rotation.y += dx * 1.5;
              group.rotation.x = clamp(group.rotation.x - dy * 1.0, -0.65, 0.65);
              
              // Active velocity for release inertia
              velocityRef.current = {
                x: -dy * 0.12,
                y: dx * 0.18
              };
              
              pinchStartPosRef.current = { x: cursor.x, y: cursor.y };
            }
          } else {
            wasPinchingRef.current = false;
          }
        } else {
          // Joystick-style rotation control (based on hand position relative to screen center)
          const deadZone = 0.22; // 22% dead zone in center to keep planet static
          let targetVelocityY = 0;
          let targetVelocityX = 0;

          if (Math.abs(cursor.x) > deadZone) {
            const factorX = (cursor.x - Math.sign(cursor.x) * deadZone) / (1 - deadZone);
            targetVelocityY = factorX * 0.024; // max Y spin speed
          }
          if (Math.abs(cursor.y) > deadZone) {
            const factorY = (cursor.y - Math.sign(cursor.y) * deadZone) / (1 - deadZone);
            targetVelocityX = -factorY * 0.018; // max X tilt speed (inverted to match drag mapping)
          }

          // Smoothly LERP velocity changes for inertia feel
          velocityRef.current.y = THREE.MathUtils.lerp(velocityRef.current.y, targetVelocityY, 0.08);
          velocityRef.current.x = THREE.MathUtils.lerp(velocityRef.current.x, targetVelocityX, 0.08);
        }

        prevCursorRef.current = { ...cursor };
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

    // Rotation physics (inertia on mouse or hand release)
    if (!draggingRef.current) {
      // In pinch mode, only apply inertia when not actively pinching
      const applyingHandPinch = (rotationMode === 'pinch' && handDetected && isPinching);
      if (!applyingHandPinch) {
        group.rotation.y += velocityRef.current.y + 0.00045;
        group.rotation.x = clamp(group.rotation.x + velocityRef.current.x, -0.65, 0.65);
        velocityRef.current.x *= 0.97; // Lowered friction (from 0.92 to 0.97) for long-lasting cosmic spin
        velocityRef.current.y *= 0.97;
      }
    }

    currentScaleRef.current = THREE.MathUtils.lerp(
      currentScaleRef.current,
      targetScaleRef.current,
      0.12
    );
    group.scale.setScalar(currentScaleRef.current);
  });

  const handlePointerDown = (event) => {
    // Skip synthetic events from virtual hand cursor simulation
    if (event.nativeEvent && !event.nativeEvent.isTrusted) return;

    // Skip mouse dragging logic if hand tracking is actively tracking a hand
    if (trackingMode !== TRACKING_MODES.MOUSE && handDetected) return;

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
