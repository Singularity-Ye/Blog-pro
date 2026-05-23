import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
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

const COLLECTION_COLORS = {
  travel: '#c88c51',
  project: '#d69e63',
  'blog-design': '#b68a5c',
};

function toNoteHref(slug) {
  return `/note/${String(slug).split('/').map(encodeURIComponent).join('/')}`;
}

const THEME = {
  node: '#e4b684', nodeHover: '#7a2e2e', nodeHighlight: '#c88c51', nodeMuted: '#f0e4d6',
  edge: '#b2a18d', edgeAlpha: 0.8, edgeHighlight: '#c88c51', edgeHighlightAlpha: 0.9,
  text: '#2c2820', textHighlight: '#1a1610',
};

function getRadius(degree, isLocal) {
  const baseRadius = isLocal ? 1.0 : 1.2;
  const maxRadius = isLocal ? 3.0 : 6.0;
  const radiusScale = isLocal ? 0.25 : 0.45;
  return Math.max(baseRadius, Math.min(maxRadius, baseRadius + Math.sqrt(degree) * radiusScale));
}

export default function GraphView({ modal = false, onClose }) {
  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const [graphData, setGraphData] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, title: '', connections: 0 });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const collectionFilter = searchParams.get('collection');
  const localFilter = searchParams.get('local');

  const [hoverNode, setHoverNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  const highlightNodes = useRef(new Set());
  const highlightLinks = useRef(new Set());

  useEffect(() => {
    fetch('/graph.json')
      .then((response) => response.json())
      .then(setGraphData)
      .catch(console.error);
  }, []);

  const visibleGraphData = useMemo(() => {
    if (!graphData) return null;
    let data;
    if (localFilter) data = filterGraphByLocal(graphData, localFilter);
    else if (collectionFilter) data = filterGraphByCollection(graphData, collectionFilter);
    else data = normalizeGraph(graphData);
    
    const degrees = new Map();
    data.links.forEach(l => {
      const source = typeof l.source === 'object' ? l.source.id : l.source;
      const target = typeof l.target === 'object' ? l.target.id : l.target;
      degrees.set(source, (degrees.get(source) || 0) + 1);
      degrees.set(target, (degrees.get(target) || 0) + 1);
    });
    
    return {
      nodes: data.nodes.map(n => ({ ...n, degree: degrees.get(n.id) || 0 })),
      links: data.links.map(l => ({ ...l }))
    };
  }, [collectionFilter, graphData, localFilter]);

  const currentNode = useMemo(() => {
    if (!visibleGraphData || !localFilter) return null;
    return visibleGraphData.nodes.find((node) => node.id === localFilter || node.slug === localFilter) ?? null;
  }, [visibleGraphData, localFilter]);

  const graphModeTitle = useMemo(() => {
    if (localFilter) return '局部关系图';
    if (collectionFilter) return `${COLLECTION_LABELS[collectionFilter] ?? collectionFilter} · 分类全局图`;
    return '全站关系图';
  }, [collectionFilter, localFilter]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    // setTimeout to ensure it resizes after layout is settled
    const timer = setTimeout(handleResize, 50);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  const handleNodeHover = useCallback((node) => {
    highlightNodes.current.clear();
    highlightLinks.current.clear();
    
    if (node) {
      highlightNodes.current.add(node.id);
      visibleGraphData.links.forEach(link => {
        if (link.source.id === node.id || link.target.id === node.id) {
          highlightLinks.current.add(link);
          highlightNodes.current.add(link.source.id === node.id ? link.target.id : link.source.id);
        }
      });
    }
    
    setHoverNode(node || null);
    if (node) {
      setTooltip({ visible: true, title: node.title, connections: node.degree || 0 });
    } else {
      setTooltip({ visible: false, title: '', connections: 0 });
    }
  }, [visibleGraphData]);

  const handleEngineStop = useCallback(() => {
    if (fgRef.current && localFilter) {
      const node = visibleGraphData?.nodes.find(n => n.id === localFilter);
      if (node) {
        fgRef.current.centerAt(node.x, node.y, 800);
        fgRef.current.zoom(1.8, 800);
      }
    } else if (fgRef.current && !localFilter) {
      fgRef.current.zoomToFit(800, 50);
    }
  }, [localFilter, visibleGraphData]);



  const handleReset = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(800, 50);
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

  const handlePointerMove = useCallback((event) => {
    if (hoverNode && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltip(t => ({ ...t, x: event.clientX - rect.left + 15, y: event.clientY - rect.top + 15 }));
    }
  }, [hoverNode]);

  const paintNode = useCallback((node, ctx, globalScale) => {
    const isHovered = hoverNode?.id === node.id;
    const isHighlight = highlightNodes.current.has(node.id);
    const isSelf = localFilter && node.id === localFilter;
    const radius = getRadius(node.degree, !!localFilter);
    
    let color = COLLECTION_COLORS[node.collection] || THEME.node;
    if (hoverNode) {
      if (isHovered) color = THEME.nodeHover;
      else if (isSelf) color = THEME.nodeHighlight;
      else if (!isHighlight) color = THEME.nodeMuted;
    } else if (isSelf) {
      color = THEME.nodeHighlight;
    }
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.globalAlpha = hoverNode && !isHighlight && !isHovered ? 0.3 : 1;
    ctx.fill();
    ctx.globalAlpha = 1;
    
    const visible = globalScale > 0.8 || isSelf || isHighlight || (visibleGraphData?.nodes.length < 30);
    if (visible && (node.degree > 3 || localFilter)) {
      const fontSize = 12 / globalScale;
      ctx.font = `${isSelf ? '700' : '500'} ${fontSize}px Inter, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isSelf ? THEME.textHighlight : THEME.text;
      ctx.globalAlpha = hoverNode && !isHighlight ? 0.2 : 1;
      ctx.fillText(node.title, node.x, node.y + radius + 4 / globalScale);
      ctx.globalAlpha = 1;
    }
  }, [hoverNode, localFilter, visibleGraphData]);

  const paintLink = useCallback((link, ctx, globalScale) => {
    const isHighlight = highlightLinks.current.has(link);
    
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    
    if (hoverNode && isHighlight) {
      ctx.strokeStyle = THEME.edgeHighlight;
      ctx.globalAlpha = THEME.edgeHighlightAlpha;
      ctx.lineWidth = 1.5 / globalScale;
    } else {
      ctx.strokeStyle = THEME.edge;
      ctx.globalAlpha = hoverNode ? 0.08 : THEME.edgeAlpha;
      ctx.lineWidth = 0.5 / globalScale;
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, [hoverNode]);

  useEffect(() => {
    if (fgRef.current && visibleGraphData) {
      const el = fgRef.current;
      const nodeCount = visibleGraphData.nodes.length;
      const chargeStrength = -Math.max(50, Math.min(180, nodeCount * 0.8 + 30));
      const linkDistance = Math.max(35, Math.min(75, nodeCount * 0.2 + 25));
      
      el.d3Force('charge').strength(chargeStrength);
      
      const linkForce = el.d3Force('link');
      if (linkForce) {
        linkForce
          .distance(linkDistance)
          .strength(link => 1 / Math.min(link.source.degree || 1, link.target.degree || 1));
      }
      el.d3ReheatSimulation();
    }
  }, [visibleGraphData]);

  const paintPointerArea = useCallback((node, color, ctx, globalScale) => {
    const radius = getRadius(node.degree, !!localFilter) + 6 / globalScale;
    const hitRadius = Math.max(8, radius);
    ctx.beginPath();
    ctx.arc(node.x, node.y, hitRadius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }, [localFilter]);

  const graphContent = (
    <div 
      ref={containerRef}
      className={`graph-view-container ${localFilter ? 'is-local' : 'is-global'}`}
      onPointerMove={handlePointerMove}
    >
      {visibleGraphData && (
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={visibleGraphData}
          nodeCanvasObject={paintNode}
          linkCanvasObject={paintLink}
          nodePointerAreaPaint={paintPointerArea}
          onNodeHover={handleNodeHover}
          onNodeClick={(node) => navigate(toNoteHref(node.slug ?? node.id))}
          onEngineStop={handleEngineStop}
          warmupTicks={200}
          d3VelocityDecay={0.4}
          d3AlphaDecay={0.1}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          enableNodeDrag={true}
          minZoom={0.2}
          maxZoom={8}
        />
      )}
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
