# Obsidian 笔记发布控制

这个项目的笔记发布由 `scripts/publish-manifest.json` 控制。

## 常用命令

```bash
npm run publish-admin
```

打开本地发布控制台。默认地址是：

```text
http://localhost:4177
```

控制台可以：

- 开关某个发布分类
- 修改分类名称、Vault 目录、分类标识
- 编辑 include / exclude 规则
- 预览当前分类会发布哪些笔记
- 保存清单并一键同步发布

```bash
npm run sync-notes
```

按清单从 Obsidian Vault 同步笔记到 `public/notes`，并重新生成：

- `public/graph.json`
- `public/notes-index.json`

`npm run publish-notes` 和 `npm run build-graph` 目前执行同一条流水线。

## 发布一个分类

在 `collections` 中把对应项设为：

```json
{
  "enabled": true,
  "label": "杭州五一旅游攻略",
  "root": "杭州五一旅游攻略",
  "kind": "travel",
  "include": ["**/*.md"],
  "exclude": []
}
```

- `enabled`: 是否发布这个分类。
- `label`: 网站上显示的分类名。
- `root`: Obsidian Vault 中的目录名。
- `kind`: 网站内部分类标识。
- `include`: 允许发布的文件规则。
- `exclude`: 从允许范围中排除的文件规则。

## 只发布某些笔记

例如只发布旅游攻略里的路线和美食：

```json
"include": [
  "路线/**/*.md",
  "美食/**/*.md"
]
```

## 排除某些笔记

例如排除草稿目录：

```json
"exclude": [
  "草稿/**",
  "**/*.draft.md"
]
```

## 控制公开属性

`publicFrontmatterFields` 用来记录哪些 frontmatter 字段适合展示给读者。当前前端会优先展示这些读者能理解的属性，并隐藏 `id`、`lng`、`lat`、`cluster`、`plan_weight` 等内部字段。
