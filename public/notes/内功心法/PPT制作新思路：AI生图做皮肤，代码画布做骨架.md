---
tags:
  - ppt
  - ai生成
  - canvas
  - html
  - 演示文稿
  - 工作流
aliases:
  - PPT制作技巧
  - AI+代码做PPT
  - 线框背景法
created: 2026-05-27
status: draft
---

# PPT 制作新思路：AI 生图做皮肤，代码画布做骨架

> [!abstract] 核心思路
> 把一张 PPT 拆成两层——**底层用 AI 生图模型出背景和氛围，上层用 HTML/Canvas 精准绘制内容。**
> 不精准的、感性的、需要"好看"的部分交给生图模型；精准的、结构化的、需要"准确"的部分用代码完成。
> 两层的结合点是一张固定尺寸的画布——比如 1920×1080 的 HTML 页面，导出就是一张 PPT。

---

## 一、为什么这个思路成立

传统做 PPT 有两条路，各有各的痛：

| 路线 | 优势 | 痛点 |
|------|------|------|
| **PowerPoint / Keynote 手搓** | 精准控制每个元素的位置 | 做出"好看"的背景和氛围感极其费时间，普通人的排版审美上限很低 |
| **AI 生图一键出片** | 视觉冲击力强，氛围感拉满 | 文字经常乱码，排版不可控，数据图表根本不准，改一个字要重新生成 |

这两条路的痛点是互补的。AI 生图擅长的是"不精准但好看"——渐变、光影、材质感、氛围色调、装饰元素。代码擅长的是"精准但素"——文字渲染、数据可视化、几何图形、精确对齐。

**把它们拆成两层，各干各的。**

---

## 二、两层分工

### 底层：AI 生图 = 皮肤

AI 生图模型（Midjourney / DALL-E / SD）负责：

- **线框背景 / 网格底纹**——给整页 PPT 一个氛围基调，比如科技感的深蓝渐变 + 微弱的电路板线框、温暖感的米色纸张纹理、冷峻感的暗色金属拉丝
- **装饰性插画**——边缘的藤蔓、角落的几何装饰、若隐若现的水印图案
- **场景氛围图**——你不一定需要它，但如果某一页需要一个"森林木屋"的感觉，让 AI 生成一张柔和的背景，上面再盖内容
- **质感材质**——纸张纹理、布料褶皱、金属光泽、玻璃反光

一句话：**AI 负责"这页 PPT 看起来值钱"。**

### 上层：HTML / Canvas = 骨架

代码负责：

- **文字排版**——标题、正文、引用块。CSS 控制字体、字号、行高、对齐，想怎么排怎么排
- **数据图表**——Canvas 画折线图、柱状图、饼图、雷达图。数据改了，重跑一次代码，图表自动更新
- **精确几何**——矩形卡片、圆形头像、分割线、网格布局。CSS Grid / Flexbox 的精确度是任何拖拽排版比不了的
- **代码块 / 技术图示**——Mermaid 流程图、语法高亮的代码片段。这些是生图模型的噩梦，但代码原生支持
- **Mermaid 流程图**——这本就是 Obsidian 生态内最擅长的渲染方式

一句话：**代码负责"这页 PPT 不会翻车"。**

---

## 三、具体工作流

### 第一步：确定画布尺寸

选一个固定分辨率作为所有页面的画布。最常用的是 **1920×1080**（16:9 宽屏）。

```html
<!-- 每一页 PPT 就是一个 div -->
<div class="slide" style="width: 1920px; height: 1080px; position: relative;">
  <!-- 底层：AI 生成的背景图 -->
  <img class="bg" src="bg-slide-01.png" />
  <!-- 上层：代码绘制的内容 -->
  <div class="content">...</div>
</div>
```

### 第二步：给每一页生成背景图

用 Midjourney / DALL-E / SD 出图，提示词的核心是"别在图上写任何文字，只要氛围和装饰"。

举例：

```
A minimalist tech presentation background, dark navy blue gradient,
faint geometric wireframe lines in the corner, subtle grid pattern,
no text, no letters, no typography, clean negative space in the center,
16:9 aspect ratio, 4k
```

关键指令：**no text, no letters, no typography**——告诉 AI 别在背景上写字，中间留白给我放内容。

### 第三步：用 HTML + CSS 画内容

把内容层叠在背景图上。CSS Grid 做布局，`@font-face` 引入合适的字体。

```html
<div class="slide">
  <img class="bg" src="bg-title.png" />
  <div class="overlay">
    <h1>PPT 制作新思路</h1>
    <p class="subtitle">AI 生图做皮肤，代码画布做骨架</p>
    <p class="author">叶 · 2026</p>
  </div>
</div>
```

```css
.slide {
  width: 1920px; height: 1080px;
  position: relative; overflow: hidden;
}
.bg {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: cover;
}
.overlay {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
}
```

### 第四步：需要图表的页面用 Canvas

```javascript
const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');
// 画折线图、柱状图、雷达图——随便
// 数据来源可以是 JSON，改了数据重跑就行
```

Canvas 画图表有一个 AI 生图永远做不到的优势——**数据动了，图自动跟着动。** 不需要重新生成。

### 第五步：导出

最终产出是一个 HTML 文件，每一页是一个 `.slide` div。导出方式：

| 方式 | 工具 |
|------|------|
| **浏览器打印 → PDF** | Chrome 的 `Ctrl+P`，设置纸张为自定义 1920×1080 |
| **截图 / Puppeteer** | 用 Puppeteer 自动打开 HTML，批量截图每一页为 PNG |
| **塞进 PPT** | 把导出的 PNG 作为幻灯片背景，PPT 本身只做播放器 |
| **Slidev** | 直接用 Slidev（基于 Vite 的演示框架），它本身就是用 Markdown + HTML + Vue 写 PPT |

---

## 四、选型比较

这个思路有几种实现路径，适合不同场景：

| 方案 | 适合场景 | 优点 | 缺点 |
|------|------|------|------|
| **纯 HTML/CSS + AI 背景** | 页数少、追求极致视觉控制 | 完全自由，任何 CSS 效果都能用 | 每页要手写 HTML，页数多了累 |
| **Slidev + AI 背景** | 技术分享、需要代码展示 | Markdown 写内容、代码高亮原生支持、Mermaid 直接渲染 | 安装 Node 环境，有一定门槛 |
| **Marp + AI 背景** | VS Code 用户，轻量需求 | Markdown → PPT，最简洁 | 自定义程度不如 Slidev |
| **Puppeteer 批量导出** | 数据驱动的图表型 PPT | 数据和图表自动绑定，一改全改 | 需要写脚本 |

---

## 五、这个思路和 Obsidian 的关系

等一下——这不就是 Obsidian 做的事情吗？

Obsidian 把 Markdown（精准的结构化内容）渲染成 HTML，加上 CSS 主题（好看的皮肤），再加上 JavaScript 插件（交互能力）。底层是精准的文本，上层是好看的界面。

这个 PPT 思路完全一样：底层是代码画的精准内容，上层是 AI 生成的氛围皮肤。

连分层逻辑都一模一样：

| | Obsidian | 这个 PPT 方案 |
|------|------|------|
| **数据层** | Markdown 文件 | HTML/CSS/Canvas 代码 |
| **表现层** | CSS 主题 | AI 生成的背景图 |
| **交互层** | JS 插件 | 图表交互 / 动画 |
| **输出** | Obsidian 阅读界面 | 1920×1080 截图 / PDF |

所以我之前写的 [[Obsidian本质理解：Markdown、HTML 与 AI 时代的知识工作流|Obsidian 本质理解]] 里那个结论——"Markdown 是知识源代码，HTML/CSS 是人类友好界面"——其实可以推广到 PPT 制作上：

> **代码是 PPT 的"知识源代码"，AI 生图是 PPT 的"人类友好皮肤"。**

---

## 六、实操起步

如果你现在要做第一版，最小可行路径：

1. 用 **Midjourney** 生成 5-10 张风格统一的背景图（dark tech theme, no text, 16:9）
2. 写一个 **HTML 模板文件**，里面每个 `.slide` div 就是一页
3. 用 **CSS Grid** 排内容，用 **Canvas** 画图表
4. 浏览器打开 → `Ctrl+P` → 保存为 PDF
5. 搞定了

进阶版：
- 用 **Slidev** 代替手写 HTML，Markdown 写内容更快
- 用 **Puppeteer** 写个脚本自动截图导出
- 把背景图 prompt + HTML 模板做成可复用的"主题"

---

> [!tip] 一句话
> **AI 画的背景决定了你的 PPT"看起来值多少钱"，代码写的骨架决定了你的 PPT"讲清楚了没有"。**

---

*整理于 2026-05-27，一个关于"不精准交给 AI、精准交给代码"的 PPT 制作方法论。*

---

## 相关笔记

- [[Codex三件套：AI做PPT的最强组合]] — 另一种路径：Codex 当总导演，不写代码也能出可编辑 PPTX。两套方案互补，选择取决于你更需要像素级控制还是可编辑的通用格式。
