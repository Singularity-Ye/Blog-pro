---
tags:
  - threejs
  - react-three-fiber
  - canvas
  - 粒子系统
  - 首页
  - 技术札记
page:
  - ContinentPatch.jsx
created: 2026-06-06
status: active
---

# 三维星寰：基于 R3F 与 Canvas 的圆流漩涡星砂粒子系统

在松果星寰仪的首页 3D 大陆升级中，为了在星球上空营造具有“灵气环绕”的因果节点纽带，我们设计了一套动态绕流粒子。本篇手札记录了粒子从“3D faceted 晶体”到“2D 高拟真自旋圆形漩涡星砂”的视觉重塑与技术实现方案。

---

## 一、视觉痛点与重塑设想

1. **废弃方案：3D 低多边形几何体（十二面体）**
   * *问题*：最初为了追求低模 3D 感，使用 `dodecahedronGeometry`（十二面体）。由于体积极小，且在轨道运动中伴随 3D 自转，在屏幕上会呈现为**闪烁、滚动的矩形小方块**，视觉上显得简陋、不规则，缺乏灵性。
2. **重塑目标：高拟真圆流漩涡粒子**
   * *设计*：粒子必须保持完美的圆形物理边缘，但在粒子内部，需要有精致的视觉纹理——即**微型自旋漩涡（Mini Vortex）**与**星砂螺旋路径**，使其看起来像一颗颗被法力驱动、缓慢自转的微型星系或聚能法阵。

---

## 二、技术架构与核心实现

这套系统巧妙地结合了 **HTML5 Canvas 动态纹理生成** 与 **Three.js Sprite 局部旋转矩阵**，避免了加载大体积外部序列图，实现了轻量级、零开销的高动态效果。

```
┌──────────────────────────────────────────────┐
│           createVortexTexture(color)         │
│  1. 绘制径向渐变背景 (Radial Glow)           │
│  2. 绘制两条黄金螺旋曲线 (Spiral Arms)       │
│  3. 沿螺旋路径绘制随机大小的光斑 (Sparks)    │
│  4. 绘制中心高亮白核 (White Core)            │
└──────────────────────┬───────────────────────┘
                       │ 生成 CanvasTexture
                       ▼
┌──────────────────────────────────────────────┐
│        Three.js SpriteMaterial               │
│  - map: vortexTexture                        │
│  - blending: AdditiveBlending (白光融合)      │
│  - depthWrite: false (避免粒子重叠产生黑边)   │
└──────────────────────┬───────────────────────┘
                       │ 渲染并置入 3D 场景
                       ▼
┌──────────────────────────────────────────────┐
│           useFrame (自旋与绕流)              │
│  - 按照 sine/cosine 轨道公式计算三维坐标      │
│  - 对每个 Sprite.material.rotation 独立自增   │
└──────────────────────────────────────────────┘
```

---

## 三、核心代码解析

### 1. Canvas 漩涡纹理生成算法
利用原生的二维 Canvas，在内存中动态绘制具有呼吸感和层次感的螺旋星砂。分辨率设为 `128x128` 以确保缩放时边缘清晰。

```javascript
const createVortexTexture = (colorHex) => {
  const size = 128; 
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  
  const r = parseInt(colorHex.slice(1, 3), 16);
  const g = parseInt(colorHex.slice(3, 5), 16);
  const b = parseInt(colorHex.slice(5, 7), 16);
  
  // 1. 绘制外围朦胧的星尘光晕 (Outer Glow)
  const outerGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, size / 2);
  outerGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.45)`);
  outerGrad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.15)`);
  outerGrad.addColorStop(1.0, `rgba(${r}, ${g}, ${b}, 0.0)`);
  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // 2. 绘制两条螺旋状星砂悬臂 (Spiral Arms)
  const numArms = 2; 
  const maxRadius = size / 2 - 8;
  ctx.lineWidth = 2.0;
  
  for (let arm = 0; arm < numArms; arm++) {
    const armStartAngle = (arm * Math.PI * 2) / numArms;
    ctx.beginPath();
    
    for (let d = 0; d <= 40; d++) {
      const t = d / 40;
      const radius = t * maxRadius;
      // 螺线方程：角度随半径增加呈线性/对数扭转
      const theta = armStartAngle + t * Math.PI * 1.6; 
      const x = cx + radius * Math.cos(theta);
      const y = cy + radius * Math.sin(theta);
      
      if (d === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, maxRadius);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.75)`);
    grad.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, 0.2)`);
    grad.addColorStop(1.0, `rgba(${r}, ${g}, ${b}, 0.0)`);
    ctx.strokeStyle = grad;
    ctx.stroke();
  }
  
  // 3. 沿悬臂点缀碎金色星光颗粒 (Energy Sparks)
  for (let arm = 0; arm < numArms; arm++) {
    const armStartAngle = (arm * Math.PI * 2) / numArms;
    for (let i = 0; i < 5; i++) {
      const t = (i + 1.2) / 6.5;
      const radius = t * maxRadius;
      const theta = armStartAngle + t * Math.PI * 1.6 + 0.05;
      const x = cx + radius * Math.cos(theta);
      const y = cy + radius * Math.sin(theta);
      const pSize = (1.0 - t) * 1.8 + 0.6;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * (1.0 - t)})`;
      ctx.beginPath();
      ctx.arc(x, y, pSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // 4. 绘制中心致密的高亮白核 (White Core)
  const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 5);
  innerGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  innerGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.85)');
  innerGrad.addColorStop(1.0, `rgba(${r}, ${g}, ${b}, 0.0)`);
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};
```

### 2. 绕流运动与自转矩阵 (useFrame Animation)
在动画循环中，粒子除了要根据轨道方程执行开合运动（`pulse`）和三维轨道绕流（`orbits`）外，还需要独立对其 2D 材质执行自旋转（`material.rotation`），从而产生漩涡流转的效果。

```javascript
useFrame((state) => {
  const t = state.clock.getElapsedTime();

  particleRefs.current.forEach((mesh, i) => {
    if (!mesh) return;

    const baseScale = liftAmount; // 随大陆 hover 状态平滑缩放
    const pulse = i % 2 === 1 ? 1.0 + Math.sin(t * 5 + i) * 0.15 : 1.0;
    const orbit = orbits[i];
    if (!orbit) return;

    // 1. 动态尺寸微调（缩放因子为 1.6 以确保漩涡细节可辨）
    mesh.scale.setScalar(baseScale * pulse * orbit.size * 1.6);

    if (baseScale > 0.001) {
      // 2. 绕流轨道位置计算
      const expand = 0.85 + 0.15 * liftAmount;
      const theta = t * orbit.speed + orbit.phase;
      
      const x = orbit.rx * expand * Math.cos(theta);
      const z = orbit.rz * expand * Math.sin(theta);
      const y = orbit.yOffset + Math.sin(theta * 2) * 0.04;
      
      const localPos = new THREE.Vector3(x, y, z);
      localPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), orbit.tiltX);
      localPos.applyAxisAngle(new THREE.Vector3(0, 0, 1), orbit.tiltZ);
      mesh.position.copy(localPos);
      
      // 3. 核心：自旋转以驱动粒子内部漩涡旋转
      if (mesh.material) {
        // 根据粒子索引设置交错的自转方向和速度
        mesh.material.rotation = t * (1.8 + (i % 3) * 0.6) * (i % 2 === 0 ? 1 : -1);
      }
    }
  });
});
```

---

## 四、关键性能与渲染优化点

1. **混合模式与黑边滤除**
   为了使发光粒子能够完美融入 3D 背景，使用 `blending: THREE.AdditiveBlending`（加色混合），并且设置 `transparent: true`。同时必须设置 `depthWrite: false`，否则粒子之间重叠或粒子与大气层遮挡时，透明边缘会产生生硬的黑色截断框。
2. **实例独立材质**
   由于每个粒子都需要不同的 `rotation` 值，每个 Sprite 必须独立创建 `SpriteMaterial` 实例，以防所有粒子在渲染时保持完全同步的旋转角度。
3. **动态分辨率把控**
   128 像素既能够保证在全屏视口下微小漩涡细节（如双螺旋曲线）的细腻度，又极大地节省了显存，配合 CanvasTexture 的实时更新，性能开销微乎其微。
