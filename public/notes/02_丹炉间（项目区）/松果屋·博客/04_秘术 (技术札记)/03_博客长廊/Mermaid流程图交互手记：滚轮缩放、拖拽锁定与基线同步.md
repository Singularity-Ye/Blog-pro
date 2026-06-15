# Mermaid 流程图交互手记：滚轮缩放、拖拽锁定与基线同步

在现代 Web 前端开发中，针对大型 SVG 节点（如 Mermaid 生成的复杂流程图、架构图）进行画布交互开发时，**滚轮缩放（Zoom）** 与 **鼠标拖拽平移（Pan）** 的复合交互是提升用户体验的核心。

然而，在 React 框架的开发语境下，由于状态更新的异步批处理特性、浏览器的 Passive Event 优化，以及多重叠加交互状态的冲突，开发者往往会遭遇以下经典痛点：
1. **高频滚动时缩放中心漂移**；
2. **缩放时网页背景页面同步滚动（无法锁定）**；
3. **拖拽过程中进行滚轮缩放，继续拖拽时画面发生“瞬移/跳跃”**。

本文将详述以上痛点的数学模型与 React 最佳实践解决方案。

---

## 一、 缩放与平移的几何数学模型

在二维笛卡尔坐标系中，画布上的某一个点从**虚拟画布空间（Canvas Space）** 投影到 **浏览器视窗空间（Viewport Space）** ，满足以下仿射变换：
$$
x_{viewport} = x_{canvas} \cdot s + t_x
$$
$$
y_{viewport} = y_{canvas} \cdot s + t_y
$$
其中 $s$ 为当前缩放比例（Scale），$(t_x, t_y)$ 为当前画布的平移偏移量（Translation / Position）。

### 1. 指针为中心缩放（Pointer-Centered Zoom）
当用户将鼠标指针悬停在某一点 $P(p_x, p_y)$ 并滚动滚轮时，我们的目标是：**在缩放比例由 $s$ 变化为 $s'$ 的过程中，点 $P$ 在视窗中的位置保持不变**。

根据投影公式，缩放前后点 $P$ 对应的虚拟画布空间点坐标应当恒等：
$$
\frac{p_x - t_x}{s} = \frac{p_x - t'_x}{s'}
$$
$$
\frac{p_y - t_y}{s} = \frac{p_y - t'_y}{s'}
$$

解出缩放后的新偏移量 $(t'_x, t'_y)$：
$$
t'_x = p_x - (p_x - t_x) \cdot \frac{s'}{s}
$$
$$
t'_y = p_y - (p_y - t_y) \cdot \frac{s'}{s}
$$

这就是实现“鼠标指哪缩放哪”的核心数学公式。

---

## 二、 React 异步状态下的高频事件同步 Ref 模式

在 React 中，我们通常使用 `useState` 来维护 `scale` 和 `position`：
```javascript
const [scale, setScale] = useState(1);
const [position, setPosition] = useState({ x: 0, y: 0 });
```

### 1. 异步陷阱
React 的状态更新是异步的，并且会在同一事件循环中进行批处理。当用户快速滚动鼠标滚轮时，连续触发的 `wheel` 事件会在极短时间内入队。
如果直接在事件回调中读取当前的 `scale` 和 `position`，拿到的通常是尚未被 React 重新渲染更新的**陈旧快照（Stale Closure）**，从而导致计算出的新偏移量 $(t'_x, t'_y)$ 不断漂移，产生严重的视图抖动。

### 2. 双重同步设计（Sync Refs Pattern）
为了解决这一问题，我们引入 `useRef` 对关键状态进行即时的同步读写保护：
```javascript
const scaleRef = useRef(scale);
const positionRef = useRef(position);

// 在渲染周期中将最新的 state 镜像至 Ref
useEffect(() => {
  scaleRef.current = scale;
  positionRef.current = position;
}, [scale, position]);
```

在 `handleWheel` 事件回调中，我们放弃从 Closure 中读取 State，而是直接读取并修改 Ref，最后将结果同步写回 State：
```javascript
const handleWheel = useCallback((e) => {
  e.preventDefault();
  
  // 1. 同步读取最新的物理快照
  const currentScale = scaleRef.current;
  const currentPosition = positionRef.current;

  // 2. 几何计算新比例与新位置
  let newScale = isZoomIn ? currentScale * 1.15 : currentScale / 1.15;
  const newX = mouseX - (mouseX - currentPosition.x) * (newScale / currentScale);
  const newY = mouseY - (mouseY - currentPosition.y) * (newScale / currentScale);

  // 3. 立即写入 Ref，使同帧内的下一次连续滚动事件能读到最新物理坐标
  scaleRef.current = newScale;
  positionRef.current = { x: newX, y: newY };

  // 4. 触发异步渲染更新
  setScale(newScale);
  setPosition({ x: newX, y: newY });
}, []);
```

---

## 三、 突破 Passive Listener 锁定背景滚动

在现代浏览器中，为了优化页面的滚动流畅度，默认将绑定在组件上的 `onWheel` 标记为 `passive: true`。在 passive 监听器中调用 `e.preventDefault()` 会被浏览器直接忽略，并抛出警告：
> *Unable to preventDefault inside passive event listener due to target being treated as passive.*

这意味着用户在弹窗中缩放流程图时，底部的博客背景页面也会跟着一起滚动，极具割裂感。

### 解决方案
必须绕过 React 的合成事件系统（SyntheticEvent），在组件挂载后，通过原生的非 passive 属性强制绑定事件：
```javascript
useEffect(() => {
  if (!isFocused || !viewportRef.current) return;
  const viewport = viewportRef.current;
  
  // 声明 { passive: false }，使其拥有拦截默认滚动的权限
  viewport.addEventListener('wheel', handleWheel, { passive: false });
  return () => {
    viewport.removeEventListener('wheel', handleWheel);
  };
}, [isFocused, handleWheel]);
```

---

## 四、 复合交互冲突：拖拽过程中的缩放锁与基线同步

当 **左键按住拖动（Panning）** 与 **滚轮缩放（Zooming）** 两种交互叠加时，会产生以下经典冲突：

### 1. 拖拽时缩放锚点锁定（Drag Zoom Lock）
- **现象**：当用户左键按住画布一边拖拽一边滚动滚轮时，若缩放中心点依然跟随鼠标指针，由于画面本身在位移，缩放中心点会在虚拟画布中急速游走，导致画面发生错乱抖动。
- **解决方案**：引入拖拽锁。当 `isDragging` 为真时，强制将缩放中心锁定在用户**最开始按下鼠标那一瞬间的视窗物理坐标**（即拖拽起点 `initialZoomCenterRef.current`），而不是移动后的鼠标坐标。这与 Figma、Miro 等专业制图工具的物理交互逻辑完全一致。

### 2. 拖拽基线同步（Baseline Synchronization）
- **现象**：用户按下鼠标，此时保存的基线偏移量为 `dragStart.current = mouseCoords - position`。在按住鼠标移动的过程中，用户滚动滚轮进行了缩放，这修改了画面的 `position`。当用户稍微移动鼠标，MouseMove 事件再次触发，直接使用新鼠标坐标减去未同步的旧基线 `dragStart`，导致画面计算出的新 `position` 发生突变，出现生硬的“瞬移跳跃”。
- **解决方案**：在 `handleWheel` 中计算出新坐标 `newX` 和 `newY` 后，如果检测到拖拽处于激活状态，**立即动态反向推导并重置当前的拖拽基线偏移量**：
```javascript
if (isDraggingRef.current) {
  // 根据缩放后的新画布位置，反向更新拖拽的鼠标相对原点
  dragStart.current = {
    x: e.clientX - newX,
    y: e.clientY - newY
  };
}
```
通过这种瞬时的基线同步，画面在缩放前后得以保持完美的物理连续性，拖拽体验丝滑无比。

---

## 五、 总结

复杂的画布交互不是简单的事件绑定，而是由几何计算与 React 渲染机制共同决定的。通过：
1. **仿射变换公式** 精准计算定锚坐标；
2. **Sync Refs 模式** 越过 React 异步批处理陷阱；
3. **原生非 Passive 事件注册** 锁定浏览器滚动；
4. **动态基线同步机制** 消除多重交互冲突。

这套方案能够为前台应用提供原生客户端级别的流畅交互体验，非常适合在流程图、思维导图、无限画布等应用场景中落地。
