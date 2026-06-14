---
tags:
  - 博客
  - 博客页
  - Canvas
  - 交互
  - Alpha通道
page:
  - Blog.jsx
aliases:
  - Alpha命中检测
  - 像素级热区
  - 透明抠图交互
created: 2026-05-28
status: permanent
---

# 透明抠图 Alpha 命中：不规则物件的像素级热区

travel 场景的地图册、卷轴、旧札柜的抽屉、工坊的魔药瓶——这些都不是矩形按钮。它们是不规则的手绘抠图。如果热区是矩形，用户会点到物件旁边的透明区域，交互精度崩塌。

页面的做法是**预计算 alpha 命中网格**：

```javascript
const imgData = ctx.getImageData(0, 0, w, h).data;
const grid = new Uint8Array(w * h);
for (let i = 0; i < grid.length; i++) {
  grid[i] = imgData[i * 4 + 3] > 20 ? 1 : 0;
}
```

加载时把抠图资源画到离屏 canvas 上，读取每个像素的 alpha 通道，存入 `Uint8Array` 网格。鼠标移动时，屏幕坐标换算为图片网格坐标，只在 `grid[index] === 1` 的区域触发 hover 和 click。

这意味着用户不是点中一个大矩形，而是真的点中了画面中的物件轮廓。手绘画卷与真实交互严丝合缝。

> 以 alpha 通道为边界，替代矩形按钮热区。它让不规则手绘素材拥有了像素级精确的交互表面。
