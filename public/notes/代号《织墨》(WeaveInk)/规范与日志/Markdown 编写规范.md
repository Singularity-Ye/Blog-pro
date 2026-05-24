---
tags:
  - weaveink/meta
  - weaveink/usage
parent: "[[WeaveInk：创作流协议]]"
---

# Markdown 编写规范 (Markdown Writing Standard)

WeaveInk 的文本层协议——确保系统能正确解析每一行内容。

## 章节结构

```markdown
# 第N章：标题

（正文段落...）

---

## 场景：场景名

（新场景正文...）
```

- `#` 一级标题：章节声明
- `---` 分隔线：场景切换
- `##` 二级标题：场景命名

## 内联约束标记

在需要设定守护者特别关注的段落前，使用 HTML 注释：

```markdown
<!-- weaveink:constraint 林夜当前重伤，左臂已断，无法使用双手武器 -->
林夜缓缓拔出剑，单手持剑指向敌军。
```

守护者解析器会提取 `<!-- weaveink:constraint ... -->` 作为额外的约束条件。

## 禁止行为

- 不要在正文中内嵌大段设定描述（应用 `[[角色·XXX]]` 引用）
- 不要使用 HTML 排版（`<div>`, `<span>` 等）——保持纯 Markdown
