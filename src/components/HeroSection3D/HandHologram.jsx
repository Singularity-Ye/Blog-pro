import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useHandTracking } from '../../utils/useHandTracking';

// Define the indices for joints in each finger
const FINGER_CONNECTIONS = {
  thumb: [0, 1, 2, 3, 4],
  index: [0, 5, 6, 7, 8],
  middle: [0, 9, 10, 11, 12],
  ring: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
  palm: [5, 9, 13, 17, 0] // Connect base knuckles and back to wrist
};

export default function HandHologram() {
  const { handDetected, landmarks, isPinching } = useHandTracking();

  // Map landmarks to Three.js world coordinates
  const worldPoints = useMemo(() => {
    if (!handDetected || !landmarks || landmarks.length < 21) return [];

    // Scale factors to stretch the hand to match screen space bounds
    const scaleX = 3.6;
    const scaleY = 2.6;
    const scaleZ = 4.0;

    return landmarks.map((lm) => {
      // Mirror X so it follows the user's hand correctly
      const x = (1 - lm.x * 2) * scaleX;
      const y = (1 - lm.y * 2) * scaleY;
      const z = -lm.z * scaleZ + 1.2; // Push forward slightly in front of center (Z=0)
      return new THREE.Vector3(x, y, z);
    });
  }, [handDetected, landmarks]);

  // If no hand is detected, or we're in mouse mode, don't render the 3D hand skeleton
  if (!handDetected || worldPoints.length < 21) return null;

  // Render finger lines and joint spheres
  const fingerLines = Object.entries(FINGER_CONNECTIONS).map(([fingerName, indices]) => {
    const points = indices.map(idx => worldPoints[idx]);
    
    // Choose neon green for pinching state, cyan for normal tracking
    const lineColor = isPinching ? '#10b981' : '#00f0ff';

    return (
      <Line
        key={fingerName}
        points={points}
        color={lineColor}
        lineWidth={3.2}
        transparent
        opacity={0.82}
        blending={THREE.AdditiveBlending}
        depthTest={false}
      />
    );
  });

  return (
    <group>
      {/* 1. Finger connection lines */}
      {fingerLines}

      {/* 2. Joint points */}
      {worldPoints.map((pt, idx) => {
        // Highlight thumb tip (4) and index tip (8)
        const isTip = idx === 4 || idx === 8;
        const color = isTip 
          ? (isPinching ? '#ef4444' : '#ff7b54') 
          : '#00f0ff';
        const size = isTip ? 0.055 : 0.038;

        return (
          <mesh key={idx} position={pt} depthTest={false}>
            <sphereGeometry args={[size, 12, 12]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
    </group>
  );
}
