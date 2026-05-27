import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  filterGraphByCollection,
  normalizeGraph,
} from '../utils/graphFilters';

const COLLECTION_LABELS = {
  travel: '宇宙旅居 · 杭州记事',
  project: '建站构筑 · 经纬指南',
  'blog-design': '星沙原野 · 松果屋构想',
};

const CONSTELLATION_THEMES = {
  travel: {
    core: '#ffffff',
    glow: 'rgba(79, 209, 197, 0.85)',      // Cyan / Teal
    glowHalf: 'rgba(79, 209, 197, 0.35)',
    color: '#4fd1c5',
    text: '#e6fffa',
  },
  project: {
    core: '#ffffff',
    glow: 'rgba(246, 173, 85, 0.85)',      // Amber / Orange
    glowHalf: 'rgba(246, 173, 85, 0.35)',
    color: '#f6ad55',
    text: '#fffaf0',
  },
  'blog-design': {
    core: '#ffffff',
    glow: 'rgba(183, 121, 31, 0.85)',      // Gold / Bronze
    glowHalf: 'rgba(183, 121, 31, 0.35)',
    color: '#b7791f',
    text: '#fffaf0',
  },
  default: {
    core: '#ffffff',
    glow: 'rgba(144, 205, 244, 0.85)',     // Stellar Blue
    glowHalf: 'rgba(144, 205, 244, 0.35)',
    color: '#90cdf4',
    text: '#ebf8ff',
  }
};

function toNoteHref(slug) {
  return `/note/${String(slug).split('/').map(encodeURIComponent).join('/')}`;
}

function getRadius(degree) {
  const baseRadius = 2.5;
  const maxRadius = 8.5;
  const radiusScale = 0.55;
  return Math.max(baseRadius, Math.min(maxRadius, baseRadius + Math.sqrt(degree) * radiusScale));
}

// ── Styled Components ──

const drift = keyframes`
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-100px, 80px, 0); }
`;

const pulse = keyframes`
  0% { opacity: 0.3; }
  50% { opacity: 0.75; }
  100% { opacity: 0.3; }
`;

const Container = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: 
    radial-gradient(circle at 50% 50%, #0c1a16 0%, #040907 80%, #020504 100%);
  color: #fff8eb;
  font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
  user-select: none;

  /* 天文网格背景 */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: 
      linear-gradient(rgba(147, 197, 253, 0.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(147, 197, 253, 0.015) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(circle at center, black, transparent 85%);
    z-index: 1;
  }

  /* 星尘微粒飘动 */
  &::after {
    content: '';
    position: absolute;
    inset: -100px;
    pointer-events: none;
    z-index: 2;
    opacity: 0.35;
    background-image: 
      radial-gradient(circle at 12% 15%, rgba(255, 255, 255, 0.06) 0 1px, transparent 2px),
      radial-gradient(circle at 35% 65%, rgba(79, 209, 197, 0.08) 0 1px, transparent 2px),
      radial-gradient(circle at 72% 38%, rgba(246, 173, 85, 0.06) 0 1px, transparent 2px),
      radial-gradient(circle at 88% 82%, rgba(255, 255, 255, 0.08) 0 1px, transparent 2px);
    background-size: 260px 260px, 320px 320px, 290px 290px;
    animation: ${drift} 45s linear infinite;
  }

  canvas {
    display: block;
    cursor: grab;
    &:active {
      cursor: grabbing;
    }
  }
`;

const NebulaOverlay = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background: 
    radial-gradient(circle at 20% 30%, rgba(79, 209, 197, 0.05), transparent 45%),
    radial-gradient(circle at 75% 70%, rgba(246, 173, 85, 0.04), transparent 50%),
    radial-gradient(circle at 50% 80%, rgba(183, 121, 31, 0.03), transparent 40%);
  animation: ${pulse} 12s ease-in-out infinite alternate;
`;

const Sidebar = styled(motion.div)`
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 10;
  width: min(360px, calc(100% - 48px));
  padding: 1.25rem;
  border-radius: 12px;
  background: rgba(4, 9, 7, 0.65);
  border: 1px solid rgba(215, 187, 135, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  display: grid;
  gap: 1rem;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #ffedd5;
  text-shadow: 0 0 12px rgba(246, 173, 85, 0.2);
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #4fd1c5;
    box-shadow: 0 0 10px #4fd1c5;
  }
`;

const Description = styled.p`
  margin: 0;
  font-size: 0.78rem;
  color: rgba(255, 248, 235, 0.65);
  line-height: 1.6;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 1.2rem;
  padding: 0.65rem 0.8rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 0.72rem;
  color: rgba(255, 248, 235, 0.85);

  strong {
    color: #ffd699;
  }
`;

const NavLinks = styled.div`
  display: grid;
  gap: 0.45rem;
  margin-top: 0.2rem;
`;

const NavItem = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.75rem;
  border-radius: 6px;
  font-size: 0.78rem;
  text-decoration: none;
  color: ${({ $active }) => ($active ? '#ffffff' : 'rgba(255, 248, 235, 0.68)')};
  background: ${({ $active }) => ($active ? 'rgba(79, 209, 197, 0.12)' : 'transparent')};
  border: 1px solid ${({ $active }) => ($active ? 'rgba(79, 209, 197, 0.28)' : 'rgba(255, 255, 255, 0.03)')};
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.1);
    transform: translateX(2px);
  }

  span.label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    &::before {
      content: '✦';
      color: ${({ $color }) => $color || 'rgba(255,255,255,0.3)'};
    }
  }

  span.count {
    font-size: 0.7rem;
    color: rgba(255, 248, 235, 0.4);
  }
`;

const ControlsGroup = styled.div`
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 10;
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button`
  min-height: 38px;
  padding: 0 1rem;
  border-radius: 8px;
  border: 1px solid rgba(215, 187, 135, 0.25);
  background: rgba(6, 12, 10, 0.8);
  color: #ffd8a8;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  backdrop-filter: blur(8px);
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(215, 187, 135, 0.55);
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    box-shadow: 0 8px 30px rgba(79, 209, 197, 0.15);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(1px);
  }
`;

const Tooltip = styled.div`
  position: absolute;
  pointer-events: none;
  z-index: 99;
  min-width: 140px;
  padding: 0.65rem 0.8rem;
  border-radius: 8px;
  background: rgba(3, 7, 5, 0.85);
  border: 1px solid rgba(215, 187, 135, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.65);
  transform: translate(-50%, -100%);
  margin-top: -15px;
  opacity: 0;
  transition: opacity 0.18s ease;

  &.visible {
    opacity: 1;
  }

  .title {
    font-size: 0.82rem;
    font-weight: 800;
    color: #ffedd5;
    margin-bottom: 3px;
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.15);
  }

  .connections {
    font-size: 0.68rem;
    color: rgba(255, 248, 235, 0.55);
    display: flex;
    align-items: center;
    gap: 4px;
    &::before {
      content: '⚓';
      font-size: 0.65rem;
    }
  }
`;

// ── 主组件 ──

export default function GraphConstellationTest() {
  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const [graphData, setGraphData] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, title: '', connections: 0 });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const collectionFilter = searchParams.get('collection');
  
  const pageTitle = useMemo(() => {
    if (collectionFilter && COLLECTION_LABELS[collectionFilter]) {
      return `${COLLECTION_LABELS[collectionFilter]} · 星宿`;
    }
    return '暗空星座关系图谱';
  }, [collectionFilter]);
  
  const [hoverNode, setHoverNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  const highlightNodes = useRef(new Set());
  const highlightLinks = useRef(new Set());

  // 轨道动画的旋转参数
  const [orbitAngle, setOrbitAngle] = useState(0);

  // 阻尼缩放惯性 lerp 引用
  const targetZoomRef = useRef(1.0);
  const targetCenterRef = useRef({ x: 0, y: 0 });
  const currentZoomRef = useRef(1.0);
  const currentCenterRef = useRef({ x: 0, y: 0 });
  const animFrameIdRef = useRef(null);

  // 定期更新轨道旋转状态以驱动重绘
  useEffect(() => {
    let animId;
    const updateOrbit = () => {
      setOrbitAngle(Date.now() / 1000);
      animId = requestAnimationFrame(updateOrbit);
    };
    animId = requestAnimationFrame(updateOrbit);
    return () => cancelAnimationFrame(animId);
  }, []);

  // 加载数据
  useEffect(() => {
    fetch('/graph.json')
      .then((response) => response.json())
      .then(setGraphData)
      .catch(console.error);
  }, []);

  // 统计与过滤
  const visibleGraphData = useMemo(() => {
    if (!graphData) return null;
    let data = collectionFilter ? filterGraphByCollection(graphData, collectionFilter) : normalizeGraph(graphData);
    
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
  }, [collectionFilter, graphData]);

  const collectionsStats = useMemo(() => {
    if (!graphData) return { all: 0, travel: 0, project: 0, 'blog-design': 0 };
    const counts = { all: graphData.nodes?.length || 0, travel: 0, project: 0, 'blog-design': 0 };
    graphData.nodes?.forEach(n => {
      if (counts[n.collection] !== undefined) {
        counts[n.collection]++;
      }
    });
    return counts;
  }, [graphData]);

  // 自适应尺寸
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
    const timer = setTimeout(handleResize, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // 交互逻辑
  const handleNodeHover = useCallback((node) => {
    highlightNodes.current.clear();
    highlightLinks.current.clear();
    
    if (node) {
      highlightNodes.current.add(node.id);
      visibleGraphData.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        if (sourceId === node.id || targetId === node.id) {
          highlightLinks.current.add(link);
          highlightNodes.current.add(sourceId === node.id ? targetId : sourceId);
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
    if (fgRef.current) {
      fgRef.current.zoomToFit(600, 80);
    }
  }, []);

  const handleReset = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(800, 80);
    }
  }, []);

  const handlePointerMove = useCallback((event) => {
    if (hoverNode && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltip(t => ({ ...t, x: event.clientX - rect.left + 15, y: event.clientY - rect.top + 15 }));
    }
  }, [hoverNode]);

  // ── 核心 Canvas 节点绘制方法 (恒星与星轨) ──
  const paintNode = useCallback((node, ctx, globalScale) => {
    const isHovered = hoverNode?.id === node.id;
    const isHighlight = highlightNodes.current.has(node.id);
    const radius = getRadius(node.degree);
    
    // 防御性数值检查：如果 D3 引擎还没计算好初始 x, y 坐标，跳过此帧绘制防止 createRadialGradient 抛出非有限数值异常
    if (
      node.x === undefined || node.y === undefined || 
      isNaN(node.x) || isNaN(node.y) ||
      radius === undefined || isNaN(radius)
    ) {
      return;
    }
    
    const theme = CONSTELLATION_THEMES[node.collection] || CONSTELLATION_THEMES.default;
    
    ctx.save();
    
    // 如果存在 hover 且当前节点不属于高亮，降低不透明度（极佳的视觉聚焦效果）
    if (hoverNode && !isHighlight && !isHovered) {
      ctx.globalAlpha = 0.15;
    } else {
      ctx.globalAlpha = 1.0;
    }

    // 1. 绘制虚线星轨 (同心轨道环) 与其伴星微粒 (仅针对 Hover/Highlight 节点)
    if (isHighlight || isHovered) {
      // 绘制内轨道 (以缓慢的逆时针速度旋转)
      const orbitR1 = radius * 4.5;
      const angle1 = orbitAngle * 0.8 * (isHovered ? 1.5 : 1);
      ctx.save();
      ctx.translate(node.x, node.y);
      ctx.rotate(-angle1);
      ctx.beginPath();
      ctx.arc(0, 0, orbitR1, 0, 2 * Math.PI);
      ctx.setLineDash([2, 5]);
      ctx.strokeStyle = 'rgba(215, 187, 135, 0.18)';
      ctx.lineWidth = 0.6 / globalScale;
      ctx.stroke();
      
      // 伴星微粒 1
      ctx.beginPath();
      ctx.arc(orbitR1, 0, 1.6 / globalScale + 0.4, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 239, 204, 0.7)';
      ctx.fill();
      ctx.restore();

      // 绘制外轨道 (以较快的顺时针速度旋转)
      const orbitR2 = radius * 7.5;
      const angle2 = orbitAngle * 0.5 * (isHovered ? 1.5 : 1);
      ctx.save();
      ctx.translate(node.x, node.y);
      ctx.rotate(angle2);
      ctx.beginPath();
      ctx.arc(0, 0, orbitR2, 0, 2 * Math.PI);
      ctx.setLineDash([1, 6]);
      ctx.strokeStyle = 'rgba(215, 187, 135, 0.12)';
      ctx.lineWidth = 0.5 / globalScale;
      ctx.stroke();

      // 伴星微粒 2
      ctx.beginPath();
      ctx.arc(orbitR2, 0, 1.2 / globalScale + 0.2, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(215, 235, 255, 0.6)';
      ctx.fill();
      ctx.restore();
    }

    // 2. 绘制星云光晕 (Nebula Halo) - 使用径向渐变
    const glowRadius = radius * (isHovered ? 4.5 : (isHighlight ? 3.5 : 2.5));
    const radialGrad = ctx.createRadialGradient(node.x, node.y, radius * 0.2, node.x, node.y, glowRadius);
    radialGrad.addColorStop(0, '#ffffff');
    radialGrad.addColorStop(0.15, theme.glow);
    radialGrad.addColorStop(0.45, theme.glowHalf);
    radialGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI);
    ctx.fillStyle = radialGrad;
    ctx.fill();

    // 3. 绘制超亮恒星核心 (Solid White Core)
    const coreR = Math.max(1.0, radius * 0.35);
    ctx.beginPath();
    ctx.arc(node.x, node.y, coreR, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    // 恒星核心微弱光芒投影
    ctx.shadowColor = theme.color;
    ctx.shadowBlur = 8;
    ctx.fill();
    
    // 清理投影设置以防污染
    ctx.shadowBlur = 0;

    // 4. 绘制金色文字标签 (Golden Star Labels)
    const shouldShowLabel = globalScale > 0.85 || isHovered || isHighlight || (visibleGraphData?.nodes.length < 35);
    if (shouldShowLabel) {
      const fontSize = Math.max(8, Math.min(15, 10.5 / globalScale + 1.5));
      ctx.font = `${isHovered ? '800' : (isHighlight ? '600' : '400')} ${fontSize}px "Outfit", "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      // 文字投影，保证在星云层上的可读性
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      ctx.fillStyle = isHovered ? '#ffffff' : (isHighlight ? theme.text : 'rgba(255, 248, 235, 0.88)');
      ctx.fillText(node.title, node.x, node.y + radius + 5 / globalScale);
    }
    
    ctx.restore();
  }, [hoverNode, orbitAngle, visibleGraphData]);

  // ── 核心 Canvas 连线绘制方法 (星座虚线与能量束) ──
  const paintLink = useCallback((link, ctx, globalScale) => {
    const isHighlight = highlightLinks.current.has(link);
    const source = link.source;
    const target = link.target;
    
    if (typeof source !== 'object' || typeof target !== 'object') return;
    
    // 连线坐标防御检查
    if (
      source.x === undefined || source.y === undefined ||
      target.x === undefined || target.y === undefined ||
      isNaN(source.x) || isNaN(source.y) ||
      isNaN(target.x) || isNaN(target.y)
    ) {
      return;
    }

    ctx.save();

    if (hoverNode) {
      if (isHighlight) {
        // 高亮连线：发光的能量光束 (Energy Beams)
        const theme = CONSTELLATION_THEMES[hoverNode.collection] || CONSTELLATION_THEMES.default;
        
        // 绘制外圈彩色发光层
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = theme.color;
        ctx.lineWidth = 2.4 / globalScale;
        ctx.globalAlpha = 0.45;
        ctx.stroke();

        // 绘制内层白色明亮层
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.9 / globalScale;
        ctx.globalAlpha = 0.85;
        ctx.stroke();
      } else {
        // 非高亮连线：置灰弱化
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 0.4 / globalScale;
        ctx.stroke();
      }
    } else {
      // 默认状态：细碎的半透明银色星座线 (Constellation lines)
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = 'rgba(144, 205, 244, 0.1)';
      ctx.lineWidth = 0.4 / globalScale;
      ctx.stroke();
    }

    ctx.restore();
  }, [hoverNode]);

  // 指针命中碰撞箱
  const paintPointerArea = useCallback((node, color, ctx, globalScale) => {
    const radius = getRadius(node.degree) + 7 / globalScale;
    const hitRadius = Math.max(9, radius);
    ctx.beginPath();
    ctx.arc(node.x, node.y, hitRadius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }, []);

  // ── D3 物理力调节 ──
  useEffect(() => {
    if (fgRef.current && visibleGraphData) {
      const el = fgRef.current;
      const nodeCount = visibleGraphData.nodes.length;
      
      const chargeStrength = -Math.max(60, Math.min(220, nodeCount * 0.9 + 40));
      const linkDistance = Math.max(40, Math.min(80, nodeCount * 0.25 + 30));
      
      el.d3Force('charge').strength(chargeStrength);
      const linkForce = el.d3Force('link');
      if (linkForce) {
        linkForce
          .distance(linkDistance)
          .strength(link => 1.1 / Math.min(link.source.degree || 1, link.target.degree || 1));
      }
      el.d3ReheatSimulation();
    }
  }, [visibleGraphData]);

  // ── 仿 Obsidian/Quartz 流畅动画缩放 (rAF Lerp 阻尼) ──
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

      const lerpFactor = 0.15; // 阻尼参数

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

      targetZoomRef.current = fgRef.current.zoom();
      const initCenter = fgRef.current.centerAt();
      targetCenterRef.current = { x: initCenter.x || 0, y: initCenter.y || 0 };
      currentZoomRef.current = targetZoomRef.current;
      currentCenterRef.current = { ...targetCenterRef.current };

      const handleWheel = (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        if (!fgRef.current) return;

        if (!animFrameIdRef.current) {
          currentZoomRef.current = fgRef.current.zoom();
          const center = fgRef.current.centerAt();
          currentCenterRef.current = { x: center.x || 0, y: center.y || 0 };
          targetZoomRef.current = currentZoomRef.current;
          targetCenterRef.current = { ...currentCenterRef.current };
        }

        const zoomFactor = 1.35;
        const minZoom = 0.15;
        const maxZoom = 10;

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

    const canvas = container.querySelector('canvas');
    if (canvas) {
      bindToCanvas(canvas);
    }

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

  return (
    <Container ref={containerRef} onPointerMove={handlePointerMove}>
      <NebulaOverlay />
      
      {/* 侧边信息与导航面板 */}
      <AnimatePresence>
        <Sidebar
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Title>{pageTitle}</Title>
          <Description>
            这里是松果博客的“沙盒星座大厅”。星点代表知识笔记，连线如同繁星构成的夜空轨迹。通过引力交互与星轨微粒，您能探索全站脉络的经纬关系。
          </Description>

          <StatsRow>
            <div>
              笔记: <strong>{visibleGraphData?.nodes.length ?? 0}</strong> / {collectionsStats.all}
            </div>
            <div>
              链接: <strong>{visibleGraphData?.links.length ?? 0}</strong>
            </div>
          </StatsRow>

          <NavLinks>
            <NavItem to="/graph-test" $active={!collectionFilter}>
              <span className="label">全站星系</span>
              <span className="count">{collectionsStats.all}</span>
            </NavItem>
            <NavItem 
              to="/graph-test?collection=travel" 
              $active={collectionFilter === 'travel'} 
              $color={CONSTELLATION_THEMES.travel.color}
            >
              <span className="label">宇宙旅居 (Travel)</span>
              <span className="count">{collectionsStats.travel}</span>
            </NavItem>
            <NavItem 
              to="/graph-test?collection=project" 
              $active={collectionFilter === 'project'} 
              $color={CONSTELLATION_THEMES.project.color}
            >
              <span className="label">建站构筑 (Project)</span>
              <span className="count">{collectionsStats.project}</span>
            </NavItem>
            <NavItem 
              to="/graph-test?collection=blog-design" 
              $active={collectionFilter === 'blog-design'} 
              $color={CONSTELLATION_THEMES['blog-design'].color}
            >
              <span className="label">松果屋构想 (Design)</span>
              <span className="count">{collectionsStats['blog-design']}</span>
            </NavItem>
          </NavLinks>
        </Sidebar>
      </AnimatePresence>

      {/* 重置视图与退出 */}
      <ControlsGroup>
        <ActionButton onClick={handleReset}>重置星图</ActionButton>
        <ActionButton onClick={() => navigate('/atlas')}>返回图谱大厅</ActionButton>
      </ControlsGroup>

      {/* ForceGraph 核心渲染层 */}
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
          warmupTicks={180}
          d3VelocityDecay={0.42}
          d3AlphaDecay={0.08}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          enableNodeDrag={true}
          minZoom={0.15}
          maxZoom={10}
        />
      )}

      {/* 玻璃感 Tooltip */}
      <Tooltip
        className={tooltip.visible ? 'visible' : ''}
        style={{ left: tooltip.x, top: tooltip.y }}
      >
        <div className="title">{tooltip.title}</div>
        <div className="connections">{tooltip.connections} 星宿联结</div>
      </Tooltip>
    </Container>
  );
}
