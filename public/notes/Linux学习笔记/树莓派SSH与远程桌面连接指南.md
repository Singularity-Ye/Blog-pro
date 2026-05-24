---
tags: [Linux, 树莓派, SSH, VNC, 实验]
created: 2026-05-23
status: active
---

# 树莓派 SSH 与远程桌面连接指南

> 实验目标：实现笔记本电脑对树莓派的命令行远程控制（SSH）和图形界面远程控制（VNC），提交两张截图。

---

## 一、整体流程

```
同一网络 → 找到树莓派 IP → SSH 登录 → SNIP → 开启 VNC → VNC 桌面 → SNIP
```

不是写代码，是证明你能远程控制树莓派。两根线：一根命令行（SSH），一根图形界面（VNC）。

---

## 二、让树莓派和电脑在同一网络

目标：让笔记本电脑能找到树莓派的 IP。

| 方式 | 操作 |
|------|------|
| **同连 WiFi** | 树莓派和笔记本连同一个路由器 / 手机热点 |
| **网线连路由器** | 树莓派和笔记本都插路由器 LAN 口 |
| **网线直连笔记本** | 网线一头插树莓派，一头插笔记本（需要配静态 IP） |

最简单：两个都连同一个手机热点。

---

## 三、找到树莓派 IP 地址

### 方法 1：手机热点查看

手机热点 → 已连接设备 → 找 `raspberrypi` 或类似设备名，记录 IP，如 `192.168.43.190`。

### 方法 2：IP 扫描工具

Windows 上用 `advanced_ip_scanner.exe` 扫描局域网，找 Manufacturer 为 `Raspberry Pi Foundation` 的设备。

### 方法 3：树莓派本地查看

如果树莓派接了显示器，终端输入：

```bash
hostname -I
```

### 验证：能否 ping 通

在笔记本 CMD 或 PowerShell：

```bash
ping 192.168.43.190
```

有回复说明网络通，没有回复说明不在同一网络或 IP 有误。

---

## 四、SSH 连接树莓派

### 确认 SSH 已开启

如果树莓派是全新系统，可能需要先开 SSH。两种方式：

**方式 A（有显示器）**：树莓派终端里

```bash
sudo raspi-config
# Interface Options → SSH → Enable
```

**方式 B（无显示器）**：在树莓派 SD 卡的 `boot` 分区根目录，新建一个名为 `ssh` 的空文件（无后缀名）。树莓派启动时检测到此文件会自动开启 SSH。

### 从笔记本 SSH 连接

打开 PowerShell / CMD：

```bash
ssh pi@192.168.43.190
```

> 旧版树莓派系统默认用户名 `pi`，默认密码 `raspberry`。新版系统首次启动会要求创建用户。

**注意**：输密码时屏幕不显示任何字符（不会出现 `***`），这是正常的安全设计。输完回车即可。

### 登录成功后

命令行提示符会变成类似：

```
pi@raspberrypi:~ $
```

输入几条命令让截图更完整：

```bash
whoami        # 显示当前用户 → pi
hostname      # 显示设备名 → raspberrypi
hostname -I   # 显示 IP 地址
uname -a      # 显示系统内核信息
```

**截图 1 —— 此时截屏**：SSH 窗口，能看到登录过程和上述命令输出。

---

## 五、远程桌面连接树莓派（VNC）

### 在树莓派开启 VNC 服务

如果已经 SSH 进去了，直接在 SSH 里操作。

#### 方式 A：系统自带 VNC（推荐，新版系统）

```bash
sudo raspi-config
# Interface Options → VNC → Enable
```

启用后树莓派 VNC 服务会自动在后台运行。

#### 方式 B：安装 tightvncserver（旧版方式）

```bash
sudo apt-get install tightvncserver
vncserver :1 -geometry 1024x768
```

> `:1` 表示 1 号虚拟桌面，`-geometry` 是分辨率。第一次运行会要求设置 VNC 密码。

### 笔记本安装 VNC Viewer

下载 [RealVNC Viewer](https://www.realvnc.com/en/connect/download/viewer/) 或同类软件。

### 连接

VNC Viewer 地址栏输入：

**系统自带 VNC**：
```
192.168.43.190
```

**tightvncserver 的 :1 桌面**：
```
192.168.43.190:1
```

输入树莓派的用户名和密码（与 SSH 登录相同，或 VNC 专用密码）。

成功后会看到树莓派的桌面环境。

**截图 2 —— 此时截屏**：笔记本上的 VNC Viewer 窗口，里面是完整的树莓派桌面。

---

## 六、最终提交

| 截图 | 内容 | 关键信息 |
|------|------|----------|
| 截图 1 | SSH 成功登录 | 终端里可见 `whoami`、`hostname`、`uname -a` 输出 |
| 截图 2 | VNC 远程桌面 | VNC Viewer 窗口里可见树莓派桌面 |

---

## 七、常见问题排查

| 症状 | 原因 | 解决 |
|------|------|------|
| `Connection refused` | SSH 未开启 | `sudo raspi-config` 开启 SSH，或用 SD 卡 boot 分区放 `ssh` 文件 |
| `Connection timed out` | IP 不对或不在同一网络 | 确认同一 WiFi，`ping` 一下看是否通 |
| `Permission denied` | 用户名或密码错误 | 检查用户名是否为 `pi`（或自己设置的），密码是否正确 |
| VNC 连不上 | VNC 服务未启动 | SSH 进去执行 `sudo raspi-config` 开启 VNC，或 `vncserver` 手动启动 |
| VNC 黑屏 | 分辨率或权限问题 | 试试 `vncserver :1 -geometry 1024x768` 重开一个桌面 |

---

## 关联笔记

- [[Linux学习笔记/Linux基础命令速查]]
