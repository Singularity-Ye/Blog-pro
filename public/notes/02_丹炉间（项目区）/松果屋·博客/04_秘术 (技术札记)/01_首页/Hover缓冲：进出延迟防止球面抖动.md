---
tags:
  - 博客
  - 首页
  - 交互
  - threejs
page:
  - PlanetSurface.jsx
aliases:
  - Hover进出缓冲
  - 球面高亮防抖
  - hover延迟
created: 2026-05-28
status: permanent
---

# Hover 缓冲：进出延迟防止球面抖动

3D 球面上的大陆边缘并不规则。如果 hover 立即进出，用户移动鼠标时高亮会疯狂闪烁——鼠标扫过大陆边缘的锯齿区域时，每一帧都在"进入"和"离开"之间反复横跳。

`PlanetSurface` 没有让 hover 立即生效。

---

## 进入延迟：180ms

```javascript
hoverTimerRef.current = window.setTimeout(() => {
  setHoverTile(hoverTileRef.current);
  onBiomeHover?.(hoverTileRef.current?.biome ?? null);
}, 180);
```

鼠标必须在大陆上稳定停留 180ms 以上，高亮才亮起。扫过去的瞬间碰触不会触发。

---

## 离开缓冲：420ms

```javascript
leaveTimerRef.current = window.setTimeout(() => {
  hoverTileRef.current = null;
  setHoverTile(null);
  onBiomeHover?.(null);
}, 420);
```

离开后 420ms 内如果鼠标又回来了（比如扫过边缘锯齿的另一侧），高亮不会熄灭。缓冲窗口够长，覆盖了边缘地带的全部抖动区间。

---

## 为什么是两个不对称的值

进入 180ms，离开 420ms。**亮起要快，熄灭要慢。**

进入快——用户停下来想看某块大陆时，不需要等太久就有反馈。离开慢——鼠标扫过边缘锯齿时不至于亮灭亮灭。非对称延迟是交互打磨的经验值，不是随便写的。

---

## 清理 timer

每次设置新 timer 前，先清掉旧的：

```javascript
if (hoverTimerRef.current) {
  clearTimeout(hoverTimerRef.current);
  hoverTimerRef.current = null;
}
```

这防止了快速移动鼠标时多个 timer 堆叠导致的闪烁。上一个还没触发就被下一个替换了。

---

> 星体像有了"感应迟滞"——灵识靠近片刻才亮起，离开后也不会立刻熄灭。交互从机械按钮变成了星体感应。
