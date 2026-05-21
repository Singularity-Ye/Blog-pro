/* eslint-disable react/no-unknown-property */
/* @refresh reset */
'use client';
import { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { useTexture, Environment, Lightformer } from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
} from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';
import './Lanyard.css';

import cardImage from '../../assets/images/card.png';

extend({ MeshLineGeometry, MeshLineMaterial });

const CONNECTOR_HEADER_H = 0.16;
const CONNECTOR_THICKNESS = 0.045;
const CONNECTOR_SUCTION_Y = CONNECTOR_HEADER_H / 2 + 0.075;

/* ─────────────────────────────────────────
   舌头纹理 — 模块级单例
   粉紫渐变 + 中央湿润高光 + 横向肉纹
───────────────────────────────────────── */
let _tongueTex = null;
function getTongueTexture() {
  if (_tongueTex) return _tongueTex;

  const W = 512;
  const H = 96;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 主体渐变：边缘暗，中间亮
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, '#b8326f');
  base.addColorStop(0.18, '#e86f9e');
  base.addColorStop(0.5, '#ff9db8');
  base.addColorStop(0.82, '#e86f9e');
  base.addColorStop(1, '#9f245f');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // 中央湿润高光
  const highlight = ctx.createLinearGradient(0, 0, 0, H);
  highlight.addColorStop(0, 'rgba(255,255,255,0)');
  highlight.addColorStop(0.42, 'rgba(255,230,240,0.32)');
  highlight.addColorStop(0.5, 'rgba(255,255,255,0.45)');
  highlight.addColorStop(0.58, 'rgba(255,230,240,0.25)');
  highlight.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = highlight;
  ctx.fillRect(0, 0, W, H);

  // 细微横向肉纹
  for (let x = 0; x < W; x += 18) {
    ctx.strokeStyle = 'rgba(120, 20, 70, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, H * 0.2);
    ctx.quadraticCurveTo(x + 8, H * 0.5, x, H * 0.8);
    ctx.stroke();
  }

  // 少量亮斑
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * W;
    const y = H * 0.25 + Math.random() * H * 0.5;
    const r = Math.random() * 1.4 + 0.4;
    ctx.fillStyle = 'rgba(255, 230, 240, 0.18)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  _tongueTex = new THREE.CanvasTexture(canvas);
  _tongueTex.wrapS = THREE.RepeatWrapping;
  _tongueTex.wrapT = THREE.RepeatWrapping;
  _tongueTex.colorSpace = THREE.SRGBColorSpace;

  return _tongueTex;
}

/* ─────────────────────────────────────────
   蛙怪脑袋 — 几何拼装版
   默认 / hover / dragged 三种眼睛状态
───────────────────────────────────────── */
function FrogHead({ position = [0, 0, 0], dragged = false, hovered = false }) {
  const headRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();

  useFrame((state) => {
    if (!headRef.current) return;
    const t = state.clock.elapsedTime;
    headRef.current.position.y = position[1] + Math.sin(t * 1.8) * 0.035;
    headRef.current.rotation.z = Math.sin(t * 1.2) * 0.035;

    // 眼睛看向鼠标方向
    const targetX = state.pointer.x * 0.04;
    const targetY = state.pointer.y * 0.03;
    [leftEyeRef, rightEyeRef].forEach((ref) => {
      if (ref.current) {
        ref.current.rotation.y += (targetX - ref.current.rotation.y) * 0.08;
        ref.current.rotation.x += (targetY - ref.current.rotation.x) * 0.08;
      }
    });
  });

  const eyeScale = dragged ? 1.18 : hovered ? 1.08 : 1;
  const mouthOpen = dragged ? 0.06 : hovered ? 0.03 : 0;

  return (
    <group ref={headRef} position={position} scale={0.9}>
      {/* 脑袋主体 */}
      <mesh>
        <sphereGeometry args={[0.45, 32, 24]} />
        <meshStandardMaterial
          color="#7dd3a8"
          roughness={0.55}
          metalness={0.02}
        />
      </mesh>

      {/* 头顶小凸起 */}
      <mesh position={[0, 0.38, -0.05]}>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshStandardMaterial color="#6bc99a" roughness={0.6} />
      </mesh>

      {/* 左眼 */}
      <group position={[-0.22, 0.24, 0.28]} scale={eyeScale}>
        <mesh>
          <sphereGeometry args={[0.12, 24, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.35} />
        </mesh>
        <group ref={leftEyeRef}>
          <mesh position={[0, 0, 0.08]}>
            <sphereGeometry args={[0.05, 16, 12]} />
            <meshStandardMaterial color="#111827" />
          </mesh>
          {/* 眼睛高光 */}
          <mesh position={[0.02, 0.025, 0.1]}>
            <sphereGeometry args={[0.018, 12, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>
        </group>
      </group>

      {/* 右眼 */}
      <group position={[0.22, 0.24, 0.28]} scale={eyeScale}>
        <mesh>
          <sphereGeometry args={[0.12, 24, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.35} />
        </mesh>
        <group ref={rightEyeRef}>
          <mesh position={[0, 0, 0.08]}>
            <sphereGeometry args={[0.05, 16, 12]} />
            <meshStandardMaterial color="#111827" />
          </mesh>
          <mesh position={[0.02, 0.025, 0.1]}>
            <sphereGeometry args={[0.018, 12, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>
        </group>
      </group>

      {/* 嘴巴 — 半圆弧，舌头从中间吐出 */}
      <group position={[0, -0.12 - mouthOpen, 0.38]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.16, 0.025, 12, 32, Math.PI]} />
          <meshStandardMaterial color="#3f1d2f" roughness={0.5} />
        </mesh>
        {/* 嘴巴内侧 */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.01]}>
          <torusGeometry args={[0.13, 0.015, 12, 32, Math.PI]} />
          <meshStandardMaterial color="#8b2252" roughness={0.4} />
        </mesh>
      </group>

      {/* 腮红 */}
      <mesh position={[-0.3, 0.08, 0.3]} rotation={[0, 0.3, 0]}>
        <circleGeometry args={[0.08, 24]} />
        <meshStandardMaterial
          color="#f9a8d4"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0.3, 0.08, 0.3]} rotation={[0, -0.3, 0]}>
        <circleGeometry args={[0.08, 24]} />
        <meshStandardMaterial
          color="#f9a8d4"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────
   卡片背面纹理 — Canvas 生成 Explorer Profile
   简化版：4 块大字，3D 晃动时也能看清
───────────────────────────────────────── */
let _backTex = null;
function getBackTexture() {
  if (_backTex) return _backTex;

  const W = 778;
  const H = 1008;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 背景
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0c0a1a');
  bg.addColorStop(0.5, '#141030');
  bg.addColorStop(1, '#0c0a1a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 微弱网格
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  const px = (v) => v * (W / 400);
  ctx.textAlign = 'center';

  // ── 标题 ──
  ctx.font = `bold ${px(14)}px "Inter", "SF Pro", system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(167, 139, 250, 0.6)';
  ctx.fillText('EXPLORER PROFILE', W / 2, px(70));

  // 分隔线
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px(50), px(90));
  ctx.lineTo(W - px(50), px(90));
  ctx.stroke();

  // ── 身份信息 — 大字，4 行 ──
  const labelX = W * 0.22;
  const valX = W * 0.42;
  let y = px(130);
  const gap = px(48);

  const drawRow = (label, value) => {
    ctx.textAlign = 'left';
    ctx.font = `bold ${px(10)}px "Inter", "SF Mono", monospace`;
    ctx.fillStyle = 'rgba(167, 139, 250, 0.55)';
    ctx.fillText(label, labelX, y);

    ctx.font = `${px(11)}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(224, 231, 255, 0.9)';
    ctx.fillText(value, valX, y);
    y += gap;
  };

  drawRow('ROLE', 'Developer / Explorer');
  drawRow('FOCUS', 'Web · AI · Obsidian · Travel');
  drawRow('MODE', 'Build · Note · Visualize');
  drawRow('STATUS', '● Online');

  // 分隔线
  y += px(6);
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px(50), y);
  ctx.lineTo(W - px(50), y);
  ctx.stroke();
  y += px(30);

  // ── 系统一行 ──
  ctx.textAlign = 'center';
  ctx.font = `${px(9.5)}px "Inter", "SF Mono", monospace`;
  ctx.fillStyle = 'rgba(224, 231, 255, 0.4)';
  ctx.fillText('Blog · Obsidian · Travel Atlas', W / 2, y);
  y += px(36);

  // 分隔线
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px(80), y);
  ctx.lineTo(W - px(80), y);
  ctx.stroke();
  y += px(36);

  // ── 底部标语 ──
  ctx.font = `italic ${px(10)}px "Inter", system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(167, 139, 250, 0.5)';
  ctx.fillText('从笔记出发，延伸到地图、项目与世界。', W / 2, y);
  y += px(40);

  // 装饰小点
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(W / 2 + i * px(12), y, px(2), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(167, 139, 250, ${0.15 + Math.abs(2 - Math.abs(i)) * 0.1})`;
    ctx.fill();
  }

  _backTex = new THREE.CanvasTexture(canvas);
  _backTex.colorSpace = THREE.SRGBColorSpace;
  return _backTex;
}

/* ─────────────────────────────────────────
   吊头组件 — 窄圆角塑料片 + 金属环 + 舌尖
   独立 scale，不跟卡片主体一起放大
───────────────────────────────────────── */
function SuctionCup({ dragged = false, hovered = false }) {
  const cupRef = useRef();
  const sealRef = useRef();
  const shineRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pull = dragged ? 1 : hovered ? 0.45 : 0;
    const pulse = Math.sin(t * 5.5) * 0.025;

    if (cupRef.current) {
      cupRef.current.scale.set(
        1.85 + pull * 0.22 + pulse,
        0.7 - pull * 0.08,
        0.28 + pull * 0.03
      );
    }

    if (sealRef.current) {
      sealRef.current.scale.set(1.15 + pull * 0.12, 0.45 - pull * 0.04, 0.08);
    }

    if (shineRef.current) {
      shineRef.current.material.opacity = dragged ? 0.62 : hovered ? 0.52 : 0.42;
    }
  });

  return (
    <group>
      <mesh ref={sealRef} position={[0, 0.02, 0.01]} rotation={[0.42, 0, 0]}>
        <sphereGeometry args={[0.13, 36, 16]} />
        <meshBasicMaterial
          color="#ffb3c7"
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={cupRef} position={[0, 0, 0.02]} rotation={[0.42, 0, 0]}>
        <sphereGeometry args={[0.15, 40, 22]} />
        <meshPhysicalMaterial
          color={dragged ? '#f43f7a' : '#fb7185'}
          roughness={0.16}
          metalness={0.01}
          clearcoat={0.75}
          clearcoatRoughness={0.07}
        />
      </mesh>

      <mesh position={[0, -0.006, 0.058]} rotation={[0.42, 0, 0]} scale={[1.15, 0.42, 0.08]}>
        <sphereGeometry args={[0.105, 32, 14]} />
        <meshPhysicalMaterial
          color="#c02663"
          roughness={0.22}
          metalness={0}
          clearcoat={0.45}
          clearcoatRoughness={0.12}
        />
      </mesh>

      <mesh ref={shineRef} position={[0.035, 0.035, 0.105]} rotation={[0.42, 0, -0.1]} scale={[1.2, 0.35, 0.1]}>
        <sphereGeometry args={[0.06, 24, 12]} />
        <meshBasicMaterial
          color="#ffd1dc"
          transparent
          opacity={0.42}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function CardConnector({ dragged = false, hovered = false }) {
  const HEADER_W = 0.46;
  const HEADER_H = CONNECTOR_HEADER_H;
  const THICKNESS = CONNECTOR_THICKNESS;

  return (
    <group>
      {/* ── 吊头主体：缩小、降低存在感 ── */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[HEADER_W, HEADER_H, THICKNESS]} />
        <meshPhysicalMaterial
          color="#1a1748"
          roughness={0.28}
          metalness={0.06}
          clearcoat={0.65}
          clearcoatRoughness={0.2}
          transparent
          opacity={0.82}
        />
      </mesh>

      {/* 吊头前面的小亮面 */}
      <mesh position={[0, 0.012, THICKNESS / 2 + 0.002]}>
        <planeGeometry args={[HEADER_W * 0.86, HEADER_H * 0.58]} />
        <meshBasicMaterial
          color="#a78bfa"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── 舌身到吸盘的过渡块 — 软组织渐宽 ── */}
      <mesh
        position={[0, HEADER_H / 2 + 0.19, THICKNESS / 2 + 0.065]}
        rotation={[0.35, 0, 0]}
        scale={[dragged ? 0.68 : 0.75, dragged ? 1.18 : 1.05, 0.24]}
      >
        <sphereGeometry args={[0.105, 28, 16]} />
        <meshPhysicalMaterial
          color={dragged ? '#fb7185' : '#ff8fab'}
          roughness={0.2}
          metalness={0.01}
          clearcoat={0.5}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* ── 宽舌尖吸盘：扁宽、像软舌头啪地贴住 ── */}
      <mesh
        position={[0, CONNECTOR_SUCTION_Y + 0.085, THICKNESS / 2 + 0.075]}
        rotation={[0.15, 0, 0]}
        scale={[0.55, dragged ? 1.22 : 1.08, 0.22]}
      >
        <sphereGeometry args={[0.09, 28, 16]} />
        <meshPhysicalMaterial
          color={dragged ? '#fb7185' : '#ff8fab'}
          roughness={0.18}
          metalness={0.01}
          clearcoat={0.55}
          clearcoatRoughness={0.1}
        />
      </mesh>

      <group position={[0, CONNECTOR_SUCTION_Y, THICKNESS / 2 + 0.07]}>
        <SuctionCup dragged={dragged} hovered={hovered} />
      </group>

      {/* 舌尖中央湿润高光 */}

      {/* ── 吊头与正文之间的短连接杆 ── */}
      <mesh position={[0, -HEADER_H / 2 - 0.07, 0]}>
        <boxGeometry args={[HEADER_W * 0.18, 0.14, THICKNESS * 0.6]} />
        <meshStandardMaterial color="#252050" roughness={0.4} metalness={0.12} />
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────
   主容器：蛙怪吐舌吊牌
───────────────────────────────────────── */
function LanyardPhysics({ gravity, isMobile }) {
  return (
    <Suspense fallback={null}>
      <Physics gravity={gravity} timeStep={1 / 60}>
        <FrogTongueBand isMobile={isMobile} />
      </Physics>
    </Suspense>
  );
}

export default function Lanyard({
  position = [-2, 0, 22],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
}) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) return null;

  return (
    <div className="lanyard-canvas-root">
      <Canvas
        camera={{ position: [0, 0, 30], fov }}
        dpr={[1, 2]}
        gl={{ alpha: transparent, antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0x000000), 0);
          gl.domElement.style.pointerEvents = 'none';
        }}
        eventSource={typeof document !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
      >
        <ambientLight intensity={Math.PI * 0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} color="#e0e7ff" />
        <pointLight position={[-5, 5, 5]} intensity={0.8} color="#a78bfa" />
        {/* 舌头专用暖光 */}
        <pointLight position={[0, 2, 8]} intensity={0.4} color="#f9a8d4" />

        <Environment blur={0.75}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={8} color="#a78bfa" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>

        <LanyardPhysics gravity={gravity} isMobile={isMobile} />
      </Canvas>
    </div>
  );
}

/* ─────────────────────────────────────────
   物理舌头 + 蛙怪 + 卡片
───────────────────────────────────────── */
function FrogTongueBand({ maxSpeed = 50, minSpeed = 0 }) {
  const { gl, viewport } = useThree();
  const band = useRef();
  const fixed = useRef();
  const j1 = useRef();
  const j2 = useRef();
  const j3 = useRef();
  const card = useRef();

  const vecRef = useRef(new THREE.Vector3());
  const angRef = useRef(new THREE.Vector3());
  const rotRef = useRef(new THREE.Vector3());
  const dirRef = useRef(new THREE.Vector3());

  const startX = viewport.width / 2 - 2;
  const startY = viewport.height / 2 - 0.15;

  const segmentProps = {
    type: 'dynamic',
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4,
  };

  const cardTex = useTexture(cardImage);
  const backTex = useMemo(() => getBackTexture(), []);
  const tongueTex = useMemo(() => getTongueTexture(), []);

  const CARD_W = 1.6;
  const CARD_H = CARD_W * (1008 / 778);
  const CARD_BASE_THICKNESS = 0.04;

  // 卡片主体的视觉缩放
  const CARD_VISUAL_SCALE = 2.25;
  const CONNECTOR_SCALE = 1.25;

  // 卡片主体 group 的 y 偏移
  const CARD_BODY_Y = -CARD_H / 2;

  // 视觉上卡片图片的顶部位置（刚体局部空间）
  const CARD_VISUAL_TOP_Y = CARD_BODY_Y + (CARD_H / 2) * CARD_VISUAL_SCALE;

  // 吊头放在卡片图片上方
  const CONNECTOR_Y = CARD_VISUAL_TOP_Y + 0.22;

  // CardConnector 内部吸盘舌尖中心的本地 y 偏移
  const SUCTION_LOCAL_Y = CONNECTOR_SUCTION_Y;

  // 物理舌尖连接点：对齐吸盘中心
  const CONNECTOR_JOINT_Y = CONNECTOR_Y + SUCTION_LOCAL_Y * CONNECTOR_SCALE;

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ])
  );
  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);
  const tongueColor = dragged ? '#fb4f86' : hovered ? '#ff7fa4' : '#ff8fab';
  const tongueWidth = dragged ? 0.4 : hovered ? 0.49 : 0.46;
  const tongueRepeat = dragged ? [-2.7, 1] : [-2.0, 1];

  // 物理关节
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  // 舌尖连接到吊头圆环位置
  useSphericalJoint(j3, card, [[0, 0, 0], [0, CONNECTOR_JOINT_Y, 0]]);

  // pointer events
  useEffect(() => {
    if (hovered || dragged) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      gl.domElement.style.pointerEvents = 'auto';
    } else {
      document.body.style.cursor = 'auto';
      gl.domElement.style.pointerEvents = 'none';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered, dragged, gl]);

  useFrame((state, delta) => {
    const vec = vecRef.current;
    const ang = angRef.current;
    const rot = rotRef.current;
    const dir = dirRef.current;

    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }

    if (fixed.current && j1.current && j2.current && j3.current && card.current && band.current) {
      [j1, j2].forEach((ref) => {
        if (!ref.current.lerped)
          ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        const d = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + d * (maxSpeed - minSpeed))
        );
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(32));

      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = 'chordal';

  return (
    <>
      {/* 锚点组 */}
      <group position={[startX, startY, 0]}>
        {/* 蛙怪脑袋 — 从页面顶部探出 */}
        <FrogHead position={[0, -0.4, 0]} dragged={!!dragged} hovered={hovered} />

        <RigidBody ref={fixed} {...segmentProps} type="fixed" position={[0.1, -0.45, 0]} />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>

        {/* 卡片 */}
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[CARD_W / 2, (CARD_H + 0.6) / 2, 0.01]} />

          {/* ── 吊头 — 独立缩放，不跟着正文卡片暴涨 ── */}
          <group position={[0, CONNECTOR_Y, -0.04]} scale={CONNECTOR_SCALE}>
            <CardConnector dragged={!!dragged} hovered={hovered} />
          </group>

          {/* ── 卡片主体 — scale 2.25 ── */}
          <group
            scale={2.25}
            position={[0, -CARD_H / 2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => {
              e.target.releasePointerCapture?.(e.pointerId);
              drag(false);
            }}
            onPointerDown={(e) => {
              e.target.setPointerCapture?.(e.pointerId);
              drag(
                new THREE.Vector3()
                  .copy(e.point)
                  .sub(vecRef.current.copy(card.current.translation()))
              );
            }}
          >
            {/* 厚度底板 */}
            <mesh position={[0, 0, -CARD_BASE_THICKNESS / 2]}>
              <boxGeometry args={[CARD_W + 0.04, CARD_H + 0.04, CARD_BASE_THICKNESS]} />
              <meshPhysicalMaterial
                color="#111033"
                roughness={0.35}
                metalness={0.08}
                clearcoat={0.6}
                clearcoatRoughness={0.2}
              />
            </mesh>

            {/* 正面图片 — 略微前移 */}
            <mesh position={[0, 0, 0.022]}>
              <planeGeometry args={[CARD_W, CARD_H]} />
              <meshPhysicalMaterial
                map={cardTex}
                map-anisotropy={16}
                clearcoat={1}
                clearcoatRoughness={0.1}
                roughness={0.3}
                metalness={0.05}
                transparent
                side={THREE.FrontSide}
              />
            </mesh>

            {/* 背面 — Explorer Profile，正面朝外旋转 180° */}
            <mesh position={[0, 0, -0.022]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[CARD_W, CARD_H]} />
              <meshStandardMaterial
                map={backTex}
                roughness={0.5}
                metalness={0.15}
                side={THREE.FrontSide}
              />
            </mesh>
          </group>
        </RigidBody>
      </group>

      {/* 舌头：从蛙嘴到吸盘舌尖 */}
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color={tongueColor}
          depthTest={false}
          resolution={[1000, 1000]}
          useMap
          map={tongueTex}
          repeat={tongueRepeat}
          lineWidth={tongueWidth}
          transparent
        />
      </mesh>
    </>
  );
}
