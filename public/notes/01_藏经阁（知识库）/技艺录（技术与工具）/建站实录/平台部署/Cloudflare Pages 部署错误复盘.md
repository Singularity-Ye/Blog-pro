---
tags: [建站, Cloudflare, Pages, 排错, 复盘]
created: 2026-05-21
status: active
---

# Cloudflare Pages 部署错误复盘

> 一次部署踩了域名绑定 + Git 授权断开两个坑。记录完整错误链、排查路径和修复流程，供以后快速定位。

## 1. 问题背景

- 项目：个人博客（Create React App）
- GitHub 仓库：`<GitHub 用户名>/<博客仓库名>`
- Cloudflare Pages 项目：`<pages-project-name>`
- 最终绑定域名：`example.com`
- 之前绑定过：`www.example.com`
- 部署平台：Cloudflare Workers & Pages

本次主要经历了两类问题：

1. 自定义域名从 `www` 子域名改为根域名
2. GitHub 更新后 Cloudflare Pages 没有自动部署

---

## 2. 问题一：根域名绑定流程

### 2.1 现象

之前绑定的 `www.example.com` 工作正常。决定改用根域名 `example.com`，于是在 Cloudflare Pages Custom domains 中删掉 `www`，重新添加根域名，但流程和之前完全不同。

### 2.2 原因

- **`www` 子域名**：可以在原 DNS 服务商（如阿里云）处直接加一条 CNAME 指向 Pages 默认域名即可
- **根域名（apex domain）**：Cloudflare Pages 要求域名 DNS 托管到 Cloudflare，才能稳定处理根域名解析、SSL 和 CNAME flattening

因此 Cloudflare 提示：

```
Transfer DNS management
Before adding example.com to your Pages project,
you'll need to transfer your DNS to Cloudflare.
```

### 2.3 解决流程

**Step 1：修改 nameserver**

进入域名注册商（阿里云）控制台：

```
域名管理 → example.com → DNS 修改 → 修改 DNS 服务器
```

将原有 nameserver：
```
<registrar-ns-1>
<registrar-ns-2>
```

替换为 Cloudflare 提供的两个 nameserver：
```
<cloudflare-ns-1>.ns.cloudflare.com
<cloudflare-ns-2>.ns.cloudflare.com
```

**Step 2：等待生效**

回到 Cloudflare，点击「I updated my nameservers」。检测成功后显示：

```
Your domain is now protected by Cloudflare
DNS Setup: Full
```

**Step 3：Pages 绑定根域名**

```
Workers & Pages → <pages-project-name>
  → Custom domains → Set up a custom domain
```

输入：`example.com`（不加 `www`，不加 `https://`）

如果 Cloudflare 没有自动创建 DNS 记录，手动添加：

| 类型 | Name | Target | Proxy |
|------|------|--------|:--:|
| CNAME | `@` | `<project>.pages.dev` | Proxied |

**Step 4：确认结果**

Custom domains 页面显示：

```
example.com    Active    SSL enabled
```

### 2.4 注意事项

- **改 nameserver 不等于加 DNS 记录**：nameserver 决定"谁来解析这个域名"，DNS record 决定"解析到哪里"
- 修改 nameserver 的操作位置在**域名注册商**（如阿里云的「DNS 修改」），不是在云解析 DNS 里加记录
- 子域名绑定和根域名绑定的流程不同，不要用处理子域名的方式处理根域名

---

## 3. 问题二：GitHub 更新后 Cloudflare 不自动部署

### 3.1 现象

GitHub 仓库更新后，在 Cloudflare Pages 里点击旧部署的 **Retry deployment**，但网站没有任何变化。

后来发现 retry 的仍是旧 commit（`<old-commit-hash>`，两天前的初始提交）。

### 3.2 核心误区

**Retry deployment 不会拉取 GitHub 最新代码。**

```
Retry deployment = 重跑当前 deployment 绑定的旧 commit
不是 = 拉取最新 GitHub 代码重新部署
```

如果旧 deployment 绑定的是两天前的 commit，retry 之后部署出来仍然是旧版本。

### 3.3 真正原因

Cloudflare Pages 设置页顶部有一行关键提示：

```
This project is disconnected from your Git account.
This may cause deployments to fail.
```

完整因果链：

```
GitHub 授权断开
  → Cloudflare 收不到 push 事件
    → 不会自动生成新的 deployment
      → 点旧部署 Retry 只会重跑旧 commit
        → 网站看起来没有变化
```

### 3.4 修复流程

**Step 1：修复 GitHub App 授权**

```
Workers & Pages → <pages-project-name>
  → Settings → Build → Git repository → Manage
```

跳转到 GitHub 的 **Cloudflare Workers and Pages App** 权限页面。

选择：
```
Only select repositories → 选中目标仓库
```

保存。如果 Save 按钮灰色，尝试取消再重选，或先切「All repositories」保存再切回。

回到 Cloudflare 刷新，确认 disconnected 提示消失。

**Step 2：重新触发 push**

保存权限只是恢复连接，Cloudflare 不一定会补抓之前错过的 push 事件。

如果本地有新修改：
```bash
git add .
git commit -m "update"
git push origin main
```

如果 GitHub 已是最新，用空提交触发：
```bash
git commit --allow-empty -m "Trigger Cloudflare Pages deployment"
git push origin main
```

**Step 3：确认新部署出现**

检查 Deployments 页面是否出现新的 deployment，commit hash 是否为最新。

### 3.5 验证方式

| 检查项 | 方法 |
|--------|------|
| GitHub 是否真的更新 | `git log --oneline -5` + 仓库首页确认 |
| Cloudflare 是否有新部署 | Deployments 页面看最新记录 |
| GitHub 授权是否正常 | Settings → Build 看 disconnected 提示 |
| 分支配置是否匹配 | Production branch 是否为 push 的分支 |

---

## 4. 本次错误清单

| # | 错误 | 正确认知 |
|---|------|----------|
| 1 | 以为 Retry deployment 会拉最新代码 | Retry 只重跑旧 commit |
| 2 | 没有第一时间看到 Git 授权断开提示 | 「disconnected from your Git account」是关键信号 |
| 3 | 混淆子域名和根域名绑定流程 | `www` 可 CNAME；根域名需迁移 DNS 到 Cloudflare |
| 4 | 以为改 DNS Records 就是改 nameserver | 改 nameserver 要去域名注册商，不是加解析记录 |
| 5 | 没有确认 GitHub main 分支是否有新 commit | 先查 GitHub，再查 Cloudflare |

---

## 5. 标准排查流程

以后遇到「GitHub 更新了但网站没变」时，按以下顺序排查：

```
Step 1：确认 GitHub 真的更新了
  → git log --oneline -5
  → 仓库首页确认最新 commit

Step 2：确认 Cloudflare 是否出现新部署
  → Deployments 页面
  → 查看最新 deployment 的 commit hash/message

Step 3：如果没有新部署，检查 GitHub 连接
  → Settings → Build → Git repository
  → 看是否有 "disconnected" 提示
  → 如果有，重新授权 GitHub App

Step 4：检查分支配置
  → Production branch 是否为 main
  → Automatic deployments 是否 Enabled

Step 5：连接恢复后重新 push 触发
  → git commit --allow-empty -m "Trigger deploy"
  → git push origin main

Step 6：只有新 deployment 成功但网页还旧时，才考虑缓存
  → 浏览器强刷 / Purge cache
  → 不要一开始就怪缓存
```

---

## 6. 正常部署流程

```
代码修改
  → git add / commit
    → git push origin main
      → Cloudflare Pages 自动检测 push
        → 自动执行 npm run build
          → 部署 build/ 目录
            → 域名自动更新
```

如果没有自动部署，优先检查：GitHub 授权 → 分支配置 → GitHub 是否有新 commit → Deployments 是否有新记录。**不要直接点旧部署的 Retry。**

---

## 7. 给未来自己的简短提醒

1. **Retry ≠ 拉最新代码**，Retry 只重跑旧的 commit
2. **disconnected from your Git account** —— 看到这行先修授权，别干别的
3. **根域名 ≠ 子域名**，根域名要迁移 DNS 到 Cloudflare
4. **改 nameserver ≠ 加 DNS 记录**，两个操作位置不同
5. **没新 deployment → 查授权和分支**，别急着清缓存
6. **发截图前打码**：邮箱、头像、账号名、仓库名、书签栏

---

## 关联笔记

- [[建站流程指南-静态网页/平台部署/Cloudflare Pages 部署流程]]
- [[建站流程指南-静态网页/域名与DNS/阿里云域名 CNAME 绑定 Cloudflare Pages]]
- [[建站流程指南-静态网页/故障排查/建站故障排查清单]]
- [[建站流程指南-静态网页/个人建站流程总览]]
