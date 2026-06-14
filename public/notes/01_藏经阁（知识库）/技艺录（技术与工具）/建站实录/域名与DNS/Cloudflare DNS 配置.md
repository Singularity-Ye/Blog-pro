---
tags: [建站, Cloudflare, DNS, 域名]
created: 2026-05-21
status: active
---

# Cloudflare DNS 配置

> 将阿里云购买的域名 DNS 托管到 Cloudflare。

## 步骤

1. **阿里云购买域名**
2. 进入 [Cloudflare](https://dash.cloudflare.com/) → **添加站点**
3. 输入域名，选择 Free 计划
4. Cloudflare 提供两个 Nameserver（如 `alice.ns.cloudflare.com` / `bob.ns.cloudflare.com`）
5. 回到阿里云域名管理 → **修改 DNS 服务器**
6. 填入 Cloudflare 的 Nameserver
7. 等待 DNS 生效（几分钟到 48 小时）

## DNS 记录类型

| 类型 | 用途 | 示例 |
|------|------|------|
| A | 指向 IPv4 地址 | `example.com → 192.0.2.1` |
| CNAME | 别名指向 | `www → example.com` |
| TXT | 验证/SPF | 域名所有权验证 |

## 代理状态

Cloudflare DNS 记录前有小云朵图标：

- 🟠 **橙色云朵（Proxied）**：流量经过 Cloudflare，隐藏源站 IP
- ⚪ **灰色云朵（DNS only）**：直连源站

Cloudflare Pages 绑定域名时，通常自动设为 Proxied。

## 关联笔记

- [[建站流程指南-静态网页/域名与DNS/阿里云域名配置]]
- [[建站流程指南-静态网页/域名与DNS/Cloudflare SSL 模式]]
- [[建站流程指南-静态网页/个人建站流程总览]]
