import React, { useState, useRef, Suspense } from 'react';
import styled, { keyframes } from 'styled-components';
import { Canvas, useFrame } from '@react-three/fiber';
import { Preload, OrbitControls, Line, Html } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { useHandTracking, TRACKING_MODES } from '../utils/useHandTracking';
import HandHologram from '../components/HeroSection3D/HandHologram';
import ErrorBoundary from '../components/ErrorBoundary';

const gridAnimation = keyframes`
  from { background-position: 0 0; }
  to { background-position: 40px 40px; }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  background: radial-gradient(circle at 50% 50%, #060a12 0%, #020408 100%);
  color: #fff;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;

  /* Holographic background grid */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    background-position: center;
    pointer-events: none;
    z-index: 0;
    animation: ${gridAnimation} 20s linear infinite;
  }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 2.5rem;
  border-bottom: 1px solid rgba(0, 240, 255, 0.15);
  background: rgba(4, 8, 15, 0.8);
  backdrop-filter: blur(12px);
  z-index: 10;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);

  .logo-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;

    .icon {
      font-size: 1.4rem;
      animation: pulseGlow 2s infinite ease-in-out;
    }

    h1 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 900;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      background: linear-gradient(90deg, #00f0ff, #00ff88);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .nav-back {
    background: transparent;
    border: 1px solid rgba(0, 240, 255, 0.4);
    color: #00f0ff;
    padding: 0.45rem 1rem;
    font-size: 0.72rem;
    font-weight: 700;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.25s ease;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    &:hover {
      background: rgba(0, 240, 255, 0.12);
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.35);
      border-color: #00f0ff;
    }
  }

  @keyframes pulseGlow {
    0%, 100% { text-shadow: 0 0 4px rgba(0, 240, 255, 0.4); }
    50% { text-shadow: 0 0 12px rgba(0, 240, 255, 0.9); }
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  position: relative;
  z-index: 1;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto 500px auto;
  }
`;

const Sidebar = styled.section`
  background: rgba(4, 8, 15, 0.65);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-right: ${props => props.$left ? '1px solid rgba(0, 240, 255, 0.15)' : 'none'};
  border-left: ${props => props.$right ? '1px solid rgba(0, 240, 255, 0.15)' : 'none'};
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  z-index: 2;
  overflow-y: auto;

  h2 {
    font-size: 0.88rem;
    font-weight: 800;
    text-transform: uppercase;
    color: #00f0ff;
    border-left: 3px solid #00f0ff;
    padding-left: 0.5rem;
    margin: 0 0 1rem;
    letter-spacing: 0.08em;
  }

  .card {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  button.option {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.75);
    border-radius: 6px;
    padding: 0.6rem 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      background: rgba(0, 240, 255, 0.05);
      border-color: rgba(0, 240, 255, 0.3);
      color: #fff;
    }

    &.active {
      background: rgba(0, 240, 255, 0.15);
      border-color: #00f0ff;
      color: #fff;
      box-shadow: 0 0 12px rgba(0, 240, 255, 0.25);
    }
  }

  .slider-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    label {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.5);
      display: flex;
      justify-content: space-between;
    }

    input[type='range'] {
      -webkit-appearance: none;
      width: 100%;
      height: 4px;
      border-radius: 2px;
      background: rgba(0, 240, 255, 0.15);
      outline: none;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #00f0ff;
        cursor: pointer;
        box-shadow: 0 0 8px #00f0ff;
        transition: transform 0.1s;

        &:hover {
          transform: scale(1.2);
        }
      }
    }
  }

  .tech-info {
    font-family: monospace;
    font-size: 0.68rem;
    color: rgba(0, 240, 255, 0.85);
    line-height: 1.45;
  }
`;

const CanvasContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  z-index: 1;

  .pip-instructions {
    position: absolute;
    bottom: 2rem;
    right: 2rem;
    background: rgba(8, 12, 18, 0.65);
    border: 1px solid rgba(0, 240, 255, 0.15);
    border-radius: 8px;
    padding: 0.6rem 1rem;
    font-size: 0.7rem;
    color: rgba(0, 240, 255, 0.85);
    pointer-events: none;
    backdrop-filter: blur(8px);
  }
`;

const FloatingCursor = styled.div`
  position: fixed;
  left: ${props => props.$left};
  top: ${props => props.$top};
  width: 10px;
  height: 10px;
  background: ${props => props.$isPinching ? '#10b981' : '#00f0ff'};
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 99999;
  pointer-events: none;
  box-shadow: 0 0 10px ${props => props.$isPinching ? '#10b981' : '#00f0ff'};
`;

const CameraPiP = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  width: 120px;
  height: 90px;
  border-radius: 6px;
  border: 1px solid rgba(0, 240, 255, 0.25);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  z-index: 100;
  background: #000;
  transform: scaleX(-1);
  pointer-events: none;
  display: ${props => props.$visible ? 'grid' : 'none'};
  grid-template-areas: "stack";
  
  video, canvas {
    grid-area: stack;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const TechPanelContainer = styled.div`
  width: 200px;
  padding: 0.65rem;
  border-radius: 6px;
  border: 1px solid rgba(0, 240, 255, 0.4);
  background: rgba(8, 12, 18, 0.85);
  box-shadow: 0 4px 20px rgba(0, 240, 255, 0.15);
  color: #fff;
  font-family: sans-serif;
  font-size: 0.68rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  pointer-events: none;
  transition: opacity 0.3s;

  h4 {
    margin: 0;
    font-size: 0.74rem;
    font-weight: 800;
    color: #00f0ff;
    border-bottom: 1px solid rgba(0, 240, 255, 0.2);
    padding-bottom: 0.2rem;
  }

  p {
    margin: 0;
    color: rgba(255, 255, 255, 0.78);
    line-height: 1.35;
  }

  .status-line {
    display: flex;
    justify-content: space-between;
    font-family: monospace;
    font-size: 0.6rem;
    margin-top: 0.2rem;
    color: #10b981;
  }
`;

// Refrigerator hotspots metadata
const FRIDGE_HOTSPOTS = {
  fresh_food: {
    pos: [0, 0.65, 0.35],
    title: '冷藏保鲜层 (Refrigeration)',
    desc: '双路微冷循环风道技术，智能控温保鲜，温度区间：2℃至8℃，有效减少细菌滋生。',
    status: '运行良好 (HEALTHY)'
  },
  freezer: {
    pos: [0, -0.55, 0.35],
    title: '极速冷冻层 (Freezer)',
    desc: '超导一体风冷无霜蒸发器，极速降温制冷，深度冻结食物，最低制冷温度可达-24℃。',
    status: '制冷中 (ACTIVE)'
  },
  compressor: {
    pos: [0, -0.85, -0.45],
    title: '双频变频压缩机 (Compressor)',
    desc: '双转子直流变频静音压缩机，能耗比极佳，机身运行震动极小，全天候噪音低于32dB。',
    status: '低功耗运行 (STANDBY)'
  },
  control_panel: {
    pos: [0.55, 0.4, 0.45],
    title: '智能全息交互面板 (Smart HUD)',
    desc: '透光晶体玻璃晶格触屏，集成OTA智能物联芯片，支持自适应场景控温方案。',
    status: '云端联机中 (ONLINE)'
  }
};

// Battery hotspots metadata
const BATTERY_HOTSPOTS = {
  anode: {
    pos: [0, 1.15, 0],
    title: '正极汇流端子 (Anode Terminal)',
    desc: '阳极集流体采用高导电防氧化铜合金镀金，接触内阻低至 0.08 mΩ，支持高倍率放电。',
    status: '温度正常 (HEALTHY)'
  },
  cathode: {
    pos: [0, -1.15, 0],
    title: '负极连接端子 (Cathode Terminal)',
    desc: '阴极集流体外层使用高纯度镍片复合冲压压铸而成，散热性极佳，防高温热失控。',
    status: '温度正常 (HEALTHY)'
  },
  separator: {
    pos: [0, 0, 0.15],
    title: '纳米多孔隔膜 (Polymer Separator)',
    desc: '12μm 多孔聚乙烯安全隔离层，高穿刺强度，熔融自闭安全防护温度达130℃。',
    status: '极间绝缘阻抗: >50MΩ'
  },
  electrolyte: {
    pos: [0.35, 0, -0.2],
    title: '固态聚合物电解质 (Electrolyte)',
    desc: '新型固态锂聚合物电解质凝胶，大幅抑制锂枝晶生长，消除漏液与易燃风险。',
    status: '离子导电率: 1.4 mS/cm'
  }
};

// 3D Hotspot Node Component (renders inside R3F)
function HotspotNode({ position, title, desc, status, hoveredHotspot, setHoveredHotspot, id, activeModel }) {
  const meshRef = useRef();
  const isHovered = hoveredHotspot === id;

  useFrame((state) => {
    if (meshRef.current) {
      // Rotate the glowing ring
      meshRef.current.rotation.z += 0.015;
      // Pulse scale slightly
      const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 4.5) * 0.12;
      meshRef.current.scale.setScalar(isHovered ? 1.4 : pulse);
    }
  });

  // Target HTML label offset
  const labelOffset = activeModel === 'battery' ? [0.95, 0.35, 0] : [0.9, 0.4, 0];

  return (
    <group position={position}>
      {/* 3D Hotspot Node (Raycast target) */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredHotspot(id);
        }}
        onPointerOut={() => setHoveredHotspot(null)}
      >
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={isHovered ? '#10b981' : '#00f0ff'} transparent opacity={0.65} />
      </mesh>

      {/* Pulsing wireframe circle around hotspot */}
      <mesh ref={meshRef}>
        <ringGeometry args={[0.11, 0.14, 16]} />
        <meshBasicMaterial
          color={isHovered ? '#10b981' : '#00f0ff'}
          side={THREE.DoubleSide}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Floating Sci-Fi Tech Data Card via Drei Html */}
      {isHovered && (
        <group>
          {/* Mapped connecting leader line from hotspot [0,0,0] to card offset */}
          <Line
            points={[[0, 0, 0], labelOffset]}
            color="#00f0ff"
            lineWidth={1.5}
            transparent
            opacity={0.6}
          />
          <Html position={labelOffset} center distanceFactor={6.2}>
            <TechPanelContainer>
              <h4>{title}</h4>
              <p>{desc}</p>
              <div className="status-line">
                <span>STATUS:</span>
                <span>{status}</span>
              </div>
            </TechPanelContainer>
          </Html>
        </group>
      )}
    </group>
  );
}

// Procedural Refrigerator Model
function Refrigerator({ explode }) {
  const ref = useRef();
  
  // Exploded translations mapping
  const doorRotateY = explode * (Math.PI * 0.65); // Open doors up to 120deg
  const drawerZ = explode * 0.72; // Slide drawers forward
  const shelfZ = explode * 0.42; // Slide shelf forward
  const backPanelY = -explode * 0.35; // Back panels push back/down

  return (
    <group ref={ref}>
      {/* 1. Main Cabinet Shell (Translucent holographic structure) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.0, 2.0, 0.8]} />
        <meshPhysicalMaterial
          color="#0f1f2e"
          roughness={0.12}
          metalness={0.1}
          transmission={0.4}
          ior={1.2}
          thickness={0.2}
          transparent
          opacity={0.36}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe border outlining the cabinet shell */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.0, 2.0, 0.8]} />
        <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.18} />
      </mesh>

      {/* 2. Divider Panel (Center Shelf) */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.96, 0.03, 0.72]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.25} />
      </mesh>

      {/* 3. Sliding Upper Food Shelf */}
      <group position={[0, 0.5, shelfZ]}>
        <mesh>
          <boxGeometry args={[0.92, 0.02, 0.68]} />
          <meshPhysicalMaterial color="#ffffff" transmission={0.9} transparent opacity={0.4} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.92, 0.02, 0.68]} />
          <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.12} />
        </mesh>
      </group>

      {/* 4. Sliding Freezer Drawer */}
      <group position={[0, -0.45, drawerZ]}>
        <mesh>
          <boxGeometry args={[0.88, 0.35, 0.65]} />
          <meshPhysicalMaterial color="#00ff88" transmission={0.8} transparent opacity={0.12} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.88, 0.35, 0.65]} />
          <meshBasicMaterial color="#00ff88" wireframe transparent opacity={0.15} />
        </mesh>
      </group>

      {/* 5. Rotary Doors (Upper Door hinges on the right, Lower Door on left) */}
      <group position={[0.5, 0.55, 0.4]}>
        <group rotation={[0, -doorRotateY, 0]} position={[-0.5, 0, 0]}>
          <mesh position={[0.5, 0, 0.02]}>
            <boxGeometry args={[0.96, 0.9, 0.05]} />
            <meshPhysicalMaterial color="#00e5ff" transmission={0.65} transparent opacity={0.25} />
          </mesh>
          <mesh position={[0.5, 0, 0.02]}>
            <boxGeometry args={[0.96, 0.9, 0.05]} />
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.15} />
          </mesh>
        </group>
      </group>

      {/* 6. Compressor (Cylinder component at the back bottom) */}
      <group position={[0, -0.85, backPanelY - 0.28]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.32, 16]} />
          <meshBasicMaterial color="#ffa801" transparent opacity={0.4} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.32, 16]} />
          <meshBasicMaterial color="#ffa801" wireframe transparent opacity={0.2} />
        </mesh>
      </group>
    </group>
  );
}

// Procedural Battery Model
function Battery({ explode }) {
  const ref = useRef();

  // Exploded translations mapping
  const caseX = explode * 0.76;       // Shell splits in half along X-axis
  const cathodeY = -explode * 0.5;   // Cathode shifts down
  const anodeY = explode * 0.5;       // Anode shifts up
  const coreZ = explode * 0.4;        // Internal layers separate slightly along Z

  return (
    <group ref={ref}>
      {/* 1. Translucent Outer Casing (Left Half) */}
      <group position={[-caseX, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.5, 0.5, 1.8, 16, 2, true, 0, Math.PI]} />
          <meshPhysicalMaterial
            color="#00f0ff"
            roughness={0.08}
            transmission={0.8}
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.5, 0.5, 1.8, 16, 2, true, 0, Math.PI]} />
          <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Translucent Outer Casing (Right Half) */}
      <group position={[caseX, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.5, 0.5, 1.8, 16, 2, true, Math.PI, Math.PI]} />
          <meshPhysicalMaterial
            color="#00f0ff"
            roughness={0.08}
            transmission={0.8}
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.5, 0.5, 1.8, 16, 2, true, Math.PI, Math.PI]} />
          <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 2. Active Cathode Terminal (-) */}
      <group position={[0, cathodeY - 0.96, 0]}>
        <mesh>
          <cylinderGeometry args={[0.26, 0.26, 0.12, 16]} />
          <meshBasicMaterial color="#0072ff" transparent opacity={0.5} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.26, 0.26, 0.12, 16]} />
          <meshBasicMaterial color="#0072ff" wireframe transparent opacity={0.2} />
        </mesh>
      </group>

      {/* 3. Active Anode Terminal (+) */}
      <group position={[0, anodeY + 0.96, 0]}>
        <mesh>
          <cylinderGeometry args={[0.18, 0.18, 0.12, 16]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.5} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.18, 0.18, 0.12, 16]} />
          <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.2} />
        </mesh>
      </group>

      {/* 4. Internal Separator Matrix Layer */}
      <group position={[0, 0, coreZ]}>
        <mesh>
          <cylinderGeometry args={[0.42, 0.42, 1.5, 16]} />
          <meshPhysicalMaterial color="#ffffff" transmission={0.9} transparent opacity={0.22} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.42, 0.42, 1.5, 16]} />
          <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.12} />
        </mesh>
      </group>

      {/* 5. Electrolyte Colloidal Matrix */}
      <group position={[0, 0, -coreZ]}>
        <mesh>
          <cylinderGeometry args={[0.35, 0.35, 1.35, 12]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.18} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.35, 0.35, 1.35, 12]} />
          <meshBasicMaterial color="#00ff88" wireframe transparent opacity={0.1} />
        </mesh>
      </group>
    </group>
  );
}

// Scene controller that binds models, rotation physics, and hotspots
function SpatialScene({ activeModel, explode, hoveredHotspot, setHoveredHotspot }) {
  const groupRef = useRef();
  
  // Hand tracking coordinate states
  const { handDetected, cursor, isPinching, isFist } = useHandTracking();
  const wasGrabbingRef = useRef(false);
  const prevCursorRef = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    // Overwrite R3F pointer coordinates if hand is active
    if (handDetected) {
      state.pointer.set(cursor.x, cursor.y);
    }

    // Gestural Hand-Dragging Rotation logic
    if (handDetected) {
      const isGrab = isFist || isPinching;
      
      // Rotate model when grabbing in empty space (i.e. not hovering any hotspot)
      if (isGrab && hoveredHotspot === null) {
        if (!wasGrabbingRef.current) {
          wasGrabbingRef.current = true;
          prevCursorRef.current = { ...cursor };
        } else {
          const dx = cursor.x - prevCursorRef.current.x;
          const dy = cursor.y - prevCursorRef.current.y;

          group.rotation.y += dx * 2.5;
          group.rotation.x = THREE.MathUtils.clamp(
            group.rotation.x + dy * 2.0,
            -0.85,
            0.85
          );

          prevCursorRef.current = { ...cursor };
        }
      } else {
        wasGrabbingRef.current = false;
      }
    } else {
      wasGrabbingRef.current = false;
    }

    // Auto slow rotate if no hand grab is active
    if (!wasGrabbingRef.current) {
      group.rotation.y += 0.0035;
    }
  });

  const hotspots = activeModel === 'fridge' ? FRIDGE_HOTSPOTS : BATTERY_HOTSPOTS;

  return (
    <>
      <ambientLight intensity={0.65} color="#dff8ff" />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#00f0ff" />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#00ff88" />
      
      <group ref={groupRef} rotation={[0.15, -0.4, 0]}>
        {/* Render selected model */}
        {activeModel === 'fridge' ? (
          <Refrigerator explode={explode} />
        ) : (
          <Battery explode={explode} />
        )}

        {/* Render respective hotspots */}
        {Object.entries(hotspots).map(([id, item]) => (
          <HotspotNode
            key={id}
            id={id}
            position={item.pos}
            title={item.title}
            desc={item.desc}
            status={item.status}
            hoveredHotspot={hoveredHotspot}
            setHoveredHotspot={setHoveredHotspot}
            activeModel={activeModel}
          />
        ))}
      </group>
    </>
  );
}

export default function SpatialUI() {
  const navigate = useNavigate();
  const [activeModel, setActiveModel] = useState('fridge'); // 'fridge' or 'battery'
  const [explodeAmount, setExplodeAmount] = useState(0.0);
  const [hoveredHotspot, setHoveredHotspot] = useState(null);

  // Hook states
  const {
    trackingMode,
    setTrackingMode,
    handDetected,
    cursor,
    isPinching,
    isFist,
    isConnected,
    wsUrl,
    setWsUrl,
    cameraActive,
    videoRef,
    canvasRef,
  } = useHandTracking();

  // Gesture-Driven Exploded View
  // Dynamically mapping hand velocity or hand stretch distance in the future
  // For now, in webcam mode, we can bind pinch duration/distance, but a slider is a stable fall-back

  const handleBack = () => {
    navigate('/projects');
  };

  const cursorLeft = `${(cursor.x + 1) * 50}%`;
  const cursorTop = `${(1 - cursor.y) * 50}%`;

  return (
    <PageContainer>
      <Header>
        <div className="logo-section" onClick={() => navigate('/')}>
          <span className="icon">🌌</span>
          <h1>全息交互空间 · Holographic Sandbox</h1>
        </div>
        <button className="nav-back" onClick={handleBack}>
          返回造物坊
        </button>
      </Header>

      <MainContent>
        {/* Left Side: Telemetry Control Panel */}
        <Sidebar $left>
          <div>
            <h2>交互模式</h2>
            <div className="btn-group">
              <button
                className={`option ${trackingMode === TRACKING_MODES.MOUSE ? 'active' : ''}`}
                onClick={() => setTrackingMode(TRACKING_MODES.MOUSE)}
              >
                🖱️ 鼠标轨迹
              </button>
              <button
                className={`option ${trackingMode === TRACKING_MODES.CAMERA ? 'active' : ''}`}
                onClick={() => setTrackingMode(TRACKING_MODES.CAMERA)}
              >
                📷 相机骨骼
              </button>
              <button
                className={`option ${trackingMode === TRACKING_MODES.WEBSOCKET ? 'active' : ''}`}
                onClick={() => setTrackingMode(TRACKING_MODES.WEBSOCKET)}
              >
                🔌 网口服务
              </button>
              <button
                className={`option ${trackingMode === TRACKING_MODES.SIMULATE ? 'active' : ''}`}
                onClick={() => setTrackingMode(TRACKING_MODES.SIMULATE)}
              >
                🌀 仿真模拟
              </button>
            </div>
          </div>

          {trackingMode === TRACKING_MODES.WEBSOCKET && (
            <div className="card">
              <h2>WebSocket 设置</h2>
              <div className="slider-group">
                <label>服务器地址</label>
                <input
                  type="text"
                  value={wsUrl}
                  onChange={(e) => setWsUrl(e.target.value)}
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(0,240,255,0.3)',
                    color: '#fff',
                    padding: '0.4rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    outline: 'none'
                  }}
                />
              </div>
              <span className="tech-info">
                状态: {isConnected ? '● 已连接 (CONNECTED)' : '○ 未连接 (DISCONNECTED)'}
              </span>
            </div>
          )}

          <div className="card">
            <h2>交互遥测数据</h2>
            <div className="tech-info">
              模式: {trackingMode.toUpperCase()}<br />
              侦测: {handDetected ? 'ACTIVE' : 'OFFLINE'}<br />
              指针 X: {cursor.x.toFixed(3)}<br />
              指针 Y: {cursor.y.toFixed(3)}<br />
              姿态: {isPinching ? '双指捏合 (PINCH)' : isFist ? '握拳抓取 (DRAG)' : '掌心展开 (OPEN)'}<br />
            </div>
          </div>
        </Sidebar>

        {/* Center Section: R3F Canvas Container */}
        <CanvasContainer>
          <ErrorBoundary>
            <Canvas
              camera={{ position: [0, 0, 4.8], fov: 48 }}
              gl={{ alpha: true, antialias: true }}
              dpr={[1, 2]}
              onCreated={({ gl }) => {
                gl.outputColorSpace = THREE.SRGBColorSpace;
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.toneMappingExposure = 1.2;
              }}
            >
              <Suspense fallback={null}>
                <SpatialScene
                  activeModel={activeModel}
                  explode={explodeAmount}
                  hoveredHotspot={hoveredHotspot}
                  setHoveredHotspot={setHoveredHotspot}
                />
                {/* 3D Hand Skeleton overlay */}
                <HandHologram />
                <OrbitControls
                  enableZoom={true}
                  enablePan={false}
                  maxDistance={8}
                  minDistance={2}
                  // Disable orbitControls mouse drag if hand is actively dragging to prevent conflicts
                  enabled={!handDetected}
                />
                <Preload all />
              </Suspense>
            </Canvas>
          </ErrorBoundary>

          {/* Mapped 2D cursor overlay */}
          {handDetected && trackingMode !== TRACKING_MODES.MOUSE && (
            <FloatingCursor
              $left={cursorLeft}
              $top={cursorTop}
              $isPinching={isPinching}
            />
          )}

          {/* Camera debug PiP window */}
          <CameraPiP $visible={trackingMode === TRACKING_MODES.CAMERA && cameraActive}>
            <video ref={videoRef} autoPlay playsInline muted />
            <canvas ref={canvasRef} width="640" height="480" />
          </CameraPiP>

          <div className="pip-instructions">
            💡 提示: 悬停在模型上的 <span style={{ color: '#00f0ff', fontWeight: 900 }}>发光环</span> 上即可展开详细技术卡片。
            {handDetected ? ' 握拳移动可以平滑旋转模型。' : ' 拖拽鼠标即可旋转模型。'}
          </div>
        </CanvasContainer>

        {/* Right Side: Model Parameter Configuration */}
        <Sidebar $right>
          <div>
            <h2>切换展示物体</h2>
            <div className="btn-group">
              <button
                className={`option ${activeModel === 'fridge' ? 'active' : ''}`}
                onClick={() => {
                  setActiveModel('fridge');
                  setHoveredHotspot(null);
                }}
              >
                ❄️ 全息微型冰箱
              </button>
              <button
                className={`option ${activeModel === 'battery' ? 'active' : ''}`}
                onClick={() => {
                  setActiveModel('battery');
                  setHoveredHotspot(null);
                }}
              >
                🔋 固态聚合物电池
              </button>
            </div>
          </div>

          <div className="card">
            <h2>全息部件拆解</h2>
            <div className="slider-group">
              <label>
                <span>拆解系数 (Explode)</span>
                <span>{Math.round(explodeAmount * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={explodeAmount}
                onChange={(e) => setExplodeAmount(parseFloat(e.target.value))}
              />
            </div>
            <span className="tech-info" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.62rem' }}>
              支持在 3D 物理视界下将外壳与核心组件剥离，查看各层精密构造与配合参数。
            </span>
          </div>

          <div className="card">
            <h2>星空遥感网络</h2>
            <span className="tech-info" style={{ color: 'rgba(0, 240, 255, 0.7)' }}>
              - 射频带宽: 5.8 GHz<br />
              - 空气时延: &lt; 12 ms<br />
              - 热失控防护: 自动断电<br />
              - 渲染管线: WebGL 2.0
            </span>
          </div>
        </Sidebar>
      </MainContent>
    </PageContainer>
  );
}
