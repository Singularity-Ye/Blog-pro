---
tags:
  - 博客
  - 首页
  - threejs
  - WebGL
  - 几何生成
page:
  - ContinentPatch.jsx
aliases:
  - 球面大陆几何
  - lat-lon转球面法线
  - 弯曲大陆片
created: 2026-05-28
status: permanent
---

# 球面弯曲大陆：lat-lon 转球面几何生成法

首页星球上的大陆不是贴在球上的平面图片。`ContinentPatch.jsx` 中的 `createCurvedPatchGeometry` 会根据每块大陆的纬度、经度、宽角、高角和旋转角，在球面上生成一张真正弯曲的网格。

---

## 从经纬度到球面法线

第一步，`normalFromLatLon` 把经纬度转为球面单位法向量。这是整个几何的"锚点"——大陆中心在球面上的精确位置。

```javascript
const centerNormal = normalFromLatLon(lat, lon);
```

有了中心法线后，计算球面切线方向 `tangentX` 与 `tangentY`，它们定义了大陆在球面上的"横向"和"纵向"展开方向。

---

## 网格生成

按 `segmentsX = 42`、`segmentsY = 32` 生成网格。每个网格点根据角度偏移投射回球面，最终得到贴合星球曲率的大陆几何。

这意味着大陆不是贴在球上的纸片——而是**顺着球面生长出的生态斑块。** 无论星球旋转到什么角度，大陆始终紧贴球面曲率，不会在边缘翘起或穿透。

---

## 多层抬升效果

hover 时，大陆不是简单变色，而是通过多层几何制造"抬升"：

- 阴影层 `shadowGeometry`
- 四层 `raised layer`
- 主大陆层
- `glow` 发光层

当大陆激活时，`liftAmountRef` 从 0 缓动到 1，多层几何逐渐显形：

```javascript
const targetLift = active ? 1 : 0;
const easing = active
  ? 1 - Math.exp(-delta * 12)
  : 1 - Math.exp(-delta * 4.2);
liftAmountRef.current = THREE.MathUtils.lerp(
  liftAmountRef.current, targetLift, easing
);
```

激活时抬升快（12），回落时缓（4.2）。这是一种交互节奏的控制——**响应要快，消退要柔。**

---

> 大陆从星体表面微微浮起。它不是贴图按钮，而是一片会响应灵识靠近的浮雕。
