---
tags:
  - 博客
  - Discord
  - Cloudflare
  - Worker
  - KV
page:
  - Contact.jsx
aliases:
  - Discord斜杠指令
  - 修仙掌管台
  - /status指令
created: 2026-05-29
status: permanent
---

# Discord 斜杠指令：用 Cloudflare Worker 零成本搭建修仙掌管台

在 [[免翻墙Discord-Webhook中转：Cloudflare-Worker安全反代方案|手札中转 Worker]] 的基础上，给同一个 Worker 增加了 Discord 斜杠指令能力。不用额外服务器，不用 Bot 托管费——Discord 的 HTTP Interaction 模式直接向 Worker 发 POST 请求，Worker 处理完返回 JSON，Discord 渲染成带下拉菜单的指令界面。

---

## 一、效果

在 Discord 聊天框输入 `/status`，弹出下拉菜单：

```
写代码    ⚡ 天雷淬体，玩命修筑阵法中...
摸鱼      🐟 潜水摸鱼，躲避天劫中...
读书      📜 翻阅天书，参悟大道玄机中...
打游戏    ⚔️ 秘境试炼，斩妖除魔中...
吃饭      🍵 畅饮灵茶，吞食仙果补充灵力中...
外出      🚶 游历红尘，寻觅道缘中...
休息      💤 闭关打盹，元神出窍中...
```

选一个，回车。状态存入 Cloudflare KV，博客前端通过 `GET /status` 读取，在页面上实时显示屋主当前在干什么。

---

## 二、Worker 四路路由

升级后的 Worker 同时处理四件事：

| 路由 | 方法 | 用途 |
|------|:--:|------|
| 签名校验通过 → 交互处理 | POST | Discord 斜杠指令回调（`/status`） |
| `/status` | GET | 博客前端读取当前状态 |
| `/status` | POST | 第三方（快捷指令等）推送状态 |
| `/` | POST | 原有的手札留言 Webhook 中转 |

---

## 三、关键实现：Ed25519 签名校验

Discord 要求必须验证请求签名才能启用斜杠指令。Worker 使用 Web Crypto API 做 Ed25519 校验，不需要额外依赖：

```javascript
async function verifyDiscordSignature(request, publicKeyHex) {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const signatureBuffer = hexToUint8Array(signature);
  const publicKeyBuffer = hexToUint8Array(publicKeyHex);
  const publicKey = await crypto.subtle.importKey(
    "raw", publicKeyBuffer, { name: "Ed25519" }, true, ["verify"]
  );
  const body = await request.clone().arrayBuffer();
  const data = new Uint8Array(timestampBuffer.byteLength + body.byteLength);
  data.set(timestampBuffer);
  data.set(new Uint8Array(body), timestampBuffer.byteLength);
  return await crypto.subtle.verify("Ed25519", publicKey, signatureBuffer, data);
}
```

---

## 四、斜杠指令处理

Discord 发来 `type: 2` 的交互请求时，读取用户选择的 `state` 值，写入 KV，返回 `type: 4` 的即时回复：

```javascript
if (body.type === 2 && body.data.name === "status") {
  const newStatus = body.data.options[0].value;
  await env.MINDS_KV.put('cabin_status', newStatus);
  return new Response(JSON.stringify({
    type: 4,
    data: { content: `✨ 道友的状态已变更为：**${mappedStatus}**` }
  }), { headers: { "Content-Type": "application/json" } });
}
```

Discord 收到 `type: 4` 后直接在聊天框渲染回复，不需要 Worker 主动发消息——全程由 Discord 推送事件到 Worker，Worker 被动响应。

---

## 五、配置步骤

### 1. 获取 Discord 公钥

Discord Developer Portal → 选择 Application → General Information → `PUBLIC KEY`

### 2. Worker 环境变量

```
DISCORD_PUBLIC_KEY = 公钥
DISCORD_WEBHOOK_URL = Webhook 地址（手札中转用）
MINDS_KV = 绑定的 KV 命名空间
```

### 3. 设置 Interactions Endpoint URL

Discord Developer Portal → `INTERACTIONS ENDPOINT URL` → 填入 `https://mail.oblogsidian.fun/`

保存时 Discord 会发 PING 验证签名，Worker 正确响应 `type: 1` 则保存成功。

### 4. 注册斜杠指令（一次性）

```bash
curl -X POST https://discord.com/api/v10/applications/<APP_ID>/commands \
  -H "Authorization: Bot <BOT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "status",
    "description": "更新修仙状态",
    "options": [{
      "name": "state", "description": "选择状态", "type": 3, "required": true,
      "choices": [
        {"name": "写代码 (⚡ 天雷淬体)", "value": "coding"},
        {"name": "摸鱼 (🐟 潜水摸鱼)", "value": "slacking"},
        ...
      ]
    }]
  }'
```

---

## 六、和手札中转的关系

同一个 Worker、同一个域名 `mail.oblogsidian.fun`，根据请求特征分流：

- 带签名的 → Discord 交互
- `GET /status` → 博客读状态
- `POST /status` → 第三方推状态
- 其他 POST → 手札中转

**零额外成本。** 一个 Worker 免费额度覆盖全部功能。

---

*整理于 2026-05-29。从手札信箱到修仙掌管台，同一个 Worker，四倍功能，零额外开销。*
