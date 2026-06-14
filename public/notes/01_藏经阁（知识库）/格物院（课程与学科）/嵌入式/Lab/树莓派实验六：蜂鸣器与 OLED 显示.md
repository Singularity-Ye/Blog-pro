---
tags: [嵌入式, 树莓派, GPIO, 蜂鸣器, OLED, I2C, SSD1306, 实验]
created: 2026-06-06
status: active
---

# 树莓派实验六：蜂鸣器与 OLED 显示

> 蜂鸣器播放《小星星》并驱动 LED 随节奏闪烁；OLED 显示中文姓名学号、实时时间、手搓像素笑脸和基础图形。

---

## 一、实验要求

### 蜂鸣器部分

1. 谱曲，驱动 LED 同时随着节奏舞动

### OLED 部分

1. 显示姓名学号
2. 显示时间
3. 显示笑脸
4. 扩展：显示其他图形

曲谱选用《小星星》——在蜂鸣器上复杂曲谱容易糊，小星星节奏清晰，效果最稳。

---

## 二、蜂鸣器接线

蜂鸣器有三个脚：**GND**、**I/O**、**VCC**

| 蜂鸣器 | 树莓派 |
|--------|--------|
| GND | GND，物理 6 |
| I/O | GPIO18，物理 12 |
| VCC | 3.3V，物理 1 |

LED 沿用之前接线：

| LED | BCM | 物理脚 |
|-----|-----|--------|
| LED1 | GPIO5 | 29 |
| LED2 | GPIO6 | 31 |
| LED3 | GPIO12 | 32 |
| LED4 | GPIO16 | 36 |

---

## 三、中音频率表

| 音符 | 频率(Hz) |
|------|---------|
| Do | 523 |
| Re | 587 |
| Mi | 659 |
| Fa | 698 |
| So | 784 |
| La | 880 |
| Si | 988 |

---

## 四、蜂鸣器 + LED 代码

```python
import RPi.GPIO as GPIO
import time

BUZZER = 18
LEDS = [5, 6, 12, 16]

GPIO.setwarnings(False)
GPIO.setmode(GPIO.BCM)

GPIO.setup(BUZZER, GPIO.OUT)

for led in LEDS:
    GPIO.setup(led, GPIO.OUT)
    GPIO.output(led, GPIO.LOW)

NOTE = {
    "Do": 523, "Re": 587, "Mi": 659, "Fa": 698,
    "So": 784, "La": 880, "Si": 988, "REST": 0
}

song = [
    ("Do", 0.5), ("Do", 0.5), ("So", 0.5), ("So", 0.5),
    ("La", 0.5), ("La", 0.5), ("So", 1.0),

    ("Fa", 0.5), ("Fa", 0.5), ("Mi", 0.5), ("Mi", 0.5),
    ("Re", 0.5), ("Re", 0.5), ("Do", 1.0),

    ("So", 0.5), ("So", 0.5), ("Fa", 0.5), ("Fa", 0.5),
    ("Mi", 0.5), ("Mi", 0.5), ("Re", 1.0),

    ("So", 0.5), ("So", 0.5), ("Fa", 0.5), ("Fa", 0.5),
    ("Mi", 0.5), ("Mi", 0.5), ("Re", 1.0),

    ("Do", 0.5), ("Do", 0.5), ("So", 0.5), ("So", 0.5),
    ("La", 0.5), ("La", 0.5), ("So", 1.0),

    ("Fa", 0.5), ("Fa", 0.5), ("Mi", 0.5), ("Mi", 0.5),
    ("Re", 0.5), ("Re", 0.5), ("Do", 1.0),
]

pwm = GPIO.PWM(BUZZER, NOTE["Do"])

def all_led_off():
    for led in LEDS:
        GPIO.output(led, GPIO.LOW)

try:
    while True:
        for index, (note, duration) in enumerate(song):
            freq = NOTE[note]
            current_led = LEDS[index % len(LEDS)]

            if freq == 0:
                pwm.stop()
                all_led_off()
                time.sleep(duration)
            else:
                pwm.ChangeFrequency(freq)
                pwm.start(50)

                GPIO.output(current_led, GPIO.HIGH)
                time.sleep(duration * 0.9)

                GPIO.output(current_led, GPIO.LOW)
                pwm.stop()

                time.sleep(duration * 0.1)

        all_led_off()
        time.sleep(1)

except KeyboardInterrupt:
    pass

finally:
    pwm.stop()
    all_led_off()
    GPIO.cleanup()
```

### 要点

- `song` 列表中每个元素是 `(音符, 时值)`，时值单位为拍
- `index % len(LEDS)` 实现 LED 循环轮流闪烁
- 每个音符播放 90% 时间亮灯，留 10% 间隙熄灯，形成节奏感

---

## 五、OLED 接线

使用的 OLED 模块：**SSD1306**，I2C 通信，128×64 分辨率。

| OLED | 树莓派物理脚 | 功能 |
|------|-------------|------|
| GND | 9 | GND |
| VDD | 17 | 3.3V |
| SCK | 5 | GPIO3 / SCL |
| SDA | 3 | GPIO2 / SDA |

### 验证连接

```bash
i2cdetect -y 1
```

成功结果：

```
30: -- -- -- -- -- -- -- -- -- -- -- -- 3c -- -- --
```

OLED 地址为 `0x3C`。

---

## 六、中文字体配置

```bash
fc-list :lang=zh
```

找到中文字体路径：

```
/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc
```

代码中加载：

```python
font_cn = ImageFont.truetype("/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc", 12)
```

> 不需要 GBK 编码，`wqy-zenhei` 原生支持中文。

---

## 七、OLED 显示代码

### SSD1306 驱动类

```python
import os
import fcntl
import time
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

# OLED 的 I2C 地址（通过 i2cdetect -y 1 检测到 0x3C）
OLED_ADDR = 0x3C

# 树莓派默认 I2C 总线编号
I2C_BUS = 1

# OLED 分辨率
WIDTH = 128
HEIGHT = 64

# Linux I2C 通信中用于指定从设备地址的控制命令
I2C_SLAVE = 0x0703

# 中文字体路径
FONT_PATH = "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"


class SSD1306:
    def __init__(self, bus=1, address=0x3C):
        self.address = address

        # 打开 I2C 设备文件，例如 /dev/i2c-1
        self.fd = os.open("/dev/i2c-{}".format(bus), os.O_RDWR)

        # 设置 I2C 从设备地址
        fcntl.ioctl(self.fd, I2C_SLAVE, address)

        # 初始化 OLED
        self.init_display()

    def command(self, cmd):
        # 0x00 表示后面的字节是 OLED 命令
        os.write(self.fd, bytes([0x00, cmd]))

    def data(self, data_bytes):
        # 0x40 表示后面的字节是显示数据
        # 分块发送，避免一次写入过长导致 I2C 不稳定
        for i in range(0, len(data_bytes), 16):
            chunk = data_bytes[i:i + 16]
            os.write(self.fd, bytes([0x40]) + bytes(chunk))

    def init_display(self):
        # SSD1306 OLED 初始化命令序列
        cmds = [
            0xAE,        # 关闭显示
            0xD5, 0x80,  # 设置显示时钟
            0xA8, 0x3F,  # 设置复用率，0x3F 对应 64 行
            0xD3, 0x00,  # 设置显示偏移
            0x40,        # 设置显示起始行
            0x8D, 0x14,  # 开启电荷泵
            0x20, 0x00,  # 设置水平寻址模式
            0xA1,        # 设置列地址映射
            0xC8,        # 设置 COM 扫描方向
            0xDA, 0x12,  # 设置 COM 引脚配置
            0x81, 0xCF,  # 设置对比度
            0xD9, 0xF1,  # 设置预充电周期
            0xDB, 0x40,  # 设置 VCOMH
            0xA4,        # 使用显存内容显示
            0xA6,        # 正常显示，黑底白字
            0xAF         # 开启显示
        ]

        for cmd in cmds:
            self.command(cmd)

        self.clear()

    def clear(self):
        # 创建一张全黑图片并显示，实现清屏
        self.show(Image.new("1", (WIDTH, HEIGHT)))

    def show(self, image):
        # OLED 是黑白屏，转换成 1 位黑白图像
        image = image.convert("1")

        # 设置列地址范围：0 到 127
        self.command(0x21)
        self.command(0)
        self.command(WIDTH - 1)

        # 设置页地址范围：0 到 7（64 像素高，每 8 行一页）
        self.command(0x22)
        self.command(0)
        self.command(7)

        pixels = image.load()
        buffer = []

        # 将 PIL 图像转换为 SSD1306 所需的 page 格式数据
        for page in range(8):
            for x in range(WIDTH):
                byte = 0
                for bit in range(8):
                    y = page * 8 + bit
                    if pixels[x, y] != 0:
                        byte |= (1 << bit)
                buffer.append(byte)

        self.data(buffer)
```

### 主循环：中文 + 时间 + 笑脸 + 图形

```python
oled = SSD1306(I2C_BUS, OLED_ADDR)

# 加载中文字体，加载失败则退回默认字体
try:
    font_cn = ImageFont.truetype(FONT_PATH, 12)
    font_small = ImageFont.truetype(FONT_PATH, 10)
except:
    font_cn = ImageFont.load_default()
    font_small = ImageFont.load_default()

try:
    while True:
        # 创建黑白图像画布
        image = Image.new("1", (WIDTH, HEIGHT))
        draw = ImageDraw.Draw(image)

        now = datetime.now().strftime("%H:%M:%S")

        # 显示中文姓名、学号、时间
        draw.text((0, 0), "姓名：叶叶叶", font=font_cn, fill=255)
        draw.text((0, 16), "学号：666666", font=font_cn, fill=255)
        draw.text((0, 32), "时间：" + now, font=font_cn, fill=255)

        # 右侧笑脸：ellipse 画轮廓 + arc 画嘴巴
        draw.ellipse((96, 0, 124, 28), outline=255, fill=0)       # 脸
        draw.ellipse((103, 9, 106, 12), outline=255, fill=255)    # 左眼
        draw.ellipse((115, 9, 118, 12), outline=255, fill=255)    # 右眼
        draw.arc((104, 11, 118, 24), start=20, end=160, fill=255) # 嘴巴

        # 底部扩展图形
        draw.rectangle((0, 50, 24, 63), outline=255, fill=0)    # 矩形
        draw.line((34, 63, 48, 50, 62, 63), fill=255)            # 三角形
        draw.ellipse((74, 50, 90, 63), outline=255, fill=0)     # 圆形

        oled.show(image)
        time.sleep(1)

except KeyboardInterrupt:
    oled.clear()
```

### 笑脸实现

用 PIL 基础图形拼成：

| 图形 | 方法 | 作用 |
|------|------|------|
| 脸 | `ellipse` 填黑 | 圆形底色 |
| 眼睛 | `ellipse` 填白 | 两个小白圆 |
| 嘴巴 | `arc` 弧线 | 20°~160° 微笑弧 |

> **附录**：还有一种"手搓像素笑脸"方案，逐像素 0/1 矩阵硬编码，仅供娱乐，见 → [[树莓派实验六附录：手搓像素笑脸]]

### 显示布局

```
┌──────────────────────────┐
│ 姓名：叶浩祥          😊 │  ← 第 0 行 + 右侧笑脸
│ 学号：123456789            │  ← 第 16 行
│ 时间：14:32:07             │  ← 第 32 行，每秒刷新
│ □  △  ○                   │  ← 第 50 行，扩展图形
└──────────────────────────┘
```

---

## 八、关键概念

### I2C 通信

OLED 使用 I2C 协议，只需两根线：
- **SCL**（时钟线）：GPIO3
- **SDA**（数据线）：GPIO2

`i2cdetect -y 1` 扫描总线上的设备地址，确认 OLED 在 `0x3C`。

### SSD1306 显存模型

128×64 像素分为 8 个 page，每个 page 8 行。写入时按 page 列顺序打包成字节流，一次 data 命令发送。

### PIL 图像缓冲

用 `PIL.Image.new("1", (128, 64))` 创建 1-bit 画布，`ImageDraw` 画好后交给 `oled.show()` 刷新到屏幕。

---

## 关联笔记

- [[树莓派GPIO实验总览]]
- [[树莓派实验四：LED 控制]]
- [[树莓派实验五：红外传感器与计数控制]]
