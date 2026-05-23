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

export default function MiniGraph() {
  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [graphData, setGraphData] = useState(null);
  const [hoverNode, setHoverNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });
  
  const highlightNodes = useRef(new Set());
  const highlightLinks = useRef(new Set());

  const currentSlug = useMemo(() => {
    const match = location.pathname.match(/^\/note\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  }, [location]);

  useEffect(() => {
    fetch('/graph.json')
      .then((response) => response.json())
      .then(setGraphData)
      .catch(console.error);
  }, []);

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
    
    const visible = globalScale > 1.2 || isSelf || isHighlight;
    if (visible && (node.degree > 3 || isSelf)) {
      const fontSize = 11 / globalScale;
      ctx.font = `${isSelf ? '700' : '500'} ${fontSize}px Inter, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isSelf ? THEME.textHighlight : THEME.text;
      ctx.globalAlpha = hoverNode && !isHighlight ? 0.2 : 1;
      ctx.fillText(node.title, node.x, node.y + radius + 4 / globalScale);
      ctx.globalAlpha = 1;
    }
  }, [hoverNode, currentSlug]);

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
        to={currentSlug ? `/graph?local=${encodeURIComponent(currentSlug)}` : '/graph'} 
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
