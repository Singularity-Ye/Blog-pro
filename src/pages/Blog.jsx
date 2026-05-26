import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BLOG_NEW_ASSETS } from '../constants/blogAssets';

// -------------------------------------------------------------------------
// 动效定义 (Animations)
// -------------------------------------------------------------------------

const scrollIndicatorFloat = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`;

const paperSlideIn = keyframes`
  from { transform: translateY(12px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;
// -------------------------------------------------------------------------
// 长廊场景配置定义 (Scene Corridor Config)
// -------------------------------------------------------------------------
const BLOG_SCENES = {
  overview: {
    id: 'overview',
    title: '松果屋总览',
    subtitle: '叩门入室，或步入叶林。',
    background: BLOG_NEW_ASSETS.bgMain,
    themeColor: '#fbbf24',
    backLabel: '',
    items: [],
  },
  indoor: {
    id: 'indoor',
    title: '碎叶墙 · 松果屋内',
    subtitle: '温火烛光，随笔杂感。',
    background: BLOG_NEW_ASSETS.bgWall,
    themeColor: '#fbbf24',
    backLabel: '🚪 返回大厅',
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
    title: '叶间书林 · 灵木区',
    subtitle: '古树高悬，仙卷竹册。',
    background: BLOG_NEW_ASSETS.bgFores,
    themeColor: '#10b981',
    backLabel: '🚪 返回大厅',
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
    subtitle: '地图漫记，红尘行脚。',
    background: BLOG_NEW_ASSETS.bgTravel,
    themeColor: '#fb923c',
    backLabel: '🚪 返回大厅',
    items: [
      { 
        id: 'travel-map', 
        type: 'map-book', 
        left: '12%', 
        top: '36%', 
        width: '180px', 
        label: '杭州旅游地图册', 
        transform: 'perspective(600px) rotateX(15deg) rotateY(10deg) rotateZ(-8deg) skewX(8deg)',
        collections: ['travel'] 
      },
      { 
        id: 'travel-scroll', 
        type: 'scroll', 
        left: '68%', 
        top: '32%', 
        width: '120px', 
        label: '一日游路线指南', 
        transform: 'rotate(5deg)',
        collections: ['travel'],
        filter: (notes) => notes.filter(n => n.title.includes('路线') || n.title.includes('行程') || n.title.includes('作战'))
      }
    ],
  },
  archive: {
    id: 'archive',
    title: '旧札柜',
    subtitle: '尘封索引，日月盈昃。',
    background: BLOG_NEW_ASSETS.bgArchive,
    themeColor: '#c084fc',
    backLabel: '🚪 返回大厅',
    items: [
      { 
        id: 'archive-drawer', 
        type: 'drawer', 
        left: '12%', 
        top: '32%', 
        width: '190px', 
        label: '博文索引抽屉 (搜索/标签)', 
        transform: 'perspective(500px) rotateY(4deg) rotateZ(1deg) skewY(-1deg)',
        action: 'search'
      },
      { 
        id: 'archive-note-box', 
        type: 'note-box', 
        left: '65%', 
        top: '46%', 
        width: '130px', 
        label: '便签盒 (最近更新)', 
        transform: 'perspective(400px) rotateX(10deg) rotateZ(-3deg) skewX(4deg)',
        action: 'recent'
      }
    ],
  },
  workshop: {
    id: 'workshop',
    title: '建站工坊',
    subtitle: '代码熔炉，工程铭牌。',
    background: BLOG_NEW_ASSETS.bgWorkshop,
    themeColor: '#38bdf8',
    backLabel: '🚪 返回大厅',
    items: [
      { 
        id: 'workshop-blueprint', 
        type: 'blueprint', 
        left: '30%', 
        top: '42%', 
        width: '220px', 
        label: '建站工坊核心蓝图', 
        transform: 'perspective(800px) rotateX(20deg) rotateY(-5deg) rotateZ(6deg) skewX(-8deg)',
        collections: ['project', 'blog-design']
      },
      { 
        id: 'workshop-scroll', 
        type: 'scroll', 
        left: '70%', 
        top: '26%', 
        width: '120px', 
        label: '部署记录与技术长卷', 
        transform: 'rotate(-5deg)',
        collections: ['linux-notes', 'compiler-theory']
      }
    ],
  }
};

// -------------------------------------------------------------------------
// 样式组件 (Styled Components)
// -------------------------------------------------------------------------
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

// ── 全景总览热区布局 ───────────────────────────────────────────
const OverviewOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  width: 100%;
  height: 100%;
`;

const OverviewHalf = styled.div`
  flex: 1;
  height: 100%;
  position: relative;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: background-color 0.4s ease;

  &:hover {
    background-color: ${props => props.$glowColor};
  }
`;

const EntranceCard = styled(motion.div)`
  background: rgba(12, 10, 24, 0.85);
  border: 1.5px solid ${props => props.$borderColor};
  border-radius: 16px;
  padding: 1.6rem 2rem;
  max-width: 320px;
  text-align: center;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 
    0 15px 35px rgba(0,0,0,0.55),
    0 0 25px ${props => props.$borderColor}30;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  pointer-events: none;
`;

const EntranceTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 800;
  color: #ffedd5;
  margin: 0;
  letter-spacing: 0.05em;
`;

const EntranceDesc = styled.p`
  font-size: 0.8rem;
  color: rgba(254, 243, 199, 0.7);
  line-height: 1.5;
  margin: 0;
`;

const EntrancePrompt = styled.span`
  font-size: 0.7rem;
  font-weight: bold;
  color: ${props => props.$activeColor};
  letter-spacing: 0.15em;
  text-transform: uppercase;
  animation: ${scrollIndicatorFloat} 2s infinite ease-in-out;
  margin-top: 0.4rem;
`;

// ── 场景长廊分岔路标 ──────────────────────────────────────────
const SignpostContainer = styled(motion.div)`
  position: absolute;
  bottom: 2.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 0.75rem;
  background: rgba(12, 10, 24, 0.82);
  border: 1px solid rgba(231, 199, 126, 0.22);
  border-radius: 30px;
  padding: 6px 18px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.55);
  align-items: center;
`;

const SignpostLabel = styled.span`
  font-size: 0.68rem;
  color: rgba(231, 199, 126, 0.6);
  font-weight: bold;
  letter-spacing: 0.1em;
  border-right: 1px solid rgba(231, 199, 126, 0.2);
  padding-right: 0.6rem;
  margin-right: 0.1rem;
  white-space: nowrap;
`;

const SignpostItem = styled(motion.button)`
  background: transparent;
  border: none;
  color: ${props => props.$active ? '#ffedd5' : 'rgba(254, 243, 199, 0.55)'};
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    color: #e7c77e;
    background: rgba(231, 199, 126, 0.08);
  }
`;

// ── 二级近景场景 ──────────────────────────────────────────────
const CloseUpContainer = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 3;
  width: 100%;
  height: 100%;
  pointer-events: ${props => props.$isTransitioning ? 'none' : 'auto'};
`;

const CloseUpTitleBar = styled.div`
  position: absolute;
  top: 1.8rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  background: rgba(12, 10, 24, 0.75);
  border: 1px solid rgba(231, 199, 126, 0.18);
  border-radius: 50px;
  padding: 6px 18px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #ffedd5;
  letter-spacing: 0.1em;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.4);
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
  transform: ${props => props.$transform || 'none'};
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
    transform: ${props => props.$transform ? `${props.$transform} translateY(-8px) scale(1.05)` : 'translateY(-8px) scale(1.05)'};
    filter: ${props => getLightingFilter(props.$sceneId, true)} drop-shadow(0 15px 25px rgba(0,0,0,0.65));
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
  transform: ${props => props.$transform || 'none'};
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
    transform: ${props => props.$transform ? `${props.$transform} translateY(-8px) scale(1.05)` : 'translateY(-8px) scale(1.05)'};
    filter: ${props => getLightingFilter(props.$sceneId, true)} drop-shadow(0 15px 25px rgba(0,0,0,0.65));
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
  transform: ${props => props.$transform || 'none'};
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
    transform: ${props => props.$transform ? `${props.$transform} translateY(-8px) scale(1.05)` : 'translateY(-8px) scale(1.05)'};
    filter: ${props => getLightingFilter(props.$sceneId, true)} drop-shadow(0 15px 25px rgba(0,0,0,0.65));
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
  transform: ${props => props.$transform || 'none'};
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
    transform: ${props => props.$transform ? `${props.$transform} translateY(-8px) scale(1.05)` : 'translateY(-8px) scale(1.05)'};
    filter: ${props => getLightingFilter(props.$sceneId, true)} drop-shadow(0 15px 25px rgba(0,0,0,0.65));
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
  transform: ${props => props.$transform || 'none'};
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
    transform: ${props => props.$transform ? `${props.$transform} translateY(-8px) scale(1.05)` : 'translateY(-8px) scale(1.05)'};
    filter: ${props => getLightingFilter(props.$sceneId, true)} drop-shadow(0 15px 25px rgba(0,0,0,0.65));
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

// ── 古典返回按钮 ──────────────────────────────────────────────
const ReturnButton = styled(motion.button)`
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  z-index: 30;
  background: rgba(12, 10, 24, 0.8);
  border: 1px solid rgba(231, 199, 126, 0.3);
  border-radius: 30px;
  padding: 8px 18px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #e7c77e;
  letter-spacing: 0.05em;
  cursor: pointer;
  backdrop-filter: blur(8px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover {
    border-color: #e7c77e;
    color: #fff7df;
    box-shadow: 0 6px 24px rgba(231,199,126,0.2);
  }
`;

// ── 卷轴展开阅读面板 ───────────────────────────────────────────
const ScrollBackdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(3, 1, 8, 0.78);
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
`;

const ScrollPanelContainer = styled(motion.div)`
  position: relative;
  width: 780px;
  height: 560px;
  background-image: url(${props => props.$bgSrc});
  background-size: 100% 100%;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0,0,0,0.7);
  box-sizing: border-box;
  padding: 4.2rem 5.2rem 4.5rem 5.2rem;
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
// 主组件 (Blog)
// -------------------------------------------------------------------------
export default function Blog() {
  const [sceneMode, setSceneMode] = useState('overview'); // overview, indoor, outdoor, travel, archive, workshop
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [notesData, setNotesData] = useState([]);
  
  const currentScene = BLOG_SCENES[sceneMode];

  const changeScene = (mode) => {
    setSceneMode(mode);
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 750); // 稍微小于过渡动画 0.8s 的防抖锁定时间
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
        
        if (sceneMode === 'indoor') {
          // 屋内只有暖橙烛光浮粒
          this.color = `rgba(231, 199, 126, ${Math.random() * 0.4 + 0.18})`;
        } else if (sceneMode === 'outdoor') {
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
        
        const mouseShiftX = rawMouseRef.current.x * -25;
        this.x += this.speedX + Math.sin(this.wobble) * 0.18;
        
        if (this.y < -10 || (this.x + mouseShiftX) < -10 || (this.x + mouseShiftX) > canvas.width + 10) {
          this.reset();
        }
      }
      
      draw() {
        const mouseShiftX = rawMouseRef.current.x * -25;
        const mouseShiftY = rawMouseRef.current.y * -20;
        
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

    // 普通：绿叶/金叶 符纸直接查看单篇文章
    if (item.type === 'gold' || item.type === 'green') {
      let targetNote;
      if (item.filter) {
        targetNote = item.filter(notesData);
      } else if (item.collection) {
        targetNote = notesData.find(n => n.collection === item.collection);
      }
      
      if (!targetNote) {
        setActiveScrollTitle(item.label || '松果札记');
        setActiveScrollMeta('PINECONE NOTE');
        setModalNotes([]);
        setArticleTitle('林间碎语');
        setArticleBody('“松果屋建在林间石道深处。屋外有潺潺池塘，屋内有炉火微微。道友沿石阶而上，累了不妨在此稍歇。每一片被风送入屋内的落叶，都写着一个未完的日常。”');
        setSelectedArticleSlug('dummy-note');
        setIsModalOpen(true);
        return;
      }
      
      setActiveScrollTitle(targetNote.title);
      setActiveScrollMeta(`MANIFEST · ${targetNote.collectionLabel || 'NOTES'}`);
      setSelectedArticleSlug(targetNote.slug);
      setIsModalOpen(true);
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

  return (
    <PageWrapper>
      {/* 魔法 Canvas 浮光背景 */}
      <CanvasBackground ref={canvasRef} />

      <SceneContainer>
        {/* ─────────────────────────────────────────────────────────────
           背景过渡层 (Cross-fading Backgrounds)
           ───────────────────────────────────────────────────────────── */}
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
                x: sceneMode === scene.id ? bgX : 0,
                y: sceneMode === scene.id ? bgY : 0,
                zIndex: sceneMode === scene.id ? 0 : -1,
              }}
            />
          );
        })}

        {/* ─────────────────────────────────────────────────────────────
           1. 全景总览场景 (Overview Mode)
           ───────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {sceneMode === 'overview' && (
            <>
              <OverviewOverlay>
                {/* 左侧：松果屋入口 */}
                <OverviewHalf 
                  $glowColor="rgba(251, 191, 36, 0.08)"
                  onClick={() => changeScene('indoor')}
                >
                  <EntranceCard
                    $borderColor="#f59e0b"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.6, type: 'spring' }}
                  >
                    <EntranceTitle>叩门入室 · 松果屋</EntranceTitle>
                    <EntranceDesc>
                      推门进入温暖的松果木屋。在“碎叶墙”上，张贴着在下关于建站记录、日常琐碎与生活感悟的碎叶符纸。
                    </EntranceDesc>
                    <EntrancePrompt $activeColor="#fbbf24">
                      ✦ 进入碎叶符纸区 ➔
                    </EntrancePrompt>
                  </EntranceCard>
                </OverviewHalf>

                {/* 右侧：屋外书林入口 */}
                <OverviewHalf 
                  $glowColor="rgba(16, 185, 129, 0.06)"
                  onClick={() => changeScene('outdoor')}
                >
                  <EntranceCard
                    $borderColor="#10b981"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.6, type: 'spring' }}
                  >
                    <EntranceTitle>步入林间 · 叶间书林</EntranceTitle>
                    <EntranceDesc>
                      沿着木桥步入森林深处。悬挂在灵木枝桠上的竹简与青绿玉简，封印着在下关于技术长文与编译法门。
                    </EntranceDesc>
                    <EntrancePrompt $activeColor="#10b981">
                      ✦ 步入灵木卷轴区 ➔
                    </EntrancePrompt>
                  </EntranceCard>
                </OverviewHalf>
              </OverviewOverlay>
            </>
          )}
        </AnimatePresence>

        {/* 场景长廊分岔路标 (始终在底部显示，方便快速传送) */}
        <SignpostContainer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SignpostLabel>快速传送</SignpostLabel>
          <SignpostItem 
            $active={sceneMode === 'overview'} 
            onClick={() => changeScene('overview')}
          >
            🏰 总览
          </SignpostItem>
          <SignpostItem 
            $active={sceneMode === 'indoor'} 
            onClick={() => changeScene('indoor')}
          >
            🚪 屋内
          </SignpostItem>
          <SignpostItem 
            $active={sceneMode === 'outdoor'} 
            onClick={() => changeScene('outdoor')}
          >
            🌿 屋外
          </SignpostItem>
          <SignpostItem 
            $active={sceneMode === 'travel'} 
            onClick={() => changeScene('travel')}
          >
            🗺️ 旅案
          </SignpostItem>
          <SignpostItem 
            $active={sceneMode === 'archive'} 
            onClick={() => changeScene('archive')}
          >
            🗄️ 旧柜
          </SignpostItem>
          <SignpostItem 
            $active={sceneMode === 'workshop'} 
            onClick={() => changeScene('workshop')}
          >
            🛠️ 工坊
          </SignpostItem>
        </SignpostContainer>

        {/* ─────────────────────────────────────────────────────────────
           2. 二级近景场景 (各场景交互物件)
           ───────────────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {sceneMode !== 'overview' && (
            <CloseUpContainer
              key={sceneMode}
              $isTransitioning={isTransitioning}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.6 }}
            >
              <CloseUpTitleBar>{currentScene.title}</CloseUpTitleBar>

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
                      $transform={item.transform}
                      $sceneId={currentScene.id}
                      style={{ x: itemX, y: itemY }}
                      onClick={() => handleItemClick(item)}
                    >
                      <img src={imgSrc} alt={item.label} />
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
                      style={{ x: itemX, y: itemY }}
                      onClick={() => handleItemClick(item)}
                    >
                      <img src={BLOG_NEW_ASSETS.mapBook} alt={item.label} />
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
                      style={{ x: itemX, y: itemY }}
                      onClick={() => handleItemClick(item)}
                    >
                      <img src={BLOG_NEW_ASSETS.noteBox} alt={item.label} />
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
                      style={{ x: itemX, y: itemY }}
                      onClick={() => handleItemClick(item)}
                    >
                      <img src={BLOG_NEW_ASSETS.drawer} alt={item.label} />
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
                      style={{ x: itemX, y: itemY }}
                      onClick={() => handleItemClick(item)}
                    >
                      <img src={BLOG_NEW_ASSETS.blueprint} alt={item.label} />
                      <BlueprintLabel>{item.label}</BlueprintLabel>
                    </BlueprintItem>
                  );
                }

                return null;
              })}

              <ReturnButton 
                onClick={() => changeScene('overview')}
                whileHover={{ scale: 1.05, x: 2 }}
                whileTap={{ scale: 0.95 }}
              >
                🏰 返回大厅
              </ReturnButton>
            </CloseUpContainer>
          )}
        </AnimatePresence>
      </SceneContainer>

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
              initial={{ scale: 0.7, opacity: 0, width: 0 }}
              animate={{ scale: 1, opacity: 1, width: 780 }}
              exit={{ scale: 0.7, opacity: 0, width: 0 }}
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
