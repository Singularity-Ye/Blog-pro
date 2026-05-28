---
tags:
  - 博客
  - 前端
  - markdown
  - react
  - callout
  - 技术方案
  - 图谱
page:
  - Blog.jsx
  - Note.jsx
  - GraphView.jsx
aliases:
  - Callout适配方案
  - Obsidian Callouts 复刻
  - VDOM节点拦截器
created: 2026-05-28
status: permanent
---

# 零依赖复刻 Obsidian Callouts：VDOM 节点拦截方案

## 痛点

Obsidian 的 Callout 语法长这样：

```markdown
> [!warning] 仅供娱乐，请勿当真
> 本文整理自一条 AI 生成的讽刺短剧。
```

> [!warning] 仅供娱乐，请勿当真
> 本文整理自一条 AI 生成的讽刺短剧。

在 Obsidian 里，它渲染成一张带黄色左边框、圆角、半透明背景的精美卡片。但在博客网页端，`react-markdown` 不认识 `[!warning]` 这玩意儿——它只认标准 Markdown。于是 `> [!warning]` 被当作普通 `<blockquote>` 里的普通文本，**裸在页面上，丑得理直气壮。**

引入第三方插件（`remark-obsidian-md` 之类）也不是好路——CommonJS/ESM 混包在 React 18+ 环境里经常炸编译，而且多数插件是"无头"的，只负责解析不负责样式，你还是要自己写图标和 CSS，还要开不安全的 `rehype-raw`。

于是有了这个方案——**零外部依赖，只在 ReactMarkdown 的 `blockquote` 组件渲染器里做一次 VDOM 拦截。** 干净、可控、不引入任何新依赖。

---

## 核心思路：虚拟 DOM 节点拦截器

整个方案只有一个核心操作：**在 ReactMarkdown 把 Markdown 解析成 React 元素之后、实际渲染到 DOM 之前——截住 `<blockquote>`，看一眼它的第一个有内容的子节点是不是 `[!type]` 开头。如果是，就劫持这个节点，把它改造成一张 callout 卡片。**

```
ReactMarkdown 解析到 <blockquote>
         ↓
触发自定义 blockquote 渲染器
         ↓
遍历 children，跳过前导 \n 空白
         ↓
找到第一个 <p> 段落节点
         ↓
正则匹配：[!type] Title
         ↓
提取：类型 / 自定义标题 / 正文
         ↓
剥离 [!type] 前缀，重新克隆 React 元素
         ↓
组装输出：SVG 图标 + CSS 变量 + 精美卡片
```

---

## 关键坑位：`\n` 前导空白

ReactMarkdown 解析 blockquote 时，在真实段落节点前后插入了换行符 `\n`。所以 `children` 数组实际长这样：

```
children: ['\n', <p>段落</p>, '\n']
```

如果你天真地用 `children[0]` 去匹配 `[!type]`——你匹配到的是一行空白。这就是为什么最初的方案全返回 `isCallout: false`。Console 截图里的 `children[0] === '\n'` 就是铁证。

修正方式：**遍历 children 时跳过所有空白文本节点**，直到找到第一个真正有内容的段落。

---

## 核心代码

### 拦截解析器

```javascript
function findAndModifyCallout(children) {
  if (!children) return { isCallout: false, children };
  let found = null;

  function processNode(node) {
    if (typeof node === 'string') {
      const match = node.match(
        /^\s*\[!([a-zA-Z_-]+)\](?:[ \t]+([^\r\n]*))?(?:\r?\n([\s\S]*))?/
      );
      if (match) {
        found = {
          type: match[1].toLowerCase(),
          title: match[2] !== undefined ? match[2].trim() : '',
          restText: match[3] || ''
        };
        return found.restText; // 剥离前缀，只返回正文
      }
      return node;
    }
    if (React.isValidElement(node)) {
      if (found) return node;
      const nodeChildren = node.props.children;
      if (Array.isArray(nodeChildren)) {
        const newChildren = [...nodeChildren];
        for (let i = 0; i < newChildren.length; i++) {
          if (typeof newChildren[i] === 'string' && !newChildren[i].trim()) continue;
          newChildren[i] = processNode(newChildren[i]);
          if (found) return React.cloneElement(node, {}, newChildren);
          break;
        }
      } else if (nodeChildren) {
        const processed = processNode(nodeChildren);
        if (found) return React.cloneElement(node, {}, processed);
      }
    }
    return node;
  }

  let modifiedChildren;
  if (Array.isArray(children)) {
    modifiedChildren = [...children];
    for (let i = 0; i < modifiedChildren.length; i++) {
      if (typeof modifiedChildren[i] === 'string' && !modifiedChildren[i].trim()) continue;
      modifiedChildren[i] = processNode(modifiedChildren[i]);
      if (found) break;
    }
  } else {
    const processed = processNode(children);
    if (found) modifiedChildren = processed;
  }

  if (found) {
    return {
      isCallout: true,
      type: found.type,
      title: found.title,
      children: modifiedChildren
    };
  }
  return { isCallout: false, children };
}
```

### 接入 ReactMarkdown

```jsx
<ReactMarkdown
  components={{
    blockquote: (props) => {
      const { children } = props;
      const calloutData = findAndModifyCallout(children);

      if (calloutData.isCallout) {
        const config = CALLOUT_MAP[calloutData.type] || {
          title: calloutData.type, color: '#94a3b8', icon: 'info'
        };
        return (
          <div className={`callout callout-${calloutData.type}`}
               style={{ '--callout-color': config.color }}>
            <div className="callout-title">
              <span className="callout-icon"><CalloutIcon iconType={config.icon} /></span>
              <span>{calloutData.title || config.title}</span>
            </div>
            <div className="callout-content">{calloutData.children}</div>
          </div>
        );
      }
      return <blockquote>{children}</blockquote>;
    }
  }}
/>
```

---

## 双主题 CSS 适配

博客有两套视觉主题，callout 卡片必须同时适配，不能一套好看另一套突兀。解决方案是 **CSS `color-mix()` 动态混色**——不用硬编码，让卡片的主题色自动融入当前背景。

### 暗色主题（Note.jsx · 星宇暗阁版）

```
混色：color-mix(in srgb, var(--callout-color) 8%, rgba(9,19,17,0.55))
效果：主题色微光融入墨绿色半透明底 + 微弱发光阴影
文字：高亮标题 + 半透明柔金正文 rgba(245,239,227,0.88)
```

### 亮色主题（Blog.jsx · 古雅羊皮卷版）

```
混色：color-mix(in srgb, var(--callout-color) 7%, rgba(240,230,210,0.4))
效果：主题色软着陆在羊皮纸纹理上，低饱和度不刺眼
文字：古典深褐墨汁色 #3b2211，去除斜体
```

---

## 13 种手绘 SVG 图标

不用外部图标库。手写 13 种 SVG 矢量图标，每种 callout 类型对应一个：

`note` `warning` `info` `tip` `important` `danger` `success` `abstract` `quote` `question` `example` `summary` `danger`

图标以 Inline SVG 形式内嵌在 JSX 中，零额外请求。

---

## 方案优势

| 维度 | 评价 |
|------|------|
| **依赖** | 0 外部依赖，纯 React + 正则，规避 ESM/CJS 混包地雷 |
| **性能** | 仅首行做次正则匹配（<0.1ms），渲染全由浏览器 C++ 引擎原生完成 |
| **自由度** | CSS 100% 可控，`color-mix()` 动态适配双主题 |
| **安全性** | 不需要 `rehype-raw`，不开放 HTML 注入 |
| **可迁移** | 不绑定 Obsidian 生态，任何 `react-markdown` 项目都能复用 |

---

## 后续可扩展

- [ ] 支持折叠 callout（`> [!note]-` 语法，默认折叠）
- [ ] 支持嵌套 callout（虽然 Obsidian 自己也不建议嵌套太深）
- [ ] 将 `CALLOUT_MAP` 改为可配置 JSON，用户可以自定义类型和颜色
- [ ] 博客端 callout 与 Obsidian 端保持视觉一致性

---

*记录于 2026-05-28，博客 Callout 适配方案从发现 `\n` 问题到双主题完美渲染的全过程。*
