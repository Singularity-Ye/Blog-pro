---
tags:
  - 博客
  - 博客页
  - 配置驱动
  - 空间场景
page:
  - Blog.jsx
aliases:
  - BLOG_SCENES
  - 空间场景配置
created: 2026-05-28
status: permanent
---

# BLOG_SCENES：配置驱动的空间场景系统

博客页不是七个硬编码的页面，而是一张由 `BLOG_SCENES` 配置对象驱动的场景地图。新增一个场景不是新写一页——是在长廊地图上新增一间房。

每个场景拥有 `id`、`title`、`subtitle`、`background`、`themeColor`、`portals`、`items`。渲染时只关心 `currentScene`——背景画卷、传送门位置、可交互物件、弹窗主题全部从配置读取。

```javascript
const [sceneMode, setSceneMode] = useState('overview');
const currentScene = BLOG_SCENES[sceneMode];
```

物件通过三种方式连接 Obsidian 数据底座：

- `articleSlug`：直接指向一篇笔记
- `collections`：绑定一个或多个 collection
- `filter`：自定义过滤函数

物件不保存内容，只保存**如何找到内容**。数据来自 `notes-index.json`，物件只是入口和筛选器。
