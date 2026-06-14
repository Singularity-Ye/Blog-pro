---
tags: [建站, React, Vite, CRA, 部署]
created: 2026-05-21
updated: 2026-05-21
status: active
---

# React 项目部署流程

> 2026-05-21 实操版。项目 `Blog-pro` 是 Create React App，部署到 Cloudflare Pages。

## 本地开发

```bash
npm install
npm start       # CRA
# 或
npm run dev     # Vite
```

本地地址：`http://localhost:3000`（CRA）或 `http://localhost:5173`（Vite）

## 构建

```bash
npm run build
```

## 关键区分：输出目录

| 框架 | Build log 关键词 | 输出目录 |
|------|------------------|----------|
| **Create React App** | `react-scripts build` | **`build`** |
| Vite | `vite build` | `dist` |

> **本次踩坑**：项目是 CRA，但 Cloudflare 配置的 output directory 写了 `dist`，导致 `Error: Output directory "dist" not found`。

## Cloudflare Pages 配置

| 配置项 | CRA | Vite |
|--------|-----|------|
| Build command | `npm run build` | `npm run build` |
| Build output directory | **`build`** | `dist` |
| Root directory | 留空 | 留空 |

## 环境变量

在 Cloudflare Pages 设置中添加：

- CRA：`REACT_APP_*` 前缀的变量
- Vite：`VITE_*` 前缀的变量

## 关联笔记

- [[建站流程指南-静态网页/平台部署/Cloudflare Pages 部署流程]]
- [[建站流程指南-静态网页/平台部署/Cloudflare Pages 404 排错记录]]
- [[建站流程指南-静态网页/GitHub 项目上传流程]]
