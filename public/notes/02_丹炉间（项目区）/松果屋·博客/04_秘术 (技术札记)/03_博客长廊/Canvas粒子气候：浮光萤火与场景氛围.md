---
tags:
  - 博客
  - 博客页
  - Canvas
  - 粒子
  - 性能
page:
  - Blog.jsx
aliases:
  - 粒子气候层
  - CanvasBackground
  - 浮光萤火
created: 2026-05-28
status: permanent
---

# Canvas 粒子气候：浮光萤火与场景氛围

博客页有一个覆盖全屏的 `CanvasBackground`，不参与 React 渲染循环，使用原生 Canvas + `requestAnimationFrame` 独立驱动。

每个粒子是一个 `Firefly` 实例：`x`、`y`、`size`、`speedX`、`speedY`、`wobble`、`wobbleSpeed`、`color`。粒子自下而上漂浮，带轻微正弦摆动：

```javascript
this.x += this.speedX + Math.sin(this.wobble) * 0.18;
```

粒子颜色随场景变化：屋内、回廊、旧柜、工坊用暖金烛光粒子；室外、旅图案台用深青森林微光；总览左侧偏金、右侧偏绿——一个场景两种气候。

鼠标位置用 `rawMouseRef`（ref 而非 state）读取，粒子产生微偏移但不会触发 React 重渲染。这是性能选择——如果每次 `mousemove` 都 `setState`，React 调度会拖垮粒子动画。

> 这套粒子不是装饰，而是在做"场景气候"：每个房间的空气质感不同。读者不用看场景标题，看粒子颜色就知道自己在屋内还是林间。
