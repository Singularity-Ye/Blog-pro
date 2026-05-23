---
tags: [建站, Vercel, 部署, 经验]
created: 2026-05-21
status: archived
---

# Vercel 部署记录

> 曾经尝试过的方案，记录经验教训。

## 优点

- 部署简单，自动生成预览域名
- 适合快速测试
- 免费额度充足

## 缺点

- Vercel 默认域名（`*.vercel.app`）在国内访问不稳定
- 有时需要代理或加速器才能访问
- 绑定 Cloudflare 后可能出现 SSL / 502 / 重定向问题

## 遇到的问题

### 502 + Cloudflare

- HTTP ERROR 502
- `chrome-error://chromewebdata`
- 某些浏览器能访问，某些不能

### 排查记录

| 操作 | 结果 |
|------|------|
| Cloudflare SSL Flexible → Full | 部分问题解决 |
| 清除 Cloudflare 缓存 | 偶尔恢复 |
| 暂停再启用 Cloudflare | 偶尔恢复 |
| 整体稳定性 | 仍不理想 |

## 结论

- ~~适合正式展示页~~ → 推荐换用 Cloudflare Pages
- 测试用途可以继续用 Vercel
- 不建议长期依赖 Vercel 默认域名

## 关联笔记

- [[建站流程指南-静态网页/个人建站流程总览]]
- [[建站流程指南-静态网页/平台部署/Cloudflare Pages 部署流程]]
- [[建站流程指南-静态网页/域名与DNS/Cloudflare SSL 模式]]
- [[建站流程指南-静态网页/故障排查/建站故障排查清单]]
