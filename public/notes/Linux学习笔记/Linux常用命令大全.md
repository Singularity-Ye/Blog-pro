---
tags: [Linux, 命令行, 学习, 实验]
created: 2026-05-23
status: active
---

# Linux 常用命令大全

> 按功能分类，每个命令独立成节。含实验考核重点标注。

---

## 一、man — 查看帮助文档

**作用**：查看 Linux 命令的帮助文档（manual）。

**常用格式**：
```bash
man ls
man mkdir
man grep
```

**man 文档内快捷键**：

| 按键 | 作用 |
|------|------|
| `空格` | 向下翻一页 |
| `PgUp` / `PgDn` | 上下翻页 |
| `Home` / `End` | 首页 / 末页 |
| `/关键词` | 从上往下搜索 |
| `?关键词` | 从下往上搜索 |
| `n` / `N` | 下一个 / 上一个搜索结果 |
| `q` | 退出 |

> 🔴 **考核 1 重点**：会进入 `man ls`，翻页，搜索，退出。

---

## 二、系统工作命令

### echo — 输出字符串或变量

**作用**：在终端显示字符串或变量值。

**常用格式**：
```bash
echo "hello linux"           # 输出到屏幕
echo "hello linux" > f.txt   # 写入文件（覆盖）
echo "more text" >> f.txt    # 追加到文件末尾
```

**注意事项**：`>` 覆盖，`>>` 追加。不要用 `>` 意外清空重要文件。

---

### date — 查看或设置时间

**作用**：显示当前时间，或按指定格式显示。

**常用格式**：
```bash
date
date "+%Y-%m-%d %H:%M:%S"    # 2026-05-23 14:30:00
date "+%j"                    # 一年中的第几天
```

**常见格式符**：

| 格式 | 含义 | 格式 | 含义 |
|------|------|------|------|
| `%Y` | 年 | `%M` | 分钟 |
| `%m` | 月 | `%S` | 秒 |
| `%d` | 日 | `%j` | 年中第几天 |
| `%H` | 24小时制 | `%I` | 12小时制 |

---

### ps — 查看进程状态

**作用**：查看当前系统中的进程。

**常用格式**：
```bash
ps
ps aux                       # 最常用：所有进程详细信息
```

**常用参数**：

| 参数 | 作用 |
|------|------|
| `-a` | 显示所有进程 |
| `-u` | 显示用户及详细信息 |
| `-x` | 显示无控制终端的进程 |

**进程状态**：

| 状态 | 含义 |
|:--:|------|
| R | 正在运行或等待运行 |
| S | 休眠 |
| D | 不可中断 |
| Z | 僵尸进程 |
| T | 停止 |

---

### top — 动态查看系统状态

**作用**：动态显示进程、CPU、内存和系统负载。

**常用格式**：
```bash
top          # q 退出
```

**注意事项**：`top` 是实时动态的，`ps` 是瞬间快照。

---

### pidof — 查看进程 PID

**作用**：查询某个服务对应的进程号。

**常用格式**：
```bash
pidof sshd                   # 查看 SSH 服务的 PID
```

---

### kill — 结束指定进程

**作用**：根据 PID 终止进程。

**常用格式**：
```bash
kill 1234                    # 正常结束 PID 1234
kill -9 1234                 # 强制结束
```

**注意事项**：不要随便 kill 系统关键进程。`-9` 是强制信号，进程无法捕获和忽略。

---

### killall — 按服务名结束进程

**作用**：终止某服务名对应的所有进程。

**常用格式**：
```bash
killall firefox
```

**注意事项**：会终止所有同名进程，慎用。

---

### reboot / poweroff — 重启 / 关机

```bash
sudo reboot                  # 重启
sudo poweroff                # 关机
```

**注意事项**：需要管理员权限。远程连接时慎用，关机后连接即断。

---

### wget — 下载网络文件

**作用**：从网络地址下载文件。

**常用格式**：
```bash
wget https://example.com/file.zip
wget -O custom_name.zip URL      # 指定文件名
wget -P /tmp URL                  # 下载到指定目录
wget -c URL                       # 断点续传
```

---

## 三、系统状态检测命令

### ifconfig / ip — 查看网络状态

**作用**：查看网卡配置和网络信息。

**常用格式**：
```bash
ifconfig
ip addr                   # 新写法，推荐
```

---

### uname — 查看系统内核信息

**作用**：查看内核名称、主机名、版本、硬件架构。

**常用格式**：
```bash
uname -a
```

---

### uptime — 系统运行时间与负载

**常用格式**：
```bash
uptime
```

输出示例：`14:30:00 up 3 days, 2 users, load average: 0.05, 0.10, 0.08`

分别显示：当前时间、已运行天数、登录用户数、1/5/15 分钟平均负载。

---

### free — 查看内存使用

**常用格式**：
```bash
free -h                    # 人类可读（MB/GB）
```

---

### who / whoami — 查看用户

**常用格式**：
```bash
who                        # 当前所有登录用户
whoami                     # 当前用户名
```

---

### last — 查看登录记录

**常用格式**：
```bash
last
```

---

### history — 查看命令历史

**常用格式**：
```bash
history
history | grep ssh         # 搜索历史中包含 ssh 的命令
```

---

### sosreport — 收集系统诊断信息

**常用格式**：
```bash
sosreport
```

**注意事项**：执行时间较长，课程实验中不常用。

---

### lscpu — 查看 CPU 信息

**常用格式**：
```bash
lscpu
```

---

## 四、目录切换命令

### pwd — 查看当前目录

```bash
pwd          # 输出当前完整路径
```

---

### cd — 切换目录

| 写法 | 作用 |
|------|------|
| `cd ~` | 回到用户主目录 |
| `cd ..` | 返回上一级 |
| `cd /` | 切换到根目录 |
| `cd -` | 返回上一次所在目录 |

---

### ls — 查看目录内容

| 写法 | 作用 |
|------|------|
| `ls` | 列出文件和目录 |
| `ls -l` | 详细列表（权限、大小、时间） |
| `ls -a` | 包含隐藏文件（`.` 开头） |
| `ls -al` | 上面两个结合 |

---

## 五、文本文件查看与处理

### cat — 查看小文件

```bash
cat file.txt
cat -n file.txt            # 显示行号
```

---

### more — 分页查看

```bash
more file.txt              # 空格翻页，q 退出
```

---

### head — 查看文件开头

```bash
head file.txt              # 默认 10 行
head -n 5 file.txt         # 前 5 行
```

---

### tail — 查看文件末尾

```bash
tail file.txt              # 默认 10 行
tail -n 5 file.txt         # 最后 5 行
tail -f log.txt            # 实时追踪（Ctrl+C 退出）
```

---

### wc — 统计文本

```bash
wc -l file.txt             # 行数
wc -w file.txt             # 单词数
wc -c file.txt             # 字节数
```

---

### cut — 按列提取

```bash
cut -d: -f1 /etc/passwd    # 以 : 分隔，提取第 1 列
```

---

### diff — 比较文件差异

```bash
diff a.txt b.txt
diff --brief a.txt b.txt   # 只判断是否不同
diff -c a.txt b.txt        # 详细差异
```

---

### tr — 字符替换

```bash
cat file.txt | tr [a-z] [A-Z]    # 小写转大写
```

**注意事项**：不要用 `>` 直接把结果写回原文件，会清空。

---

### stat — 查看文件状态

```bash
stat file.txt
```

| 时间 | 含义 |
|------|------|
| atime | 最后一次访问内容 |
| mtime | 最后一次修改内容 |
| ctime | 最后一次修改状态/权限 |

---

## 六、文件与目录管理

### touch — 创建空文件或更新时间

```bash
touch new.txt
touch a.txt b.txt c.txt    # 批量创建
```

---

### mkdir — 创建目录

```bash
mkdir mydir
mkdir -p a/b/c             # 递归创建多层目录
```

---

### cp — 复制

```bash
cp src.txt dest.txt        # 复制文件
cp file.txt dir/           # 复制到目录
cp -r dir1 dir2            # 递归复制目录
```

**常用参数**：`-r`（递归）、`-p`（保留属性）、`-i`（覆盖前询问）、`-a`（相当于 `-pdr`）

---

### mv — 移动或重命名

```bash
mv old.txt new.txt         # 重命名
mv file.txt dir/           # 移动到目录
```

---

### rm — 删除

```bash
rm file.txt                # 删除文件
rm -r dir/                 # 删除目录（递归）
rm -f file.txt             # 强制删除，不提示
```

> ⚠️ `rm -rf` 非常危险，使用前必须确认路径。删错无法恢复。

---

### rmdir — 删除空目录

```bash
rmdir empty_dir            # 只能删空目录，非空用 rm -r
```

---

### dd — 复制指定大小内容

```bash
dd if=/dev/zero of=test.img bs=1M count=10    # 生成 10MB 文件
```

> ⚠️ `dd` 操作磁盘时路径写错可能造成数据损坏。

---

### file — 查看文件类型

```bash
file unknown.bin
file test.txt
```

---

## 七、打包压缩与搜索

### tar — 打包和压缩

**压缩**：
```bash
tar -czvf archive.tar.gz dir/
```

**解压**：
```bash
tar -xzvf archive.tar.gz
tar -xzvf archive.tar.gz -C /target/dir/
```

| 参数 | 作用 |
|------|------|
| `c` | 创建压缩包 |
| `x` | 解压 |
| `z` | gzip 格式 |
| `v` | 显示过程 |
| `f` | 指定文件名 |

---

### zip / unzip — ZIP 压缩与解压

```bash
zip -r test.zip dir/
unzip test.zip
unzip test.zip -d /target/
```

---

### grep — 搜索文本

**作用**：在文件中搜索包含关键词的行。

```bash
grep "error" log.txt
grep -r "TODO" ./notes/        # 递归搜索目录
grep -vi "debug" log.txt       # 忽略大小写 + 反选
```

| 参数 | 作用 |
|------|------|
| `-i` | 忽略大小写 |
| `-v` | 反选（不含关键词） |
| `-n` | 显示行号 |
| `-r` | 递归搜索目录 |
| `-l` | 只列出文件名 |

---

### find — 查找文件

```bash
find . -name "*.md"                    # 按文件名
find . -mtime -1                       # 一天内修改过的
find /home -user username              # 按用户
find . -name "*.tmp" -delete           # 查找并删除
find . -name "*.txt" -exec cat {} \;   # 查找并执行命令
```

---

## 八、路径说明

### 绝对路径 vs 相对路径

| 类型 | 写法 | 含义 |
|------|------|------|
| 绝对路径 | `/home/user/test.txt` | 从根目录 `/` 出发 |
| 相对路径 | `./test.txt` | 从当前目录出发 |
| 相对路径 | `../test.txt` | 从上一级目录出发 |

### 特殊路径符号

| 符号 | 含义 |
|:--:|------|
| `.` | 当前目录 |
| `..` | 上一级目录 |
| `~` | 用户主目录 |
| `/` | 根目录 |
| `-` | 上一次所在目录 |

---

## 九、实验考核重点

| 考核 | 内容 | 重点命令 |
|:--:|------|----------|
| **考核 1** | man 帮助 | `man ls`、`man mkdir`、`man grep`（会进入、翻页、搜索、退出） |
| **考核 2** | 系统工作与状态检测 | `echo`、`date`、`ps`、`top`、`pidof`、`kill`、`killall`、`ifconfig`、`uname -a`、`uptime`、`free -h`、`who`、`whoami`、`last`、`history`、`lscpu` |
| **考核 3** | 压缩搜索与路径 | `tar`、`zip`、`unzip`、`grep`、`find`、`pwd`、绝对路径、相对路径 |

---

## 十、练习命令清单

可以直接在终端依次输入：

```bash
# 基础导航与文件
pwd
ls
ls -l
cd ~
mkdir linux_test
cd linux_test
touch test.txt
echo "hello linux" > test.txt
cat test.txt

# 系统信息
date
whoami
uname -a
free -h
lscpu
uptime

# 压缩与搜索练习
mkdir demo
touch demo/a.txt demo/b.txt
echo "linux command test" > demo/a.txt
grep "linux" demo/a.txt
tar -czvf demo.tar.gz demo
mkdir output
tar -xzvf demo.tar.gz -C output
find . -name "*.txt"

# 查看历史
history
```

---

## 关联笔记

- [[Linux基础命令速查]]
- [[树莓派SSH与远程桌面连接指南]]
