import React, { useState, useRef, Suspense } from 'react';
import styled from 'styled-components';
import { Canvas, useFrame } from '@react-three/fiber';
import { Preload, OrbitControls, Line, Html, Clone, useGLTF, Grid, Environment } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { useHandTracking, TRACKING_MODES } from '../utils/useHandTracking';
import ErrorBoundary from '../components/ErrorBoundary';

const PageContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  background:
    radial-gradient(circle at 50% 42%, rgba(40, 80, 120, 0.32), transparent 42%),
    linear-gradient(180deg, #0a101c 0%, #05070d 100%);
  color: #f1f5f9;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(20, 23, 30, 0.85);
  backdrop-filter: blur(16px);
  z-index: 10;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);

  .logo-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;

    .icon {
      font-size: 1.3rem;
    }

    h1 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #ffffff;
    }
  }

  .nav-back {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #cbd5e1;
    padding: 0.45rem 1rem;
    font-size: 0.72rem;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.4);
      color: #ffffff;
    }
  }
`;

const MainContent = styled.main`
  flex: 1;
  position: relative;
  display: flex;
  z-index: 1;
  height: calc(100vh - 65px);

  @media (max-width: 968px) {
    flex-direction: column;
    overflow-y: auto;
    height: auto;
  }
`;

const Sidebar = styled.section`
  position: absolute;
  top: 1.5rem;
  bottom: 1.5rem;
  ${props => props.$left ? 'left: 1.5rem;' : 'right: 1.5rem;'}
  width: 290px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease;

  ${props => props.$focus && (props.$left ? 'transform: translateX(-340px); opacity: 0; pointer-events: none;' : 'transform: translateX(340px); opacity: 0; pointer-events: none;')}

  @media (max-width: 968px) {
    position: relative;
    left: auto;
    right: auto;
    top: auto;
    bottom: auto;
    width: 100%;
    height: auto;
    margin-bottom: 1rem;
    ${props => props.$focus && 'display: none;'}
  }

  .btn-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  button.option {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #cbd5e1;
    border-radius: 6px;
    padding: 0.6rem 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(37, 99, 235, 0.08);
      border-color: rgba(37, 99, 235, 0.4);
      color: #fff;
    }

    &.active {
      background: #2563eb;
      border-color: #3b82f6;
      color: #fff;
    }
  }

  .slider-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    label {
      font-size: 0.7rem;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }

    input[type='range'] {
      -webkit-appearance: none;
      width: 100%;
      height: 4px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.1);
      outline: none;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        transition: transform 0.1s;

        &:hover {
          transform: scale(1.2);
        }
      }
    }
  }

  .tech-info {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.68rem;
    color: #94a3b8;
    line-height: 1.45;
  }
`;

const CanvasContainer = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;

  @media (max-width: 968px) {
    position: relative;
    height: 500px;
  }

  .pip-instructions {
    position: absolute;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 17, 23, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.6rem 1rem;
    font-size: 0.7rem;
    color: #e2e8f0;
    pointer-events: none;
    backdrop-filter: blur(12px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    white-space: nowrap;
    z-index: 5;
  }
`;


const HudCard = styled.div`
  background: rgba(10, 16, 27, 0.72);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(80, 180, 255, 0.18);
  box-shadow: inset 0 0 18px rgba(80, 180, 255, 0.05), 0 18px 40px rgba(0, 0, 0, 0.38);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  transition: all 0.3s ease;

  h3 {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #f1f5f9;
    border-left: 3px solid #2563eb;
    padding-left: 0.4rem;
    margin: 0;
    letter-spacing: 0.05em;
  }

  .tech-info {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    color: #94a3b8;
    line-height: 1.45;
  }

  /* Progress bar styles */
  .progress-bar-container {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 0.2rem;
  }

  .progress-bar-fill {
    height: 100%;
    background: #2563eb;
    box-shadow: 0 0 8px #3b82f6;
  }

  /* Sparkline row style */
  .sparkline-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.62rem;
    font-family: 'JetBrains Mono', monospace;
    color: #94a3b8;
  }
`;


// Tag and Hotspot styled label
const TagLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: ${props => props.$selected ? 'rgba(37, 99, 235, 0.92)' : 'rgba(10, 16, 27, 0.75)'};
  border: 1px solid ${props => props.$selected ? '#ffffff' : 'rgba(80, 180, 255, 0.35)'};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  padding: 0.2rem 0.45rem;
  color: #fff;
  font-family: 'Outfit', sans-serif;
  font-size: 0.65rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  pointer-events: auto;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    background: rgba(37, 99, 235, 0.85);
    border-color: #fff;
  }

  .num {
    color: ${props => props.$selected ? '#fff' : '#00d2ff'};
    font-family: 'JetBrains Mono', monospace;
    font-weight: 800;
  }
`;

// Refrigerator parts metadata
const FRIDGE_PARTS = {
  '01': {
    id: 'RF-FC-001',
    name: 'Cool Cabin',
    title: '01 冷藏保鲜层 (Cool Cabin)',
    desc: '双路微冷循环风道技术，智能控温保鲜，温度区间：2℃至8℃。',
    specs: {
      material: '食品级 ABS / 钢化玻璃',
      weight: '18.5 kg',
      status: '正常 (Healthy)',
      temp: '4.0 ℃',
      vibration: '0.1 mm/s',
      power: '---',
      efficiency: '92.0%'
    },
    pos: [0, 0.65, 0.35]
  },
  '02': {
    id: 'RF-FZ-002',
    name: 'Freezer Cabin',
    title: '02 极速冷冻层 (Freezer Cabin)',
    desc: '超导一体风冷无霜蒸发器，最低制冷温度可达 -24℃。',
    specs: {
      material: '发泡聚氨酯 / 铝板',
      weight: '24.2 kg',
      status: '活动 (Active)',
      temp: '-18.0 ℃',
      vibration: '0.2 mm/s',
      power: '---',
      efficiency: '95.0%'
    },
    pos: [0, -0.45, 0.35]
  },
  '03': {
    id: 'RF-CP-003',
    name: 'Compressor',
    title: '03 变频压缩机 (Compressor)',
    desc: '双转子直流变频静音压缩机，能耗比极佳，全天候噪音低于32dB。',
    specs: {
      material: '铸钢 / 铜绕组',
      weight: '12.0 kg',
      status: '正常 (Healthy)',
      temp: '45.2 ℃',
      vibration: '0.8 mm/s',
      power: '120 W',
      efficiency: '96.5%'
    },
    pos: [0, -0.85, -0.45]
  },
  '04': {
    id: 'RF-SP-004',
    name: 'Control Board',
    title: '04 智能控制板 (Control Board)',
    desc: '透光晶体玻璃晶格触屏，集成智能物联控制芯片。',
    specs: {
      material: '微处理器 / LCD 面板',
      weight: '0.85 kg',
      status: '在线 (Online)',
      temp: '28.1 ℃',
      vibration: '0.0 mm/s',
      power: '12 W',
      efficiency: '98.0%'
    },
    pos: [0.55, 0.4, 0.45]
  }
};

// Battery parts metadata
const BATTERY_PARTS = {
  '01': {
    id: 'BT-AT-001',
    name: 'Anode Terminal',
    title: '01 正极汇流端子 (Anode Terminal)',
    desc: '阳极集流体采用高导电防氧化铜合金镀金，接触内阻极低。',
    specs: {
      material: '铜合金镀金',
      weight: '0.12 kg',
      status: '正常 (Healthy)',
      temp: '32.5 ℃',
      vibration: '0.0 mm/s',
      power: '---',
      efficiency: '99.8%'
    },
    pos: [0, 1.15, 0]
  },
  '02': {
    id: 'BT-CT-002',
    name: 'Cathode Terminal',
    title: '02 负极连接端子 (Cathode Terminal)',
    desc: '阴极集流体外层使用高纯度镍片复合冲压压铸而成，散热性极佳。',
    specs: {
      material: '高纯度复合镍板',
      weight: '0.15 kg',
      status: '正常 (Healthy)',
      temp: '31.8 ℃',
      vibration: '0.0 mm/s',
      power: '---',
      efficiency: '99.6%'
    },
    pos: [0, -1.15, 0]
  },
  '03': {
    id: 'BT-MS-003',
    name: 'Matrix Separator',
    title: '03 纳米多孔隔膜 (Matrix Separator)',
    desc: '12μm 多孔聚乙烯安全隔离层，熔融自闭安全防护温度达130℃。',
    specs: {
      material: '多孔聚乙烯安全膜',
      weight: '0.05 kg',
      status: '绝缘 (Healthy)',
      temp: '29.5 ℃',
      vibration: '0.0 mm/s',
      power: '---',
      efficiency: '99.9%'
    },
    pos: [0, 0, 0.15]
  },
  '04': {
    id: 'BT-SE-004',
    name: 'Solid Electrolyte',
    title: '04 固态电解质 (Solid Electrolyte)',
    desc: '新型固态锂聚合物电解质凝胶，大幅抑制锂枝晶生长，消除漏液风险。',
    specs: {
      material: '锂聚合物凝胶',
      weight: '1.45 kg',
      status: '正常 (Healthy)',
      temp: '34.2 ℃',
      vibration: '0.0 mm/s',
      power: '---',
      efficiency: '97.2%'
    },
    pos: [0.35, 0, -0.2]
  }
};

// Turbine parts metadata
const TURBINE_PARTS = {
  '01': {
    id: 'WT-FR-001',
    name: 'Fan Rotor',
    title: '01 桨叶转子 (Fan Rotor)',
    desc: '高刚性碳纤维结构叶片，捕捉微弱风能并转化为转矩机械能。',
    specs: {
      material: '碳纤维复合材料',
      weight: '8.45 吨',
      status: '正常 (Healthy)',
      temp: '32.1 ℃',
      vibration: '1.2 mm/s',
      power: '---',
      efficiency: '94.5%'
    },
    pos: [0, 0.9, 0.4]
  },
  '02': {
    id: 'WT-GS-002',
    name: 'Gear Stage',
    title: '02 行星齿轮级 (Gear Stage)',
    desc: '两级行星齿轮及一级平行齿轮增速机构，将低速轴增速至额定发电转速。',
    specs: {
      material: '合金渗碳钢 18CrNiMo7-6',
      weight: '15.20 吨',
      status: '正常 (Healthy)',
      temp: '54.5 ℃',
      vibration: '2.4 mm/s',
      power: '---',
      efficiency: '97.8%'
    },
    pos: [0, 0.95, -0.15]
  },
  '03': {
    id: 'WT-CS-003',
    name: 'Core Shaft',
    title: '03 主轴系统 (Core Shaft)',
    desc: '高强度锻钢主轴，支承风轮气动力和交变载荷并传递扭矩。',
    specs: {
      material: '合金锻钢 34CrNiMo6',
      weight: '12.80 吨',
      status: '正常 (Healthy)',
      temp: '41.2 ℃',
      vibration: '1.8 mm/s',
      power: '---',
      efficiency: '98.5%'
    },
    pos: [0, 0.8, -0.35]
  },
  '04': {
    id: 'WT-PM-004',
    name: 'Power Module',
    title: '04 变频功率模块 (Power Module)',
    desc: '全功率变流集成柜，实现网侧与电机侧双向变流与电能调制。',
    specs: {
      material: 'IGBT 晶闸管阵列',
      weight: '3.10 吨',
      status: '在线 (Online)',
      temp: '42.3 ℃',
      vibration: '0.8 mm/s',
      power: '3.2 MW',
      efficiency: '96.8%'
    },
    pos: [0, 0.9, -0.6]
  },
  '05': {
    id: 'WT-OP-005',
    name: 'Oil Pump',
    title: '05 循环油泵组 (Oil Pump)',
    desc: '压力强制润滑系统，提供齿轮箱与轴承温控润滑介质。',
    specs: {
      material: '不锈钢泵体',
      weight: '0.85 吨',
      status: '运行 (Running)',
      temp: '38.4 ℃',
      vibration: '3.1 mm/s',
      power: '45 kW',
      efficiency: '88.5%'
    },
    pos: [0, 0.3, -0.2]
  },
  '06': {
    id: 'WT-BH-006',
    name: 'Bearing Housing',
    title: '06 主轴承座箱 (Bearing Housing)',
    desc: '重载调心滚子轴承座，承受风力发电机偏航与俯仰弯矩扭矩载荷。',
    specs: {
      material: '高韧性球墨铸铁 QT400',
      weight: '9.35 吨',
      status: '正常 (Healthy)',
      temp: '45.8 ℃',
      vibration: '1.5 mm/s',
      power: '---',
      efficiency: '99.1%'
    },
    pos: [0, 0.85, -0.8]
  },
  '07': {
    id: 'WT-CU-007',
    name: 'Control Unit',
    title: '07 偏航与主控柜 (Control Unit)',
    desc: '偏航电机驱动器与PLC主控单元，自适应偏航对风与变桨调节。',
    specs: {
      material: 'PLC 变频伺服系统',
      weight: '1.20 吨',
      status: '正常 (Healthy)',
      temp: '35.6 ℃',
      vibration: '0.5 mm/s',
      power: '22 kW',
      efficiency: '95.0%'
    },
    pos: [0, 0.2, -0.5]
  }
};

// 3D Tag and Hotspot Node Component (renders inside R3F)
function TagNode({ partId, name, position, isSelected, onSelect }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += 0.012;
      const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 3.5) * 0.08;
      meshRef.current.scale.setScalar(isSelected ? 1.3 : pulse);
    }
  });

  // Target HTML label offset
  const labelOffset = [0.2, 0.18, 0];

  return (
    <group position={position}>
      {/* Hotspot sphere (Clickable / Hoverable) */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={isSelected ? '#ffffff' : '#3b82f6'} transparent opacity={0.8} />
      </mesh>

      {/* Pulsing wireframe circle */}
      <mesh ref={meshRef}>
        <ringGeometry args={[0.06, 0.08, 16]} />
        <meshBasicMaterial
          color={isSelected ? '#ffffff' : '#3b82f6'}
          side={THREE.DoubleSide}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Floating Leader Line (draws connection from hotspot [0,0,0] to labelOffset) */}
      {isSelected && (
        <Line
          points={[[0, 0, 0], labelOffset]}
          color="#3b82f6"
          lineWidth={1.2}
          transparent
          opacity={0.5}
        />
      )}

      {/* Floating 3D Label Tag */}
      <Html position={labelOffset} center distanceFactor={6.2}>
        <TagLabel $selected={isSelected} onClick={onSelect}>
          <span className="num">{partId}</span>
          <span className="name">{name}</span>
        </TagLabel>
      </Html>
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

// Procedural high-fidelity Wind Turbine Model loaded from GLB
function Turbine({ explode }) {
  const { scene } = useGLTF("/model/glb/turbine.glb");
  const objRef = useRef();

  useFrame((state, delta) => {
    if (!objRef.current) return;
    
    // Rotate the blades when not exploded or slowly when exploded
    const blades = objRef.current.getObjectByName("defaultMaterial_45");
    if (blades) {
      blades.rotateY(delta * (1.2 * (1 - explode * 0.85))); // Rotates slower as it explodes
    }

    // Apply real-time explode translation along Z axis
    const children = objRef.current.children;
    if (children && children.length > 0) {
      const length = children.length;
      const mid = (length - 1) / 2;
      const step = 0.15;

      children.forEach((child, index) => {
        if (child.isMesh) {
          if (!child.userData.originPosition) {
            child.userData.originPosition = child.position.clone();
          }
          const originPos = child.userData.originPosition;
          const offset = (index - mid) * step * explode;
          child.position.z = originPos.z + offset;
        }
      });
    }
  });

  return (
    <group scale={1.2} position={[0, -0.6, 0]} rotation={[0, Math.PI / 2, 0]}>
      <Clone
        deep
        castShadow
        receiveShadow
        ref={objRef}
        object={scene}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (e.object.isMesh) {
            e.object.userData.originHex = e.object.material.emissive?.getHex() || 0;
            e.object.material.emissive?.setHex(0x3b82f6);
          }
        }}
        onPointerOut={(e) => {
          if (e.object.isMesh) {
            e.object.material.emissive?.setHex(e.object.userData.originHex || 0);
          }
        }}
      />
    </group>
  );
}

// Scene controller that binds models, rotation physics, and hotspots
function SpatialScene({
  activeModel,
  explode,
  setExplode,
  selectedPartId,
  setSelectedPartId,
  fov,
  autoRotate,
  cameraPreset,
  setCameraPreset,
  focusMode
}) {
  const groupRef = useRef();
  const tickRingRef = useRef();

  useFrame((state, delta) => {
    const { camera, controls } = state;
    const group = groupRef.current;
    if (!group) return;

    // Smoothly LERP camera fov for lens zoom effect
    const targetFov = focusMode ? 30 : fov;
    if (camera.fov !== targetFov) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.15);
      camera.updateProjectionMatrix();
    }

    // Smoothly animate camera to presets
    if (cameraPreset) {
      const targetPos = new THREE.Vector3(0, 0, 4.8);
      switch (cameraPreset) {
        case 'home':
          targetPos.set(0, 0, 4.8);
          break;
        case 'front':
          targetPos.set(0, 0, 4.8);
          break;
        case 'side':
          targetPos.set(4.8, 0, 0.01);
          break;
        case 'top':
          targetPos.set(0, 4.8, 0.01);
          break;
        case 'iso':
          targetPos.set(3.2, 2.5, 3.2);
          break;
        default:
          break;
      }

      camera.position.lerp(targetPos, 0.1);
      
      if (controls) {
        controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.1);
        controls.update();
      }

      if (camera.position.distanceTo(targetPos) < 0.02) {
        setCameraPreset(null);
      }
    }

    // Rotate tick ring
    if (tickRingRef.current) {
      tickRingRef.current.rotation.z -= delta * 0.15;
    }
  });

  const partsData = activeModel === 'fridge' 
    ? FRIDGE_PARTS 
    : (activeModel === 'battery' ? BATTERY_PARTS : TURBINE_PARTS);

  const getExplodedPosition = (id, pos) => {
    const [x, y, z] = pos;
    if (activeModel === 'turbine') {
      // The turbine GLB is oriented along local Z-axis (blades at positive Z, generator at negative Z)
      // and rotated by [0, Math.PI / 2, 0] inside parent space.
      let localX = 0;
      let localY = 0;
      let localZ = 0;
      
      switch (id) {
        case '01': // Fan Rotor (Blades)
          localX = 0; localY = 1.25; localZ = 0.83;
          break;
        case '02': // Gear Stage
          localX = 0; localY = 1.29; localZ = 0.38;
          break;
        case '03': // Core Shaft
          localX = 0; localY = 1.17; localZ = 0.15;
          break;
        case '04': // Power Module
          localX = 0; localY = 1.25; localZ = -0.2;
          break;
        case '05': // Oil Pump
          localX = 0; localY = 0.75; localZ = -0.4;
          break;
        case '06': // Bearing Housing
          localX = 0; localY = 1.17; localZ = -0.6;
          break;
        case '07': // Control Unit
          localX = 0; localY = 0.67; localZ = -0.3;
          break;
        default:
          return pos;
      }
      
      // Calculate local Z explode displacement
      const zOffset = localZ * explode * 0.85;
      const explodedLocalZ = localZ + zOffset;
      
      // Project local GLB coordinates to rotated parent space:
      // Rotated by PI/2 around Y: [localX, localY, localZ] -> [localZ, localY, -localX]
      // Scaled by 1.2, and shifted by -0.6 along the Y-axis.
      const globalX = explodedLocalZ * 1.2;
      const globalY = localY * 1.2 - 0.6;
      const globalZ = -localX * 1.2;
      
      return [globalX, globalY, globalZ];
    }
    
    if (activeModel === 'battery') {
      // Battery translates along different axes
      if (id === '01') return [x, y + explode * 0.5, z];
      if (id === '02') return [x, y - explode * 0.5, z];
      if (id === '03') return [x, y, z + explode * 0.4];
      if (id === '04') return [x, y, z - explode * 0.4];
    }
    
    if (activeModel === 'fridge') {
      // Fridge slides forward or shifts down
      if (id === '01') return [x, y, z + explode * 0.42];
      if (id === '02') return [x, y, z + explode * 0.72];
      if (id === '03') return [x, y - explode * 0.35, z - explode * 0.28];
      if (id === '04') return [x - explode * 0.35, y, z + explode * 0.45];
    }
    
    return pos;
  };

  const gridY = activeModel === 'fridge' ? -1.005 : (activeModel === 'battery' ? -0.905 : -0.605);

  const ambientIntensity = focusMode ? 2.0 : 1.5;
  const hemisphereIntensity = focusMode ? 2.2 : 1.8;
  const keyLightIntensity = focusMode ? 5.5 : 4.5;

  return (
    <>
      {/* Deep blue tech studio ambient lights */}
      <ambientLight intensity={ambientIntensity} color="#0a182c" />
      <hemisphereLight skyColor="#00d2ff" groundColor="#0f2b46" intensity={hemisphereIntensity} />
      
      {/* Key Light (Strong cyan studio light) */}
      <directionalLight 
        position={[8, 12, 8]} 
        intensity={keyLightIntensity} 
        color="#00d2ff" 
        castShadow 
      />

      {/* Fill Light (Soft purple tint) */}
      <directionalLight 
        position={[-8, 4, 8]} 
        intensity={2.0} 
        color="#b026ff" 
      />

      {/* Bounce Light */}
      <directionalLight 
        position={[0, -5, 0]} 
        intensity={1.0} 
        color="#0f2b46" 
      />

      <Environment files="/hdr/venice_sunset_1k.hdr" intensity={0.5} />

      {/* Tech Grid on the floor */}
      <Grid
        infiniteGrid
        renderOrder={-1}
        position={[0, gridY, 0]}
        cellSize={0.5}
        cellThickness={0.5}
        sectionSize={2.5}
        sectionThickness={1.0}
        sectionColor="#005577"
        cellColor="#002233"
        fadeDistance={20}
      />

      {/* Concentric Hologram Rings */}
      <group position={[0, gridY + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[0.8, 0.81, 64]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <ringGeometry args={[1.2, 1.205, 64]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.18} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <ringGeometry args={[1.5, 1.502, 64]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.08} side={THREE.DoubleSide} />
        </mesh>
        {/* Rotating tick ring */}
        <mesh ref={tickRingRef}>
          <ringGeometry args={[0.95, 1.0, 32]} />
          <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.22} side={THREE.DoubleSide} />
        </mesh>
      </group>
      
      <group ref={groupRef} rotation={[0.15, -0.4, 0]}>
        {/* Render selected model */}
        {activeModel === 'fridge' ? (
          <Refrigerator explode={explode} />
        ) : activeModel === 'battery' ? (
          <Battery explode={explode} />
        ) : (
          <Turbine explode={explode} />
        )}

        {/* Render respective tag nodes */}
        {Object.entries(partsData).map(([id, item]) => {
          const explodedPos = getExplodedPosition(id, item.pos);
          return (
            <TagNode
              key={id}
              partId={id}
              name={item.name}
              position={explodedPos}
              isSelected={selectedPartId === id}
              onSelect={() => setSelectedPartId(id)}
            />
          );
        })}
      </group>
    </>
  );
}

const ObjectItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.8rem;
  background: ${props => props.$active ? 'rgba(37, 99, 235, 0.15)' : 'rgba(255, 255, 255, 0.02)'};
  border: 1px solid ${props => props.$active ? 'rgba(80, 180, 255, 0.45)' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
  color: ${props => props.$active ? '#ffffff' : '#cbd5e1'};
  box-shadow: ${props => props.$active ? '0 0 12px rgba(80, 180, 255, 0.15)' : 'none'};

  &:hover {
    background: rgba(37, 99, 235, 0.08);
    border-color: rgba(37, 99, 235, 0.4);
    color: #ffffff;
  }

  .label-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${props => props.$active ? '#00f0ff' : 'transparent'};
    box-shadow: ${props => props.$active ? '0 0 6px #00f0ff' : 'none'};
  }
`;

const TreeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding-left: 0.5rem;
  border-left: 1px dashed rgba(80, 180, 255, 0.15);
`;

const TreeItem = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: ${props => props.$active ? '#00f0ff' : '#cbd5e1'};
  background: ${props => props.$active ? 'rgba(0, 240, 255, 0.06)' : 'transparent'};
  transition: all 0.15s ease;

  &:hover {
    color: #00f0ff;
    background: rgba(0, 240, 255, 0.03);
  }

  &::before {
    content: '';
    position: absolute;
    left: -0.5rem;
    top: 50%;
    width: 0.4rem;
    height: 1px;
    border-bottom: 1px dashed rgba(80, 180, 255, 0.15);
  }
`;

const BottomDock = styled.div`
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.8rem;
  background: rgba(10, 16, 27, 0.78);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(80, 180, 255, 0.22);
  box-shadow: inset 0 0 16px rgba(80, 180, 255, 0.04), 0 12px 30px rgba(0, 0, 0, 0.45);
  border-radius: 30px;
  padding: 0.5rem 1.2rem;
  z-index: 6;
  pointer-events: auto;
  transition: all 0.3s ease;

  @media (max-width: 968px) {
    position: relative;
    bottom: auto;
    left: auto;
    transform: none;
    flex-wrap: wrap;
    justify-content: center;
    border-radius: 12px;
    padding: 0.8rem;
    margin: 1rem 1.5rem;
  }

  .dock-section {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .divider {
    width: 1px;
    height: 18px;
    background: rgba(80, 180, 255, 0.15);
  }

  .label {
    font-size: 0.65rem;
    font-weight: 700;
    color: #8fa3b5;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-family: 'Outfit', sans-serif;
  }

  button {
    background: transparent;
    border: 1px solid transparent;
    color: #cbd5e1;
    cursor: pointer;
    font-family: 'Outfit', sans-serif;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.3rem 0.6rem;
    border-radius: 15px;
    display: flex;
    align-items: center;
    gap: 0.2rem;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(80, 180, 255, 0.08);
      border-color: rgba(80, 180, 255, 0.2);
      color: #fff;
    }

    &.active {
      background: rgba(37, 99, 235, 0.25);
      border-color: rgba(80, 180, 255, 0.4);
      color: #00f0ff;
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.15);
    }
  }

  .zoom-display {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: #00f0ff;
    min-width: 38px;
    text-align: center;
  }

  .explode-control {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;

    input[type='range'] {
      -webkit-appearance: none;
      width: 70px;
      height: 3px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.1);
      outline: none;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #00f0ff;
        cursor: pointer;
        box-shadow: 0 0 4px #00f0ff;
      }
    }
  }
`;

const EdgeTab = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${props => props.$left ? 'left: 0.5rem;' : 'right: 0.5rem;'}
  background: rgba(10, 16, 27, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(80, 180, 255, 0.2);
  color: #00f0ff;
  font-family: 'Outfit', sans-serif;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 1rem 0.35rem;
  border-radius: 4px;
  writing-mode: vertical-lr;
  cursor: pointer;
  z-index: 10;
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: ${props => props.$visible ? 'auto' : 'none'};
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);

  &:hover {
    background: rgba(37, 99, 235, 0.15);
    border-color: #00f0ff;
  }
`;

const Sparkline = ({ color = '#00f0ff', points = [10, 25, 15, 30, 20, 35, 15, 40, 25, 30] }) => {
  const width = 80;
  const height = 16;
  const step = width / (points.length - 1);
  const pathData = points
    .map((p, index) => `${index === 0 ? 'M' : 'L'} ${index * step} ${height - (p / 45) * height}`)
    .join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <path d={pathData} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={pathData} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.15" style={{ filter: 'blur(1px)' }} />
    </svg>
  );
};

export default function SpatialUI() {
  const navigate = useNavigate();
  const [activeModel, setActiveModel] = useState('fridge'); // 'fridge', 'battery', 'turbine'
  const [explodeAmount, setExplodeAmount] = useState(0.0);
  
  // High-fidelity active sub-component selection state (defaults to '01')
  const [selectedPartId, setSelectedPartId] = useState('01');

  // Camera view configuration states
  const [fov, setFov] = useState(48);
  const [autoRotate, setAutoRotate] = useState(true);
  const [cameraPreset, setCameraPreset] = useState(null);
  const [focusMode, setFocusMode] = useState(false);

  // Temporary slide-out expanders for sidebars when focusMode is active
  const [tempTelemetryShow, setTempTelemetryShow] = useState(false);
  const [tempConfigShow, setTempConfigShow] = useState(false);

  // Hook states
  const {
    trackingMode,
    setTrackingMode,
    handDetected,
    cursor,
    isPinching,
    isConnected,
    wsUrl,
    setWsUrl,
  } = useHandTracking();

  // Reset selected part when switching models
  React.useEffect(() => {
    setSelectedPartId('01');
  }, [activeModel]);

  const handleBack = () => {
    navigate('/projects');
  };

  const partsData = activeModel === 'fridge' 
    ? FRIDGE_PARTS 
    : (activeModel === 'battery' ? BATTERY_PARTS : TURBINE_PARTS);

  const selectedPart = partsData[selectedPartId] || Object.values(partsData)[0];

  return (
    <PageContainer>
      <Header>
        <div className="logo-section" onClick={() => navigate('/')}>
          <span className="icon">⚙️</span>
          <h1>3D 零件拆解沙盒 · Product Configurator</h1>
        </div>
        <button className="nav-back" onClick={handleBack}>
          返回造物坊
        </button>
      </Header>

      <MainContent>
        {/* Edge toggle tabs visible only in Focus Mode */}
        <EdgeTab
          $left
          $visible={focusMode}
          onClick={() => setTempTelemetryShow(prev => !prev)}
        >
          {tempTelemetryShow ? '◀ 交互遥测' : '交互遥测 ▶'}
        </EdgeTab>
        
        <EdgeTab
          $visible={focusMode}
          onClick={() => setTempConfigShow(prev => !prev)}
        >
          {tempConfigShow ? '参数配置 ▶' : '◀ 参数配置'}
        </EdgeTab>

        {/* Left Side: Telemetry Control Panel */}
        <Sidebar $left $focus={focusMode && !tempTelemetryShow}>
          <HudCard>
            <h3>交互模式</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.4rem' }}>
              {[
                { label: '鼠标轨迹', mode: TRACKING_MODES.MOUSE, icon: '🖱️' },
                { label: '手势捕捉', mode: TRACKING_MODES.CAMERA, icon: '📷' },
                { label: '仿真模拟', mode: TRACKING_MODES.SIMULATE, icon: '🌀' },
                { label: '网口服务', mode: TRACKING_MODES.WEBSOCKET, icon: '🔌' }
              ].map(m => (
                <button
                  key={m.label}
                  className={`option ${trackingMode === m.mode ? 'active' : ''}`}
                  onClick={() => setTrackingMode(m.mode)}
                  style={{
                    padding: '0.45rem',
                    fontSize: '0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    justifyContent: 'center',
                    background: trackingMode === m.mode ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${trackingMode === m.mode ? '#00f0ff' : 'rgba(255,255,255,0.08)'}`,
                    color: trackingMode === m.mode ? '#fff' : '#cbd5e1',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </HudCard>

          {trackingMode === TRACKING_MODES.WEBSOCKET && (
            <HudCard>
              <h3>WebSocket 连接设置</h3>
              <div className="slider-group" style={{ marginTop: '0.2rem' }}>
                <label>服务器地址</label>
                <input
                  type="text"
                  value={wsUrl}
                  onChange={(e) => setWsUrl(e.target.value)}
                  style={{
                    background: 'rgba(15, 17, 23, 0.6)',
                    border: '1px solid rgba(80, 180, 255, 0.15)',
                    color: '#fff',
                    padding: '0.4rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <span className="tech-info" style={{ color: isConnected ? '#10b981' : '#ef4444', display: 'block', marginTop: '0.2rem' }}>
                {isConnected ? '● 已连接 (CONNECTED)' : '○ 未连接 (DISCONNECTED)'}
              </span>
            </HudCard>
          )}

          <HudCard>
            <h3>追踪状态</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem' }}>
                <span style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: handDetected ? '#10b981' : '#ef4444',
                  boxShadow: handDetected ? '0 0 6px #10b981' : '0 0 6px #ef4444'
                }} />
                <span style={{ color: '#cbd5e1', fontFamily: 'JetBrains Mono, monospace' }}>
                  {handDetected ? '在线 (ONLINE)' : '离线 (OFFLINE)'}
                </span>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#00f0ff' }}>
                置信度: {handDetected ? '98.4%' : '0.0%'}
              </span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: handDetected ? '98.4%' : '0%', transition: 'width 0.3s ease' }} />
            </div>
          </HudCard>

          <HudCard>
            <h3>指针数据</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.2rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              <div>X轴: <span style={{ color: '#fff' }}>{cursor.x.toFixed(3)}</span></div>
              <div>Y轴: <span style={{ color: '#fff' }}>{cursor.y.toFixed(3)}</span></div>
              <div>Z轴: <span style={{ color: '#fff' }}>{isPinching ? '0.214' : '0.000'}</span></div>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <svg width="100%" height="60" style={{ background: 'rgba(0,0,0,0.22)', borderRadius: '6px', border: '1px solid rgba(80,180,255,0.1)' }}>
                <defs>
                  <pattern id="pointer-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(80,180,255,0.06)" strokeWidth="0.8" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#pointer-grid)" />
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(80,180,255,0.15)" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(80,180,255,0.15)" strokeWidth="0.5" strokeDasharray="2,2" />
                <circle cx={`${50 + cursor.x * 50}%`} cy={`${50 - cursor.y * 50}%`} r="3.5" fill="#00f0ff" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)', transition: 'cx 0.05s, cy 0.05s' }} />
              </svg>
            </div>
          </HudCard>

          <HudCard>
            <h3>性能诊断</h3>
            <div className="sparkline-row" style={{ marginTop: '0.2rem' }}>
              <span>帧率 (FPS): <span style={{ color: '#fff' }}>59.8</span></span>
              <Sparkline color="#00ff88" points={[15, 18, 17, 16, 20, 19, 21, 20, 18, 20]} />
            </div>
            <div className="sparkline-row">
              <span>延时 (Latency): <span style={{ color: '#fff' }}>11ms</span></span>
              <Sparkline color="#ffaa00" points={[10, 8, 12, 11, 15, 12, 10, 9, 11, 8]} />
            </div>
            <div className="sparkline-row">
              <span>追踪量 (Quality): <span style={{ color: '#fff' }}>99.2%</span></span>
              <Sparkline color="#00a8ff" points={[5, 12, 18, 15, 8, 22, 14, 18, 10, 15]} />
            </div>
          </HudCard>
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
                gl.toneMappingExposure = 1.45;
              }}
            >
              <Suspense fallback={null}>
                <SpatialScene
                  activeModel={activeModel}
                  explode={explodeAmount}
                  setExplode={setExplodeAmount}
                  selectedPartId={selectedPartId}
                  setSelectedPartId={setSelectedPartId}
                  fov={fov}
                  autoRotate={autoRotate}
                  cameraPreset={cameraPreset}
                  setCameraPreset={setCameraPreset}
                  focusMode={focusMode}
                />
                <OrbitControls
                  enableZoom={true}
                  enablePan={false}
                  maxDistance={8}
                  minDistance={2}
                  enabled={!handDetected}
                  onStart={() => setCameraPreset(null)}
                />
                <Preload all />
              </Suspense>
            </Canvas>
          </ErrorBoundary>

          {/* Floating Camera Control Dock */}
          <BottomDock>
            <span className="label">视角控制</span>
            <div className="divider" />
            
            <div className="dock-section">
              <button onClick={() => setFov(prev => Math.min(85, prev + 3))} title="拉远视角 (➖)">
                ➖
              </button>
              <span className="zoom-display">
                {Math.round((48 / fov) * 100)}%
              </span>
              <button onClick={() => setFov(prev => Math.max(15, prev - 3))} title="拉近视角 (➕)">
                ➕
              </button>
            </div>
            
            <div className="divider" />
            
            <div className="dock-section">
              {[
                { id: 'home', label: '重置' },
                { id: 'front', label: '前视' },
                { id: 'side', label: '侧视' },
                { id: 'top', label: '俯视' },
                { id: 'iso', label: '等轴' }
              ].map(view => (
                <button
                  key={view.id}
                  className={cameraPreset === view.id ? 'active' : ''}
                  onClick={() => setCameraPreset(view.id)}
                >
                  {view.label}
                </button>
              ))}
            </div>
            
            <div className="divider" />
            
            <div className="dock-section explode-control">
              <span style={{ color: '#8fa3b5', fontWeight: 600 }}>拆解系数</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={explodeAmount}
                onChange={(e) => setExplodeAmount(parseFloat(e.target.value))}
              />
              <span style={{ fontFamily: 'JetBrains Mono', color: '#00f0ff', minWidth: '32px' }}>
                {Math.round(explodeAmount * 100)}%
              </span>
            </div>
            
            <div className="divider" />
            
            <button
              className={autoRotate ? 'active' : ''}
              onClick={() => setAutoRotate(prev => !prev)}
              title="切换自动旋转"
            >
              🔄 自动旋转
            </button>
            
            <div className="divider" />
            
            <button
              className={focusMode ? 'active' : ''}
              onClick={() => {
                setFocusMode(prev => {
                  const next = !prev;
                  setTempTelemetryShow(false);
                  setTempConfigShow(false);
                  return next;
                });
              }}
              style={{
                background: focusMode ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                borderColor: focusMode ? 'rgba(239, 68, 68, 0.4)' : 'transparent',
                color: focusMode ? '#ef4444' : '#cbd5e1'
              }}
            >
              🎯 {focusMode ? '退出观察' : '沉浸观察'}
            </button>
          </BottomDock>

          <div className="pip-instructions">
            💡 提示: 点击 3D 场景中的 <span style={{ color: '#00f0ff', fontWeight: 900 }}>标签点位</span> 即可高亮并追踪该零件，数据在右侧面板同步更新。
            {handDetected ? ' 捏合并上下拖拽，即可空中拆解模型。' : ' 拖拽鼠标即可旋转模型，缩放手轮可调节焦距。'}
          </div>
        </CanvasContainer>

        {/* Right Side: Model Parameter Configuration */}
        <Sidebar $right $focus={focusMode && !tempConfigShow}>
          <HudCard>
            <h3>展示对象库</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.3rem' }}>
              {[
                { id: 'turbine', label: 'Wind Turbine', desc: 'MW 级双馈风力发电机', icon: '⚙️' },
                { id: 'battery', label: 'Battery Pack', desc: '固态聚合物电解质电池', icon: '🔋' },
                { id: 'fridge', label: 'Refrigerator', desc: '全息智能温控冷藏机', icon: '❄️' }
              ].map(item => (
                <ObjectItem
                  key={item.id}
                  $active={activeModel === item.id}
                  onClick={() => {
                    setActiveModel(item.id);
                  }}
                >
                  <div className="label-group">
                    <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{item.label}</span>
                      <span style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '1px' }}>{item.desc}</span>
                    </div>
                  </div>
                  <div className="status-indicator" />
                </ObjectItem>
              ))}
            </div>
          </HudCard>

          <HudCard>
            <h3>零件浏览器</h3>
            <div style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '4px', scrollbarWidth: 'thin' }}>
              <TreeContainer>
                {Object.entries(partsData).map(([id, item]) => (
                  <TreeItem
                    key={id}
                    $active={selectedPartId === id}
                    onClick={() => setSelectedPartId(id)}
                  >
                    <span style={{ color: selectedPartId === id ? '#00f0ff' : 'rgba(80, 180, 255, 0.65)' }}>{id}</span>
                    <span>{item.name}</span>
                  </TreeItem>
                ))}
              </TreeContainer>
            </div>
          </HudCard>

          <HudCard style={{ flex: 1 }}>
            <h3>组件全息数据</h3>
            {selectedPart ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00f0ff' }}>{selectedPart.name}</span>
                  <span style={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono', background: 'rgba(80,180,255,0.12)', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid rgba(80,180,255,0.2)' }}>
                    {selectedPart.id}
                  </span>
                </div>
                
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.45 }}>
                  {selectedPart.desc}
                </p>
                
                <div style={{ height: '1px', background: 'rgba(80, 180, 255, 0.12)', margin: '0.2rem 0' }} />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem 0.6rem', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: '#cbd5e1' }}>
                  <div>材料: <span style={{ color: '#fff' }}>{selectedPart.specs.material}</span></div>
                  <div>重量: <span style={{ color: '#fff' }}>{selectedPart.specs.weight}</span></div>
                  <div>状态: <span style={{ color: selectedPart.specs.status.includes('Active') || selectedPart.specs.status.includes('Running') || selectedPart.specs.status.includes('Healthy') || selectedPart.specs.status.includes('Online') || selectedPart.specs.status.includes('正常') || selectedPart.specs.status.includes('活动') || selectedPart.specs.status.includes('运行') || selectedPart.specs.status.includes('在线') ? '#10b981' : '#ffaa00' }}>
                    {selectedPart.specs.status}
                  </span></div>
                  <div>温度: <span style={{ color: '#fff' }}>{selectedPart.specs.temp}</span></div>
                  {selectedPart.specs.vibration && selectedPart.specs.vibration !== '---' && (
                    <div style={{ gridColumn: 'span 2' }}>振动: <span style={{ color: '#fff' }}>{selectedPart.specs.vibration}</span></div>
                  )}
                  {selectedPart.specs.power && selectedPart.specs.power !== '---' && (
                    <div style={{ gridColumn: 'span 2' }}>功率: <span style={{ color: '#fff' }}>{selectedPart.specs.power}</span></div>
                  )}
                  {selectedPart.specs.efficiency && selectedPart.specs.efficiency !== '---' && (
                    <div style={{ gridColumn: 'span 2' }}>效率: <span style={{ color: '#fff' }}>{selectedPart.specs.efficiency}</span></div>
                  )}
                </div>
              </div>
            ) : (
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>请选择一个零件以查看其全息遥测参数</span>
            )}
          </HudCard>
        </Sidebar>
      </MainContent>
    </PageContainer>
  );
}
