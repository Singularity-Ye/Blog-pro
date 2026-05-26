import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BLOG_NEW_ASSETS } from '../constants/blogAssets';

// -------------------------------------------------------------------------
// 动效定义 (Animations)
// -------------------------------------------------------------------------


const paperSlideIn = keyframes`
  from { transform: translateY(12px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const leafShake = keyframes`
  0%, 100% { transform: rotate(0deg); }
  20%, 60% { transform: rotate(-8deg); }
  40%, 80% { transform: rotate(6deg); }
`;

const scrollSway = keyframes`
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(3deg) translateY(-2px); }
`;

const mapLinePulse = keyframes`
  to {
    stroke-dashoffset: -20;
  }
`;

const MinimapSVGLine = styled.line`
  stroke: ${props => props.$color};
  stroke-width: 1.5px;
  stroke-linecap: round;
  stroke-dasharray: 4, 6;
  animation: ${mapLinePulse} 1.2s linear infinite;
`;

const TeleportFlash = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: radial-gradient(circle, rgba(231, 199, 126, 0.15) 0%, rgba(8, 6, 16, 0.95) 100%);
  mix-blend-mode: screen;
  backdrop-filter: blur(12px) brightness(1.5);
  -webkit-backdrop-filter: blur(12px) brightness(1.5);
  z-index: 99999;
  pointer-events: none;
`;
// -------------------------------------------------------------------------
// 长廊场景配置定义 (Scene Corridor Config)
// -------------------------------------------------------------------------
const BLOG_SCENES = {
  overview: {
    id: 'overview',
    title: '松果屋总览',
    subtitle: '夜色落在树冠之间，灯火从木门与林桥深处慢慢亮起。\n这里是叶间书林的入口，也是所有手札、卷轴与旧档案的起点。',
    background: BLOG_NEW_ASSETS.bgMain,
    themeColor: '#fbbf24',
    portals: [
      {
        id: 'overview-to-indoor',
        target: 'indoor',
        label: '叩门入室',
        desc: '推开松果屋的木门，查看短札、随笔与屋内收藏。',
        left: '28%',
        top: '48%',
        color: '#fbbf24',
        icon: '🚪',
        styleType: 'door'
      },
      {
        id: 'overview-to-outdoor',
        target: 'outdoor',
        label: '步入林间',
        desc: '沿着木桥进入叶间书林，翻阅长文、技术笔记与专题卷轴。',
        left: '72%',
        top: '52%',
        color: '#10b981',
        icon: '🌿',
        styleType: 'bridge'
      }
    ],
    items: [],
  },
  indoor: {
    id: 'indoor',
    title: '碎叶墙 · 松果屋内',
    subtitle: '暖灯照着木墙，零散的想法像叶片一样被钉在这里。\n有些倾刻灵感，有些会慢慢长成一篇完整的手札。',
    background: BLOG_NEW_ASSETS.bgWall,
    themeColor: '#f59e0b',
    portals: [
      {
        id: 'indoor-to-overview',
        target: 'overview',
        label: '推门外出',
        desc: '推门离开松果屋，回到树屋门前的大厅。',
        left: '36%',
        top: '86%',
        color: '#fbbf24',
        icon: '🚪',
        styleType: 'door'
      },
      {
        id: 'indoor-to-junction',
        target: 'junction',
        label: '步入回廊',
        desc: '穿过书柜拱门，通往更深处的书脊回廊。',
        left: '92%',
        top: '65%',
        color: '#818cf8',
        icon: '🚪',
        styleType: 'door'
      }
    ],
    items: [
      { 
        id: 'gold-1', 
        type: 'gold', 
        left: '18%', 
        top: '26%', 
        width: '65px', 
        label: '建站秘辛', 
        collection: 'blog-design', 
        transform: 'rotate(-12deg)',
        filter: (notes) => notes.filter(n => n.collection === 'blog-design')[0] 
      },
      { 
        id: 'gold-2', 
        type: 'gold', 
        left: '52%', 
        top: '18%', 
        width: '65px', 
        label: '屋主札记', 
        collection: 'blog-design', 
        transform: 'rotate(8deg)',
        filter: (notes) => notes.filter(n => n.collection === 'blog-design')[1] 
      },
      { 
        id: 'green-1', 
        type: 'green', 
        left: '28%', 
        top: '48%', 
        width: '70px', 
        label: '旅途随笔', 
        collection: 'travel', 
        transform: 'rotate(-5deg)',
        filter: (notes) => notes.filter(n => n.collection === 'travel' && n.tags?.includes('随笔'))[0] || notes.filter(n => n.collection === 'travel')[0] 
      },
      { 
        id: 'green-2', 
        type: 'green', 
        left: '46%', 
        top: '42%', 
        width: '70px', 
        label: '心境碎片', 
        collection: 'travel', 
        transform: 'rotate(15deg)',
        filter: (notes) => notes.filter(n => n.collection === 'travel' && n.tags?.includes('随笔'))[1] || notes.filter(n => n.collection === 'travel')[1] 
      },
      { 
        id: 'green-3', 
        type: 'green', 
        left: '68%', 
        top: '38%', 
        width: '70px', 
        label: '修真见闻', 
        collection: 'travel', 
        transform: 'rotate(-20deg)',
        filter: (notes) => notes.filter(n => n.collection === 'travel')[2] 
      },
      { 
        id: 'green-4', 
        type: 'green', 
        left: '78%', 
        top: '56%', 
        width: '70px', 
        label: '松果碎语', 
        collection: 'travel', 
        transform: 'rotate(10deg)',
        filter: (notes) => notes.filter(n => n.collection === 'travel')[3] 
      },
    ],
  },
  outdoor: {
    id: 'outdoor',
    title: '叶间书林',
    subtitle: '木桥通往更深的森林，卷轴悬在枝叶与灯火之间。\n这里收藏着篇幅更长的记录：技术、建站、图谱与慢慢整理成形的思考。',
    background: BLOG_NEW_ASSETS.bgFores,
    themeColor: '#10b981',
    portals: [
      {
        id: 'outdoor-to-overview',
        target: 'overview',
        label: '回到大厅',
        desc: '沿林间小路走回树屋门前的传送大门。',
        left: '33%',
        top: '88%',
        color: '#10b981',
        icon: '🏰',
        styleType: 'bridge'
      },
      {
        id: 'outdoor-to-travel',
        target: 'travel',
        label: '前往 · 旅图案台',
        desc: '沿着林桥栈道左上行，通往临窗的旅行主题书案。',
        left: '22%',
        top: '65%',
        color: '#fb923c',
        icon: '🧭',
        styleType: 'compass'
      }
    ],
    items: [
      { 
        id: 'bamboo-1', 
        type: 'bamboo', 
        left: '25%', 
        top: '28%', 
        width: '110px', 
        label: '建站流程', 
        transform: 'rotate(-4deg)',
        collections: ['project'] 
      },
      { 
        id: 'bamboo-2', 
        type: 'bamboo', 
        left: '48%', 
        top: '46%', 
        width: '110px', 
        label: 'Linux 法门', 
        transform: 'rotate(3deg)',
        collections: ['linux-notes'] 
      },
      { 
        id: 'jade-1', 
        type: 'jade', 
        left: '66%', 
        top: '20%', 
        width: '100px', 
        label: '织墨灵卷', 
        transform: 'rotate(-6deg)',
        collections: ['weaveink'] 
      },
      { 
        id: 'jade-2', 
        type: 'jade', 
        left: '78%', 
        top: '52%', 
        width: '100px', 
        label: '编译原理', 
        transform: 'rotate(5deg)',
        collections: ['compiler-theory'] 
      },
    ],
  },
  travel: {
    id: 'travel',
    title: '旅图案台',
    subtitle: '地图册摊在灯下，路线、地名与零散坐标被慢慢连成一条路。\n这里收着城市漫游、旅行攻略，以及那些尚未出发的计划。',
    background: BLOG_NEW_ASSETS.bgTravel,
    themeColor: '#fb923c',
    portals: [
      {
        id: 'travel-to-outdoor',
        target: 'outdoor',
        label: '返回林间',
        desc: '离开旅行书案，回到叶间书林之中。',
        left: '72%',
        top: '68%',
        color: '#10b981',
        icon: '🌿',
        styleType: 'bridge'
      }
    ],
    items: [
      { 
        id: 'travel-map', 
        type: 'map-book', 
        left: '9.57%', 
        top: '45.70%', 
        width: '19.14%', 
        height: '26.57%',
        label: '杭州旅游地图册', 
        imgSrc: BLOG_NEW_ASSETS.travelMap,
        collections: ['travel'] 
      },
      { 
        id: 'travel-scroll', 
        type: 'scroll', 
        left: '66.99%', 
        top: '42.51%', 
        width: '10.77%', 
        height: '21.25%',
        label: '一日游路线指南', 
        imgSrc: BLOG_NEW_ASSETS.travelScroll,
        collections: ['travel'],
        filter: (notes) => notes.filter(n => n.title.includes('路线') || n.title.includes('行程') || n.title.includes('作战'))
      }
    ],
  },
  junction: {
    id: 'junction',
    title: '书脊回廊',
    subtitle: '灯火微明，墙上书脊如石碑般延伸。\n这里是松果屋深处的转角，左通旧手札的柜阁，右达施展代码法阵的工坊。',
    background: BLOG_NEW_ASSETS.bgHallway,
    themeColor: '#818cf8',
    portals: [
      {
        id: 'junction-to-indoor',
        target: 'indoor',
        label: '返回大厅',
        desc: '离开书脊回廊，回到松果屋大厅。',
        left: '42%',
        top: '88%',
        color: '#f59e0b',
        icon: '🚪',
        styleType: 'door'
      },
      {
        id: 'junction-to-archive',
        target: 'archive',
        label: '开启 · 旧札柜',
        desc: '推开左侧雕花木门，进入旧札柜阁分类检索抽屉。',
        left: '22%',
        top: '55%',
        color: '#a78bfa',
        icon: '🔑',
        styleType: 'key'
      },
      {
        id: 'junction-to-workshop',
        target: 'workshop',
        label: '进入 · 建站工坊',
        desc: '拉开右侧带有铜齿轮的厚重木门，进入建站工坊。',
        left: '78%',
        top: '65%',
        color: '#38bdf8',
        icon: '⚙️',
        styleType: 'gear'
      }
    ],
    items: [],
  },
  archive: {
    id: 'archive',
    title: '旧札柜',
    subtitle: '旧抽屉里收着按时间、标签和主题整理过的手札。\n当你不想漫游，只想快速找到一篇文章，这里就是最可靠的索引柜。',
    background: BLOG_NEW_ASSETS.bgArchive,
    themeColor: '#c084fc',
    portals: [
      {
        id: 'archive-to-junction',
        target: 'junction',
        label: '返回回廊',
        desc: '推门离开旧札柜，回到书脊回廊的岔路口。',
        left: '42%',
        top: '90%',
        color: '#818cf8',
        icon: '🚪',
        styleType: 'door'
      }
    ],
    items: [
      { 
        id: 'archive-drawer', 
        type: 'drawer', 
        left: '10.77%', 
        top: '43.57%', 
        width: '16.75%', 
        height: '26.57%',
        label: '博文索引抽屉 (搜索/标签)', 
        imgSrc: BLOG_NEW_ASSETS.archiveDrawer,
        action: 'search'
      },
      { 
        id: 'archive-note-box', 
        type: 'note-box', 
        left: '64.59%', 
        top: '53.13%', 
        width: '11.96%', 
        height: '21.25%',
        label: '便签盒 (最近更新)', 
        imgSrc: BLOG_NEW_ASSETS.archiveNoteBox,
        action: 'recent'
      }
    ],
  },
  workshop: {
    id: 'workshop',
    title: '建站工坊',
    subtitle: '蓝图、卷轴和发光仪器堆在工作台上。\n这里记录着松果屋如何一点点搭起来，也收着那些被修好的 Bug 和没修好的奇怪想法。',
    background: BLOG_NEW_ASSETS.bgWorkshop,
    themeColor: '#38bdf8',
    portals: [
      {
        id: 'workshop-to-junction',
        target: 'junction',
        label: '返回回廊',
        desc: '推门离开建站工坊，回到书脊回廊的岔路口。',
        left: '8%',
        top: '60%',
        color: '#818cf8',
        icon: '🚪',
        styleType: 'door'
      }
    ],
    items: [
      { 
        id: 'workshop-blueprint', 
        type: 'blueprint', 
        left: '26.91%', 
        top: '51.01%', 
        width: '25.12%', 
        height: '27.63%',
        label: '建站工坊核心蓝图', 
        imgSrc: BLOG_NEW_ASSETS.workshopBlueprint,
        collections: ['project', 'blog-design']
      },
      { 
        id: 'workshop-scroll', 
        type: 'scroll', 
        left: '66.99%', 
        top: '31.88%', 
        width: '10.77%', 
        height: '23.38%',
        label: '部署记录与技术长卷', 
        imgSrc: BLOG_NEW_ASSETS.workshopScroll,
        collections: ['linux-notes', 'compiler-theory']
      }
    ],
  }
};
const PageWrapper = styled.div`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: #000;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #f5efe3;
`;

const SceneContainer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const SceneCanvas = styled(motion.div)`
  position: absolute;
  top: -9999px;
  bottom: -9999px;
  left: -9999px;
  right: -9999px;
  margin: auto;
  flex-shrink: 0;
  width: max(100vw, calc(100vh * 1.777));
  height: max(100vh, calc(100vw / 1.777));
  aspect-ratio: 1672 / 941;
  overflow: hidden;
  pointer-events: none;
`;

const CanvasBackground = styled.canvas`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  width: 100%;
  height: 100%;
`;

const BgLayer = styled.div`
  position: absolute;
  inset: 0;
  background-size: cover; /* 宁可裁剪，也要完全铺满屏幕 */
  background-position: center center;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 0;
  width: 100%;
  height: 100%;
  background-image: ${props => props.$bg || 'none'};
`;

// ── 统一的场景顶部叙事标牌样式 ────────────────────────────────────────
const SceneHeaderContainer = styled(motion.div)`
  position: absolute;
  top: 1.8rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  background: rgba(12, 10, 24, 0.72);
  border: 1px solid rgba(231, 199, 126, 0.18);
  border-radius: 16px;
  padding: 10px 20px;
  width: min(540px, 90vw);
  text-align: center;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.45);
  display: flex;
  flex-direction: column;
  gap: 4px;
  pointer-events: none;
`;

const SceneHeaderTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 800;
  color: #ffedd5;
  margin: 0;
  letter-spacing: 0.05em;
`;

const SceneHeaderSubtitle = styled.p`
  font-size: 0.72rem;
  color: rgba(254, 243, 199, 0.68);
  line-height: 1.45;
  margin: 0;
  white-space: pre-line;
`;

// ── 魔法传送门样式 ────────────────────────────────────────────────────
const PortalContainer = styled(motion.div)`
  position: absolute;
  left: ${props => props.$left};
  top: ${props => props.$top};
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
  cursor: pointer;
`;

const pulseGlow = keyframes`
  0%, 100% {
    transform: scale(0.95);
    box-shadow: 0 0 4px 1px ${props => props.$color}aa;
    opacity: 0.75;
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 14px 4px ${props => props.$color}ff;
    opacity: 1;
  }
`;

const pulseRing = keyframes`
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
`;

const PortalGlowRing = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid ${props => props.$color};
  animation: ${pulseRing} 2.5s infinite ease-out;
  pointer-events: none;
`;

const PortalAnchor = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(12, 10, 24, 0.85);
  border: 2px solid ${props => props.$color};
  box-shadow: 0 0 10px ${props => props.$color}cc;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  color: #fff;
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  animation: ${pulseGlow} 2.5s infinite ease-in-out;

  &::before {
    content: '';
    position: absolute;
    inset: -5px;
    border: 1px dashed ${props => props.$color}88;
    border-radius: 50%;
    animation: portalSpin 12s linear infinite;
  }

  @keyframes portalSpin {
    to { transform: rotate(360deg); }
  }

  ${PortalContainer}:hover & {
    transform: scale(1.2);
    box-shadow: 
      0 0 18px 6px ${props => props.$color}ff,
      0 0 30px 10px ${props => props.$color}66;
    border-color: #ffffff;
    background: ${props => props.$color};
  }
`;

const PortalIconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);

  ${PortalContainer}:hover & {
    transform: ${props => {
      if (props.$styleType === 'compass') return 'rotate(180deg)';
      if (props.$styleType === 'gear') return 'rotate(360deg)';
      if (props.$styleType === 'key') return 'scale(1.2) translateY(-2px)';
      return 'scale(1.2)';
    }};
  }
`;

const PortalTooltip = styled(motion.div)`
  position: absolute;
  bottom: 44px;
  width: 240px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(15, 11, 28, 0.94);
  border: 1px solid ${props => props.$color}88;
  box-shadow: 
    0 10px 25px rgba(0, 0, 0, 0.6),
    0 0 15px ${props => props.$color}22;
  color: #f7eed7;
  pointer-events: none;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 5px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  
  &::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px 6px 0;
    border-style: solid;
    border-color: rgba(15, 11, 28, 0.94) transparent transparent;
    display: block;
    width: 0;
  }
`;

const PortalTooltipTitle = styled.h4`
  font-size: 0.85rem;
  font-weight: 800;
  color: ${props => props.$color};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.05em;
`;

const PortalTooltipDesc = styled.p`
  font-size: 0.72rem;
  color: rgba(247, 238, 215, 0.72);
  line-height: 1.45;
  margin: 0;
`;

// ── 摘叶随笔纸条 (Leaf Paper Note) ──────────────────────────────────
const LeafPaperNote = styled(motion.div)`
  position: fixed;
  left: 50%;
  top: 48%;
  transform: translate(-50%, -50%);
  width: min(340px, calc(100% - 32px));
  padding: 1.4rem;
  border-radius: 14px;
  background: 
    linear-gradient(135deg, rgba(255, 250, 235, 0.96), rgba(245, 230, 200, 0.94)),
    #fcf8ec;
  border: 1px dashed #d97706;
  box-shadow: 
    0 20px 45px rgba(0, 0, 0, 0.45),
    0 0 15px rgba(217, 119, 6, 0.15);
  color: #4a2d1b;
  z-index: 20000;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  backdrop-filter: blur(4px);
  
  &::before {
    content: '';
    position: absolute;
    inset: 2px;
    border: 1px solid rgba(217, 119, 6, 0.2);
    border-radius: 12px;
    pointer-events: none;
  }
`;

const LeafPaperTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 800;
  color: #3d2212;
  margin: 0;
  line-height: 1.35;
`;

const LeafPaperMeta = styled.div`
  font-size: 0.7rem;
  color: rgba(91, 52, 22, 0.65);
  font-weight: 700;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const LeafPaperSnippet = styled.p`
  font-size: 0.78rem;
  color: rgba(61, 34, 18, 0.85);
  line-height: 1.5;
  margin: 0;
  font-style: italic;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const LeafPaperActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 4px;
`;

const LeafPaperBtn = styled(motion.button)`
  flex: 1;
  min-height: 34px;
  border: 1px solid ${props => props.$primary ? 'transparent' : 'rgba(91, 52, 22, 0.28)'};
  border-radius: 8px;
  background: ${props => props.$primary ? '#78350f' : 'rgba(255, 255, 255, 0.4)'};
  color: ${props => props.$primary ? '#fef3c7' : '#5b3416'};
  font-weight: 800;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  transition: background 0.2s ease;
  
  &:hover {
    background: ${props => props.$primary ? '#92400e' : 'rgba(255, 255, 255, 0.7)'};
  }
`;


// ── 场景长廊分岔路标 ──────────────────────────────────────────
const MAP_EDGES = [
  { from: 'overview', to: 'indoor', label: '叩门', x1: 50, y1: 15, x2: 30, y2: 40, color: '#fbbf24' },
  { from: 'overview', to: 'outdoor', label: '出林', x1: 50, y1: 15, x2: 70, y2: 40, color: '#10b981' },
  { from: 'outdoor', to: 'travel', label: '栈道', x1: 70, y1: 40, x2: 70, y2: 75, color: '#fb923c' },
  { from: 'indoor', to: 'junction', label: '拱门', x1: 30, y1: 40, x2: 30, y2: 65, color: '#818cf8' },
  { from: 'junction', to: 'archive', label: '旧柜', x1: 30, y1: 65, x2: 15, y2: 85, color: '#c084fc' },
  { from: 'junction', to: 'workshop', label: '工坊', x1: 30, y1: 65, x2: 45, y2: 85, color: '#38bdf8' }
];

// ── 二级近景场景 ──────────────────────────────────────────────
const CloseUpContainer = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 3;
  width: 100%;
  height: 100%;
  pointer-events: ${props => props.$isTransitioning ? 'none' : 'auto'};
`;



const getLightingFilter = (sceneId, hover = false) => {
  const baseFilters = {
    indoor: 'sepia(0.18) saturate(1.15) brightness(0.85) contrast(1.02)',
    outdoor: 'hue-rotate(6deg) saturate(1.1) brightness(0.9) contrast(1.02)',
    travel: 'sepia(0.1) saturate(1.1) brightness(0.85) contrast(1.05)',
    archive: 'sepia(0.15) saturate(0.95) brightness(0.8) contrast(1.08)',
    workshop: 'saturate(1.25) brightness(0.88) contrast(1.05)'
  };
  const base = baseFilters[sceneId] || 'none';
  if (hover) {
    return `${base} brightness(1.22) contrast(1.12)`;
  }
  return base;
};

const LeafItem = styled(motion.div)`
  position: absolute;
  left: ${props => props.$left};
  top: ${props => props.$top};
  width: ${props => props.$width};
  transform: ${props => props.$transform || 'none'};
  cursor: pointer;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: ${props => getLightingFilter(props.$sceneId, false)} drop-shadow(0 3px 6px rgba(0,0,0,0.4));
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  img {
    width: 100%;
    height: auto;
  }

  &.shake img {
    animation: ${leafShake} 0.6s ease-in-out;
  }

  &:hover {
    transform: ${props => props.$transform ? `${props.$transform} translateY(-8px) scale(1.05)` : 'translateY(-8px) scale(1.05)'};
    filter: ${props => getLightingFilter(props.$sceneId, true)} drop-shadow(0 15px 25px rgba(0,0,0,0.65));
  }
`;

const LeafLabel = styled.div`
  margin-top: 0.35rem;
  background: rgba(12, 10, 24, 0.82);
  border: 1px solid rgba(231, 199, 126, 0.25);
  border-radius: 6px;
  color: #ffedd5;
  font-size: 0.65rem;
  padding: 3px 8px;
  text-align: center;
  letter-spacing: 0.05em;
  white-space: nowrap;
  pointer-events: none;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(0,0,0,0.5);
  opacity: 0;
  transform: translateY(6px);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  ${LeafItem}:hover & {
    opacity: 1;
    transform: translateY(0);
    border-color: #d4af37;
    color: #e7c77e;
    box-shadow: 0 0 10px rgba(212,175,55,0.3);
  }
`;

const ScrollItem = styled(motion.div)`
  position: absolute;
  left: ${props => props.$left};
  top: ${props => props.$top};
  width: ${props => props.$width};
  height: ${props => props.$height || 'auto'};
  cursor: pointer;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: ${props => getLightingFilter(props.$sceneId, false)} drop-shadow(0 4px 8px rgba(0,0,0,0.5));
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  img {
    width: 100%;
    height: auto;
  }

  &:hover {
    filter: ${props => getLightingFilter(props.$sceneId, true)} drop-shadow(0 0 12px #e7c77e) brightness(1.2);
    
    img {
      animation: ${props => props.$imgSrc ? 'none' : `${scrollSway} 2.5s infinite ease-in-out`};
    }
  }
`;

const ScrollLabel = styled.div`
  margin-top: 0.35rem;
  background: rgba(4, 12, 10, 0.85);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 6px;
  color: #e2fbf2;
  font-size: 0.68rem;
  padding: 3px 10px;
  text-align: center;
  letter-spacing: 0.05em;
  white-space: nowrap;
  pointer-events: none;
  font-weight: 800;
  box-shadow: 0 4px 10px rgba(0,0,0,0.5);
  opacity: 0;
  transform: translateY(6px);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  ${ScrollItem}:hover & {
    opacity: 1;
    transform: translateY(0);
    border-color: #10b981;
    color: #10b981;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
  }
`;

const MapBookItem = styled(motion.div)`
  position: absolute;
  left: ${props => props.$left};
  top: ${props => props.$top};
  width: ${props => props.$width};
  height: ${props => props.$height || 'auto'};
  cursor: pointer;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: ${props => getLightingFilter(props.$sceneId, false)} drop-shadow(0 6px 12px rgba(0,0,0,0.5));
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  img {
    width: 100%;
    height: auto;
  }

  &:hover {
    filter: ${props => getLightingFilter(props.$sceneId, true)} drop-shadow(0 0 15px #e7c77e) brightness(1.2);
  }
`;

const MapBookLabel = styled.div`
  margin-top: 0.3rem;
  background: rgba(12, 10, 24, 0.85);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 6px;
  color: #ffedd5;
  font-size: 0.68rem;
  padding: 3px 8px;
  text-align: center;
  letter-spacing: 0.05em;
  white-space: nowrap;
  pointer-events: none;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0,0,0,0.45);
  opacity: 0;
  transform: translateY(6px);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  ${MapBookItem}:hover & {
    opacity: 1;
    transform: translateY(0);
    border-color: #fb923c;
    color: #fb923c;
    box-shadow: 0 0 10px rgba(251, 146, 60, 0.35);
  }
`;

const NoteBoxItem = styled(motion.div)`
  position: absolute;
  left: ${props => props.$left};
  top: ${props => props.$top};
  width: ${props => props.$width};
  height: ${props => props.$height || 'auto'};
  cursor: pointer;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: ${props => getLightingFilter(props.$sceneId, false)} drop-shadow(0 6px 12px rgba(0,0,0,0.45));
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  img {
    width: 100%;
    height: auto;
  }

  &:hover {
    filter: ${props => getLightingFilter(props.$sceneId, true)} drop-shadow(0 0 12px #e7c77e) brightness(1.2);
  }
`;

const NoteBoxLabel = styled.div`
  margin-top: 0.3rem;
  background: rgba(12, 10, 24, 0.85);
  border: 1px solid rgba(231, 199, 126, 0.35);
  border-radius: 6px;
  color: #ffedd5;
  font-size: 0.68rem;
  padding: 3px 8px;
  text-align: center;
  letter-spacing: 0.05em;
  white-space: nowrap;
  pointer-events: none;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0,0,0,0.45);
  opacity: 0;
  transform: translateY(6px);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  ${NoteBoxItem}:hover & {
    opacity: 1;
    transform: translateY(0);
    border-color: #fcd34d;
    color: #fcd34d;
    box-shadow: 0 0 10px rgba(252, 211, 77, 0.3);
  }
`;

const DrawerItem = styled(motion.div)`
  position: absolute;
  left: ${props => props.$left};
  top: ${props => props.$top};
  width: ${props => props.$width};
  height: ${props => props.$height || 'auto'};
  cursor: pointer;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: ${props => getLightingFilter(props.$sceneId, false)} drop-shadow(0 8px 16px rgba(0,0,0,0.55));
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  img {
    width: 100%;
    height: auto;
  }

  &:hover {
    filter: ${props => getLightingFilter(props.$sceneId, true)} drop-shadow(0 0 15px #e7c77e) brightness(1.2);
  }
`;

const DrawerLabel = styled.div`
  margin-top: 0.3rem;
  background: rgba(12, 10, 24, 0.85);
  border: 1px solid rgba(192, 132, 252, 0.35);
  border-radius: 6px;
  color: #f5f3ff;
  font-size: 0.68rem;
  padding: 3px 8px;
  text-align: center;
  letter-spacing: 0.05em;
  white-space: nowrap;
  pointer-events: none;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0,0,0,0.45);
  opacity: 0;
  transform: translateY(6px);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  ${DrawerItem}:hover & {
    opacity: 1;
    transform: translateY(0);
    border-color: #a78bfa;
    color: #c084fc;
    box-shadow: 0 0 10px rgba(167, 139, 250, 0.3);
  }
`;

const BlueprintItem = styled(motion.div)`
  position: absolute;
  left: ${props => props.$left};
  top: ${props => props.$top};
  width: ${props => props.$width};
  height: ${props => props.$height || 'auto'};
  cursor: pointer;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: ${props => getLightingFilter(props.$sceneId, false)} drop-shadow(0 6px 15px rgba(0,0,0,0.5));
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  img {
    width: 100%;
    height: auto;
  }

  &:hover {
    filter: ${props => getLightingFilter(props.$sceneId, true)} drop-shadow(0 0 15px #e7c77e) brightness(1.2);
  }
`;

const BlueprintLabel = styled.div`
  margin-top: 0.3rem;
  background: rgba(12, 10, 24, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 6px;
  color: #f0f9ff;
  font-size: 0.68rem;
  padding: 3px 8px;
  text-align: center;
  letter-spacing: 0.05em;
  white-space: nowrap;
  pointer-events: none;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0,0,0,0.45);
  opacity: 0;
  transform: translateY(6px);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  ${BlueprintItem}:hover & {
    opacity: 1;
    transform: translateY(0);
    border-color: #38bdf8;
    color: #38bdf8;
    box-shadow: 0 0 12px rgba(56, 189, 248, 0.35);
  }
`;

// ── 博文检索与分类柜 UI (Search and Filter UI) ──
// ── 游园星图 (Minimap) Styled Components ──────────────────────────────
const MinimapContainer = styled.div`
  position: absolute;
  top: 1.8rem;
  right: 1.8rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const MinimapCompass = styled(motion.button)`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(12, 10, 24, 0.85);
  border: 2px solid #e7c77e;
  box-shadow: 
    0 0 12px rgba(231, 199, 126, 0.4),
    0 4px 10px rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  cursor: pointer;
  outline: none;
  pointer-events: auto;
  
  &:hover {
    background: #e7c77e;
    color: #0c0a18;
    box-shadow: 0 0 18px rgba(231, 199, 126, 0.7);
  }
`;

const MinimapPaper = styled(motion.div)`
  width: 280px;
  height: 220px;
  background-color: rgba(12, 10, 24, 0.94);
  background-image: url(${props => props.$bgSrc});
  background-size: cover;
  background-position: center;
  border: 1px solid rgba(231, 199, 126, 0.35);
  border-radius: 12px;
  box-shadow: 
    0 15px 35px rgba(0, 0, 0, 0.65),
    0 0 20px rgba(231, 199, 126, 0.15);
  padding: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  pointer-events: auto;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  &::before {
    content: '';
    position: absolute;
    inset: 3px;
    border: 1px solid rgba(231, 199, 126, 0.12);
    border-radius: 9px;
    pointer-events: none;
  }
`;

const MinimapHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px dashed rgba(231, 199, 126, 0.2);
  padding-bottom: 4px;
  margin-bottom: 6px;
  z-index: 10;
`;

const MinimapTitle = styled.h4`
  font-size: 0.75rem;
  font-weight: 800;
  color: #ffedd5;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  letter-spacing: 0.05em;
  
  span {
    color: #e7c77e;
  }
`;

const MinimapCoordBadge = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 0.58rem;
  font-weight: 800;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.35);
  border-radius: 4px;
  padding: 1px 5px;
  letter-spacing: 0.05em;
  box-shadow: 0 0 6px rgba(251, 191, 36, 0.2);
  user-select: none;
`;

const MinimapCloseBtn = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgba(254, 243, 199, 0.6);
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background: rgba(231, 199, 126, 0.1);
    color: #ffffff;
  }
`;

const MinimapGraphArea = styled.div`
  flex: 1;
  position: relative;
  background: rgba(6, 4, 10, 0.65) radial-gradient(rgba(231, 199, 126, 0.15) 1px, transparent 1px) 0 0 / 12px 12px;
  border: 1px solid rgba(231, 199, 126, 0.15);
  border-radius: 8px;
  overflow: hidden;
`;

const MinimapEdgeLabel = styled.div`
  position: absolute;
  transform: translate(-50%, -50%);
  background: rgba(15, 11, 28, 0.92);
  border: 1px solid rgba(231, 199, 126, 0.18);
  border-radius: 4px;
  color: rgba(254, 243, 199, 0.75);
  font-size: 0.52rem;
  padding: 1px 3px;
  white-space: nowrap;
  z-index: 5;
  pointer-events: none;
  scale: 0.9;
`;

const MinimapNodeContainer = styled(motion.div)`
  position: absolute;
  left: ${props => props.$x}%;
  top: ${props => props.$y}%;
  transform: translate(-50%, -50%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
`;

const MinimapMedallion = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => props.$isCurrent ? 'rgba(231, 199, 126, 0.35)' : 'rgba(12, 10, 24, 0.85)'};
  border: 1.5px solid ${props => props.$isCurrent ? '#fbbf24' : props.$themeColor || '#e7c77e'};
  box-shadow: ${props => props.$isCurrent 
    ? '0 0 10px #fbbf24, inset 0 0 5px rgba(251, 191, 36, 0.5)' 
    : '0 2px 4px rgba(0,0,0,0.5)'};
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 11px;
  color: #fff;
  transition: all 0.25s ease;
  position: relative;

  ${MinimapNodeContainer}:hover & {
    transform: scale(1.2);
    box-shadow: 0 0 12px ${props => props.$themeColor || '#e7c77e'};
    border-color: #ffffff;
    background: ${props => props.$themeColor || '#e7c77e'};
  }
`;

const MinimapNodeLabel = styled.div`
  margin-top: 2px;
  font-size: 0.55rem;
  font-weight: 800;
  color: ${props => props.$isCurrent ? '#fbbf24' : '#ffedd5'};
  text-shadow: 0 1px 2px rgba(0,0,0,0.9);
  white-space: nowrap;
  scale: 0.95;
  display: flex;
  align-items: center;
  gap: 2px;
  
  span.coords-text {
    font-family: 'Courier New', monospace;
    font-size: 0.48rem;
    opacity: 0.5;
    font-weight: normal;
    color: #a78bfa;
    transition: opacity 0.2s, color 0.2s;
  }
  
  ${MinimapNodeContainer}:hover & {
    color: #ffffff;
    text-shadow: 0 0 4px ${props => props.$themeColor || '#e7c77e'};
    
    span.coords-text {
      opacity: 0.9;
      color: #fbbf24;
    }
  }
`;

const MinimapPointerBadge = styled(motion.div)`
  position: absolute;
  top: -12px;
  font-size: 10px;
  pointer-events: none;
  z-index: 12;
`;

const SearchInputWrapper = styled.div`
  display: flex;
  align-items: center;
  background: rgba(74, 45, 27, 0.05);
  border: 1.5px solid rgba(74, 45, 27, 0.2);
  border-radius: 8px;
  padding: 6px 12px;
  margin-bottom: 1rem;
  gap: 8px;
  transition: all 0.25s ease;

  &:focus-within {
    border-color: rgba(74, 45, 27, 0.7);
    background: rgba(74, 45, 27, 0.08);
    box-shadow: 0 0 8px rgba(74, 45, 27, 0.15);
  }
`;

const SearchInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 0.85rem;
  color: #4a2d1b;

  &::placeholder {
    color: rgba(74, 45, 27, 0.45);
  }
`;

const TagFilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 1rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px dashed rgba(74, 45, 27, 0.15);
  max-height: 120px;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(74, 45, 27, 0.03);
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(74, 45, 27, 0.2);
    border-radius: 2px;
  }
`;

const SearchTagButton = styled.button`
  background: ${props => props.$active ? 'rgba(74, 45, 27, 0.85)' : 'rgba(74, 45, 27, 0.05)'};
  border: 1px solid rgba(74, 45, 27, 0.2);
  border-radius: 20px;
  color: ${props => props.$active ? '#ffedd5' : '#4a2d1b'};
  padding: 3px 10px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: ${props => props.$active ? 'bold' : 'normal'};

  &:hover {
    background: ${props => props.$active ? 'rgba(74, 45, 27, 0.85)' : 'rgba(74, 45, 27, 0.1)'};
    border-color: rgba(74, 45, 27, 0.4);
  }
`;



// ── 卷轴展开阅读面板 ───────────────────────────────────────────
const ScrollBackdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(8, 6, 14, 0.52);
  backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
`;

const ScrollPanelContainer = styled(motion.div)`
  position: relative;
  width: min(760px, 62vw);
  height: min(540px, 48vh);
  min-height: 480px;
  background-image: url(${props => props.$bgSrc});
  background-size: 100% 100%;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0,0,0,0.7);
  box-sizing: border-box;
  padding: 4.2rem 5.2rem 4.5rem 5.2rem;

  @media (max-width: 760px) {
    width: min(440px, 94vw);
    height: 520px;
    padding: 3.5rem 3rem 4rem 3rem;
  }
`;

const ScrollHeader = styled.div`
  border-bottom: 2px dashed rgba(74, 45, 27, 0.2);
  padding-bottom: 0.5rem;
  margin-bottom: 0.8rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: Georgia, serif;
`;

const ScrollTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 800;
  color: #4a2d1b;
  margin: 0;
  letter-spacing: 0.05em;
`;

const ScrollMeta = styled.span`
  font-size: 0.7rem;
  color: rgba(74, 45, 27, 0.55);
  font-family: monospace;
  text-transform: uppercase;
`;

const ScrollCloseButton = styled.button`
  position: absolute;
  top: 2.8rem;
  right: 3.2rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #4a2d1b;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  transition: background 0.2s ease;
  z-index: 200;

  &:hover {
    background: rgba(74, 45, 27, 0.1);
  }
`;

const ScrollContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  box-sizing: border-box;

  /* Custom scrollbar matching scroll theme */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(74, 45, 27, 0.05);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(74, 45, 27, 0.35);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(74, 45, 27, 0.55);
  }
`;

const ScrollBackButton = styled.button`
  background: transparent;
  border: 1px solid #4a2d1b;
  border-radius: 4px;
  color: #4a2d1b;
  padding: 3px 8px;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  margin-bottom: 0.8rem;

  &:hover {
    background: rgba(74, 45, 27, 0.08);
  }
`;

// ── 文章列表与正文渲染 ──────────────────────────────────────────
const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60%;
  color: #4a2d1b;
  font-family: Georgia, serif;
  font-size: 0.88rem;
  gap: 8px;
`;

const ArticleItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  background: rgba(74, 45, 27, 0.04);
  border: 1px solid rgba(74, 45, 27, 0.08);
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  animation: ${paperSlideIn} 0.35s ease both;

  &:hover {
    background: rgba(74, 45, 27, 0.09);
    border-color: rgba(74, 45, 27, 0.3);
    transform: translateX(4px);
  }
`;

const ArticleTitle = styled.span`
  font-size: 0.85rem;
  font-weight: bold;
  color: #4a2d1b;
`;

const ArticleMeta = styled.span`
  font-size: 0.68rem;
  color: rgba(74, 45, 27, 0.6);
  background: rgba(74, 45, 27, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
`;

const EmptyState = styled.div`
  text-align: center;
  color: rgba(74, 45, 27, 0.65);
  font-size: 0.8rem;
  margin-top: 4rem;
  font-family: Georgia, serif;
`;

const MarkdownBody = styled.div`
  color: #3b2211;
  line-height: 1.7;
  font-size: 0.85rem;
  font-family: Georgia, 'Times New Roman', Times, serif;

  h1, h2, h3 {
    color: #4a2d1b;
    font-weight: 800;
    margin: 1.5rem 0 0.5rem;
  }
  h1 { font-size: 1.3rem; }
  h2 { font-size: 1.12rem; border-bottom: 1.5px solid rgba(74, 45, 27, 0.18); padding-bottom: 0.2rem; }
  h3 { font-size: 0.98rem; }
  p { margin: 0.6rem 0; text-align: justify; }

  ul, ol { padding-left: 1.2rem; margin: 0.6rem 0; }
  li { margin: 0.2rem 0; }

  code {
    background: rgba(74, 45, 27, 0.08);
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 0.85em;
  }
  pre {
    background: rgba(74, 45, 27, 0.06);
    border: 1px solid rgba(74, 45, 27, 0.12);
    border-radius: 6px;
    padding: 0.6rem;
    overflow-x: auto;
    code { background: none; padding: 0; }
  }
  blockquote {
    border-left: 3px solid rgba(74, 45, 27, 0.4);
    padding-left: 0.8rem;
    margin: 0.6rem 0;
    color: rgba(74, 45, 27, 0.7);
    font-style: italic;
  }
`;

// ── 简易 Frontmatter 解析器 ────────────────────────────────────
function parseFrontmatter(markdown) {
  const normalized = String(markdown || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { body: markdown, title: '' };

  const raw = match[1].split('\n');
  let title = '';
  for (const line of raw) {
    const pair = line.match(/^title:\s*["']?(.+?)["']?\s*$/);
    if (pair) {
      title = pair[1].replace(/^["']|["']$/g, '');
      break;
    }
  }

  return {
    body: normalized.slice(match[0].length),
    title,
  };
}

// -------------------------------------------------------------------------
// Helper functions & Portal Component
// -------------------------------------------------------------------------
const getNoteSnippet = (text) => {
  let cleanText = text;
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
  const match = text.match(frontmatterRegex);
  if (match) {
    cleanText = text.slice(match[0].length);
  }
  cleanText = cleanText
    .replace(/<!--[\s\S]*?-->/g, '') // remove comments
    .replace(/^#+\s+.*$/gm, '')      // remove headings
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // simplify links
    .replace(/[*_`#]/g, '')          // remove formatting
    .replace(/\s+/g, ' ')            // collapse whitespace
    .trim();
  return cleanText.length > 120 ? cleanText.slice(0, 120) + '...' : cleanText;
};

const Portal = ({ portal, onChangeScene }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <PortalContainer
      $left={portal.left}
      $top={portal.top}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onChangeScene(portal.target)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 90, damping: 15 }}
    >
      <PortalAnchor $color={portal.color}>
        <PortalGlowRing $color={portal.color} />
        <PortalIconWrapper $styleType={portal.styleType}>
          {portal.icon}
        </PortalIconWrapper>
      </PortalAnchor>
      
      <AnimatePresence>
        {isHovered && (
          <PortalTooltip
            $color={portal.color}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <PortalTooltipTitle $color={portal.color}>
              {portal.icon} {portal.label}
            </PortalTooltipTitle>
            <PortalTooltipDesc>
              {portal.desc}
            </PortalTooltipDesc>
          </PortalTooltip>
        )}
      </AnimatePresence>
    </PortalContainer>
  );
};

// -------------------------------------------------------------------------
// 主组件 (Blog)
// -------------------------------------------------------------------------
export default function Blog() {
  const [sceneMode, setSceneMode] = useState('overview'); // overview, indoor, outdoor, travel, archive, workshop
  const [isMinimapOpen, setIsMinimapOpen] = useState(true);
  const [isTeleporting, setIsTeleporting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [notesData, setNotesData] = useState([]);
  
  // 摘叶子与传送节点交互状态
  const [isLeafPreviewOpen, setIsLeafPreviewOpen] = useState(false);
  const [activeLeafNote, setActiveLeafNote] = useState(null);
  const [leafSnippet, setLeafSnippet] = useState('');
  const [leafSnippetLoading, setLeafSnippetLoading] = useState(false);
  const [shakingLeafId, setShakingLeafId] = useState(null);
  
  const currentScene = BLOG_SCENES[sceneMode];

  const changeScene = (mode) => {
    if (sceneMode === mode) return;
    setIsTeleporting(true);
    setIsTransitioning(true);
    setTimeout(() => {
      setSceneMode(mode);
    }, 300);
    setTimeout(() => {
      setIsTransitioning(false);
      setIsTeleporting(false);
    }, 700);
  };
  const [notesLoading, setNotesLoading] = useState(true);
  
  // Modal / Reader State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeScrollTitle, setActiveScrollTitle] = useState('');
  const [activeScrollMeta, setActiveScrollMeta] = useState('');
  const [modalNotes, setModalNotes] = useState([]);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState(null);
  
  // Article detail state
  const [articleTitle, setArticleTitle] = useState('');
  const [articleBody, setArticleBody] = useState('');
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState(null);

  // Search & Filter state for Archive scene
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchTag, setSelectedSearchTag] = useState('');
  const [archiveMode, setArchiveMode] = useState(null); // 'search' or 'recent' or null

  const canvasRef = useRef(null);

  // ── 鼠标 3D 视差 Motion 变量与阻尼弹簧配置 ──
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 40, stiffness: 180, mass: 0.4 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // 创建映射：背景移动范围 [-1.2%, 1.2%]，前景物件移动范围 [-2.8%, 2.8%]
  const bgX = useTransform(springX, [-0.5, 0.5], ['-1.2%', '1.2%']);
  const bgY = useTransform(springY, [-0.5, 0.5], ['-1.2%', '1.2%']);
  const itemX = useTransform(springX, [-0.5, 0.5], ['-2.8%', '2.8%']);
  const itemY = useTransform(springY, [-0.5, 0.5], ['-2.8%', '2.8%']);

  // 保存实时标准化坐标的 ref，供 Canvas 粒子渲染系统读取，减少 React 调度开销
  const rawMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const nx = (e.clientX / window.innerWidth) - 0.5;
      const ny = (e.clientY / window.innerHeight) - 0.5;
      mouseX.set(nx);
      mouseY.set(ny);
      rawMouseRef.current = { x: nx, y: ny };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // 1. 获取 notes-index.json 数据
  useEffect(() => {
    fetch('/notes-index.json')
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch notes index');
        return r.json();
      })
      .then(data => {
        setNotesData(data.notes || []);
        setNotesLoading(false);
      })
      .catch(err => {
        console.error(err);
        setNotesLoading(false);
      });
  }, []);

  // 2. 动态加载单个 Markdown 内容
  useEffect(() => {
    if (!selectedArticleSlug) {
      setArticleBody('');
      setArticleTitle('');
      return;
    }

    setArticleLoading(true);
    setArticleError(null);

    fetch(`/notes/${selectedArticleSlug}.md`)
      .then(r => {
        if (!r.ok) throw new Error(`未找到该法宝的纸卷: ${selectedArticleSlug}`);
        return r.text();
      })
      .then(text => {
        const parsed = parseFrontmatter(text);
        setArticleBody(parsed.body);
        // 如果 frontmatter 里面没有 title，解析文件名
        const fileName = selectedArticleSlug.split('/').pop().replace('.md', '');
        setArticleTitle(parsed.title || fileName);
        setArticleLoading(false);
      })
      .catch(err => {
        setArticleError(err.message);
        setArticleLoading(false);
      });
  }, [selectedArticleSlug]);

  // 3. Canvas 魔法浮光粒子效果
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationId;
    let particles = [];
    
    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    class Firefly {
      constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
      }
      
      reset() {
        if (!canvas) return;
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 50;
        this.size = Math.random() * 2.8 + 1.1;
        this.speedY = -(Math.random() * 0.45 + 0.12);
        this.speedX = Math.random() * 0.3 - 0.15;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.015 + 0.005;
        
        const indoorScenes = ['indoor', 'junction', 'archive', 'workshop'];
        if (indoorScenes.includes(sceneMode)) {
          // 屋内只有暖橙烛光浮粒
          this.color = `rgba(231, 199, 126, ${Math.random() * 0.4 + 0.18})`;
        } else if (sceneMode === 'outdoor' || sceneMode === 'travel') {
          // 屋外主要是深青/绿森林精灵
          this.color = `rgba(90, 163, 143, ${Math.random() * 0.4 + 0.18})`;
        } else {
          // 全景：左金右绿
          const isLeft = this.x < canvas.width / 2;
          this.color = isLeft 
            ? `rgba(231, 199, 126, ${Math.random() * 0.35 + 0.18})`
            : `rgba(90, 163, 143, ${Math.random() * 0.35 + 0.18})`;
        }
      }
      
      update() {
        this.y += this.speedY;
        this.wobble += this.wobbleSpeed;
        
        const mouseShiftX = rawMouseRef.current.x * 25;
        this.x += this.speedX + Math.sin(this.wobble) * 0.18;
        
        if (this.y < -10 || (this.x + mouseShiftX) < -10 || (this.x + mouseShiftX) > canvas.width + 10) {
          this.reset();
        }
      }
      
      draw() {
        const mouseShiftX = rawMouseRef.current.x * 25;
        const mouseShiftY = rawMouseRef.current.y * 20;
        
        ctx.fillStyle = this.color;
        ctx.shadowBlur = this.size * 2.5;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x + mouseShiftX, this.y + mouseShiftY, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    
    for (let i = 0; i < 40; i++) {
      particles.push(new Firefly());
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [sceneMode]);

  // 4. 提取检索柜的所有标签
  const uniqueTags = React.useMemo(() => {
    const tagsSet = new Set();
    notesData.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(t => {
          // 过滤掉一些过于系统/空置的标签，保持检索美观
          if (t && !['travel', 'project', 'blog-design', 'linux-notes'].includes(t)) {
            tagsSet.add(t);
          }
        });
      }
    });
    return Array.from(tagsSet).slice(0, 24); // 限制首屏展示的标签数量
  }, [notesData]);

  // 5. 检索柜筛选后的文章列表
  const filteredNotes = React.useMemo(() => {
    if (archiveMode !== 'search') return [];
    return notesData.filter(note => {
      const matchesSearch = searchQuery
        ? (note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (note.tags && note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))))
        : true;
      const matchesTag = selectedSearchTag
        ? (note.tags && note.tags.includes(selectedSearchTag))
        : true;
      return matchesSearch && matchesTag;
    });
  }, [notesData, searchQuery, selectedSearchTag, archiveMode]);

  // 6. 统一交互物件点击响应
  const handleItemClick = (item) => {
    if (isTransitioning || notesLoading) return;
    
    // 初始化/重置 modal 状态
    setSelectedArticleSlug(null);
    setSearchQuery('');
    setSelectedSearchTag('');
    setArchiveMode(null);

    // 特殊：抽屉柜触发分类检索面板
    if (item.action === 'search') {
      setArchiveMode('search');
      setActiveScrollTitle('藏经分类阁');
      setActiveScrollMeta('SEARCH & TAG FILTERS');
      setModalNotes([]);
      setIsModalOpen(true);
      return;
    }

    // 特殊：便签箱触发最近更新面板
    if (item.action === 'recent') {
      setArchiveMode('recent');
      setActiveScrollTitle('近期修真手札');
      setActiveScrollMeta('RECENT CHRONICLES');
      // 按照默认顺序截取最近的 15 篇
      const recent = [...notesData].slice(0, 15);
      setModalNotes(recent);
      setIsModalOpen(true);
      return;
    }

    // 普通：绿叶/金叶 符纸触发摘叶随记预览 (小纸条)
    if (item.type === 'gold' || item.type === 'green') {
      // 触发抖动
      setShakingLeafId(item.id);
      setTimeout(() => {
        setShakingLeafId(null);
      }, 600);

      let targetNote;
      if (item.filter) {
        targetNote = item.filter(notesData);
      } else if (item.collection) {
        targetNote = notesData.find(n => n.collection === item.collection);
      }
      
      setIsLeafPreviewOpen(true);
      setLeafSnippetLoading(true);
      setLeafSnippet('');

      if (!targetNote) {
        const dummy = {
          title: item.label || '松果随记',
          collectionLabel: '日常札记',
          tags: ['心境', '杂感'],
          slug: 'dummy-note'
        };
        setActiveLeafNote(dummy);
        setLeafSnippet('“松果屋建在林间石道深处。屋外有潺潺池塘，屋内有炉火微微。每一片被风送入屋内的落叶，都写着一个未完的日常。”');
        setLeafSnippetLoading(false);
        return;
      }
      
      setActiveLeafNote(targetNote);

      fetch(`/notes/${targetNote.slug}.md`)
        .then(r => {
          if (!r.ok) throw new Error('Could not fetch note content');
          return r.text();
        })
        .then(text => {
          const snippet = getNoteSnippet(text);
          setLeafSnippet(snippet);
          setLeafSnippetLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLeafSnippet('无法读取树叶上的法力印记，只隐约看到这是一篇关于「' + targetNote.title + '」的修行感悟。');
          setLeafSnippetLoading(false);
        });
    } else {
      // 卷轴、蓝图、地图册 展示文章列表
      let matchedNotes = notesData;
      if (item.collections) {
        matchedNotes = notesData.filter(note => item.collections.includes(note.collection));
      }
      if (item.filter) {
        matchedNotes = item.filter(matchedNotes);
      }
      
      setActiveScrollTitle(item.label || '法典卷轴');
      setActiveScrollMeta(`ARCHIVE · ${item.collections ? item.collections.join(' / ').toUpperCase() : 'ALL'}`);
      setModalNotes(matchedNotes);
      setIsModalOpen(true);
    }
  };

  const handleExpandLeafNote = () => {
    if (!activeLeafNote) return;
    setIsLeafPreviewOpen(false);
    
    // 初始化/重置 modal 状态
    setSelectedArticleSlug(null);
    setSearchQuery('');
    setSelectedSearchTag('');
    setArchiveMode(null);

    setSelectedArticleSlug(activeLeafNote.slug);
    
    if (activeLeafNote.slug === 'dummy-note') {
      setActiveScrollTitle('林间随记');
      setActiveScrollMeta('PINECONE NOTE');
      setModalNotes([]);
      setArticleTitle('林间随记');
      setArticleBody('“松果屋建在林间石道深处。屋外有潺潺池塘，屋内有炉火微微。每一片被风送入屋内的落叶，都写着一个未完的日常。”');
    } else {
      setActiveScrollTitle(activeLeafNote.title);
      setActiveScrollMeta(`MANIFEST · ${activeLeafNote.collectionLabel || 'NOTES'}`);
    }
    setIsModalOpen(true);
  };

  return (
    <PageWrapper>
      {/* 🗺️ 右上角游园星图 (Collapsible Minimap) */}
      <MinimapContainer>
        <AnimatePresence>
          {!isMinimapOpen ? (
            <MinimapCompass
              onClick={() => setIsMinimapOpen(true)}
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              title="展开游园星图"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              🧭
            </MinimapCompass>
          ) : (
            <MinimapPaper
              $bgSrc={BLOG_NEW_ASSETS.bgMinimap}
              initial={{ scale: 0.8, opacity: 0, x: 50, y: -50 }}
              animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, x: 50, y: -50 }}
              transition={{ type: 'spring', damping: 16 }}
            >
              <MinimapHeader>
                <MinimapTitle>
                  🧭 游园星图 <span>(双路径)</span>
                </MinimapTitle>
                {(() => {
                  const coords = {
                    overview: { x: 50, y: 15 },
                    indoor: { x: 30, y: 40 },
                    outdoor: { x: 70, y: 40 },
                    travel: { x: 70, y: 75 },
                    junction: { x: 30, y: 65 },
                    archive: { x: 15, y: 85 },
                    workshop: { x: 45, y: 85 }
                  }[sceneMode] || { x: 50, y: 50 };
                  return (
                    <MinimapCoordBadge title="当前空间星象坐标">
                      LOC: {coords.x}, {coords.y}
                    </MinimapCoordBadge>
                  );
                })()}
                <MinimapCloseBtn onClick={() => setIsMinimapOpen(false)}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </MinimapCloseBtn>
              </MinimapHeader>
              
              <MinimapGraphArea>
                {/* Connections SVG */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                  {MAP_EDGES.map((edge, idx) => (
                    <g key={idx}>
                      {/* Background path track */}
                      <line 
                        x1={`${edge.x1}%`} 
                        y1={`${edge.y1}%`} 
                        x2={`${edge.x2}%`} 
                        y2={`${edge.y2}%`} 
                        stroke="rgba(231, 199, 126, 0.12)" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                      />
                      {/* Flowing color light line */}
                      <MinimapSVGLine 
                        x1={`${edge.x1}%`} 
                        y1={`${edge.y1}%`} 
                        x2={`${edge.x2}%`} 
                        y2={`${edge.y2}%`} 
                        $color={edge.color}
                      />
                    </g>
                  ))}
                </svg>

                {/* Edge Labels */}
                {MAP_EDGES.map((edge, idx) => {
                  const mx = (edge.x1 + edge.x2) / 2;
                  const my = (edge.y1 + edge.y2) / 2;
                  return (
                    <MinimapEdgeLabel key={idx} style={{ left: `${mx}%`, top: `${my}%` }}>
                      {edge.label}
                    </MinimapEdgeLabel>
                  );
                })}

                {/* Scene Nodes */}
                {Object.values(BLOG_SCENES).map((scene) => {
                  const coords = {
                    overview: { x: 50, y: 15, icon: '🏰', label: '总览' },
                    indoor: { x: 30, y: 40, icon: '🚪', label: '屋内' },
                    outdoor: { x: 70, y: 40, icon: '🌿', label: '林间' },
                    travel: { x: 70, y: 75, icon: '🧭', label: '旅案' },
                    junction: { x: 30, y: 65, icon: '🪟', label: '回廊' },
                    archive: { x: 15, y: 85, icon: '🗄️', label: '旧柜' },
                    workshop: { x: 45, y: 85, icon: '🛠️', label: '工坊' }
                  }[scene.id] || { x: 50, y: 50, icon: '❓', label: '未知' };

                  const isCurrent = sceneMode === scene.id;

                  return (
                    <MinimapNodeContainer
                      key={scene.id}
                      $x={coords.x}
                      $y={coords.y}
                      onClick={() => changeScene(scene.id)}
                      title={`传送到: ${scene.title}`}
                    >
                      <MinimapMedallion $isCurrent={isCurrent} $themeColor={scene.themeColor}>
                        {coords.icon}
                      </MinimapMedallion>
                      <MinimapNodeLabel $isCurrent={isCurrent} $themeColor={scene.themeColor}>
                        {coords.label} <span className="coords-text">[{coords.x},{coords.y}]</span>
                      </MinimapNodeLabel>
                      
                      {isCurrent && (
                        <MinimapPointerBadge
                          animate={{ y: [-3, 1, -3] }}
                          transition={{ repeat: Infinity, duration: 1.2 }}
                        >
                          ✨
                        </MinimapPointerBadge>
                      )}
                    </MinimapNodeContainer>
                  );
                })}
              </MinimapGraphArea>
            </MinimapPaper>
          )}
        </AnimatePresence>
      </MinimapContainer>

      {/* 魔法 Canvas 浮光背景 */}
      <CanvasBackground ref={canvasRef} />

      <SceneContainer>
        {/* 🔮 传送时全屏魔力光晕 (Teleport spell screen flash) */}
        <AnimatePresence>
          {isTeleporting && (
            <TeleportFlash
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, times: [0, 0.4, 1], ease: 'easeInOut' }}
            />
          )}
        </AnimatePresence>

        {/* 🪐 响应式 16:9 画布容器 (Centers background & overlay nodes relative to artwork aspect-ratio) */}
        <SceneCanvas
          style={{
            x: bgX,
            y: bgY,
          }}
        >
          {Object.values(BLOG_SCENES).map((scene) => {
            const bgVal = scene.background 
              ? `url(${scene.background})` 
              : `radial-gradient(circle at 50% 50%, ${scene.themeColor}15 0%, #030108 80%)`;
            return (
              <BgLayer
                key={scene.id}
                as={motion.div}
                $bg={bgVal}
                animate={{
                  opacity: sceneMode === scene.id ? 1 : 0,
                  scale: sceneMode === scene.id ? 1.05 : 1.15,
                }}
                transition={{
                  duration: 1.1,
                  ease: [0.25, 1, 0.5, 1]
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: sceneMode === scene.id ? 0 : -1,
                }}
              />
            );
          })}

          {/* 统一的场景传送节点 (Portal Nodes) */}
          <AnimatePresence>
            {currentScene.portals && currentScene.portals.map((portal) => (
              <Portal
                key={portal.id}
                portal={portal}
                onChangeScene={changeScene}
              />
            ))}
          </AnimatePresence>

          {/* 二级近景场景 (各场景交互物件) */}
          <AnimatePresence mode="wait">
            {sceneMode !== 'overview' && (
              <CloseUpContainer
                key={sceneMode}
                $isTransitioning={isTransitioning}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.6 }}
              >
                {/* 渲染具体的场景交互物 */}
                {currentScene.items.map((item) => {
                if (item.type === 'gold' || item.type === 'green') {
                  const isGold = item.type === 'gold';
                  return (
                    <LeafItem
                      key={item.id}
                      $left={item.left}
                      $top={item.top}
                      $width={item.width}
                      $transform={item.transform}
                      $sceneId={currentScene.id}
                      className={shakingLeafId === item.id ? 'shake' : ''}
                      style={{ x: itemX, y: itemY }}
                      onClick={() => handleItemClick(item)}
                    >
                      <img 
                        src={isGold ? BLOG_NEW_ASSETS.leafGold : BLOG_NEW_ASSETS.leafGreen} 
                        alt={item.label} 
                      />
                      <LeafLabel>{item.label}</LeafLabel>
                    </LeafItem>
                  );
                }

                if (item.type === 'bamboo' || item.type === 'jade' || item.type === 'scroll') {
                  let imgSrc = BLOG_NEW_ASSETS.scroll;
                  if (item.type === 'bamboo') {
                    imgSrc = BLOG_NEW_ASSETS.scrollBamboo;
                  } else if (item.type === 'jade') {
                    imgSrc = BLOG_NEW_ASSETS.scrollJade;
                  }
                  return (
                    <ScrollItem
                      key={item.id}
                      $left={item.left}
                      $top={item.top}
                      $width={item.width}
                      $height={item.height}
                      $sceneId={currentScene.id}
                      $imgSrc={item.imgSrc}
                      onClick={() => handleItemClick(item)}
                    >
                      <img src={item.imgSrc || imgSrc} alt={item.label} />
                      <ScrollLabel>{item.label}</ScrollLabel>
                    </ScrollItem>
                  );
                }

                if (item.type === 'map-book') {
                  return (
                    <MapBookItem
                      key={item.id}
                      $left={item.left}
                      $top={item.top}
                      $width={item.width}
                      $transform={item.transform}
                      $sceneId={currentScene.id}
                      onClick={() => handleItemClick(item)}
                    >
                      <img src={item.imgSrc || BLOG_NEW_ASSETS.mapBook} alt={item.label} />
                      <MapBookLabel>{item.label}</MapBookLabel>
                    </MapBookItem>
                  );
                }

                if (item.type === 'note-box') {
                  return (
                    <NoteBoxItem
                      key={item.id}
                      $left={item.left}
                      $top={item.top}
                      $width={item.width}
                      $transform={item.transform}
                      $sceneId={currentScene.id}
                      onClick={() => handleItemClick(item)}
                    >
                      <img src={item.imgSrc || BLOG_NEW_ASSETS.noteBox} alt={item.label} />
                      <NoteBoxLabel>{item.label}</NoteBoxLabel>
                    </NoteBoxItem>
                  );
                }

                if (item.type === 'drawer') {
                  return (
                    <DrawerItem
                      key={item.id}
                      $left={item.left}
                      $top={item.top}
                      $width={item.width}
                      $transform={item.transform}
                      $sceneId={currentScene.id}
                      onClick={() => handleItemClick(item)}
                    >
                      <img src={item.imgSrc || BLOG_NEW_ASSETS.drawer} alt={item.label} />
                      <DrawerLabel>{item.label}</DrawerLabel>
                    </DrawerItem>
                  );
                }

                if (item.type === 'blueprint') {
                  return (
                    <BlueprintItem
                      key={item.id}
                      $left={item.left}
                      $top={item.top}
                      $width={item.width}
                      $transform={item.transform}
                      $sceneId={currentScene.id}
                      onClick={() => handleItemClick(item)}
                    >
                      <img src={item.imgSrc || BLOG_NEW_ASSETS.blueprint} alt={item.label} />
                      <BlueprintLabel>{item.label}</BlueprintLabel>
                    </BlueprintItem>
                  );
                }

                return null;
              })}
            </CloseUpContainer>
          )}
        </AnimatePresence>
        </SceneCanvas>

        {/* 统一的场景顶部叙事标牌 (Scene Narrative Header) */}
        <AnimatePresence mode="wait">
          <SceneHeaderContainer
            key={sceneMode}
            initial={{ opacity: 0, y: -15, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -15, x: '-50%' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <SceneHeaderTitle>{currentScene.title}</SceneHeaderTitle>
            <SceneHeaderSubtitle>{currentScene.subtitle}</SceneHeaderSubtitle>
          </SceneHeaderContainer>
        </AnimatePresence>
      </SceneContainer>

      {/* ── 摘叶随笔纸条 (Leaf Paper Note Overlay) ── */}
      <AnimatePresence>
        {isLeafPreviewOpen && activeLeafNote && (
          <LeafPaperNote
            initial={{ opacity: 0, scale: 0.8, y: '-40%', x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
            exit={{ opacity: 0, scale: 0.8, y: '-40%', x: '-50%' }}
            transition={{ type: 'spring', damping: 18 }}
          >
            <LeafPaperTitle>{activeLeafNote.title}</LeafPaperTitle>
            <LeafPaperMeta>
              <span>📅 {activeLeafNote.date || '修真纪'}</span>
              <span>🏷️ {activeLeafNote.collectionLabel || '日常'}</span>
              {activeLeafNote.tags && activeLeafNote.tags.slice(0, 2).map(t => (
                <span key={t}>#{t}</span>
              ))}
            </LeafPaperMeta>
            
            {leafSnippetLoading ? (
              <LoadingWrapper style={{ minHeight: '60px', flexDirection: 'row', gap: '8px' }}>
                <motion.span 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                  style={{ display: 'inline-block' }}
                >
                  🍃
                </motion.span>
                <span>正在从叶片读取灵印...</span>
              </LoadingWrapper>
            ) : (
              <LeafPaperSnippet>
                {leafSnippet || '点击下方按钮展开阅读全文...'}
              </LeafPaperSnippet>
            )}

            <LeafPaperActions>
              <LeafPaperBtn 
                onClick={() => setIsLeafPreviewOpen(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                挂回墙上
              </LeafPaperBtn>
              <LeafPaperBtn 
                $primary 
                onClick={handleExpandLeafNote}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                展开读卷
              </LeafPaperBtn>
            </LeafPaperActions>
          </LeafPaperNote>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
         通用古卷弹出面板 Modal (Scroll/Map Expand Modal)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <ScrollBackdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
          >
            <ScrollPanelContainer
              $bgSrc={sceneMode === 'travel' ? BLOG_NEW_ASSETS.mapOpen : BLOG_NEW_ASSETS.scrollOpen}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 85, damping: 14 }}
            >
              {/* 关闭按钮 */}
              <ScrollCloseButton onClick={() => setIsModalOpen(false)}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </ScrollCloseButton>

              {/* 卷轴头部 */}
              <ScrollHeader>
                <ScrollTitle>{selectedArticleSlug ? articleTitle : activeScrollTitle}</ScrollTitle>
                <ScrollMeta>{activeScrollMeta}</ScrollMeta>
              </ScrollHeader>

              {/* 卷轴主要内容区 */}
              <ScrollContentArea>
                {selectedArticleSlug ? (
                  /* ── 阅读单篇文章状态 ── */
                  <>
                    {/* 如果是从文章列表/搜索进来的，提供返回列表按钮 */}
                    {(modalNotes.length > 0 || archiveMode) && (
                      <ScrollBackButton onClick={() => setSelectedArticleSlug(null)}>
                        ← 返回列表
                      </ScrollBackButton>
                    )}

                    {articleLoading ? (
                      <LoadingWrapper>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} style={{ fontSize: '1.5rem' }}>📜</motion.div>
                        <span>正在展开法术古卷...</span>
                      </LoadingWrapper>
                    ) : articleError ? (
                      <EmptyState>
                        <p>⚠️ 卷页失效：{articleError}</p>
                      </EmptyState>
                    ) : (
                      <MarkdownBody>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {articleBody}
                        </ReactMarkdown>
                      </MarkdownBody>
                    )}
                  </>
                ) : archiveMode === 'search' ? (
                  /* ── 藏经分类阁 / 搜索模式 ── */
                  <>
                    <SearchInputWrapper>
                      <span style={{ fontSize: '1rem', opacity: 0.7 }}>🔍</span>
                      <SearchInput 
                        type="text" 
                        placeholder="输入关键词检索修真秘法、手札..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button 
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4a2d1b', fontWeight: 'bold' }} 
                          onClick={() => setSearchQuery('')}
                        >
                          ✕
                        </button>
                      )}
                    </SearchInputWrapper>

                    {uniqueTags.length > 0 && (
                      <TagFilterRow>
                        <SearchTagButton 
                          $active={selectedSearchTag === ''} 
                          onClick={() => setSelectedSearchTag('')}
                        >
                          全部标签
                        </SearchTagButton>
                        {uniqueTags.map(tag => (
                          <SearchTagButton 
                            key={tag}
                            $active={selectedSearchTag === tag} 
                            onClick={() => setSelectedSearchTag(tag)}
                          >
                            #{tag}
                          </SearchTagButton>
                        ))}
                      </TagFilterRow>
                    )}

                    {filteredNotes.length === 0 ? (
                      <EmptyState>无匹配的尘封秘籍，换个词试试？</EmptyState>
                    ) : (
                      <div>
                        {filteredNotes.map((note) => (
                          <ArticleItem 
                            key={note.id} 
                            onClick={() => setSelectedArticleSlug(note.slug)}
                          >
                            <ArticleTitle>✦ {note.title}</ArticleTitle>
                            <ArticleMeta>{note.collectionLabel || '归档'}</ArticleMeta>
                          </ArticleItem>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  /* ── 展示文章列表状态 / 最近更新 ── */
                  <>
                    {modalNotes.length === 0 ? (
                      <EmptyState>该卷轴下暂无尘封的文章手札</EmptyState>
                    ) : (
                      <div>
                        {modalNotes.map((note) => (
                          <ArticleItem 
                            key={note.id} 
                            onClick={() => setSelectedArticleSlug(note.slug)}
                          >
                            <ArticleTitle>✦ {note.title}</ArticleTitle>
                            <ArticleMeta>{note.collectionLabel || '归档'}</ArticleMeta>
                          </ArticleItem>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </ScrollContentArea>
            </ScrollPanelContainer>
          </ScrollBackdrop>
        )}
      </AnimatePresence>

    </PageWrapper>
  );
}
