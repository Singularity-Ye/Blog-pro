---
tags: [Linux, 命令行, 学习]
created: 2026-05-23
status: active
---

# Linux 基础命令速查

> 从 `pwd` 到 `history` 的入门练习记录。

---

## 一、本次练习的全套命令

```
pwd              → 查看当前所在目录
ls               → 列出当前目录下的文件
ls -l            → 详细列出（权限、大小、时间）
cd ~             → 回到主目录
mkdir linux_test → 新建文件夹
cd linux_test    → 进入文件夹
touch test.txt   → 创建空文件
echo "..." > f   → 把文字写入文件
cat test.txt     → 查看文件内容
date             → 系统时间
whoami           → 当前用户
uname -a         → 系统信息
history          → 命令历史
```

---

## 二、分类速查

### 📂 目录与导航

| 命令 | 全称 | 作用 | 示例 |
|------|------|------|------|
| `pwd` | Print Working Directory | 显示当前路径 | `/home/singularity-ye` |
| `ls` | List | 列出文件 | `ls` / `ls -l` / `ls -a` |
| `cd` | Change Directory | 切换目录 | `cd ~`（回家）/ `cd ..`（上层）/ `cd -`（回上一个） |
| `mkdir` | Make Directory | 创建目录 | `mkdir my_folder` |
| `rmdir` | Remove Directory | 删除空目录 | `rmdir my_folder` |

### 📄 文件操作

| 命令 | 作用 | 示例 |
|------|------|------|
| `touch` | 创建空文件 / 更新时间戳 | `touch new.txt` |
| `cat` | 查看文件全部内容 | `cat file.txt` |
| `head` | 查看文件前 10 行 | `head -5 file.txt` |
| `tail` | 查看文件末尾 10 行 | `tail -f log.txt`（实时追踪） |
| `cp` | 复制文件或目录 | `cp a.txt b.txt` / `cp -r dir1 dir2` |
| `mv` | 移动 / 重命名 | `mv old.txt new.txt` |
| `rm` | 删除文件 | `rm file.txt` / `rm -rf dir/`（递归强制删目录） |
| `echo` | 输出文字 | `echo "hello" > file.txt` |
| `>` | 重定向（覆盖写入） | `echo "hi" > file.txt` |
| `>>` | 重定向（追加写入） | `echo "hi" >> file.txt` |

### 🔍 查看与查找

| 命令 | 作用 | 示例 |
|------|------|------|
| `cat` | 查看小文件 | `cat /etc/os-release` |
| `less` | 分页查看大文件 | `less huge.log`（q 退出） |
| `grep` | 搜索文本 | `grep "error" log.txt` |
| `find` | 搜索文件 | `find . -name "*.md"` |
| `wc` | 统计行/词/字 | `wc -l file.txt`（行数） |
| `file` | 查看文件类型 | `file unknown.bin` |

### 🖥️ 系统信息

| 命令 | 作用 |
|------|------|
| `whoami` | 当前登录用户名 |
| `date` | 系统日期和时间 |
| `uname -a` | 内核版本、系统架构 |
| `df -h` | 磁盘使用情况（人类可读） |
| `free -h` | 内存使用情况 |
| `top` / `htop` | 实时进程监控（q 退出） |
| `ps aux` | 当前所有进程快照 |
| `ip a` / `ifconfig` | 网络接口信息 |

### 🔐 权限

| 命令 | 作用 |
|------|------|
| `chmod +x script.sh` | 给文件加执行权限 |
| `chmod 755 file` | rwxr-xr-x（拥有者全权限，其他人读+执行） |
| `chown user:group file` | 修改文件所属 |

| rwx | 数字 | 含义 |
|-----|:--:|------|
| r | 4 | 读 |
| w | 2 | 写 |
| x | 1 | 执行 |

### 📦 包管理（Ubuntu / Debian）

| 命令 | 作用 |
|------|------|
| `sudo apt update` | 刷新包列表 |
| `sudo apt upgrade` | 升级所有包 |
| `sudo apt install pkg` | 安装软件 |
| `sudo apt remove pkg` | 卸载软件 |

### 🧠 历史与快捷

| 操作 | 作用 |
|------|------|
| `history` | 查看命令历史 |
| `↑` / `↓` | 翻阅历史命令 |
| `Ctrl+R` | 反向搜索历史命令 |
| `Ctrl+C` | 终止当前运行的程序 |
| `Ctrl+L` | 清屏 |
| `Tab` | 自动补全路径/命令 |
| `!!` | 重复上一条命令 |
| `!grep` | 重复最近一条以 grep 开头的命令 |

---

## 三、常用组合速记

```bash
# 创建目录并进入
mkdir project && cd project

# 递归创建多层目录
mkdir -p deep/nested/folder

# 查看最近修改的 5 个文件
ls -lt | head -5

# 统计某目录下 .md 文件数量
find . -name "*.md" | wc -l

# 搜索日志中的错误行
grep -i "error" app.log

# 查看文件末尾并实时追踪新内容
tail -f app.log

# 删除当前目录下所有 .tmp 文件
find . -name "*.tmp" -delete
```

---

## 四、易混淆点

| 概念 | 说明 |
|------|------|
| `>` vs `>>` | `>` 覆盖写入，`>>` 追加写入 |
| `rm` vs `rmdir` | `rmdir` 只能删空目录，`rm -r` 删非空 |
| `~` vs `/` | `~` 是用户主目录，`/` 是系统根目录 |
| `apt` vs `apt-get` | `apt` 是新版更友好的前端，日常用 `apt` 即可 |

---

## 关联笔记

- [[Linux学习笔记/]]
