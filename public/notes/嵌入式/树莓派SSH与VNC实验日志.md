---
tags: [嵌入式, 树莓派, SSH, VNC, 实验]
created: 2026-05-24
status: active
---

# 树莓派 SSH 与 VNC 远程连接实验日志

> 无屏幕配置树莓派，通过手机热点实现笔记本远程控制。完整链路：SD 卡 → 热点 → SSH → VNC。

---

## 一、实验目标

1. 树莓派通过 WiFi 连接手机热点
2. 笔记本同一热点下 SSH 登录树莓派
3. 笔记本通过 VNC Viewer 远程桌面树莓派

---

## 二、实验环境

| 项目 | 说明 |
|------|------|
| 树莓派 | 开发板 + microSD 卡 + 摄像头模块 |
| 笔记本 | Windows，连接同一手机热点 |
| 网络 | 手机热点 `Singularity`，2.4GHz，WPA2 |
| 登录信息 | 用户名 `pi`，密码 `raspberry` |

**热点建议**：英文名、2.4GHz 频段、WPA2 加密。避免中文热点名或 5GHz 导致树莓派连不上。

---

## 三、无屏幕配置：SD 卡预写入 WiFi 和 SSH

实验时树莓派没有接显示器，采用 **boot 分区预置文件** 的方式，让树莓派开机自动连热点并开启 SSH。

### 操作步骤

1. **断开树莓派电源**，取出 microSD 卡
   > 不要在通电状态下插拔 SD 卡。

2. SD 卡通过 USB 读卡器插入笔记本。Windows 出现 `boot` 分区（如 `boot (E:)`）
   > 如果提示格式化其他分区，不要点。那是 Linux 分区，Windows 不识别属于正常。

3. **新建 `wpa_supplicant.conf`** 在 boot 分区根目录：

```ini
country=CN
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="Singularity"
    psk="y123123123"
    key_mgmt=WPA-PSK
    priority=1
}
```

| 字段 | 含义 |
|------|------|
| `ssid` | 热点名称 |
| `psk` | 热点密码 |
| `key_mgmt=WPA-PSK` | WPA/WPA2 加密 |
| `priority=1` | 优先连接 |

> 保存为 UTF-8，换行符 LF。

4. **新建 `ssh` 空文件** 在 boot 分区根目录
   > 文件名叫 `ssh`，**不要加 `.txt` 后缀**。Windows 需要在「查看 → 文件扩展名」中确认。

5. **安全弹出 SD 卡**，插回树莓派。

### boot 分区最终文件

```
boot/
├── wpa_supplicant.conf
└── ssh
```

---

## 四、上电与连接

### 正确顺序

```
1. SD 卡已插入
2. 打开手机热点
3. 树莓派通电
4. 等待 1-2 分钟
```

> 通电后再插 SD 卡，系统不会重新读取启动配置。

### 确认启动

- 红灯常亮：供电正常
- 绿灯闪烁：正在读取 SD 卡

### 确认连上热点

手机热点 → 已连接设备 → 出现 `raspberrypi`

本实验：
```
设备名：raspberrypi
MAC：b8:27:eb:62:38:71
```

---

## 五、SSH 登录

### 踩坑：代理拦截

电脑开启了全局代理 / TUN 模式，导致 `raspberrypi.local` 被解析到错误的虚拟地址 `198.18.0.145`：

```
Connection closed by 198.18.0.145 port 22
```

**解决**：关闭全局代理 / 加速器 / TUN 模式，重开 PowerShell。必要时：

```bash
ipconfig /flushdns
```

### 验证连通

```bash
ping raspberrypi.local
```

关闭代理后正常解析到热点网段：

```
10.203.22.213
```

### SSH 连接

```bash
ssh pi@raspberrypi.local
# 或直接用 IP
ssh pi@10.203.22.213
```

首次连接输入 `yes`，密码 `raspberry`（不显示字符，正常）。

### 成功标志

```
pi@raspberrypi:~ $
```

系统信息：`Linux raspberrypi 5.10.63-v7+ armv7l`

> 📸 **截图 1 在此**：SSH 窗口可见 `pi@raspberrypi:~ $` 和系统信息。
> ![Pasted image 20260524233212.png](/notes/attachments/%E4%B8%B4%E6%97%B6%E7%B4%A0%E6%9D%90/Pasted%20image%2020260524233212.png)

---

## 六、开启 VNC 服务

SSH 登录后在树莓派终端：

```bash
sudo raspi-config
```

```
Interface Options → VNC → Enable → Finish
```

重启（可选，建议）：

```bash
sudo reboot
```

重启后等待 1-2 分钟。

---

## 七、VNC Viewer 远程桌面

### 笔记本端

Windows 安装 RealVNC Viewer，打开。

### 连接地址

`raspberrypi.local` 在 VNC 中不稳定，直接用 IP：

```
10.203.22.213
```

### 登录

```
Username: pi
Password: raspberry
```

### 成功标志

VNC Viewer 窗口中显示树莓派桌面。

本实验可见桌面内容：回收站、Arduino IDE、Scratch 3、Geany、mu。

> 📸 **截图 2 在此**：VNC Viewer 窗口内为完整树莓派桌面。


![Pasted image 20260524233312.png](/notes/attachments/%E4%B8%B4%E6%97%B6%E7%B4%A0%E6%9D%90/Pasted%20image%2020260524233312.png)
---

## 八、问题清单

| 问题 | 原因 | 解决 |
|------|------|------|
| 树莓派不会自动连热点 | SD 卡没有 WiFi 配置 | boot 分区新建 `wpa_supplicant.conf` |
| SSH 被 `198.18.0.145` 拒绝 | 全局代理劫持了局域网 DNS | 关闭代理/加速器/TUN，flushdns |
| `arp -a` 查不到树莓派 IP | ARP 表不实时更新 | 看手机热点设备列表，或 `ping raspberrypi.local` |
| VNC 用 `.local` 连不上 | mDNS 不稳定 | 直接用 IP：`10.203.22.213` |

---

## 九、实验结果

| 目标 | 状态 |
|------|:--:|
| 树莓派连上手机热点 | ✅ |
| 笔记本 SSH 登录树莓派 | ✅ |
| 开启 VNC 服务 | ✅ |
| VNC Viewer 远程桌面 | ✅ |
| 两张实验截图 | 📸 |

---

## 十、关键命令速记

```bash
# 验证网络
ping raspberrypi.local

# SSH 登录
ssh pi@raspberrypi.local
ssh pi@10.203.22.213

# 开启 VNC
sudo raspi-config

# 重启
sudo reboot
```

VNC Viewer 连接：`10.203.22.213`，用户名 `pi`，密码 `raspberry`。

---

## 后续会用到的场景

这条无屏幕配置 + SSH + VNC 链路的经验，后面做以下项目时都会复用：

- 树莓派摄像头实时视频流
- 手势识别边缘推理
- GPIO 传感器数据采集（远程调试不需要搬显示器）
- 嵌入式 Linux 应用开发（远程编译 + 远程桌面）

---

## 关联笔记

- [[Linux学习笔记/Linux基础命令速查]]
- [[Linux学习笔记/树莓派SSH与远程桌面连接指南]]
