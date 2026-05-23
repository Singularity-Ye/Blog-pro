---
tags: [建站, 阿里云, CNAME, Cloudflare Pages, 域名]
created: 2026-05-21
status: active
domain: oblogsidian.fun
---

# 阿里云域名 CNAME 绑定 Cloudflare Pages

> 2026-05-21 实操版：不把域名 DNS 托管到 Cloudflare，保持阿里云 DNS，仅通过一条 CNAME 记录指向 Pages。

## 两种 DNS 方案对比

| 方案 | DNS 托管方 | 操作 | 适用场景 |
|------|------------|------|----------|
| **方案一：Cloudflare DNS** | Cloudflare | 阿里云改 Nameserver | 全家桶，需整体迁移 |
| **方案二：My DNS provider** | 阿里云（不变） | 只加一条 CNAME | ✅ 本次采用 |

本次选择方案二的原因：

- 不想整体迁移 DNS
- 复刻之前成功的 CNAME 方案
- 操作简单，只加一条记录

## 步骤

### 1. 确认 Pages 默认域名可访问

在绑自定义域名之前，先确保：

```
https://blog-pro-csu.pages.dev
```

能正常打开。如果默认域名也 404，问题在部署，不在 DNS。

### 2. Cloudflare Pages 添加自定义域名

**Workers & Pages** → `blog-pro` → **Custom domains** → **Set up a custom domain**

填写：

```
www.oblogsidian.fun
```

> ⚠️ 这里填**完整域名**，不是只填 `www`。

### 3. 选择 DNS 配置方式

选择 **My DNS provider** → **Begin CNAME setup**

Cloudflare 提示添加：

| 字段 | 值 |
|------|-----|
| Name | `www` |
| Target | `blog-pro-csu.pages.dev` |

### 4. 阿里云添加 CNAME 记录

阿里云 → **云解析 DNS** → **权威域名解析** → `oblogsidian.fun` → **解析设置** → **添加记录**

| 字段 | 内容 |
|------|------|
| 记录类型 | **CNAME** |
| 主机记录 | `www` |
| 解析线路 | 默认 |
| 记录值 | `blog-pro-csu.pages.dev` |
| TTL | 默认 |

含义：`www.oblogsidian.fun` → `blog-pro-csu.pages.dev`

### 5. 回 Cloudflare 检测 DNS

回到 Cloudflare Pages 页面，点击 **Check DNS records**，等待检测通过。

最终显示：

```
www.oblogsidian.fun
Active
SSL enabled
```

## 关键判断

### 你的 DNS 到底在谁手里？

在阿里云解析页面看提示：

| 提示 | 含义 |
|------|------|
| "域名的 DNS 信息配置正确" | DNS 在阿里云 → 阿里云里的解析记录**生效** |
| "未接入使用云解析 DNS，当前配置的解析记录不会生效" | DNS 不在阿里云（可能在 Cloudflare）→ 要去 Cloudflare 加记录 |

> 解析记录必须加到**当前真正生效的 DNS 服务商**。

## Active + SSL ≠ 网站能打开

Custom domains 显示 `Active` + `SSL enabled` 只说明：

- ✅ 域名解析成功
- ✅ HTTPS 证书签发成功

但如果 Pages 项目本身**构建失败**，访问仍然 404。

排查方法：先访问 Pages 默认域名，默认域名也不行 → 看 Build log。

## 关联笔记

- [[建站流程指南-静态网页/平台部署/Cloudflare Pages 部署流程]]
- [[建站流程指南-静态网页/平台部署/Cloudflare Pages 404 排错记录]]
- [[建站流程指南-静态网页/域名与DNS/阿里云域名配置]]
- [[建站流程指南-静态网页/个人建站流程总览]]
