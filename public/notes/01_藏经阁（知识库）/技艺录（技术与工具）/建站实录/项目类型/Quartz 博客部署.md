---
tags: [建站, Quartz, Obsidian, 博客]
created: 2026-05-21
status: planned
---

# Quartz 博客部署

> 使用 Quartz 将 Obsidian vault 发布为静态博客。

## 概述

[Quartz](https://quartz.jzhao.xyz/) 是一个基于 Hugo 的 Obsidian 发布工具。它读取 Obsidian vault 中的 Markdown 文件，生成静态网站。

## 基本流程

1. 安装 Quartz
2. 配置 vault 路径
3. 本地预览
4. 构建静态文件
5. 部署到 Cloudflare Pages

## 构建配置

```
项目类型：静态网站
构建命令：npx quartz build
输出目录：public
```

## 与 Obsidian 的关系

- Quartz 不直接修改 Obsidian vault
- 读取 vault 中的 `.md` 文件生成 HTML
- 支持 `[[双链]]`、标签、图谱等

## 关联笔记

- [[建站流程指南-静态网页/个人建站流程总览]]
- [[建站流程指南-静态网页/平台部署/Cloudflare Pages 部署流程]]
- [[02_丹炉间（项目区）/松果屋·博客/设计总览]]
