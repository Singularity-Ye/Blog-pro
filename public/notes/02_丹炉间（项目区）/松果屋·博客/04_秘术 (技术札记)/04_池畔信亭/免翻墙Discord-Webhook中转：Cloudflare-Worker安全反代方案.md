---
tags:
  - 博客
  - 联系页
  - Cloudflare
  - Discord
  - 安全
  - Webhook
page:
  - Contact.jsx
aliases:
  - Discord Webhook中转
  - Cloudflare Worker反代
  - 手札提交方案
created: 2026-05-29
status: permanent
---

# 免翻墙 Discord Webhook 中转：Cloudflare Worker 安全反代方案

联系页的"手札提交"功能——访客填写称呼、邮箱和内容后，前端把请求发给 Discord。国内用户不开加速器时请求超时，手札送不出去。

问题不在表单，不在 Webhook——在于**用户浏览器无法直接访问 Discord API**。

---

## 一、原方案的两个缺陷

```
用户浏览器 → Discord Webhook → Discord 频道
```

**缺陷一：国内网络限制。** `discord.com` 在国内普通网络下无法访问，半路就被拦下。

**缺陷二：Webhook 暴露在前端。** 即使写在 `.env` 里，只要参与前端打包，任何人都能从 Network 面板抓到真实 Webhook URL。拿到就能往频道里灌垃圾消息。

---

## 二、目标链路

```
国内用户浏览器
    ↓
https://mail.oblogsidian.fun/
    ↓
Cloudflare Worker
    ↓
Discord Webhook
    ↓
Discord 频道
```

用户只访问我的域名，Worker 负责代发。真实 Webhook 只存在于 Worker 环境变量中。

---

## 三、为什么选 Cloudflare Worker

- **免费额度够**——个人博客联系页提交量极低
- **无服务器**——不需要维护 VPS、Nginx、Node 进程
- **隐藏密钥**——Webhook 作为 Worker Secret 保存，前端只看到中转地址
- **可扩展**——后续可加入备用通道（邮件、飞书）、反垃圾验证

---

## 四、核心坑点：workers.dev 国内也不通

Worker 默认域名 `*.workers.dev` 在国内同样访问不稳定。

解法：绑定自定义子域名 `mail.oblogsidian.fun`，利用 Cloudflare 的 CDN 节点让国内用户能访问到 Worker。

---

## 五、Worker 核心代码

```js
export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    const discordWebhookUrl = env.DISCORD_WEBHOOK_URL;
    if (!discordWebhookUrl) {
      return new Response(JSON.stringify({ ok: false, error: "未配置 Webhook" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const bodyText = await request.text();
    const discordResponse = await fetch(discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyText,
    });

    const responseText = await discordResponse.text();
    return new Response(responseText, {
      status: discordResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },
};
```

三件事：收请求 → 读环境变量 → 透明转发给 Discord。

---

## 六、前端改造

```js
// 旧：直连 Discord
fetch(DISCORD_WEBHOOK_URL, { ... });

// 新：请求 Worker 中转
fetch("https://mail.oblogsidian.fun/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
```

即使 Worker 地址硬编码在前端，泄露的也只是中转地址，不是真实 Webhook。

---

## 七、部署纪要

1. Cloudflare → Workers & Pages → 创建 Worker
2. Settings → Variables → 添加 Secret：`DISCORD_WEBHOOK_URL`
3. Domains → 绑定 `mail.oblogsidian.fun`
4. 前端改请求地址 → 重新构建部署

---

## 八、测试验证

- 浏览器直接访问 `mail.oblogsidian.fun` → 返回 `Method Not Allowed` 说明 Worker 存活
- F12 Network 面板确认请求地址是 `mail.oblogsidian.fun` 而非 `discord.com`
- 关加速器提交手札 → Discord 频道能收到 → 链路打通

---

## 九、后续可优化

- [ ] CORS 收紧为仅允许博客域名
- [ ] 增加字段校验（message 非空、长度限制、email 格式）
- [ ] 接入 Cloudflare Turnstile 防机器人刷接口
- [ ] 增加备用通道：Discord 失败 → 邮件 / 飞书
- [ ] 记录提交日志（时间、来源、成功/失败）

---

*整理于 2026-05-29。从直连 Discord 到 Worker 中转，一次零成本的可用性+安全性双重升级。*
