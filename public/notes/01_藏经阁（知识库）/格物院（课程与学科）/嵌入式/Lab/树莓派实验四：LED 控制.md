---
tags: [嵌入式, 树莓派, GPIO, LED, PWM, 实验]
created: 2026-06-06
status: active
---

# 树莓派实验四：LED 控制

> 用树莓派 GPIO 驱动 4 颗 LED，实现点亮、流水灯、流水呼吸灯三种效果。

---

## 一、实验要求

用树莓派实现：
1. 点亮灯
2. 流水灯
3. 往返流水灯
4. 呼吸灯

最终报告保留三项：**点亮灯**、**单向流水灯**、**流水呼吸灯**。

---

## 二、接线

代码采用 `GPIO.setmode(GPIO.BCM)`，以下编号均为 BCM 编号。

### 最终接线方案

| LED | 长脚（正极） | 短脚（负极） |
|-----|-------------|-------------|
| LED1 | 29号脚 GPIO5 | 30号脚 GND |
| LED2 | 31号脚 GPIO6 | 34号脚 GND |
| LED3 | 32号脚 GPIO12 | 39号脚 GND |
| LED4 | 36号脚 GPIO16 | 25号脚 GND |

> 每个 LED 使用独立 GND 引脚，因为线不能一脚多连。

---

## 三、点亮灯

### 代码

```python
import RPi.GPIO as GPIO
import time

LED = 5

GPIO.setwarnings(False)
GPIO.setmode(GPIO.BCM)

GPIO.setup(LED, GPIO.OUT)

GPIO.output(LED, GPIO.HIGH)
time.sleep(5)

GPIO.output(LED, GPIO.LOW)

GPIO.cleanup()
```

### 要点

| 代码 | 含义 |
|------|------|
| `LED = 5` | LED 接在 GPIO5，即物理 29 号脚 |
| `GPIO.setup(LED, GPIO.OUT)` | 将 GPIO5 设为输出模式 |
| `GPIO.output(LED, GPIO.HIGH)` | 输出高电平，点亮 |
| `GPIO.output(LED, GPIO.LOW)` | 输出低电平，熄灭 |

---

## 四、单向流水灯

### 代码

```python
import RPi.GPIO as GPIO
import time

LEDs = [5, 6, 12, 16]

GPIO.setwarnings(False)
GPIO.setmode(GPIO.BCM)

for led in LEDs:
    GPIO.setup(led, GPIO.OUT)
    GPIO.output(led, GPIO.LOW)

try:
    while True:
        for led in LEDs:
            GPIO.output(led, GPIO.HIGH)
            time.sleep(0.3)
            GPIO.output(led, GPIO.LOW)

except KeyboardInterrupt:
    pass

finally:
    GPIO.cleanup()
```

### 要点

- `LEDs = [5, 6, 12, 16]`：4 个灯分别接 GPIO5、GPIO6、GPIO12、GPIO16
- `for led in LEDs`：依次遍历每个 LED 引脚
- 每个 LED 点亮 0.3 秒后熄灭，再进入下一个

### 实验现象

```
LED1 → LED2 → LED3 → LED4 → LED1 → ...
```

形成单向循环流水灯。

---

## 五、流水呼吸灯

### 代码

```python
import RPi.GPIO as GPIO
import time

LEDs = [5, 6, 12, 16]

GPIO.setwarnings(False)
GPIO.setmode(GPIO.BCM)

for led in LEDs:
    GPIO.setup(led, GPIO.OUT)
    GPIO.output(led, GPIO.LOW)

pwms = []

for led in LEDs:
    p = GPIO.PWM(led, 50)
    p.start(0)
    pwms.append(p)

try:
    while True:
        for p in pwms:
            for dc in range(0, 101, 5):
                p.ChangeDutyCycle(dc)
                time.sleep(0.03)

            for dc in range(100, -1, -5):
                p.ChangeDutyCycle(dc)
                time.sleep(0.03)

except KeyboardInterrupt:
    pass

finally:
    for p in pwms:
        p.stop()
    GPIO.cleanup()
```

### 要点

| 代码 | 含义 |
|------|------|
| `GPIO.PWM(led, 50)` | 创建 PWM 对象，频率 50Hz |
| `p.start(0)` | 初始占空比 0，灯不亮 |
| `range(0, 101, 5)` | 占空比 0→100，灯逐渐变亮 |
| `range(100, -1, -5)` | 占空比 100→0，灯逐渐变暗 |

### 实验现象

```
LED1 渐亮渐灭 → LED2 渐亮渐灭 → LED3 → LED4 → 循环
```

---

## 六、关键概念：PWM

**PWM**（脉冲宽度调制）通过快速开关 GPIO 来模拟"中间亮度"：

- 占空比 0%：全灭
- 占空比 50%：半亮（肉眼看到的亮度约一半）
- 占空比 100%：全亮

> `ChangeDutyCycle(dc)` 改变占空比，配合 `time.sleep` 控制渐变速度。

---

## 关联笔记

- [[树莓派GPIO实验总览]]
- [[树莓派实验五：红外传感器与计数控制]]
- [[树莓派实验六：蜂鸣器与 OLED 显示]]
