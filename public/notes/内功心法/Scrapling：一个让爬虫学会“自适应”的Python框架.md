---
tags:
  - 爬虫
  - python
  - 开源
  - web-scraping
  - AI工具
aliases:
  - Scrapling爬虫框架
  - 自适应爬虫
source: GitHub D4Vinci/Scrapling + 科技资讯
created: 2026-05-27
status: permanent
---

# Scrapling：一个让爬虫学会"自适应"的 Python 框架

> [!abstract] 一句话
> Scrapling 是一个 Python 爬虫框架，核心卖点是**自适应解析**——网页改版了，你写的选择器不需要改，它会自动找到元素在哪。加上内置的反爬绕过、Spider 爬虫引擎、MCP AI 集成，从单次请求到大规模爬取全包了。GitHub 54K star，BSD-3 协议。

---

## 一、它解决了什么痛点

传统爬虫最让人头疼的事——**网站一改版，爬虫就废了。**

你花半小时写的 CSS 选择器 `.product-card .title > span`，对方前端换个 class 名、加一层 div、改成 flex 布局，你的脚本就再也抓不到数据了。然后你打开浏览器 F12，重新找选择器，改代码，部署。下次对方又改版，再来一遍。

Scrapling 的核心设计就是解决这个问题：

```python
# 第一次抓取：正常用选择器
products = page.css('.product', auto_save=True)

# 网站改版后：原来的 .product 找不到了
# 加 adaptive=True，框架会用相似度算法自动定位到新位置的元素
products = page.css('.product', adaptive=True)
```

它怎么做到的？**第一次 `auto_save=True` 时，它不只记住了 CSS 选择器，还记住了目标元素的文本特征、DOM 位置、父节点结构、周围的元素关系。** 网站改版后，用这些特征去匹配，找到"最像原来那个元素"的东西。

这不光是"换个选择器"的智能——它是一种**元素指纹追踪**。

---

## 二、核心能力拆解

### 2.1 三种 Fetcher，覆盖不同场景

| Fetcher | 用途 | 特点 |
|------|------|------|
| **`Fetcher`** | 普通 HTTP 请求 | 快速、支持 TLS 指纹伪装（伪装成 Chrome/Firefox）、HTTP/3 |
| **`DynamicFetcher`** | 需要 JS 渲染的页面 | 基于 Playwright 的 Chromium 或 Chrome，支持 `network_idle` 等待 |
| **`StealthyFetcher`** | 有反爬保护的页面 | 指纹伪装 + 浏览器自动化，**内置绕过 Cloudflare Turnstile** |

```python
# 普通请求
page = Fetcher.get('https://example.com')

# 需要 JS 渲染
page = DynamicFetcher.fetch('https://spa-site.com', headless=True, network_idle=True)

# 突破 Cloudflare
page = StealthyFetcher.fetch('https://protected.com', solve_cloudflare=True)
```

三种 Fetcher 都支持 **Session 模式**——维持登录态、Cookie、代理轮换。

### 2.2 Spider 引擎：Scrapy 风格的爬虫

```python
from scrapling.spiders import Spider, Response

class MySpider(Spider):
    name = "demo"
    start_urls = ["https://example.com/"]
    concurrent_requests = 10  # 并发数

    async def parse(self, response: Response):
        for item in response.css('.product'):
            yield {"title": item.css('h2::text').get()}

MySpider().start()
```

几个亮点：
- **Pause & Resume**：按 Ctrl+C 优雅暂停，下次启动从断点继续。长爬取不用从头再来
- **多 Session 混用**：一个 Spider 里可以同时用 `FetcherSession`（快）和 `StealthySession`（安全）。普通页面用快的，遇到 Cloudflare 自动切到隐身模式
- **流式输出**：`async for item in spider.stream()`，数据一边抓一边出，不用等全抓完
- **开发模式**：第一次跑把响应缓存到磁盘，后续调试 `parse()` 逻辑时直接从磁盘读，不打目标服务器

### 2.3 MCP Server：让 AI 直接操控爬虫

这是最有意思的部分。Scrapling 内置了一个 MCP（Model Context Protocol）服务器：

> AI（Claude / Cursor / Copilot）可以直接通过 MCP 调用 Scrapling 的能力——给定一个 URL 和目标描述，Scrapling 帮你抓取、提取、清洗，然后把**精准的结果**而不是整页 HTML 喂给 AI。

这意味着什么？AI 不再需要"读整页源代码再猜哪个是正文"——Scrapling 在 MCP 层就把数据提取好了，AI 拿到的已经是结构化内容。**省 token，提速，减少幻觉。**

这和 [[GSAP官方AI技能包：动画短板被补上了|GSAP 知识包]] 的思路一样——"让人类最好的工具直接教 AI"。GSAP 教 AI 写动画，Scrapling 教 AI 抓数据。

### 2.4 CLI：不写代码也能用

```bash
# 把网页内容提取为 Markdown
scrapling extract get 'https://example.com' content.md

# 只提取指定选择器的内容
scrapling extract get 'https://example.com' content.txt --css-selector '#main'

# 隐身模式，绕过 Cloudflare
scrapling extract stealthy-fetch 'https://protected.com' output.html --solve-cloudflare
```

CLI 支持三种输出格式：`.txt`（纯文本）、`.md`（Markdown 渲染）、`.html`（原始 HTML）。

---

## 三、性能

Scrapling 的解析器性能在 Python 爬虫生态里属于第一梯队：

| 库 | 文本提取速度（5000 元素） | 相对 Scrapling |
|------|:--:|:--:|
| **Scrapling** | 2.02ms | 1x |
| Parsel / Scrapy | 2.04ms | 1.01x |
| Raw Lxml | 2.54ms | 1.26x |
| PyQuery | 24.17ms | ~12x |
| BeautifulSoup (lxml) | 1584ms | ~784x |

在"元素相似度匹配"（自适应重定位的核心能力）上，对比 AutoScraper 快了 5 倍。

---

## 四、和之前笔记的关联

这个项目和之前的几篇内功心法形成了一条很有意思的线索：

| 笔记 | 核心思想 |
|------|------|
| [[自动化知识管线：从信息捕猎到日报推送的完整闭环\|自动化知识管线]] | AutoCLI 抓取信息 → LLM 编译 → Obsidian 入库 |
| [[GSAP官方AI技能包：动画短板被补上了\|GSAP 技能包]] | 官方给 AI 写教科书，AI 不再从垃圾教程里学 |
| **Scrapling** | 爬虫学会自适应，网页改版不报废；内置 MCP 让 AI 直接调用 |

如果把这三个串起来：

```
Scrapling 抓取网页 → LLM 编译 → Obsidian 入库 → GSAP 渲染动画 → 博客展示
```

一条从"数据采集"到"视觉呈现"的完整 AI 增强管线。Scrapling 补上了最上游的"采集自适应"这个环节——它让信息捕猎不再是"写选择器 → 改版 → 重写 → 又改版"的无限循环。

---

## 五、基本信息

| 项目 | 详情 |
|------|------|
| **仓库** | `github.com/D4Vinci/Scrapling` |
| **语言** | Python（≥3.10） |
| **Star** | ~54,000 |
| **协议** | BSD-3-Clause |
| **安装** | `pip install scrapling` |
| **文档** | scrapling.readthedocs.io |
| **创建时间** | 2024 年 10 月 |

---

> [!summary]
> 传统爬虫死于网页改版。Scrapling 让爬虫学会追踪元素——不靠固定选择器，靠元素指纹。加上反爬绕过、Spider 引擎、MCP AI 集成，它可能是目前 Python 生态里"从零到生产"最快的爬虫框架。

---

*整理于 2026-05-27。基于 GitHub 仓库 README 和性能基准数据。*
