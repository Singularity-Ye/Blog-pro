import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './GraphView.css';

// ── 力导向图引擎 ──────────────────────────────────────────────
class ForceGraph {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nodes = [];
    this.edges = [];
    this.nodeMap = new Map();

    // 视图状态
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.dragNode = null;
    this.hoveredNode = null;

    // 回调
    this.onNodeClick = options.onNodeClick || (() => {});
    this.onNodeHover = options.onNodeHover || (() => {});

    // 样式
    this.colors = {
      node: '#a78bfa',
      nodeHover: '#c4b5fd',
      nodeHighlight: '#e0e7ff',
      edge: 'rgba(167, 139, 250, 0.12)',
      edgeHighlight: 'rgba(167, 139, 250, 0.5)',
      text: 'rgba(224, 231, 255, 0.8)',
      textHighlight: '#e0e7ff',
      background: '#05000f',
    };

    // 物理参数
    this.repulsion = 800;
    this.attraction = 0.005;
    this.damping = 0.85;
    this.centerGravity = 0.01;
    this.maxVelocity = 8;

    // 动画
    this.animId = null;
    this.running = false;
    this.simulationAlpha = 1;

    // 绑定事件
    this._bindEvents();
  }

  _bindEvents() {
    this.canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this._onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this._onMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this._onWheel.bind(this), { passive: false });
    this.canvas.addEventListener('mouseleave', this._onMouseLeave.bind(this));
  }

  _screenToWorld(sx, sy) {
    return {
      x: (sx - this.offsetX) / this.scale,
      y: (sy - this.offsetY) / this.scale,
    };
  }

  _worldToScreen(wx, wy) {
    return {
      x: wx * this.scale + this.offsetX,
      y: wy * this.scale + this.offsetY,
    };
  }

  _findNodeAt(sx, sy) {
    const { x, y } = this._screenToWorld(sx, sy);
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const n = this.nodes[i];
      const r = n.radius || 4;
      const dx = x - n.x;
      const dy = y - n.y;
      if (dx * dx + dy * dy <= (r + 4) * (r + 4)) return n;
    }
    return null;
  }

  _onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const node = this._findNodeAt(sx, sy);

    if (node) {
      this.dragNode = node;
      node.fx = node.x;
      node.fy = node.y;
    } else {
      this.isDragging = true;
      this.dragStart = { x: sx - this.offsetX, y: sy - this.offsetY };
    }
  }

  _onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (this.dragNode) {
      const { x, y } = this._screenToWorld(sx, sy);
      this.dragNode.fx = x;
      this.dragNode.fy = y;
      this.simulationAlpha = 1;
    } else if (this.isDragging) {
      this.offsetX = sx - this.dragStart.x;
      this.offsetY = sy - this.dragStart.y;
    } else {
      const node = this._findNodeAt(sx, sy);
      if (node !== this.hoveredNode) {
        this.hoveredNode = node;
        this.canvas.style.cursor = node ? 'pointer' : 'grab';
        this.onNodeHover(node, sx, sy);
      }
    }
  }

  _onMouseUp(e) {
    if (this.dragNode) {
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const moved = Math.abs(sx - (this.dragNode.fx * this.scale + this.offsetX)) < 3
                  && Math.abs(sy - (this.dragNode.fy * this.scale + this.offsetY)) < 3;
      if (moved) {
        this.onNodeClick(this.dragNode);
      }
      this.dragNode.fx = null;
      this.dragNode.fy = null;
      this.dragNode = null;
    }
    this.isDragging = false;
  }

  _onWheel(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, this.scale * zoomFactor));

    this.offsetX = sx - (sx - this.offsetX) * (newScale / this.scale);
    this.offsetY = sy - (sy - this.offsetY) * (newScale / this.scale);
    this.scale = newScale;
  }

  _onMouseLeave() {
    this.hoveredNode = null;
    this.isDragging = false;
    this.onNodeHover(null);
  }

  setData(graphData) {
    // 初始化节点位置（随机分布在中心区域）
    const w = this.canvas.width / 2;
    const h = this.canvas.height / 2;
    this.nodes = graphData.nodes.map((n, i) => ({
      ...n,
      x: w + (Math.random() - 0.5) * 400,
      y: h + (Math.random() - 0.5) * 400,
      vx: 0,
      vy: 0,
      radius: 4,
    }));
    this.edges = graphData.links.map(l => ({ ...l }));
    this.nodeMap = new Map(this.nodes.map(n => [n.id, n]));

    // 计算节点大小（按连接数）
    const degreeMap = new Map();
    for (const e of this.edges) {
      degreeMap.set(e.source, (degreeMap.get(e.source) || 0) + 1);
      degreeMap.set(e.target, (degreeMap.get(e.target) || 0) + 1);
    }
    for (const n of this.nodes) {
      const deg = degreeMap.get(n.id) || 0;
      n.radius = Math.max(3, Math.min(12, 3 + Math.sqrt(deg) * 2));
    }

    // 居中视图
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    this.simulationAlpha = 1;
  }

  setHighlight(nodeId) {
    this._highlightId = nodeId;
  }

  _simulate() {
    const nodes = this.nodes;
    const edges = this.edges;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    // 节点间斥力
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist > 300) continue; // 优化：忽略太远的节点
        const force = this.repulsion / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      }
    }

    // 边的引力
    for (const e of edges) {
      const a = this.nodeMap.get(e.source);
      const b = this.nodeMap.get(e.target);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = dist * this.attraction;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    }

    // 中心引力
    for (const n of nodes) {
      n.vx += (cx - n.x) * this.centerGravity;
      n.vy += (cy - n.y) * this.centerGravity;
    }

    // 更新位置
    for (const n of nodes) {
      if (n.fx != null) { n.x = n.fx; n.y = n.fy; n.vx = 0; n.vy = 0; continue; }
      n.vx *= this.damping;
      n.vy *= this.damping;
      const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (speed > this.maxVelocity) {
        n.vx = (n.vx / speed) * this.maxVelocity;
        n.vy = (n.vy / speed) * this.maxVelocity;
      }
      n.x += n.vx;
      n.y += n.vy;
    }

    this.simulationAlpha *= 0.995;
  }

  _draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = this.colors.background;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    const highlightId = this._highlightId || (this.hoveredNode && this.hoveredNode.id);
    const highlightSet = new Set();
    if (highlightId) {
      highlightSet.add(highlightId);
      for (const e of this.edges) {
        if (e.source === highlightId) highlightSet.add(e.target);
        if (e.target === highlightId) highlightSet.add(e.source);
      }
    }

    // 画边
    for (const e of this.edges) {
      const a = this.nodeMap.get(e.source);
      const b = this.nodeMap.get(e.target);
      if (!a || !b) continue;
      const isHighlight = highlightSet.has(e.source) && highlightSet.has(e.target);
      ctx.strokeStyle = isHighlight ? this.colors.edgeHighlight : this.colors.edge;
      ctx.lineWidth = isHighlight ? 1.2 / this.scale : 0.5 / this.scale;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // 画节点
    for (const n of this.nodes) {
      const isHighlight = highlightSet.has(n.id);
      const isSelf = n.id === highlightId;
      const r = n.radius || 4;

      // 光晕
      if (isSelf) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(167, 139, 250, 0.15)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isSelf ? this.colors.nodeHighlight
        : isHighlight ? this.colors.nodeHover
        : this.colors.node;
      ctx.globalAlpha = highlightId && !isHighlight ? 0.25 : 1;
      ctx.fill();
      ctx.globalAlpha = 1;

      // 标签（只在缩放足够大或节点被高亮时显示）
      if (this.scale > 0.6 || isSelf) {
        ctx.font = `${isSelf ? 'bold ' : ''}${11 / Math.max(this.scale, 0.5)}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = isSelf ? this.colors.textHighlight : this.colors.text;
        ctx.globalAlpha = highlightId && !isHighlight ? 0.2 : 1;
        ctx.textAlign = 'center';
        ctx.fillText(n.title, n.x, n.y + r + 14 / Math.max(this.scale, 0.5));
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      if (this.simulationAlpha > 0.01) this._simulate();
      this._draw();
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    this.running = false;
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  destroy() {
    this.stop();
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('mouseup', this._onMouseUp);
    this.canvas.removeEventListener('wheel', this._onWheel);
    this.canvas.removeEventListener('mouseleave', this._onMouseLeave);
  }
}

// ── React 组件 ────────────────────────────────────────────────

export default function GraphView() {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const [graphData, setGraphData] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, title: '', connections: 0 });
  const navigate = useNavigate();

  // 加载图谱数据
  useEffect(() => {
    fetch('/graph.json')
      .then(r => r.json())
      .then(setGraphData)
      .catch(console.error);
  }, []);

  // 初始化图谱
  useEffect(() => {
    if (!graphData || !canvasRef.current) return;

    const graph = new ForceGraph(canvasRef.current, {
      onNodeClick: (node) => navigate(`/note/${node.slug}`),
      onNodeHover: (node, x, y) => {
        if (node) {
          const conn = graphData.links.filter(
            l => l.source === node.id || l.target === node.id
          ).length;
          setTooltip({ visible: true, x, y, title: node.title, connections: conn });
        } else {
          setTooltip(t => ({ ...t, visible: false }));
        }
      },
    });

    graph.setData(graphData);
    graph.resize();
    graph.start();

    const handleResize = () => graph.resize();
    window.addEventListener('resize', handleResize);

    graphRef.current = graph;
    return () => {
      window.removeEventListener('resize', handleResize);
      graph.destroy();
    };
  }, [graphData, navigate]);

  const handleReset = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.offsetX = 0;
      graphRef.current.offsetY = 0;
      graphRef.current.scale = 1;
      graphRef.current.simulationAlpha = 1;
    }
  }, []);

  return (
    <div className="graph-view-container">
      <canvas ref={canvasRef} />
      <div
        className={`graph-tooltip ${tooltip.visible ? 'visible' : ''}`}
        style={{ left: tooltip.x, top: tooltip.y }}
      >
        <div className="tooltip-title">{tooltip.title}</div>
        <div className="tooltip-connections">{tooltip.connections} 个连接</div>
      </div>
      <div className="graph-controls">
        <button onClick={handleReset}>重置视图</button>
      </div>
    </div>
  );
}

// 导出 ForceGraph 供 MiniGraph 复用
export { ForceGraph };
