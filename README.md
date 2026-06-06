# 松果阁个人博客

这是一个基于 Create React App 的个人博客与知识图谱站点。当前视觉核心是首页的 3D 松果星寰仪：用 React Three Fiber 渲染一颗可拖拽、可缩放、可点击的星球，并把博客、知识图谱、项目、联系、关于等入口做成悬浮大陆。

> 给新对话里的 agent：真实项目通常位于 `D:\Yhx06\Documents\仙术工坊——项目集\个人博客网站-松果阁\personal-blog`。如果当前工作区是 `D:\Yhx06\Documents\全栈学习模板\个人博客网站\personal-blog`，那只是一个占位目录，不是正在运行的 React 项目。

## 常用命令

```bash
npm start
npm run build
npm run sync-notes
npm run publish-admin
```

- `npm start` / `npm run dev`：启动 CRA 开发服务器，默认 `http://localhost:3000`，如果端口被占用会顺延。
- `npm run build`：生产构建，输出到 `build/`。
- `npm run sync-notes` / `npm run build-graph` / `npm run publish-notes`：从 Obsidian Vault 同步已发布笔记，生成 `public/notes`、`public/graph.json`、`public/notes-index.json`。
- `npm run publish-admin`：启动本地发布控制台，配置见 `scripts/publish-manifest.json`。

## 技术栈

- React 18 + React Router v6
- styled-components
- Framer Motion
- Three.js + `@react-three/fiber` + `@react-three/drei`
- Markdown/知识库：`react-markdown`、`remark-gfm`、自定义 Obsidian 同步脚本
- 图谱：`react-force-graph-2d`、D3

## 路由地图

- `/`：首页，入口组件 `src/pages/Home.jsx`，核心视觉 `src/components/HeroSection3D`。
- `/blog`、`/blog/:category`：博客列表与分类页。
- `/atlas`、`/atlas/:type`：知识图谱/笔记导航入口。
- `/graph`：图谱视图。直接访问时会以 `/atlas` 为背景；从站内进入时可作为 modal。
- `/note/*`：单篇笔记阅读页，数据来自 `public/notes-index.json` 与 `public/notes`。
- `/projects`：项目页。
- `/contact`：联系页。
- `/about`：关于页。

## 目录结构

```text
src/
  App.js                         路由、懒加载、全局导航挂载
  index.js / index.css           React 入口与基础样式
  styles/GlobalStyle.js          styled-components 全局样式
  pages/                         页面级组件
  components/
    HeroSection3D/               首页 3D 星球与左侧入口 UI
    GraphView/                   知识图谱视图
    GlobalNav/                   全局导航
    Layout/                      页面外壳、Footer、旧导航
    Animations/                  复用动效组件
    Lanyard/                     联系页/装饰交互组件
  constants/                     博客对象、区域、调试与资源配置
  utils/                         frontmatter、图谱过滤、发布数据等工具
  assets/
    images/                      页面背景、卡片、社交图标
    textures/                    Three.js 星球/大陆纹理

public/
  notes/                         发布后的 Markdown 笔记
  graph.json                     图谱节点与边
  notes-index.json               笔记索引
  _redirects                     部署平台路由回退

scripts/
  build-graph.mjs                Obsidian 同步与图谱生成主脚本
  publish-admin.mjs/html         本地发布控制台
  publish-manifest.json          发布集合、include/exclude、Vault 路径配置
```

## 首页 3D 架构

入口链路：

```text
src/pages/Home.jsx
  -> src/components/HeroSection3D/index.jsx
    -> Canvas + Scene
      -> BlogPlanet/index.jsx
        -> PlanetSurface.jsx
          -> PlanetBase.jsx
          -> ContinentPatch.jsx
          -> BiomeLabel.jsx
```

关键文件：

- `HeroSection3D/index.jsx`：页面首屏布局、左侧入口卡片、Canvas 相机参数、背景图。
- `HeroSection3D/Scene.jsx`：Three.js 灯光和雾。
- `BlogPlanet/index.jsx`：星球整体拖拽、惯性旋转、滚轮缩放、默认缩放值。
- `BlogPlanet/PlanetSurface.jsx`：星球表面、hover 状态、选中状态、标签与光环。
- `BlogPlanet/ContinentPatch.jsx`：悬浮大陆曲面几何、贴图材质、hover 凸起效果。
- `BlogPlanet/planetData.js`：星球半径、各大陆经纬度、大小角度、旋转角度、hover lift。
- `BlogPlanet/biomeConfig.js`：每个入口的文案、颜色、跳转路由、左侧卡片背景。
- `src/assets/textures/continents/`：大陆 alpha 贴图。贴图透明通道决定大陆轮廓。

### ContinentPatch 渲染注意事项

`ContinentPatch.jsx` 会用同一张大陆贴图生成多层几何：

- 顶层高清大陆：保留完整 RGB 贴图，负责可见细节和点击。
- hover 底座层：只读取贴图 alpha，用纯色表现地质层，不再重复显示树木/建筑细节。
- glow/shadow：只做轮廓氛围，不能盖住顶层。

维护时要避免：

- 给底座层使用完整 RGB 贴图，否则会产生重影和模糊。
- 让透明层在顶层之后绘制，或用过强的 `polygonOffset` 抢到前景。
- 把 glow 放在顶层之后用 additive blending 覆盖岛屿。
- 多个透明材质共享一张未 clone 的贴图后反复改参数。

当前策略是：底座和 glow 先绘制，顶层大陆使用更高 `renderOrder` 最后绘制并写入深度；底座层只通过 shader 读取 alpha 轮廓。

## 内容发布流程

站点的 Markdown 内容来自 Obsidian Vault。默认 Vault 路径在 `scripts/build-graph.mjs` 与 `scripts/publish-manifest.json` 中配置。

发布流程：

1. 修改 `scripts/publish-manifest.json`，决定哪些 collection 启用。
2. 运行 `npm run sync-notes`。
3. 脚本复制 Markdown 到 `public/notes`。
4. 脚本解析 wikilink/frontmatter，生成 `public/graph.json` 与 `public/notes-index.json`。
5. 前端的 `/atlas`、`/graph`、`/note/*` 读取这些 public 数据。

## 开发注意事项

- 这个仓库里有大量中文路径和中文内容，文件请保持 UTF-8。
- 当前代码中部分旧中文字符串可能已经出现 mojibake 乱码；修文案时优先整体替换为正常 UTF-8，不要继续复制乱码。
- 项目使用 CRA，不是 Vite。看到 `vite-env.d.ts` 不代表构建工具是 Vite。
- 修改 3D 首页后务必跑 `npm run build`，Three.js 材质/纹理错误经常只有构建或浏览器控制台才暴露。
- 工作区可能有用户未提交改动，尤其是 `src/assets/textures/continents/` 下的图片；不要随意删除或重命名贴图。
- 如果调试 hover 命中区域，先看 `PlanetSurface.jsx` 的 hover 延迟和 `ContinentPatch.jsx` 的 `facingRef` 正面判断。

## 部署

生产构建产物在 `build/`。`public/_redirects` 用于静态部署时把前端路由回退到 `index.html`，适合 Netlify/Vercel 类静态站点托管。
