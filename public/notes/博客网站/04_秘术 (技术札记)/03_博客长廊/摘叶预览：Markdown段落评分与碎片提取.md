---
tags:
  - 博客
  - 博客页
  - Markdown
  - 文本提取
page:
  - Blog.jsx
aliases:
  - 摘叶预览
  - getNoteSnippet
  - Markdown段落评分
created: 2026-05-28
status: permanent
---

# 摘叶预览：Markdown 段落评分与碎片提取

indoor 场景的叶片点击后不直接打开正文，而是先浮出一张摘要纸条。`getNoteSnippet` 负责从原始 Markdown 中提取最值得预览的片段。

它不只粗暴截取前 150 字。流程是：

1. 跳过 YAML frontmatter（`---` 包裹区）
2. 过滤噪音行——空行、纯符号行、过短段落
3. 对每个候选段落评分——中文数量、标点密度、长度加权
4. 取评分最高的段落作为摘叶内容

摘叶不是"显示前几句"，而是"找到最像正文的那一段"。这让读者的第一次触碰就拿到有信息量的内容，不会看到一堆 `tags:` 或空行。

交互链路：点击叶片 → 叶片抖动 → filter/collection 定位笔记 → fetch Markdown → parseFrontmatter + getNoteSnippet → 浮出 `LeafPaperNote` 纸条 → 点击"展开读卷"进入完整阅读器。

> 它把"文章预览"包装成了一次摘叶动作，非常贴合松果屋世界观。
