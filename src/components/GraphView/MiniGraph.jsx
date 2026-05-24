import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { normalizeGraph, filterGraphByLocal } from '../../utils/graphFilters';
import './GraphView.css';

function toNoteHref(slug) {
  return `/note/${String(slug).split('/').map(encodeURIComponent).join('/')}`;
}

const COLLECTION_COLORS = {
  travel: '#c88c51',
  project: '#d69e63',
  'blog-design': '#b68a5c',
};

const THEME = {
  node: '#e4b684', nodeHover: '#7a2e2e', nodeHighlight: '#c88c51', nodeMuted: '#f0e4d6',
  edge: '#b2a18d', edgeAlpha: 0.8, edgeHighlight: '#c88c51', edgeHighlightAlpha: 0.9,
  text: '#2c2820', textHighlight: '#1a1610',
};

export default function MiniGraph({ graphData: propGraphData, currentSlug: propCurrentSlug, expandHref }) {
  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [internalGraphData, setInternalGraphData] = useState(null);
  const [hoverNode, setHoverNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });
  
  const highlightNodes = useRef(new Set());
  const highlightLinks = useRef(new Set());

  const targetZoomRef = useRef(1.0);
  const targetCenterRef = useRef({ x: 0, y: 0 });
  const currentZoomRef = useRef(1.0);
  const currentCenterRef = useRef({ x: 0, y: 0 });
  const animFrameIdRef = useRef(null);

  const graphData = propGraphData || internalGraphData;

  const currentSlug = useMemo(() => {
    if (propCurrentSlug !== undefined) return propCurrentSlug;
    const match = location.pathname.match(/^\/note\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  }, [location, propCurrentSlug]);

  useEffect(() => {
    if (propGraphData) return;
    fetch('/graph.json')
      .then((response) => response.json())
      .then(setInternalGraphData)
      .catch(console.error);
  }, [propGraphData]);

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
    setTimeout(handleResize, 50);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visibleGraphData = useMemo(() => {
    if (!graphData) return null;
    // Use local filter when on a note page, otherwise show full graph
    const data = currentSlug ? filterGraphByLocal(graphData, currentSlug) : normalizeGraph(graphData);
    
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
  }, [graphData, currentSlug]);

  const handleNodeHover = useCallback((node) => {
    highlightNodes.current.clear();
    highlightLinks.current.clear();
    
    if (node && visibleGraphData) {
      highlightNodes.current.add(node.id);
      visibleGraphData.links.forEach(link => {
        if (link.source.id === node.id || link.target.id === node.id) {
          highlightLinks.current.add(link);
          highlightNodes.current.add(link.source.id === node.id ? link.target.id : link.source.id);
        }
      });
    }
    
    setHoverNode(node || null);
  }, [visibleGraphData]);

  const handleEngineStop = useCallback(() => {
    if (fgRef.current && currentSlug) {
      const node = visibleGraphData?.nodes.find(n => n.id === currentSlug || n.slug === currentSlug);
      if (node) {
        fgRef.current.centerAt(node.x, node.y, 1000);
        fgRef.current.zoom(1.8, 1000);
      }
    }
  }, [currentSlug, visibleGraphData]);


  
  const paintNode = useCallback((node, ctx, globalScale) => {
    const isHovered = hoverNode?.id === node.id;
    const isHighlight = highlightNodes.current.has(node.id);
    const isSelf = currentSlug && (node.id === currentSlug || node.slug === currentSlug);
    
    const radius = Math.max(1.0, Math.min(4.0, 1.0 + Math.sqrt(node.degree) * 0.3));
    
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
    
    const totalNodesCount = visibleGraphData?.nodes?.length || 0;
    const shouldShowLabel = node.degree > 3 || isSelf || isHighlight || totalNodesCount < 20 || isHovered;
    const visible = globalScale > 1.2 || isSelf || isHighlight || totalNodesCount < 20;
    
    if (visible && shouldShowLabel) {
      const fontSize = 11 / globalScale;
      ctx.font = `${isSelf ? '700' : '500'} ${fontSize}px Inter, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isSelf ? THEME.textHighlight : THEME.text;
      ctx.globalAlpha = hoverNode && !isHighlight ? 0.2 : 1;
      ctx.fillText(node.title, node.x, node.y + radius + 4 / globalScale);
      ctx.globalAlpha = 1;
    }
  }, [hoverNode, currentSlug, visibleGraphData]);

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
  
  // ── 仿 Obsidian/Quartz 流畅动画缩放 (rAF Lerp 惯性阻尼版本) ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let canvasListener = null;

    const tick = () => {
      if (!fgRef.current) {
        animFrameIdRef.current = null;
        return;
      }

      const targetK = targetZoomRef.current;
      const targetC = targetCenterRef.current;
      const currK = currentZoomRef.current;
      const currC = currentCenterRef.current;

      const lerpFactor = 0.15; // 阻尼系数，0.15 最为丝滑

      const nextK = currK + (targetK - currK) * lerpFactor;
      const nextCx = currC.x + (targetC.x - currC.x) * lerpFactor;
      const nextCy = currC.y + (targetC.y - currC.y) * lerpFactor;

      currentZoomRef.current = nextK;
      currentCenterRef.current = { x: nextCx, y: nextCy };

      fgRef.current.zoom(nextK);
      fgRef.current.centerAt(nextCx, nextCy);

      const diffK = Math.abs(targetK - nextK);
      const diffC = Math.sqrt((targetC.x - nextCx) ** 2 + (targetC.y - nextCy) ** 2);

      if (diffK < 0.001 && diffC < 0.01) {
        fgRef.current.zoom(targetK);
        fgRef.current.centerAt(targetC.x, targetC.y);
        currentZoomRef.current = targetK;
        currentCenterRef.current = { ...targetC };
        animFrameIdRef.current = null;
      } else {
        animFrameIdRef.current = requestAnimationFrame(tick);
      }
    };

    const startAnimation = () => {
      if (!animFrameIdRef.current) {
        animFrameIdRef.current = requestAnimationFrame(tick);
      }
    };

    const bindToCanvas = (canvasElement) => {
      if (!canvasElement || canvasListener) return;

      // 初始化当前和目标位置
      targetZoomRef.current = fgRef.current.zoom();
      const initCenter = fgRef.current.centerAt();
      targetCenterRef.current = { x: initCenter.x || 0, y: initCenter.y || 0 };
      currentZoomRef.current = targetZoomRef.current;
      currentCenterRef.current = { ...targetCenterRef.current };

      const handleWheel = (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        if (!fgRef.current) return;

        // 手动拖拽平移后同步
        if (!animFrameIdRef.current) {
          currentZoomRef.current = fgRef.current.zoom();
          const center = fgRef.current.centerAt();
          currentCenterRef.current = { x: center.x || 0, y: center.y || 0 };
          targetZoomRef.current = currentZoomRef.current;
          targetCenterRef.current = { ...currentCenterRef.current };
        }

        const zoomFactor = 1.3;
        const minZoom = 0.5; // 对应 MiniGraph 的限制
        const maxZoom = 8;

        let K_new = e.deltaY < 0 ? targetZoomRef.current * zoomFactor : targetZoomRef.current / zoomFactor;
        K_new = Math.max(minZoom, Math.min(maxZoom, K_new));

        if (K_new === targetZoomRef.current) return;

        const rect = canvasElement.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const width = rect.width;
        const height = rect.height;

        const K_old = targetZoomRef.current;
        const centerX = targetCenterRef.current.x;
        const centerY = targetCenterRef.current.y;

        const centerX_new = centerX + (mouseX - width / 2) * (1 / K_old - 1 / K_new);
        const centerY_new = centerY + (mouseY - height / 2) * (1 / K_old - 1 / K_new);

        targetZoomRef.current = K_new;
        targetCenterRef.current = { x: centerX_new, y: centerY_new };

        startAnimation();
      };

      canvasElement.addEventListener('wheel', handleWheel, { passive: false });
      canvasListener = () => {
        canvasElement.removeEventListener('wheel', handleWheel);
      };
    };

    // 1. 直连 canvas
    const canvas = container.querySelector('canvas');
    if (canvas) {
      bindToCanvas(canvas);
    }

    // 2. 观察者模式兜底动态挂载的 canvas
    const observer = new MutationObserver(() => {
      const c = container.querySelector('canvas');
      if (c) {
        bindToCanvas(c);
      }
    });

    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (canvasListener) canvasListener();
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [graphData]);

  const paintPointerArea = useCallback((node, color, ctx, globalScale) => {
    const radius = Math.max(1, Math.min(4, 1 + Math.sqrt(node.degree) * 0.5)) + 6 / globalScale;
    const hitRadius = Math.max(8, radius);
    ctx.beginPath();
    ctx.arc(node.x, node.y, hitRadius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }, []);

  return (
    <div className={`mini-graph-container ${currentSlug ? 'publishLocal' : ''}`} ref={containerRef}>
      <span className="mini-graph-label">关系图谱</span>
      <Link 
        to={expandHref || (currentSlug ? `/graph?local=${encodeURIComponent(currentSlug)}` : '/graph')} 
        state={{ backgroundLocation: location }}
        className="mini-graph-expand"
        title="在全屏查看图谱"
      >
        ↗
      </Link>
      {visibleGraphData ? (
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
          minZoom={0.5}
          maxZoom={8}
        />
      ) : (
        <div className="mini-graph-empty">加载中...</div>
      )}
    </div>
  );
}
