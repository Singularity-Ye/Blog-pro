import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  filterGraphByCollection,
  filterGraphByLocal,
  normalizeGraph,
} from '../../utils/graphFilters';
import './GraphView.css';

const COLLECTION_LABELS = {
  travel: '杭州五一旅游攻略',
  project: '建站流程指南',
  'blog-design': '博客网站设计思路',
};

const GRAPH_THEMES = {
  publishGlobal: {
    node: '#b98234',
    nodeHover: '#9a6728',
    nodeHighlight: '#7b4a18',
    nodeMuted: '#c9bea8',
    edge: 'rgba(91, 70, 48, 0.18)',
    edgeHighlight: 'rgba(123, 74, 24, 0.42)',
    text: 'rgba(54, 45, 34, 0.68)',
    textHighlight: '#5f3513',
    halo: 'rgba(185, 130, 52, 0.18)',
    background: '#f1eadb',
  },
  publishLocal: {
    node: '#b98234',
    nodeHover: '#9a6728',
    nodeHighlight: '#7b4a18',
    nodeMuted: '#d8cfbd',
    edge: 'rgba(91, 70, 48, 0.18)',
    edgeHighlight: 'rgba(123, 74, 24, 0.42)',
    text: 'rgba(54, 45, 34, 0.68)',
    textHighlight: '#5f3513',
    halo: 'rgba(185, 130, 52, 0.18)',
    background: '#f4eedf',
  },
};

function toNoteHref(slug) {
  return `/note/${String(slug).split('/').map(encodeURIComponent).join('/')}`;
}

class ForceGraph {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false }) || canvas.getContext('2d');
    this.dpr = 1;
    this.width = 1;
    this.height = 1;
    this.nodes = [];
    this.edges = [];
    this.nodeMap = new Map();

    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    this.targetOffsetX = 0;
    this.targetOffsetY = 0;
    this.targetScale = 1;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.pointerDown = { x: 0, y: 0 };
    this.dragNode = null;
    this.hoveredNode = null;

    this.onNodeClick = options.onNodeClick || (() => {});
    this.onNodeHover = options.onNodeHover || (() => {});
    this.colors = GRAPH_THEMES[options.theme] || GRAPH_THEMES.publishGlobal;
    this.labelScale = options.labelScale || 1;
    this.maxLabelSize = options.maxLabelSize || 18;
    this.selfLabelBoost = options.selfLabelBoost ?? 3;

    this.repulsion = 800;
    this.attraction = 0.005;
    this.linkDistance = 120;
    this.damping = 0.85;
    this.centerGravity = 0.01;
    this.maxVelocity = 8;
    this.minNodeRadius = 2.4;
    this.maxNodeRadius = 8;
    this.nodeRadiusScale = 1.2;

    this.animId = null;
    this.running = false;
    this.simulationAlpha = 1;
    this.needsRedraw = true;

    this._handlers = {
      mousedown: this._onMouseDown.bind(this),
      mousemove: this._onMouseMove.bind(this),
      mouseup: this._onMouseUp.bind(this),
      wheel: this._onWheel.bind(this),
      mouseleave: this._onMouseLeave.bind(this),
    };
    this._bindEvents();
  }

  _bindEvents() {
    this.canvas.addEventListener('mousedown', this._handlers.mousedown);
    this.canvas.addEventListener('mousemove', this._handlers.mousemove);
    this.canvas.addEventListener('mouseup', this._handlers.mouseup);
    this.canvas.addEventListener('wheel', this._handlers.wheel, { passive: false });
    this.canvas.addEventListener('mouseleave', this._handlers.mouseleave);
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
    for (let i = this.nodes.length - 1; i >= 0; i -= 1) {
      const node = this.nodes[i];
      const radius = node.radius || 4;
      const dx = x - node.x;
      const dy = y - node.y;
      if (dx * dx + dy * dy <= (radius + 5) * (radius + 5)) return node;
    }
    return null;
  }

  _onMouseDown(event) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = event.clientX - rect.left;
    const sy = event.clientY - rect.top;
    const node = this._findNodeAt(sx, sy);

    this.pointerDown = { x: sx, y: sy };
    if (node) {
      this.dragNode = node;
      node.fx = node.x;
      node.fy = node.y;
    } else {
      this.isDragging = true;
      this.dragStart = { x: sx - this.offsetX, y: sy - this.offsetY };
    }
  }

  _onMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = event.clientX - rect.left;
    const sy = event.clientY - rect.top;

    if (this.dragNode) {
      const { x, y } = this._screenToWorld(sx, sy);
      this.dragNode.fx = x;
      this.dragNode.fy = y;
      this.simulationAlpha = 1;
      this.needsRedraw = true;
      return;
    }

    if (this.isDragging) {
      this.offsetX = sx - this.dragStart.x;
      this.offsetY = sy - this.dragStart.y;
      this.targetOffsetX = this.offsetX;
      this.targetOffsetY = this.offsetY;
      this.needsRedraw = true;
      return;
    }

    const node = this._findNodeAt(sx, sy);
    if (node !== this.hoveredNode) {
      this.hoveredNode = node;
      this.canvas.style.cursor = node ? 'pointer' : 'grab';
      this.onNodeHover(node, sx, sy);
      this.needsRedraw = true;
    }
  }

  _onMouseUp(event) {
    if (this.dragNode) {
      const rect = this.canvas.getBoundingClientRect();
      const sx = event.clientX - rect.left;
      const sy = event.clientY - rect.top;
      const dx = sx - this.pointerDown.x;
      const dy = sy - this.pointerDown.y;
      if (dx * dx + dy * dy < 36) {
        this.onNodeClick(this.dragNode);
      }
      this.dragNode.fx = null;
      this.dragNode.fy = null;
      this.dragNode = null;
    }
    this.isDragging = false;
  }

  _onWheel(event) {
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const sx = event.clientX - rect.left;
    const sy = event.clientY - rect.top;
    const normalizedDelta = Math.max(-120, Math.min(120, event.deltaY));
    const zoomFactor = Math.exp(-normalizedDelta * 0.0022);
    const oldScale = this.targetScale;
    const newScale = Math.max(0.15, Math.min(5, oldScale * zoomFactor));

    this.targetOffsetX = sx - (sx - this.targetOffsetX) * (newScale / oldScale);
    this.targetOffsetY = sy - (sy - this.targetOffsetY) * (newScale / oldScale);
    this.targetScale = newScale;
    this.needsRedraw = true;
  }

  _onMouseLeave() {
    this.hoveredNode = null;
    this.isDragging = false;
    this.onNodeHover(null);
  }

  setData(graphData) {
    const nodes = graphData?.nodes ?? [];
    const links = graphData?.links ?? [];
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const spread = nodes.length <= 18
      ? 130
      : Math.min(620, Math.max(260, Math.min(this.width, this.height) * 0.46));

    this.nodes = nodes.map((node, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(nodes.length, 1);
      const ring = nodes.length <= 18 ? 46 + (index % 3) * 34 : Math.random() * spread;
      return {
        ...node,
        x: centerX + Math.cos(angle) * ring + (Math.random() - 0.5) * 24,
        y: centerY + Math.sin(angle) * ring + (Math.random() - 0.5) * 24,
        vx: 0,
        vy: 0,
        radius: 4,
      };
    });
    this.edges = links.map((link) => ({ ...link }));
    this.nodeMap = new Map(this.nodes.map((node) => [node.id, node]));

    const degreeMap = new Map();
    for (const edge of this.edges) {
      degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
      degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
    }

    for (const node of this.nodes) {
      const degree = degreeMap.get(node.id) || 0;
      node.radius = Math.max(
        this.minNodeRadius,
        Math.min(this.maxNodeRadius, this.minNodeRadius + Math.sqrt(degree) * this.nodeRadiusScale)
      );
    }

    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    this.targetOffsetX = 0;
    this.targetOffsetY = 0;
    this.targetScale = 1;
    this.simulationAlpha = 1;
    this.needsRedraw = true;
  }

  _updateViewAnimation() {
    const ease = 0.28;
    const scaleDelta = this.targetScale - this.scale;
    const xDelta = this.targetOffsetX - this.offsetX;
    const yDelta = this.targetOffsetY - this.offsetY;

    if (
      Math.abs(scaleDelta) < 0.0005 &&
      Math.abs(xDelta) < 0.08 &&
      Math.abs(yDelta) < 0.08
    ) {
      if (this.scale !== this.targetScale || this.offsetX !== this.targetOffsetX || this.offsetY !== this.targetOffsetY) {
        this.scale = this.targetScale;
        this.offsetX = this.targetOffsetX;
        this.offsetY = this.targetOffsetY;
        this.needsRedraw = true;
      }
      return false;
    }

    this.scale += scaleDelta * ease;
    this.offsetX += xDelta * ease;
    this.offsetY += yDelta * ease;
    this.needsRedraw = true;
    return true;
  }

  setHighlight(nodeId) {
    this._highlightId = nodeId;
    this.needsRedraw = true;
  }

  _simulate() {
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    for (let i = 0; i < this.nodes.length; i += 1) {
      for (let j = i + 1; j < this.nodes.length; j += 1) {
        const a = this.nodes[i];
        const b = this.nodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist > 320) continue;
        const force = this.repulsion / (dist * dist);
        dx /= dist;
        dy /= dist;
        a.vx += dx * force;
        a.vy += dy * force;
        b.vx -= dx * force;
        b.vy -= dy * force;
      }
    }

    for (const edge of this.edges) {
      const a = this.nodeMap.get(edge.source);
      const b = this.nodeMap.get(edge.target);
      if (!a || !b) continue;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - this.linkDistance) * this.attraction;
      dx /= dist;
      dy /= dist;
      a.vx += dx * force;
      a.vy += dy * force;
      b.vx -= dx * force;
      b.vy -= dy * force;
    }

    for (const node of this.nodes) {
      node.vx += (centerX - node.x) * this.centerGravity;
      node.vy += (centerY - node.y) * this.centerGravity;
    }

    for (const node of this.nodes) {
      if (node.fx != null) {
        node.x = node.fx;
        node.y = node.fy;
        node.vx = 0;
        node.vy = 0;
        continue;
      }
      node.vx *= this.damping;
      node.vy *= this.damping;
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed > this.maxVelocity) {
        node.vx = (node.vx / speed) * this.maxVelocity;
        node.vy = (node.vy / speed) * this.maxVelocity;
      }
      node.x += node.vx;
      node.y += node.vy;
    }

    this.simulationAlpha *= 0.995;
    this.needsRedraw = true;
  }

  _draw() {
    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = this.colors.background;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    const highlightId = this._highlightId || (this.hoveredNode && this.hoveredNode.id);
    const highlightSet = new Set();
    if (highlightId) {
      highlightSet.add(highlightId);
      for (const edge of this.edges) {
        if (edge.source === highlightId) highlightSet.add(edge.target);
        if (edge.target === highlightId) highlightSet.add(edge.source);
      }
    }

    for (const edge of this.edges) {
      const source = this.nodeMap.get(edge.source);
      const target = this.nodeMap.get(edge.target);
      if (!source || !target) continue;
      const isHighlight = highlightSet.has(edge.source) && highlightSet.has(edge.target);
      ctx.strokeStyle = this.colors.edge;
      ctx.globalAlpha = highlightId ? (isHighlight ? 0.68 : 0.11) : 1;
      ctx.lineWidth = isHighlight ? 0.8 / this.scale : 0.5 / this.scale;
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const labels = [];

    for (const node of this.nodes) {
      const isHighlight = highlightSet.has(node.id);
      const isSelf = node.id === highlightId;
      const radius = node.radius || 4;

      if (isSelf) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 9, 0, Math.PI * 2);
        ctx.fillStyle = this.colors.halo;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isSelf
        ? this.colors.nodeHighlight
        : isHighlight
          ? this.colors.nodeHover
          : highlightId
            ? this.colors.nodeMuted
            : this.colors.node;
      ctx.globalAlpha = highlightId && !isHighlight ? 0.18 : 1;
      ctx.fill();
      ctx.globalAlpha = 1;

      const labelPos = this._worldToScreen(node.x, node.y + radius * 1.05);
      labels.push({
        text: node.title,
        x: labelPos.x,
        y: labelPos.y,
        isHighlight,
        isSelf,
      });
    }

    ctx.restore();

    const zoomLift = Math.log2(Math.max(this.scale, 0.2));
    const baseFontSize = (this.nodes.length > 80 ? 10.2 : 11) * this.labelScale;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (const label of labels) {
      const size = Math.max(
        (this.nodes.length > 80 ? 9.5 : 10) * this.labelScale,
        Math.min(
          label.isSelf ? this.maxLabelSize + this.selfLabelBoost : this.maxLabelSize,
          baseFontSize + zoomLift * 1.8 + (label.isSelf ? this.selfLabelBoost : 0)
        )
      );
      const x = Math.round(label.x);
      const y = Math.round(label.y + 8 + Math.max(0, zoomLift) * 2);
      ctx.font = `${label.isSelf ? '800' : '600'} ${size}px "Microsoft YaHei", "PingFang SC", "Noto Sans SC", Inter, system-ui, sans-serif`;
      ctx.fillStyle = label.isSelf ? this.colors.textHighlight : this.colors.text;
      ctx.globalAlpha = highlightId && !label.isHighlight ? 0.18 : this.nodes.length > 80 ? 0.8 : 0.92;
      ctx.fillText(label.text, x, y);
    }
    ctx.globalAlpha = 1;
    this.needsRedraw = false;
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      const viewAnimating = this._updateViewAnimation();
      if (this.simulationAlpha > 0.01) this._simulate();
      if (this.simulationAlpha > 0.01 || this.needsRedraw || viewAnimating) this._draw();
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    this.running = false;
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.dpr = dpr;
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.simulationAlpha = Math.max(this.simulationAlpha, 0.2);
    this.needsRedraw = true;
  }

  destroy() {
    this.stop();
    this.canvas.removeEventListener('mousedown', this._handlers.mousedown);
    this.canvas.removeEventListener('mousemove', this._handlers.mousemove);
    this.canvas.removeEventListener('mouseup', this._handlers.mouseup);
    this.canvas.removeEventListener('wheel', this._handlers.wheel);
    this.canvas.removeEventListener('mouseleave', this._handlers.mouseleave);
  }
}

export default function GraphView({ modal = false, onClose }) {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const [graphData, setGraphData] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, title: '', connections: 0 });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const collectionFilter = searchParams.get('collection');
  const localFilter = searchParams.get('local');

  useEffect(() => {
    fetch('/graph.json')
      .then((response) => response.json())
      .then(setGraphData)
      .catch(console.error);
  }, []);

  const visibleGraphData = useMemo(() => {
    if (!graphData) return null;
    if (localFilter) return filterGraphByLocal(graphData, localFilter);
    if (collectionFilter) return filterGraphByCollection(graphData, collectionFilter);
    return normalizeGraph(graphData);
  }, [collectionFilter, graphData, localFilter]);

  const currentNode = useMemo(() => {
    if (!graphData || !localFilter) return null;
    return graphData.nodes.find((node) => node.id === localFilter || node.slug === localFilter) ?? null;
  }, [graphData, localFilter]);

  const graphModeTitle = useMemo(() => {
    if (localFilter) return '局部关系图';
    if (collectionFilter) return `${COLLECTION_LABELS[collectionFilter] ?? collectionFilter} · 分类全局图`;
    return '全站关系图';
  }, [collectionFilter, localFilter]);

  useEffect(() => {
    if (!visibleGraphData || !canvasRef.current) return undefined;

    const graph = new ForceGraph(canvasRef.current, {
      theme: localFilter ? 'publishLocal' : 'publishGlobal',
      labelScale: localFilter ? 0.82 : 1,
      maxLabelSize: localFilter ? 13.5 : 18,
      selfLabelBoost: localFilter ? 1.2 : 3,
      onNodeClick: (node) => navigate(toNoteHref(node.slug ?? node.id)),
      onNodeHover: (node, x, y) => {
        if (node) {
          const connections = visibleGraphData.links.filter(
            (link) => link.source === node.id || link.target === node.id
          ).length;
          setTooltip({ visible: true, x, y, title: node.title, connections });
        } else {
          setTooltip((current) => ({ ...current, visible: false }));
        }
      },
    });

    if (localFilter) {
      graph.repulsion = 1250;
      graph.attraction = 0.0038;
      graph.linkDistance = 150;
      graph.centerGravity = 0.0065;
      graph.minNodeRadius = 1.55;
      graph.maxNodeRadius = 4.6;
      graph.nodeRadiusScale = 0.42;
      graph.maxVelocity = 4.2;
    } else if (visibleGraphData.nodes.length <= 24) {
      graph.repulsion = 1350;
      graph.attraction = 0.0045;
      graph.linkDistance = 170;
      graph.centerGravity = 0.025;
      graph.minNodeRadius = 3.2;
      graph.maxNodeRadius = 10;
      graph.nodeRadiusScale = 1.35;
      graph.maxVelocity = 5;
    } else {
      graph.repulsion = 2200;
      graph.attraction = 0.0038;
      graph.linkDistance = 155;
      graph.centerGravity = 0.006;
      graph.minNodeRadius = 2.2;
      graph.maxNodeRadius = 6.6;
      graph.nodeRadiusScale = 0.82;
      graph.maxVelocity = 7;
    }

    graph.resize();
    graph.setData(visibleGraphData);

    if (localFilter) {
      graph.setHighlight(localFilter);
      const node = graph.nodeMap.get(localFilter);
      if (node) {
        node.fx = graph.width / 2;
        node.fy = graph.height / 2;
        setTimeout(() => {
          node.fx = null;
          node.fy = null;
        }, 1800);
      }
    }

    graph.start();
    graphRef.current = graph;

    const handleResize = () => graph.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      graph.destroy();
    };
  }, [localFilter, navigate, visibleGraphData]);

  const handleReset = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.offsetX = 0;
      graphRef.current.offsetY = 0;
      graphRef.current.scale = 1;
      graphRef.current.targetOffsetX = 0;
      graphRef.current.targetOffsetY = 0;
      graphRef.current.targetScale = 1;
      graphRef.current.simulationAlpha = 1;
      graphRef.current.needsRedraw = true;
    }
  }, []);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }
    if (window.history.length > 1) navigate(-1);
    else navigate('/atlas');
  }, [navigate, onClose]);

  const graphContent = (
    <div className={`graph-view-container ${localFilter ? 'is-local' : 'is-global'}`}>
      <canvas ref={canvasRef} />
      <div
        className={`graph-tooltip ${tooltip.visible ? 'visible' : ''}`}
        style={{ left: tooltip.x, top: tooltip.y }}
      >
        <div className="tooltip-title">{tooltip.title}</div>
        <div className="tooltip-connections">{tooltip.connections} 个连接</div>
      </div>
      <div className="graph-mode-badge">
        <strong>{graphModeTitle}</strong>
        <span>
          {visibleGraphData?.nodes.length ?? 0} 篇笔记 · {visibleGraphData?.links.length ?? 0} 条关系
        </span>
      </div>
      <div className="graph-controls">
        <button onClick={handleReset}>重置视图</button>
        <button onClick={handleClose}>{modal ? '关闭' : '返回'}</button>
        {localFilter && currentNode?.collection && (
          <button onClick={() => navigate(`/graph?collection=${encodeURIComponent(currentNode.collection)}`)}>
            分类全局图
          </button>
        )}
        {(collectionFilter || localFilter) && (
          <button onClick={() => navigate('/graph')}>全站图谱</button>
        )}
      </div>
    </div>
  );

  if (modal) {
    return (
      <div
        className="graph-modal-backdrop"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) handleClose();
        }}
      >
        <div className="graph-modal-window" role="dialog" aria-modal="true">
          {graphContent}
        </div>
      </div>
    );
  }

  return graphContent;
}

export { ForceGraph };
