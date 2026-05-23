---
tags: [建站, Next.js, 部署]
created: 2026-05-21
status: planned
---

# Next.js 项目部署流程

> Next.js 项目部署到 Cloudflare Pages。

## 两种模式

### 静态导出（推荐 Cloudflare Pages）

```bash
# next.config.js
output: 'export'

npm run build
```

输出目录：`out`

### SSR / Edge（需 Cloudflare Workers 或 Vercel）

Cloudflare Pages 原生不支持 Next.js SSR。如需 SSR：
- 使用 Vercel 部署
- 或使用 Cloudflare Workers + `@cloudflare/next-on-pages`

## Cloudflare Pages 静态导出配置

| 配置项 | 值 |
|--------|-----|
| 构建命令 | `npm run build` |
| 输出目录 | `out` |

## 注意事项

- 静态导出时 `getServerSideProps` 不可用，需改用 `getStaticProps`
- 动态路由需要 `generateStaticParams`
- API Routes 在静态导出模式下不可用

## 关联笔记

- [[建站流程指南-静态网页/个人建站流程总览]]
- [[建站流程指南-静态网页/平台部署/Cloudflare Pages 部署流程]]
- [[建站流程指南-静态网页/平台部署/Vercel 部署记录]]
