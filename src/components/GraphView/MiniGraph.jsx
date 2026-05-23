import React, { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ForceGraph } from './GraphView';
import './GraphView.css';

function toNoteHref(slug) {
  return `/note/${String(slug).split('/').map(encodeURIComponent).join('/')}`;
}

export default function MiniGraph({
  currentSlug,
  graphData,
  label = '关系图谱',
  theme = 'publishGlobal',
  expandHref,
}) {
  const canvasRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!graphData?.nodes?.length || !canvasRef.current) return undefined;

    const graph = new ForceGraph(canvasRef.current, {
      theme,
      labelScale: theme === 'publishLocal' ? 0.76 : 0.88,
      maxLabelSize: theme === 'publishLocal' ? 11.5 : 14,
      selfLabelBoost: theme === 'publishLocal' ? 1 : 2,
      onNodeClick: (node) => navigate(toNoteHref(node.slug ?? node.id)),
    });

    if (theme === 'publishLocal') {
      graph.repulsion = 1080;
      graph.attraction = 0.0038;
      graph.linkDistance = 146;
      graph.centerGravity = 0.006;
      graph.minNodeRadius = 1.35;
      graph.maxNodeRadius = 4.1;
      graph.nodeRadiusScale = 0.38;
    } else {
      graph.repulsion = graphData.nodes.length <= 16 ? 1250 : 1800;
      graph.attraction = graphData.nodes.length <= 16 ? 0.0045 : 0.0036;
      graph.linkDistance = graphData.nodes.length <= 16 ? 150 : 130;
      graph.centerGravity = graphData.nodes.length <= 16 ? 0.026 : 0.007;
      graph.minNodeRadius = graphData.nodes.length <= 16 ? 3 : 1.9;
      graph.maxNodeRadius = graphData.nodes.length <= 16 ? 9 : 5.5;
      graph.nodeRadiusScale = graphData.nodes.length <= 16 ? 1.2 : 0.7;
    }
    graph.maxVelocity = 4;

    graph.resize();
    graph.setData(graphData);

    if (currentSlug) {
      graph.setHighlight(currentSlug);
      const currentNode = graph.nodeMap.get(currentSlug);
      if (currentNode) {
        currentNode.fx = graph.width / 2;
        currentNode.fy = graph.height / 2;
        graph.simulationAlpha = 1;
        setTimeout(() => {
          if (currentNode) {
            currentNode.fx = null;
            currentNode.fy = null;
          }
        }, 1600);
      }
    }

    graph.start();

    const handleResize = () => graph.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      graph.destroy();
    };
  }, [graphData, currentSlug, navigate, theme]);

  return (
    <div className={`mini-graph-container ${theme}`}>
      <span className="mini-graph-label">{label}</span>
      {expandHref && (
        <Link
          className="mini-graph-expand"
          to={expandHref}
          state={{ backgroundLocation: location }}
          aria-label="展开图谱"
        >
          ↗
        </Link>
      )}
      {graphData?.nodes?.length ? (
        <canvas ref={canvasRef} />
      ) : (
        <div className="mini-graph-empty">暂无可展示的节点</div>
      )}
    </div>
  );
}
