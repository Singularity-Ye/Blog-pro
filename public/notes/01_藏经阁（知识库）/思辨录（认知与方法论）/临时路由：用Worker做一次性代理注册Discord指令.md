---
tags:
  - cloudflare
  - worker
  - discord
  - 网络
  - 技巧
aliases:
  - 临时路由
  - Worker代理注册
  - 用完即焚
created: 2026-05-29
status: permanent
---

# 临时路由：用 Worker 做一次性代理注册 Discord 指令

## 场景

Discord 的 `/status` 指令需要注册后才能使用。注册方式是向 Discord API 发一个 POST 请求，里面带着指令的 JSON 结构和你的 BOT_TOKEN。

问题：国内网络访问不了 Discord API。在本地终端里直接跑 `curl` 注册会超时。

但你的 Cloudflare Worker（`mail.oblogsidian.fun`）跑在海外，它能访问 Discord。

---

## 解法：在 Worker 里开一个"临时路由"

在 Worker 代码里加一段：

```javascript
// 临时注册路由——用完即删
if (url.pathname === '/register' && request.method === 'GET') {
  const response = await fetch(
    `https://discord.com/api/v10/applications/${APP_ID}/commands`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'status', /* ... */ })
    }
  );
  const result = await response.json();
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

然后**在浏览器里访问一次** `https://mail.oblogsidian.fun/register`。

发生了什么？

```
你的浏览器 → GET /register
                  ↓
       Cloudflare Worker（海外）
                  ↓
       POST Discord API（注册指令）
                  ↓
       Discord 返回 "OK，已注册"
                  ↓
       Worker 把结果吐回你的浏览器
```

你在浏览器里看到的那堆 JSON，就是 Discord 返回的注册确认。

---

## 为什么要"用完即删"

这段代码里写着你的 `BOT_TOKEN`。如果路由一直留在 Worker 里，任何人访问 `/register` 都能触发一次注册请求。虽然不会直接泄露 Token（它只在 Worker 内部使用，不返回给浏览器），但这是不必要的攻击面。

**正确做法：浏览器访问一次 → 确认 Discord 端注册成功 → 立刻删掉这段 `if (url.pathname === '/register')` 代码 → 重新部署。**

Token 从云端代码里消失，Discord 端已经记住了指令配置。不需要重复注册。

---

## 本质：Worker 当海外跑腿

这不是什么高深技术。就是利用了 Worker 的一个简单事实——**它跑在海外，能访问国内访问不到的 API。** 你不需要买 VPN、不需要租 VPS、不需要在本地配代理。浏览器访问自己的 Worker 域名 → Worker 替你发请求 → 结果返回给你。

同样的模式可以推广到任何"国内网络访问不到、但 Worker 能访问"的 API 操作：

- 注册 Discord 指令
- 调用 GitHub API
- 触发 Vercel/Netlify Webhook
- 读取 Google Sheets

全部可以走"在 Worker 里开临时路由 → 浏览器访问一次 → 用完即删"的流程。

---

## 和"自动化注册"的区别

有更复杂的方案——比如 Worker 每次启动时自动检测指令是否最新、自动注册。但那个需要把 BOT_TOKEN 永久留在环境变量里。

临时路由方案的优势是：**BOT_TOKEN 只在注册的那几秒钟存在于 Worker 代码中，随后被删除。** 这是在"方便"和"安全"之间选择了偏向安全的做法。

---

*整理于 2026-05-29。一次浏览器访问 = Worker 替你跑了一趟 Discord API。用完即删，Token 不留痕。*
