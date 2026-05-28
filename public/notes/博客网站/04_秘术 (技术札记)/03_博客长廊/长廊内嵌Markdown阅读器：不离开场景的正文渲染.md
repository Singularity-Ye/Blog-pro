---
tags:
  - 博客
  - 博客页
  - Markdown
  - react-markdown
page:
  - Blog.jsx
aliases:
  - 长廊阅读器
  - 内嵌Markdown
  - ReaderPanel
created: 2026-05-28
status: permanent
---

# 长廊内嵌 Markdown 阅读器：不离开场景的正文渲染

博客页不是"跳转到 Note 页面"才读正文，而是在空间长廊内部直接打开一张羊皮纸阅读器。

当 `selectedArticleSlug` 改变时，动态加载对应 Markdown：

```javascript
fetch(`/notes/${selectedArticleSlug}.md`)
  .then(r => r.text())
  .then(text => {
    const parsed = parseFrontmatter(text);
    setArticleBody(parsed.body);
    setArticleTitle(parsed.data.title || fileName);
  });
```

正文用 `react-markdown` + `remarkGfm` 渲染，支持 GFM 表格、Mermaid 图、Obsidian Callout、代码块、链接、图片。

阅读器有"返回目录"逻辑：如果从卷轴列表打开文章，可返回 catalog；如果是单篇入口，直接关闭。空间探索不被正文阅读打断——读者一直在长廊里，只是面前展开了一张羊皮纸。

> 从物件到目录到正文，全程不离开同一座松果屋。阅读不是跳走，是翻页。
