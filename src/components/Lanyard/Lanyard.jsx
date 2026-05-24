/* eslint-disable react/no-unknown-property */
/* @refresh reset */
'use client';
import { Suspense, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
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

import frogImage from '../../assets/images/contact/frog01.png';
import cardWateryImage from '../../assets/images/contact/card_watery.jpg';
import avatarImage from '../../assets/images/github.png';

extend({ MeshLineGeometry, MeshLineMaterial });

/* ─────────────────────────────────────────
   卡片背面贴图 — Canvas 动态生成 Explorer Profile
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

  // 背景：金黑与曜岩黑
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a0805');
  bg.addColorStop(0.5, '#20160a');
  bg.addColorStop(1, '#0a0805');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 微弱网格
  ctx.strokeStyle = 'rgba(231, 199, 126, 0.05)';
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
  ctx.fillStyle = 'rgba(231, 199, 126, 0.72)';
  ctx.fillText('EXPLORER PROFILE', W / 2, px(70));

  // 分隔线
  ctx.strokeStyle = 'rgba(231, 199, 126, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px(50), px(90));
  ctx.lineTo(W - px(50), px(90));
  ctx.stroke();

  // ── 身份信息 — 大字 ──
  const labelX = W * 0.22;
  const valX = W * 0.42;
  let y = px(130);
  const gap = px(48);

  const drawRow = (label, value) => {
    ctx.textAlign = 'left';
    ctx.font = `bold ${px(10)}px "Inter", "SF Mono", monospace`;
    ctx.fillStyle = 'rgba(231, 199, 126, 0.58)';
    ctx.fillText(label, labelX, y);

    ctx.font = `${px(11)}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(245, 239, 227, 0.95)';
    ctx.fillText(value, valX, y);
    y += gap;
  };

  drawRow('ROLE', 'Developer / Explorer');
  drawRow('FOCUS', 'Web · AI · Obsidian · Travel');
  drawRow('MODE', 'Build · Note · Visualize');
  drawRow('STATUS', '● Online');

  // 分隔线
  y += px(6);
  ctx.strokeStyle = 'rgba(231, 199, 126, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px(50), y);
  ctx.lineTo(W - px(50), y);
  ctx.stroke();
  y += px(30);

  // ── 系统一行 ──
  ctx.textAlign = 'center';
  ctx.font = `${px(9.5)}px "Inter", "SF Mono", monospace`;
  ctx.fillStyle = 'rgba(245, 239, 227, 0.45)';
  ctx.fillText('Blog · Obsidian · Travel Atlas', W / 2, y);
  y += px(36);

  // 分隔线
  ctx.strokeStyle = 'rgba(231, 199, 126, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px(80), y);
  ctx.lineTo(W - px(80), y);
  ctx.stroke();
  y += px(36);

  // ── 底部标语 ──
  ctx.font = `italic ${px(10)}px "Inter", system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(231, 199, 126, 0.52)';
  ctx.fillText('从笔记出发，延伸到地图、项目与世界。', W / 2, y);
  y += px(40);

  // 装饰小点
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(W / 2 + i * px(12), y, px(2), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(231, 199, 126, ${0.15 + Math.abs(2 - Math.abs(i)) * 0.1})`;
    ctx.fill();
  }

  _backTex = new THREE.CanvasTexture(canvas);
  _backTex.colorSpace = THREE.SRGBColorSpace;
  return _backTex;
}

/* ─────────────────────────────────────────
   白色背景过滤与透明贴图生成工具 (支持羽化)
───────────────────────────────────────── */
function loadTransparentTexture(imgSrc, threshold = 45, feather = 40, callback) {
  const img = new Image();
  img.src = imgSrc;
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // 1. 利用颜色距离做抠图，将实白背景滤除为透明，并进行平滑羽化边缘
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const dist = Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2);
      if (dist < threshold) {
        data[i + 3] = 0;
      } else if (dist < threshold + feather) {
        const factor = (dist - threshold) / feather;
        data[i + 3] = Math.round(data[i + 3] * factor);
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    callback(tex);
  };
}

/* ─────────────────────────────────────────
   水色玻璃卡牌贴图生成器 — 动态加载背景与头像，处理抠图并在画布上绘制可配置信息
───────────────────────────────────────── */
function loadCardFrontTexture(bgImgSrc, avatarImgSrc, callback) {
  const bgImg = new Image();
  const avatarImg = new Image();

  let bgLoaded = false;
  let avatarLoaded = false;

  const draw = () => {
    if (!bgLoaded || !avatarLoaded) return;

    const W = bgImg.width;
    const H = bgImg.height;

    // 1. 创建临时 Canvas 用于抠除卡片模板的背景白底，防止误伤头像
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = W;
    bgCanvas.height = H;
    const bgCtx = bgCanvas.getContext('2d');
    bgCtx.drawImage(bgImg, 0, 0);

    const bgData = bgCtx.getImageData(0, 0, W, H);
    const data = bgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const dist = Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2);
      if (dist < 45) {
        data[i + 3] = 0; // 完全透明
      } else if (dist < 85) {
        const factor = (dist - 45) / 40;
        data[i + 3] = Math.round(data[i + 3] * factor);
      }
    }
    bgCtx.putImageData(bgData, 0, 0);

    // 2. 创建最终名片 Canvas
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // 绘制处理好的透明卡牌背景
    ctx.drawImage(bgCanvas, 0, 0);

    // 3. 绘制自定义圆形头像 (对应图三黑底孔窗)
    const cx = W / 2;          // 389
    const cy = H * 0.327;      // ~330
    const r = W * 0.141;       // ~110

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatarImg, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    // 4. 绘制名片文本信息 (对应图二的三个空白槽线)
    ctx.fillStyle = 'rgba(21, 80, 65, 0.88)'; // 高级深绿松石墨水色
    ctx.font = `bold ${W * 0.038}px "Inter", "SF Pro", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const textX = W * 0.334; // 水平对齐点 ~260

    // 写入信息槽
    ctx.fillText('松果屋屋主 (Songguo)', textX, H * 0.515); // 第一栏
    ctx.fillText('yhx06@outlook.com', textX, H * 0.630);    // 第二栏
    ctx.fillText('松果屋 · 探索与构建', textX, H * 0.745);      // 第三栏

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    callback(tex);
  };

  bgImg.src = bgImgSrc;
  bgImg.crossOrigin = 'anonymous';
  bgImg.onload = () => {
    bgLoaded = true;
    draw();
  };

  avatarImg.src = avatarImgSrc;
  avatarImg.crossOrigin = 'anonymous';
  avatarImg.onload = () => {
    avatarLoaded = true;
    draw();
  };
}

/* ─────────────────────────────────────────
   吊头组件 — 顶部的精致金属小吊环
───────────────────────────────────────── */
function CardConnector() {
  return (
    <group>
      <mesh>
        <torusGeometry args={[0.075, 0.016, 12, 24]} />
        <meshPhysicalMaterial
          color="#fcd34d"
          metalness={0.9}
          roughness={0.12}
          clearcoat={1.0}
        />
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────
   钓鱼青蛙 — 2.5D 立体纸板贴纸版
   慵懒小青蛙躺在木躺椅上，手持钓竿，从右上角探出
───────────────────────────────────────── */
function FrogHead({ position = [0, 0, 0], dragged = false, hovered = false }) {
  const headRef = useRef();
  const [frogTex, setFrogTex] = useState(null);
  const spark1 = useRef();
  const spark2 = useRef();

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(frogImage, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      setFrogTex(tex);
    });
  }, []);

  useFrame((state) => {
    if (!headRef.current) return;
    const t = state.clock.elapsedTime;

    // 微妙的呼吸悬浮动画
    headRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.04;
    headRef.current.rotation.z = Math.sin(t * 0.8) * 0.02;

    // 2.5D 立体视差倾斜：跟着指针方向微微倾斜转动
    const targetRotY = state.pointer.x * 0.22;
    const targetRotX = -state.pointer.y * 0.15;
    headRef.current.rotation.y += (targetRotY - headRef.current.rotation.y) * 0.08;
    headRef.current.rotation.x += (targetRotX - headRef.current.rotation.x) * 0.08;

    // 拖拽或悬浮时的弹性微缩放
    const targetScale = dragged ? 3.5 : hovered ? 3.45 : 3.55;
    const currentScale = headRef.current.scale.x;
    const nextScale = currentScale + (targetScale - currentScale) * 0.1;
    headRef.current.scale.set(nextScale, nextScale, nextScale);

    // 动画竿尖处的魔法微粒
    if (spark1.current) {
      const ang = t * 4.0;
      spark1.current.position.x = -0.38 + Math.cos(ang) * 0.08;
      spark1.current.position.y = 0.23 + Math.sin(ang) * 0.08;
      spark1.current.position.z = 0.2 + Math.sin(t * 2.0) * 0.04;
    }
    if (spark2.current) {
      const ang = t * -3.0 + 1.5;
      spark2.current.position.x = -0.38 + Math.cos(ang) * 0.12;
      spark2.current.position.y = 0.23 + Math.sin(ang) * 0.12;
      spark2.current.position.z = 0.2 + Math.cos(t * 2.0) * 0.04;
    }
  });

  return (
    <group ref={headRef} position={position}>
      {frogTex && (
        <group>
          {/* 后置柔和阴影片 (2.5D 浮空阴影效果) */}
          <mesh position={[0.02, -0.02, -0.04]} renderOrder={9}>
            <planeGeometry args={[1.0, 1.0]} />
            <meshBasicMaterial
              map={frogTex}
              color="#000000"
              transparent={true}
              opacity={0.3}
              alphaTest={0.05}
              depthWrite={false}
            />
          </mesh>

          {/* 前置萌系立体卡牌贴纸主板 */}
          <mesh position={[0, 0, 0]} renderOrder={10}>
            <planeGeometry args={[1.0, 1.0]} />
            <meshBasicMaterial
              map={frogTex}
              transparent={true}
              side={THREE.DoubleSide}
              alphaTest={0.05}
            />
          </mesh>

          {/* 竿尖魔法辉光节点 */}
          <group position={[-0.38, 0.23, 0.2]}>
            {/* 核心强光 */}
            <mesh>
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshBasicMaterial color="#fffbeb" />
            </mesh>
            {/* 外部柔光晕 */}
            <mesh>
              <sphereGeometry args={[0.05, 12, 12]} />
              <meshBasicMaterial color="#fcd34d" transparent opacity={0.65} />
            </mesh>
          </group>

          {/* 绕竿尖飞舞的黄金魔法火花 */}
          <mesh ref={spark1}>
            <sphereGeometry args={[0.008, 6, 6]} />
            <meshBasicMaterial color="#fcd34d" />
          </mesh>
          <mesh ref={spark2}>
            <sphereGeometry args={[0.006, 6, 6]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        </group>
      )}
    </group>
  );
}

/* ─────────────────────────────────────────
   物理场景主体：鱼竿、线、鱼钩与水色玻璃卡牌
───────────────────────────────────────── */
function FrogTongueBand({ maxSpeed = 50, minSpeed = 0, interactive = true }) {
  const { viewport } = useThree();
  const band = useRef();
  const fixed = useRef();
  const j1 = useRef();
  const j2 = useRef();
  const j3 = useRef();
  const card = useRef();
  const ropeSpark1 = useRef();
  const ropeSpark2 = useRef();
  const vecRef = useRef(new THREE.Vector3());
  const angRef = useRef(new THREE.Vector3());
  const rotRef = useRef(new THREE.Vector3());
  const dirRef = useRef(new THREE.Vector3());

  // 动态视口定位 (右上角)
  const startX = viewport.width / 2 - 2.8;
  const startY = viewport.height / 2 - 2.5;

  const segmentProps = {
    type: 'dynamic',
    canSleep: true,
    colliders: false,
    angularDamping: 4.5,
    linearDamping: 4.5,
  };

  const [cardWateryTex, setCardWateryTex] = useState(null);
  const backTex = useMemo(() => getBackTexture(), []);

  useEffect(() => {
    loadCardFrontTexture(cardWateryImage, avatarImage, setCardWateryTex);
  }, []);

  const CARD_W = 1.6;
  const CARD_H = CARD_W * (1008 / 778);

  // 物理与视觉参数
  const CARD_VISUAL_SCALE = 2.25;
  const CONNECTOR_SCALE = 1.25;

  // 鱼竿 tip 在 Frog 局部坐标系下的位置
  // 对应 frog 缩放 2.8 倍后的 tip 物理位置
  const ROPE_X_OFFSET = -1.36;
  const ROPE_Y_OFFSET = 1.60;

  // 物理挂扣连接点：对应卡片缩放后的顶部挂扣位置 (y = 1.29)
  const CONNECTOR_JOINT_Y = 1.29;

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

  // 物理挂载关节
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 0.8]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 0.7]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 0.7]);
  useSphericalJoint(j3, card, [[0, 0, 0], [0, CONNECTOR_JOINT_Y, 0]]);

  // pointer styles
  useEffect(() => {
    if (!interactive) {
      document.body.style.cursor = 'auto';
      return;
    }
    if (hovered || dragged) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
    } else {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered, dragged, interactive]);

  const resetCard = useCallback(() => {
    if (card.current && fixed.current && j1.current && j2.current && j3.current) {
      // 物理坐标复位
      card.current.setTranslation({ x: startX + ROPE_X_OFFSET, y: startY - 3.1, z: 0 }, true);
      card.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      card.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      card.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);

      j1.current.setTranslation({ x: startX + ROPE_X_OFFSET, y: startY - 0.2, z: 0 }, true);
      j1.current.setLinvel({ x: 0, y: 0, z: 0 }, true);

      j2.current.setTranslation({ x: startX + ROPE_X_OFFSET, y: startY - 0.9, z: 0 }, true);
      j2.current.setLinvel({ x: 0, y: 0, z: 0 }, true);

      j3.current.setTranslation({ x: startX + ROPE_X_OFFSET, y: startY - 1.6, z: 0 }, true);
      j3.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  }, [startX]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__resetLanyard = resetCard;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.__resetLanyard;
      }
    };
  }, [resetCard]);

  useFrame((state, delta) => {
    const vec = vecRef.current;
    const ang = angRef.current;
    const rot = rotRef.current;
    const dir = dirRef.current;
    const t = state.clock.elapsedTime;

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

      // ── 鱼线顶点插值渲染 ──
      curve.points = [
        new THREE.Vector3().copy(fixed.current.translation()),
        new THREE.Vector3().copy(j1.current.lerped),
        new THREE.Vector3().copy(j2.current.lerped),
        new THREE.Vector3().copy(j3.current.translation())
      ];
      band.current.geometry.setPoints(curve.getPoints(24));

      // 自动阻尼
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });

      // 将名片坐标转为屏幕投影坐标，以触发背景烟花与水波
      const translation = card.current.translation();
      const cardVec = vec.set(translation.x, translation.y, translation.z);
      cardVec.project(state.camera);
      const px_x = (cardVec.x * 0.5 + 0.5) * window.innerWidth;
      const px_y = (-cardVec.y * 0.5 + 0.5) * window.innerHeight;

      if (dragged) {
        window.dispatchEvent(new CustomEvent('card-drag', { detail: { x: px_x, y: px_y } }));
      } else {
        if (Math.random() < 0.2) {
          window.dispatchEvent(new CustomEvent('card-swing', { detail: { x: px_x, y: px_y } }));
        }
      }

      // 动画鱼线起点的魔法微粒
      if (ropeSpark1.current) {
        const ang = t * -3.5;
        ropeSpark1.current.position.x = ROPE_X_OFFSET + Math.cos(ang) * 0.08;
        ropeSpark1.current.position.y = ROPE_Y_OFFSET + Math.sin(ang) * 0.08;
        ropeSpark1.current.position.z = Math.cos(t * 2.0) * 0.04;
      }
      if (ropeSpark2.current) {
        const ang = t * 4.5 + 2.0;
        ropeSpark2.current.position.x = ROPE_X_OFFSET + Math.cos(ang) * 0.12;
        ropeSpark2.current.position.y = ROPE_Y_OFFSET + Math.sin(ang) * 0.12;
        ropeSpark2.current.position.z = Math.sin(t * 2.0) * 0.04;
      }
    }
  });

  curve.curveType = 'chordal';

  return (
    <>
      <group position={[startX, startY, 0]}>
        {/* 慵懒钓鱼青蛙躺椅背景装饰 */}
        <group
          onClick={interactive ? resetCard : undefined}
          onPointerOver={interactive ? () => { document.body.style.cursor = 'pointer'; } : undefined}
          onPointerOut={interactive ? () => { document.body.style.cursor = 'auto'; } : undefined}
        >
          <FrogHead position={[-0.1, 0.8, -0.6]} dragged={!!dragged} hovered={hovered} />
        </group>

        {/* 鱼竿竿尖固定锚点 */}
        <RigidBody ref={fixed} {...segmentProps} type="fixed" position={[ROPE_X_OFFSET, ROPE_Y_OFFSET, 0]} />

        {/* 鱼线起点处的魔法光球 */}
        <group position={[ROPE_X_OFFSET, ROPE_Y_OFFSET, 0.1]}>
          <mesh>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshBasicMaterial color="#fffbeb" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshBasicMaterial color="#fcd34d" transparent opacity={0.65} />
          </mesh>
        </group>

        {/* 绕鱼线起点飞舞的黄金魔法火花 */}
        <mesh ref={ropeSpark1}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshBasicMaterial color="#fcd34d" />
        </mesh>
        <mesh ref={ropeSpark2}>
          <sphereGeometry args={[0.006, 6, 6]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>

        {/* 鱼线物理节点 */}
        <RigidBody position={[ROPE_X_OFFSET, -0.20, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.08]} />
        </RigidBody>
        <RigidBody position={[ROPE_X_OFFSET, -0.90, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.08]} />
        </RigidBody>
        <RigidBody position={[ROPE_X_OFFSET, -1.60, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.08]} />
          {/* 3D 黄金小鱼钩 — 挂载于鱼线末端 */}
          <mesh position={[0, -0.06, 0.02]} rotation={[0, 0, 0.2]}>
            <torusGeometry args={[0.065, 0.015, 8, 16, Math.PI * 1.5]} />
            <meshPhysicalMaterial
              color="#fcd34d"
              metalness={0.9}
              roughness={0.12}
              clearcoat={1.0}
            />
          </mesh>
        </RigidBody>

        {/* 水色名片卡牌 */}
        <RigidBody
          position={[ROPE_X_OFFSET, -3.1, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          {/* 名片碰撞盒 */}
          <CuboidCollider args={[(CARD_W * CARD_VISUAL_SCALE) / 2, ((CARD_H + 0.12) * CARD_VISUAL_SCALE) / 2, 0.02]} />

          {/* ── 顶部挂接孔环 (Torus) ── */}
          <group position={[0, CONNECTOR_JOINT_Y, 0.025]} scale={CONNECTOR_SCALE}>
            <CardConnector />
          </group>

          {/* ── 名片主体 — scale 2.25 ── */}
          <group
            scale={CARD_VISUAL_SCALE}
            position={[0, -CARD_H / 2, -0.05]}
            onPointerOver={interactive ? () => hover(true) : undefined}
            onPointerOut={interactive ? () => hover(false) : undefined}
            onPointerUp={interactive ? (e) => {
              e.target.releasePointerCapture?.(e.pointerId);
              drag(false);
            } : undefined}
            onPointerDown={interactive ? (e) => {
              e.target.setPointerCapture?.(e.pointerId);
              drag(
                new THREE.Vector3()
                  .copy(e.point)
                  .sub(vecRef.current.copy(card.current.translation()))
              );
            } : undefined}
          >
            {/* 1. 后置立体金描边底板 (完美吻合玻璃卡片有机轮廓) */}
            {cardWateryTex && (
              <mesh position={[0, 0, -0.005]} scale={[1.035, 1.035, 1]}>
                <planeGeometry args={[CARD_W, CARD_H]} />
                <meshPhysicalMaterial
                  map={cardWateryTex}
                  color="#e7c77e"
                  metalness={0.88}
                  roughness={0.16}
                  clearcoat={1.0}
                  transparent
                  alphaTest={0.1}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {/* 2. 正面水色玻璃名片 — 具有水波纹理与折射感 */}
            {cardWateryTex && (
              <mesh position={[0, 0, 0.015]}>
                <planeGeometry args={[CARD_W, CARD_H]} />
                <meshPhysicalMaterial
                  map={cardWateryTex}
                  map-anisotropy={16}
                  transparent
                  alphaTest={0.1}
                  roughness={0.15}
                  metalness={0.05}
                  clearcoat={1.0}
                  clearcoatRoughness={0.08}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {/* 3. 背面文字手札 (Explorer Profile) — 稍微移后 */}
            <mesh position={[0, 0, -0.016]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[CARD_W, CARD_H]} />
              <meshStandardMaterial
                map={backTex}
                alphaMap={cardWateryTex}
                transparent={true}
                alphaTest={0.1}
                roughness={0.45}
                metalness={0.12}
                side={THREE.FrontSide}
              />
            </mesh>
          </group>
        </RigidBody>
      </group>

      {/* 鱼线：从鱼竿尖端垂落到鱼钩 */}
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="#fcd34d"
          depthTest={true}
          resolution={[1000, 1000]}
          lineWidth={0.035}
          transparent
          opacity={0.85}
        />
      </mesh>
    </>
  );
}

/* ─────────────────────────────────────────
   物理容器封装
───────────────────────────────────────── */
function LanyardPhysics({ gravity, isMobile, interactive }) {
  return (
    <Suspense fallback={null}>
      <Physics gravity={gravity} timeStep={1 / 60}>
        <FrogTongueBand isMobile={isMobile} interactive={interactive} />
      </Physics>
    </Suspense>
  );
}

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -32, 0], // 稍微降低重力让垂钓轻盈摆动
  fov = 20,
  transparent = true,
  interactive = true,
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
        style={{ pointerEvents: interactive ? 'auto' : 'none' }}
        camera={{ position, fov }}
        dpr={[1, 2]}
        gl={{ alpha: transparent, antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0x000000), 0);
        }}
        eventPrefix="client"
      >
        <ambientLight intensity={Math.PI * 0.65} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} color="#e0f2fe" />
        <pointLight position={[-6, 5, 5]} intensity={0.9} color="#7dd3fc" />
        <pointLight position={[0, -2, 8]} intensity={0.5} color="#e0f2fe" />

        <Environment blur={0.75}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="#38bdf8" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={6} color="#0284c7" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>

        <LanyardPhysics gravity={gravity} isMobile={isMobile} interactive={interactive} />
      </Canvas>
    </div>
  );
}
