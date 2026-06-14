---
tags: [建站, GitHub, git]
created: 2026-05-21
status: active
---

# GitHub 项目上传流程

> 本地项目托管到 GitHub，供 Cloudflare Pages 拉取并构建。

## 本次项目

| 项目  | 值                           |
| --- | --------------------------- |
| 仓库  | `Singularity-Ye / Blog-pro` |
| 框架  | Create React App            |
| 部署  | Cloudflare Pages            |

## 标准命令

```bash
git init
git add .
git commit -m "init project"
git branch -M main
git remote add origin https://github.com/Singularity-Ye/Blog-pro.git
git push -u origin main
```

## 后续更新

```bash
git add .
git commit -m "update: 描述"
git push
```

Cloudflare Pages 可在设置中开启 **自动部署**：每次 push 自动 rebuild。

## 注意事项

- `.gitignore` 中务必排除 `.env`、密钥文件
- 上传前确认 `node_modules/` 已被 ignore（通过 `.gitignore`）

## 关联笔记

- [[建站流程指南-静态网页/平台部署/Cloudflare Pages 部署流程]]
- [[建站流程指南-静态网页/个人建站流程总览]]
