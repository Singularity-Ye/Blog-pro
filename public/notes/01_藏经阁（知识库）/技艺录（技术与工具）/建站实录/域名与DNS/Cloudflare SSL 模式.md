---
tags: [建站, Cloudflare, SSL, HTTPS]
created: 2026-05-21
status: active
---

# Cloudflare SSL 模式

> SSL 模式设置不当是 502 的常见原因。

## 四种模式

| 模式 | 浏览器→Cloudflare | Cloudflare→源站 | 要求 |
|------|:--:|:--:|------|
| **Flexible** | HTTPS | HTTP | 源站不需要证书 |
| **Full** | HTTPS | HTTPS | 源站有自签名证书即可 |
| **Full (Strict)** | HTTPS | HTTPS | 源站证书必须有效 |
| **Off** | HTTP | HTTP | 不使用 HTTPS |

## 经验

- 之前使用 **Flexible** 时出现访问异常
- 改为 **Full** 后问题解决
- 后续优先使用 **Full**

## 排查顺序

1. 检查源站是否能直接访问
2. 确认 Cloudflare SSL 模式
3. 尝试从 Flexible → Full
4. 清除 Cloudflare 缓存
5. 暂停再重新启用 Cloudflare

## 关联笔记

- [[建站流程指南-静态网页/域名与DNS/Cloudflare DNS 配置]]
- [[建站流程指南-静态网页/故障排查/建站故障排查清单]]
- [[建站流程指南-静态网页/平台部署/Vercel 部署记录]]
