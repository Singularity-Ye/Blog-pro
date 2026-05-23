---
tags: [建站, Cloudflare, Pages, 部署]
created: 2026-05-21
updated: 2026-05-21
status: active
project: Blog-pro
repo: Singularity-Ye/Blog-pro
---

# Cloudflare Pages 部署流程

> 2026-05-21 实操版本：将 GitHub 上的 Create React App 项目部署到 Cloudflare Pages。

## 最终部署结果

```
GitHub 仓库 (Singularity-Ye/Blog-pro)
  → Cloudflare Pages 构建部署
    → 阿里云 DNS CNAME 解析
      → Cloudflare Pages 自定义域名绑定
        → HTTPS 访问成功
```

| 地址 | 类型 | 状态 |
|------|------|:--:|
| `blog-pro-csu.pages.dev` | Pages 默认域名 | ✅ |
| `www.oblogsidian.fun` | 自定义域名 | ✅ Active + SSL |

## 步骤

### 1. 上传项目到 GitHub

仓库：`Singularity-Ye / Blog-pro`

Cloudflare Pages 后续从该仓库拉代码并构建。

### 2. 进入 Cloudflare Pages

Cloudflare 控制台 → 右上角 **Add** → **Pages**

> ⚠️ 选 **Pages**，不要选 **Connect a domain**（那是单纯接入域名，不是部署项目）。

### 3. 导入 Git 仓库

选择 **Import an existing Git repository** → 选 `Singularity-Ye / Blog-pro`

> 不要选 **Drag and drop**——Git 方式适合长期维护，push 后可自动重新部署。

### 4. 构建配置

| 配置项 | 正确值 | 错误值（曾踩过） |
|--------|--------|------------------|
| Framework preset | Create React App 或 None | — |
| Build command | `npm run build` | 空 |
| Build output directory | **`build`** | `dist` ❌ |
| Root directory | 留空 | — |

关键判断方法：看 Build log 中是否有 `react-scripts build`（CRA）还是 `vite build`（Vite）。

```
CRA  → build
Vite → dist
```

### 5. 部署

点击 **Deploy**，等待构建完成。

获得 Pages 默认域名：`blog-pro-csu.pages.dev`

### 6. 修改配置后必须 Retry deployment

保存 Build configuration **不等于**旧部署自动更新。

修改配置后：**Deployments** → 找到最近一次 → `...` → **Retry deployment**

## 不同项目类型的配置

| 项目类型 | Build command | Output directory |
|----------|---------------|------------------|
| 纯 HTML/CSS/JS | 留空 | `/` |
| Vite | `npm run build` | `dist` |
| Create React App | `npm run build` | **`build`** |
| Next.js 静态导出 | `npm run build` | `out` |

## 绑定自定义域名

详见 → [[建站流程指南-静态网页/域名与DNS/阿里云域名 CNAME 绑定 Cloudflare Pages]]

## 关联笔记

- [[建站流程指南-静态网页/平台部署/Cloudflare Pages 404 排错记录]]
- [[建站流程指南-静态网页/域名与DNS/阿里云域名 CNAME 绑定 Cloudflare Pages]]
- [[建站流程指南-静态网页/GitHub 项目上传流程]]
- [[建站流程指南-静态网页/个人建站流程总览]]
