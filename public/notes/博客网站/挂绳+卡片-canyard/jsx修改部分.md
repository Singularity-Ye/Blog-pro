初版：
/* eslint-disable react/no-unknown-property */

'use client';

import { useEffect, useRef, useState, useMemo } from 'react';

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

  

/* ─────────────────────────────────────────

   挂绳织物纹理 — 模块级单例，避免 HMR 重复创建

───────────────────────────────────────── */

let _lanyardTex = null;

function getLanyardTexture() {

  if (_lanyardTex) return _lanyardTex;

  const W = 256;

  const H = 64;

  const canvas = document.createElement('canvas');

  canvas.width = W;

  canvas.height = H;

  const ctx = canvas.getContext('2d');

  

  ctx.fillStyle = '#3b0764';

  ctx.fillRect(0, 0, W, H);

  

  ctx.lineWidth = 4;

  for (let i = -H; i < W + H; i += 14) {

    const alpha = i % 28 === 0 ? 0.55 : 0.25;

    ctx.strokeStyle = `rgba(167, 139, 250, ${alpha})`;

    ctx.beginPath();

    ctx.moveTo(i, 0);

    ctx.lineTo(i + H, H);

    ctx.stroke();

  }

  

  const gradient = ctx.createLinearGradient(0, 0, 0, H);

  gradient.addColorStop(0, 'rgba(255,255,255,0)');

  gradient.addColorStop(0.45, 'rgba(255,255,255,0.12)');

  gradient.addColorStop(0.55, 'rgba(255,255,255,0.12)');

  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = gradient;

  ctx.fillRect(0, 0, W, H);

  

  _lanyardTex = new THREE.CanvasTexture(canvas);

  _lanyardTex.wrapS = THREE.RepeatWrapping;

  _lanyardTex.wrapT = THREE.RepeatWrapping;

  return _lanyardTex;

}

  

/* ─────────────────────────────────────────

   主 Lanyard 容器

───────────────────────────────────────── */

export default function Lanyard({

  position = [-2, 0, 22],   /* X 左偏 2，让锚点出现在 Canvas 右上角 */

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

  

  if (isMobile) return null; // 移动端不显示

  

  return (

    // ⚠️ 关键：全屏 Canvas，初始设置 pointerEvents 为 none，由 JS 动态控制

    <div className="lanyard-canvas-root">

      <Canvas

        camera={{ position: [0, 0, 30], fov }}

        dpr={[1, 2]}

        gl={{ alpha: transparent, antialias: true }}

        onCreated={({ gl }) => {

          gl.setClearColor(new THREE.Color(0x000000), 0);

          gl.domElement.style.pointerEvents = 'none'; // 初始完全穿透

        }}

        eventSource={typeof document !== 'undefined' ? document.body : undefined}

        eventPrefix="client"

      >

        <ambientLight intensity={Math.PI * 0.6} />

        <directionalLight position={[5, 10, 5]} intensity={1.2} color="#e0e7ff" />

        <pointLight position={[-5, 5, 5]} intensity={0.8} color="#a78bfa" />

  

        <Environment blur={0.75}>

          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />

          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />

          <Lightformer intensity={3} color="white" position={[1, 1, 1]}  rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />

          <Lightformer intensity={8} color="#a78bfa" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />

        </Environment>

  

        <Physics gravity={gravity} timeStep={1 / 60}>

          <Band isMobile={isMobile} />

        </Physics>

      </Canvas>

    </div>

  );

}

  

/* ─────────────────────────────────────────

   物理绳 + 卡片

───────────────────────────────────────── */

function Band({ maxSpeed = 50, minSpeed = 0 }) {

  const { gl, viewport } = useThree();

  const band  = useRef();

  const fixed = useRef();

  const j1    = useRef();

  const j2    = useRef();

  const j3    = useRef();

  const card  = useRef();

  

  // 避免每帧 new Vector3 — 用 useRef 持久化

  const vecRef = useRef(new THREE.Vector3());

  const angRef = useRef(new THREE.Vector3());

  const rotRef = useRef(new THREE.Vector3());

  const dirRef = useRef(new THREE.Vector3());

  

  // 根据屏幕动态计算锚点：右上角，往下掉一点点

  const startX = viewport.width / 2 - 2;

  const startY = viewport.height / 2 + 0.5;

  

  const segmentProps = {

    type: 'dynamic',

    canSleep: true,

    colliders: false,

    angularDamping: 4,

    linearDamping: 4,

  };

  

  // 卡片纹理

  const cardTex = useTexture(cardImage);

  

  // 挂绳织物纹理（模块级单例）

  const lanyardTex = useMemo(() => getLanyardTexture(), []);

  

  // 组件卸载时释放纹理

  useEffect(() => {

    return () => {

      if (cardTex) cardTex.dispose();

    };

  }, [cardTex]);

  

  // 卡片尺寸（保持图片比例）

  const CARD_W = 1.6;

  const CARD_H = CARD_W * (1008 / 778);

  

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

  

  // 绳节连接

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);

  useRopeJoint(j1,    j2, [[0, 0, 0], [0, 0, 0], 1]);

  useRopeJoint(j2,    j3, [[0, 0, 0], [0, 0, 0], 1]);

  useSphericalJoint(j3, card, [[0, 0, 0], [0, CARD_H / 2 + 0.1, 0]]);

  

  // 核心：动态控制 pointerEvents

  useEffect(() => {

    if (hovered || dragged) {

      document.body.style.cursor = dragged ? 'grabbing' : 'grab';

      gl.domElement.style.pointerEvents = 'auto'; // 激活 Canvas 拦截点击，防止点击穿透到底层

    } else {

      document.body.style.cursor = 'auto';

      gl.domElement.style.pointerEvents = 'none'; // 穿透给下层（如 Hero 文字的交互）

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

  

    // 拖拽处理

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

    // 绳子曲线更新

    if (fixed.current) {

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

      {/* 锚点组：使用动态计算的 startX 和 startY，确保锚点永远在屏幕右上角 */}

      <group position={[startX, startY, 0]}>

        <RigidBody ref={fixed} {...segmentProps} type="fixed" />

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

          <CuboidCollider args={[CARD_W / 2, CARD_H / 2, 0.01]} />

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

            {/* 卡片正面 */}

            <mesh>

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

            {/* 卡片背面（深色渐变） */}

            <mesh position={[0, 0, -0.001]}>

              <planeGeometry args={[CARD_W, CARD_H]} />

              <meshStandardMaterial

                color="#1e1b4b"

                roughness={0.6}

                metalness={0.3}

                side={THREE.BackSide}

              />

            </mesh>

          </group>

        </RigidBody>

      </group>

  

      {/* 挂绳带 */}

      <mesh ref={band}>

        <meshLineGeometry />

        <meshLineMaterial

          color="white"

          depthTest={false}

          resolution={[1000, 1000]}

          useMap

          map={lanyardTex}

          repeat={[-3, 1]}

          lineWidth={1}

        />

      </mesh>

    </>

  );

}
