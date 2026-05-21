import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ForceGraph } from './GraphView';
import './GraphView.css';

export default function MiniGraph({ currentSlug, graphData }) {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!graphData || !canvasRef.current) return;

    const graph = new ForceGraph(canvasRef.current, {
      onNodeClick: (node) => navigate(`/note/${node.slug}`),
    });

    // 设置较小的物理参数
    graph.repulsion = 400;
    graph.attraction = 0.003;
    graph.centerGravity = 0.02;
    graph.maxVelocity = 4;

    graph.setData(graphData);
    graph.resize();

    // 高亮当前笔记
    if (currentSlug) {
      graph.setHighlight(currentSlug);

      // 将当前节点拖到中心
      const currentNode = graph.nodeMap.get(currentSlug);
      if (currentNode) {
        currentNode.fx = canvasRef.current.width / 2;
        currentNode.fy = canvasRef.current.height / 2;
        graph.simulationAlpha = 1;
        // 释放固定位置
        setTimeout(() => {
          if (currentNode) { currentNode.fx = null; currentNode.fy = null; }
        }, 2000);
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
  }, [graphData, currentSlug, navigate]);

  return (
    <div className="mini-graph-container">
      <span className="mini-graph-label">知识图谱</span>
      <canvas ref={canvasRef} />
    </div>
  );
}
