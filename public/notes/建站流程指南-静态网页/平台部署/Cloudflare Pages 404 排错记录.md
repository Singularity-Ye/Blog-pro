---
tags: [建站, Cloudflare Pages, 404, 排错, 实操]
created: 2026-05-21
status: active
---

# Cloudflare Pages 404 排错记录

> 2026-05-21 实操：从 404 一路追到 build output directory 的真实排错路径。

## 症状

```
Custom domains: www.oblogsidian.fun → Active, SSL enabled
浏览器访问: https://www.oblogsidian.fun → HTTP ERROR 404

Pages 默认域名: https://blog-pro-csu.pages.dev → 也是 404
```

## 排查链

### 第一步：定位问题层次

```
自定义域名 404
  → 测试 Pages 默认域名
    → 默认域名也 404
      → 结论：不是 DNS 问题，是 Pages 部署问题
```

> **核心原则：看到 404 不要立刻怀疑 DNS。先访问 Pages 默认域名。**

### 第二步：查看 Build log

进入 **Deployments** → 最近一次部署 → 查看构建日志。

关键发现：

```
> personal-blog@0.1.0 build
> react-scripts build
```

这说明项目是 **Create React App**——不是 Vite。

进一步日志：

```
The build folder is ready to be deployed.

Error: Output directory "dist" not found.
Failed: build output directory not found.
```

CRA 把产物放在 `build/`，但 Cloudflare 在找 `dist/`。

### 第三步：根源定位

| 我以为 | 实际 |
|--------|------|
| 项目是 Vite | 项目是 Create React App |
| 输出目录 `dist` | 输出目录 `build` |
| → Cloudflare 找不到 `dist/` | → 构建失败，部署空目录 |

**真正错误：把 CRA 的输出目录误写成了 Vite 的 `dist`。**

### 第四步：修复

修改 Build configuration：

| 配置项 | 修改前 ❌ | 修改后 ✅ |
|--------|-----------|-----------|
| Build output directory | `dist` | **`build`** |

### 第五步：Retry deployment

保存配置后，**必须手动重新部署**。

**Deployments** → 找到最近一次 → `...` → **Retry deployment**

旧部署不会自动使用新配置。

## 最终结果

重新部署后：

- ✅ Pages 默认域名可访问
- ✅ 自定义域名 `www.oblogsidian.fun` 可访问
- ✅ 首页显示「灵感小地球仪」

## 核心经验

### 1. Active + SSL ≠ 网站能打开

`Active` 和 `SSL enabled` 只说明 DNS 解析和证书 OK。如果 Pages 构建失败，照样 404。

### 2. 排查顺序（重要）

```
1. 访问自定义域名
2. 404 → 访问 Pages 默认域名 (xxx.pages.dev)
3. 默认域名也 404 → 问题在 Pages 部署
4. 查看 Build log
5. 根据日志修正 Build command / Build output directory
6. Retry deployment
```

### 3. 不同框架的输出目录不能混

| 项目类型 | 输出目录 | 识别方法（看 build log） |
|----------|----------|--------------------------|
| CRA | **`build`** | `react-scripts build` |
| Vite | `dist` | `vite build` |
| Next.js 静态导出 | `out` | `next build && next export` |
| 纯 HTML | `/` | 无构建步骤 |

### 4. 保存配置 ≠ 自动生效

修改 Build configuration 后，必须 **Retry deployment**。旧部署不会自动用新配置重新跑。

## 关联笔记

- [[建站流程指南-静态网页/平台部署/Cloudflare Pages 部署流程]]
- [[建站流程指南-静态网页/域名与DNS/阿里云域名 CNAME 绑定 Cloudflare Pages]]
- [[建站流程指南-静态网页/故障排查/建站故障排查清单]]
- [[建站流程指南-静态网页/个人建站流程总览]]
