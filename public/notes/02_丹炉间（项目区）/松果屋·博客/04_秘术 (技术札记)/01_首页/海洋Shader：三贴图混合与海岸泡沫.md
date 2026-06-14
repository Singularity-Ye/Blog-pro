---
tags:
  - 博客
  - 首页
  - WebGL
  - Shader
  - threejs
page:
  - PlanetBase.jsx
aliases:
  - 海洋Shader
  - PlanetBase shader
  - 三贴图混合
created: 2026-05-28
status: permanent
---

# 海洋 Shader：三贴图混合与海岸泡沫

星球底层海面没有用 `meshStandardMaterial`——那是给普通 3D 模型用的，配不上一颗需要"活起来"的星体。`PlanetBase.jsx` 手写了自定义 `vertexShader` 与 `fragmentShader`，混合三张贴图并通过 `uTime` 让水面随时间流动。

---

## 三张贴图

- `ocean_albedo.png` — 海洋基础色
- `ocean_noise.png` — 水面波纹噪声
- `ocean_foam_mask.png` — 海岸泡沫遮罩

```javascript
useFrame(({ clock }) => {
  if (materialRef.current) {
    materialRef.current.uniforms.uTime.value = clock.elapsedTime;
  }
});
```

每一帧更新 `uTime`，噪声贴图的采样坐标随之偏移，水面永远在流动。

---

## Triplanar Sampling：解决球体 UV 接缝

普通 `texture2D` 在球体上会产生明显的 UV 接缝——因为纹理包裹球体时总有一个"收口"的位置。Triplanar sampling 从三个轴向分别采样纹理，再按法线方向混合权重，**接缝消失了。**

这是做星球渲染的基本功，但很多项目用现成的 spherical mapping 糊弄过去。手写 triplanar 意味着海洋纹理在任何角度都看不到那条丑陋的拼接线。

---

## 海岸 Mask 与泡沫

`getCoastMask` 是 shader 里最精妙的部分：它读取大陆中心位置，计算当前像素到最近大陆边缘的距离。在海岸线附近叠加 foam 泡沫贴图，让大陆与海洋的交界处浮出一层白色浪花。

大陆和海洋不是各画各的。它们在海陆交界处**真正发生了材质上的呼应**——就像真实的海岸线一样。

---

## Fresnel 边缘水光

球体边缘用 fresnel 效果叠加淡淡水光。视线越接近球面切线方向，水光越强。这让星球边缘有一层通透的"大气光晕"，而不是一个硬邦邦的蓝色球壳。

---

## Noise 做海盆阴影

用 noise 函数在深海区生成暗色斑块，在浅海区生成亮色斑纹。不是随机噪点——是**模拟海盆地形**的视觉暗示。深海暗，浅海亮，波纹有一致的方向感。

---

> 海面不是一层蓝色壳。它有深海、浅滩、海岸、泡沫和流动感——是起源水域，不是贴图。
