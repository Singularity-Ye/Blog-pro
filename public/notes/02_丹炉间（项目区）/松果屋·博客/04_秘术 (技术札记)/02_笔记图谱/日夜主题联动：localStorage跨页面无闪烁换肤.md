---
tags:
  - 博客
  - 图谱页
  - 主题
  - CSS变量
  - 性能
page:
  - Atlas.jsx
  - Note.jsx
aliases:
  - 日夜主题同步
  - localStorage换肤
  - 无闪烁主题切换
created: 2026-05-29
status: permanent
---

# 日夜主题联动：localStorage 跨页面无闪烁换肤

为大厂图谱大厅与笔记阅读页构建的全局日夜主题同步系统。纯 React + CSS 变量，零依赖，无闪烁。

---

## 持久化与默认主题

统一键名 `'atlas-theme'` 存入 `localStorage`。首次访问时根据系统时间智能决定——早 7 至晚 19 为晨曦日间，其余为幽夜夜间。

```javascript
const [theme, setTheme] = useState(() => {
  const saved = localStorage.getItem('atlas-theme');
  if (saved) return saved;
  const hour = new Date().getHours();
  return (hour >= 7 && hour < 19) ? 'light' : 'dark';
});
```

---

## 跨页面同步

React 中注册全局 `storage` 事件监听器。用户在大厅或笔记页任一侧切换主题时，`window.dispatchEvent` 主动抛出事件，另一侧不重载页面即完成皮肤对齐。

```javascript
const toggleTheme = () => {
  const next = theme === 'light' ? 'dark' : 'light';
  setTheme(next);
  localStorage.setItem('atlas-theme', next);
  window.dispatchEvent(new Event('storage'));
};

useEffect(() => {
  const syncTheme = () => {
    const saved = localStorage.getItem('atlas-theme');
    if (saved) setTheme(saved);
  };
  window.addEventListener('storage', syncTheme);
  return () => window.removeEventListener('storage', syncTheme);
}, []);
```

---

## 双图自适应背景

大厅页使用原生高清原画——`Celestial-Sands-Field-Light.png`（日间）和 `Celestial-Sands-Field-Dark.png`（夜间），弃用反色滤镜，原画画质无损。

笔记阅读页使用专属壁纸——`note-reading-light.png`（日间暖沙）和 `note-reading-dark.png`（夜间星轨）。夜间模式下配合软渐变遮罩（40%~60% 遮蔽度），隐藏强对比干扰的同时保留星尘与图纸隐现细节。

---

## MiniGraph Canvas 动态适配

右侧 Mini 关系图谱基于 Canvas 绘制，日夜模式切换后背景色改变会导致线条和字样看不清。解决方式是将 `theme` 传入 Canvas 渲染上下文：

- **晨曦模式**：温润棕金线条 + 暗黄文字，节点呈现金砂晕染
- **幽夜模式**：荧光绿 + 亮黄星线，节点附带星尘发光粒子

> 换肤不只换 CSS——Canvas 的每一笔颜色也要跟着变。
