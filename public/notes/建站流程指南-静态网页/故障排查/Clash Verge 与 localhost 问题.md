---
tags: [建站, 代理, Clash, localhost]
created: 2026-05-21
status: active
---

# Clash Verge 与 localhost 问题

> 开启 Clash Verge 或系统代理时，可能导致 localhost 无法访问。

## 现象

- `npm run dev` 启动后 `localhost:3000` 打不开
- 浏览器一直转圈
- 关闭 Clash 后恢复正常

## 解决方式

在代理规则中加入 localhost 直连：

确保以下地址走 **DIRECT**（不走代理）：

```
localhost
127.0.0.1
::1
```

### Clash Verge 设置

1. 打开 Clash Verge
2. 进入 **Settings** → **System Proxy Bypass**
3. 添加 `<loopback>` 或直接添加上述地址

### 其他代理工具

Surge / ClashX / V2Ray 等类似工具，同样在 bypass/直连 规则中添加 localhost。

## 关联笔记

- [[建站流程指南-静态网页/故障排查/建站故障排查清单]]
- [[建站流程指南-静态网页/个人建站流程总览]]
