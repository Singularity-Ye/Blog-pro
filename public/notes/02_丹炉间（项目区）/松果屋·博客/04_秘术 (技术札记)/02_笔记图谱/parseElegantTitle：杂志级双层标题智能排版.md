---
tags:
  - 博客
  - 图谱页
  - 排版
  - 标题解析
  - CSS
page:
  - Atlas.jsx
  - Note.jsx
aliases:
  - 双层标题排版
  - parseElegantTitle
  - 杂志级标题
created: 2026-05-29
status: permanent
---

# parseElegantTitle：杂志级双层标题智能排版

长标题直接强制折行不仅语义割裂，而且英文与中文括号混排在视觉上显得凌乱。本方案确立"结构化标题 + 前端智能拆分 + 杂志级垂直混排"的排版管理方式。

---

## 标题结构化定义

在配置数据中统一对标题进行格式改造：

- **英文附带型**：`代号《织墨》(WeaveInk)` → 主标题"代号《织墨》"，副标题"WeaveInk"
- **章节/篇目型**：`天玄奥道秘术 · 编译卷` → 主标题"天玄奥道秘术"，副标题"· 编译卷"
- **双词拼贴型**：`叶间林径 | 编织手稿` → 主标题"叶间林径"，副标题"编织手稿"

---

## 智能解析器

```javascript
export function parseElegantTitle(title) {
  if (!title) return { mainText: '', subText: null };

  // 1. 中英文括号：提取主标题 + 剥离括号内副标题
  const parenMatch = title.match(/^([^(（]+)[(（](.+?)[)）]\s*$/);
  if (parenMatch) {
    return { mainText: parenMatch[1].trim(), subText: parenMatch[2].trim() };
  }

  // 2. 管道符 |
  if (title.includes('|')) {
    const parts = title.split('|');
    return { mainText: parts[0].trim(), subText: parts[1].trim() };
  }

  // 3. 中点 · （前置点修饰卷轴）
  if (title.includes('·')) {
    const parts = title.split('·');
    return { mainText: parts[0].trim(), subText: `· ${parts[1].trim()}` };
  }

  // 4. 空格横线 -
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    return { mainText: parts[0].trim(), subText: parts[1].trim() };
  }

  return { mainText: title.trim(), subText: null };
}
```

四种分隔符按优先级匹配：括号 → 管道符 → 中点 → 横线。只有找到分隔符时才拆分，否则原样返回。

---

## 双层渲染

**主标题**：大字，字重适中，`line-height: 1.25`，`word-break: keep-all`。因为被拆分了，中文缩短到 4-8 个字，完美适应任何窄屏容器而不发生汉字截断换行。

**副标题**：小字，透明度降低。
- 若为英文 → 自动换用现代纤细无衬线 `font-family: 'Outfit'` + `letter-spacing: 0.08em`
- 若为中文 → 前置优雅卷轴连接符（如 `· 编译卷`）

---

## 列表与侧边栏净化

侧边栏目录和卡片网格中，通过 `.replace(/\s*\|\s*/g, '')` 净化去除管道符号，将标题还原为连贯文字（如"叶间林径编织手稿"），让列表排版紧凑整洁。

---

## 重构前后对比

| | 重构前 | 重构后 |
|------|------|------|
| **长标题** | `代号《织 / 墨》(Weave / Ink)` 硬生生断开 | 上方大字"代号《织墨》"，下方精致英文"WeaveInk" |
| **窄屏适配** | 中文词汇被截断换行 | `word-break: keep-all` + 拆分后短词，永不截断 |
| **视觉层次** | 标题和副标题混成一团 | 主标题大字、副标题小字透明、英文独立字体，杂志级排版 |
