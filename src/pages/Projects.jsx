import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

// -------------------------------------------------------------------------
// 动效定义 (Animations)
// -------------------------------------------------------------------------

const spinCw = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const spinCcw = keyframes`
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
`;

const floatAnim = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-6px) rotate(2deg); }
`;

// -------------------------------------------------------------------------
// 魔法卡牌测试数据 (Projects Data)
// -------------------------------------------------------------------------

const PROJECTS_DATA = [
  {
    id: 'daimao-new-year',
    title: '怪猎呆猫贺新春',
    category: 'creative',
    categoryLabel: '构装术',
    element: 'Festival (春火)',
    elementColor: '#f59e0b',
    mana: '70',
    power: '84',
    ingredients: ['节庆视觉', '角色主题', '互动网页', '新春氛围'],
    shortDesc: '以怪猎呆猫为主题的贺新春网站，是当前项目工坊中最成形、可直接访问的节日造物。',
    longDesc: '这是一座偏节庆展示向的主题小站，以怪猎呆猫为核心意象，承载新春祝福、角色氛围与轻量互动。它适合作为项目页第一件正式陈列的作品：体量不必庞大，但主题明确、入口真实、能体现独立完成一个完整网页体验的能力。后续若补齐截图、动效拆解与制作复盘，就能沉淀成一篇很完整的项目札记。',
    demoUrl: 'https://xinchun.daimao.fun',
  },
  {
    id: 'fictional-world-map',
    title: '异世地理志地图工坊',
    category: 'frontend',
    categoryLabel: '塑形术',
    element: 'Cartography (地脉)',
    elementColor: '#06b6d4',
    mana: '66',
    power: '79',
    ingredients: ['Leaflet', '地图瓦片', 'TTRPG', '世界观设定'],
    shortDesc: '把现实地图魔改成小说与桌游世界观地图，借现实地理骨架生成异世界地脉。',
    longDesc: '这个方向借鉴 Obsidian TTRPG 类项目的世界观地图玩法：先用 Leaflet 承载现实地图与瓦片数据，再在此基础上进行地点改名、地貌重绘、势力范围标注、路线与事件点叠加，最终把现实地理转译成小说或桌游世界观可用的地图界面。它的价值不只是地图展示，而是把设定、路线、阵营、剧情节点统一落在一个可交互空间里。',
  },
  {
    id: 'bear-runner-agent',
    title: '熊大快跑自动化跑酷脚本',
    category: 'backend',
    categoryLabel: '炼金术',
    element: 'Vision (目识)',
    elementColor: '#8b5cf6',
    mana: '92',
    power: '68',
    ingredients: ['场景识别', 'AssetRipper', 'Unity', 'ML-Agents'],
    shortDesc: '从场景识别版地铁跑酷脚本获得灵感，尝试为熊大快跑构筑自动化判断与跑酷决策链路。',
    longDesc: '这是一个仍在技术验证期的高难方案：先尝试整理游戏素材，使用 AssetRipper 统一碎片资源，再在 Unity 中恢复 3D 场景素材；随后接入 ML-Agents，对场景素材进行多角度旋转拍照，生成训练样本，最终让 AI 学习障碍、道路与可行动作之间的对应关系。这个路线不一定能完全走通，但它很适合记录为一次“视觉识别 + 游戏素材复原 + 强化学习/模仿学习”的探索项目。',
  },
  {
    id: 'hangzhou-travel-map',
    title: '杭州灵游 3D 路线图',
    category: 'webgl',
    categoryLabel: '幻镜术',
    element: 'Terrain (山水)',
    elementColor: '#10b981',
    mana: '78',
    power: '76',
    ingredients: ['Obsidian 路线', '3D 地图', '路线规划', '2D 降维'],
    shortDesc: '把 Obsidian 里的杭州旅行路线转化为 3D 城市地图，并按需要降维成 2D 路线规划图。',
    longDesc: '这个项目从个人 Obsidian 旅行路线出发，将景点、交通、时间与笔记节点映射到一张 3D 版杭州地图中，形成更有空间感的旅行预演界面。当实际规划需要更高效率时，再把 3D 视角降维为 2D 地图，用来做路线排序、节点筛选与行程复盘。它既是旅行工具，也是把笔记系统和地图系统接起来的一次可视化实验。',
  }
];

// -------------------------------------------------------------------------
// 符文石定义 (Filters)
// -------------------------------------------------------------------------

const RUNE_FILTERS = [
  {
    key: 'all',
    label: '全部造物',
    glow: '#f59e0b',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    key: 'webgl',
    label: '幻镜术',
    glow: '#06b6d4',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    key: 'frontend',
    label: '塑形术',
    glow: '#8b5cf6',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    key: 'backend',
    label: '炼金术',
    glow: '#10b981',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v7.58a2 2 0 0 1-.59 1.42L3.83 16.6a2 2 0 0 0-.83 1.62V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1.78a2 2 0 0 0-.83-1.62l-5.58-5.6a2 2 0 0 1-.59-1.42V2h-4z" />
        <line x1="8" y1="2" x2="16" y2="2" />
        <line x1="6" y1="12" x2="18" y2="12" />
      </svg>
    ),
  },
  {
    key: 'creative',
    label: '构装术',
    glow: '#ef4444',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

// -------------------------------------------------------------------------
// 样式组件 (Styled Components)
// -------------------------------------------------------------------------

const PageWrapper = styled.div`
  min-height: 100vh;
  background: radial-gradient(circle at 50% 50%, #0c081d 0%, #05020c 100%);
  position: relative;
  color: #ffedd5;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow-x: hidden;
  padding-bottom: 5rem;
`;

const CanvasBackground = styled.canvas`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  width: 100%;
  height: 100%;
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
`;

const MainLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
`;

const LeftSection = styled.div`
  width: 100%;
`;

const HeaderSection = styled(motion.div)`

  text-align: center;
  max-width: 650px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  animation: ${floatAnim} 6s ease-in-out infinite;
`;

const Title = styled.h1`
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 900;
  letter-spacing: 0.05em;
  background: linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #d97706 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  filter: drop-shadow(0 2px 8px rgba(245, 158, 11, 0.25));
`;

const Subtitle = styled.p`
  font-size: clamp(0.85rem, 1.5vw, 1rem);
  color: rgba(254, 243, 199, 0.65);
  line-height: 1.6;
  margin: 0;
  font-style: italic;
  
  span {
    color: #f59e0b;
    font-weight: 600;
  }
`;

const IncubationSeal = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: min(100%, 760px);
  padding: 0.65rem 1rem;
  border: 1px dashed rgba(251, 191, 36, 0.48);
  border-radius: 10px;
  color: #fde68a;
  background:
    linear-gradient(135deg, rgba(120, 53, 15, 0.18), rgba(15, 12, 28, 0.58)),
    rgba(251, 191, 36, 0.06);
  box-shadow:
    inset 0 0 18px rgba(251, 191, 36, 0.06),
    0 10px 26px rgba(0, 0, 0, 0.24);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  line-height: 1.65;
  text-align: center;
`;

// -------------------------------------------------------------------------
// 符文石过滤器样式
// -------------------------------------------------------------------------

const FilterContainer = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1.5rem 1.2rem;
  width: 100%;
  max-width: 800px;
  margin-top: 1rem;
`;

const RuneShockwave = styled(motion.span)`
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 2px solid ${props => props.$color};
  pointer-events: none;
`;

const RuneButton = styled.button`
  position: relative;
  background: rgba(15, 12, 28, 0.72);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  color: ${props => props.$active ? props.$glowColor : 'rgba(254, 243, 199, 0.4)'};
  box-shadow: ${props => props.$active 
    ? `0 0 20px ${props.$glowColor}40, inset 0 0 10px ${props.$glowColor}25` 
    : '0 4px 12px rgba(0, 0, 0, 0.5)'};
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  backdrop-filter: blur(8px);

  svg {
    width: 26px;
    height: 26px;
    transition: transform 0.3s ease;
  }

  &:hover {
    color: ${props => props.$glowColor};
    border-color: ${props => props.$glowColor}60;
    box-shadow: 0 0 18px ${props => props.$glowColor}30;
    transform: translateY(-2px);
    svg {
      transform: scale(1.1) rotate(5deg);
    }
  }

  &::before {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 1px dashed ${props => props.$active ? props.$glowColor : 'transparent'};
    opacity: 0.5;
    animation: ${spinCw} 15s linear infinite;
    pointer-events: none;
  }
`;

const RuneWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
`;

const RuneLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: ${props => props.$active ? '#ffedd5' : 'rgba(254, 243, 199, 0.5)'};
  transition: color 0.3s ease;

  ${RuneWrapper}:hover & {
    color: #ffedd5;
  }
`;

// -------------------------------------------------------------------------
// 魔法卡片样式
// -------------------------------------------------------------------------

const GridContainer = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2.2rem 1.8rem;
  width: 100%;
  margin-top: 1rem;
`;

const CardGlow = styled.div`
  position: absolute;
  inset: -1.5px;
  border-radius: 12px;
  background: linear-gradient(135deg, transparent 40%, ${props => props.$color} 100%);
  opacity: 0.12;
  transition: opacity 0.3s ease;
  z-index: 0;
  pointer-events: none;
`;

const CardTitle = styled.h3`
  font-size: 1.15rem;
  font-weight: 800;
  color: #ffedd5;
  margin: 0;
  letter-spacing: 0.03em;
  transition: color 0.3s ease;
`;

const CardHeader = styled.div`
  position: relative;
  height: 110px;
  border-radius: 8px 8px 0 0;
  background: radial-gradient(circle at 50% 50%, rgba(20, 15, 38, 0.8) 0%, rgba(8, 6, 18, 0.95) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  .circle-outer {
    position: absolute;
    width: 90px;
    height: 90px;
    color: ${props => props.$color}30;
    animation: ${spinCw} 20s linear infinite;
    transition: color 0.3s ease;
  }

  .circle-inner {
    position: absolute;
    width: 65px;
    height: 65px;
    color: ${props => props.$color}50;
    animation: ${spinCcw} 12s linear infinite;
    transition: color 0.3s ease;
  }
`;

const ProjectCard = styled(motion.div)`
  position: relative;
  background: rgba(12, 10, 24, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  z-index: 1;

  &:hover {
    border-color: ${props => props.$color}45;
    box-shadow: 
      0 15px 35px rgba(0, 0, 0, 0.5),
      0 0 20px ${props => props.$color}15;
    
    ${CardGlow} {
      opacity: 0.28;
    }

    ${CardHeader} .circle-outer {
      color: ${props => props.$color}60;
    }
    ${CardHeader} .circle-inner {
      color: ${props => props.$color}90;
    }
    ${CardTitle} {
      color: ${props => props.$color};
    }
  }
`;

const CardBody = styled.div`
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  flex: 1;
  position: relative;
  z-index: 1;
`;

const CardMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const ElementBadge = styled.span`
  color: ${props => props.$color};
  background: ${props => props.$color}14;
  padding: 0.2rem 0.6rem;
  border-radius: 50px;
  border: 1px solid ${props => props.$color}30;
`;

const ManaCost = styled.span`
  color: #fbbf24;
`;

const CardDesc = styled.p`
  font-size: 0.82rem;
  color: rgba(254, 243, 199, 0.6);
  line-height: 1.5;
  margin: 0;
  flex: 1;
`;

const CardIngredients = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
`;

const IngredientTag = styled.span`
  font-size: 0.68rem;
  font-weight: 600;
  color: #ffedd5;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
`;

// -------------------------------------------------------------------------
// 法术卷轴弹窗样式 (Scroll Expand Modal)
// -------------------------------------------------------------------------

const ScrollBackdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(3, 1, 8, 0.75);
  backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
`;

const ScrollWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 480px; /* 卷轴的固定高度 */
`;

const Roller = styled(motion.div)`
  position: absolute;
  width: 14px;
  height: 520px; /* 比羊皮纸稍长，做出木轴感 */
  background: linear-gradient(to right, #451a03, #d97706, #78350f, #3b0764);
  border-radius: 8px;
  box-shadow: 
    0 8px 20px rgba(0,0,0,0.6),
    inset 1px 1px 3px rgba(255,255,255,0.15);
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;

  &::before, &::after {
    content: '';
    width: 24px;
    height: 16px;
    background: radial-gradient(circle, #fbbf24 30%, #b45309 80%);
    border: 1.5px solid #78350f;
    border-radius: 4px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.5);
  }
  &::before { transform: translateY(-8px); }
  &::after { transform: translateY(8px); }
`;

const ParchmentPaper = styled(motion.div)`
  height: 480px;
  background: #fbf5e6; /* 仿旧羊皮纸 */
  background-image: radial-gradient(circle, #fbf5e6 60%, #eedeb5 100%);
  border-top: 3px solid #b45309;
  border-bottom: 3px solid #b45309;
  box-shadow: 
    inset 0 0 35px rgba(120, 53, 15, 0.28),
    0 15px 40px rgba(0, 0, 0, 0.6);
  position: relative;
  overflow: hidden;
  z-index: 5;
`;

const ParchmentInner = styled.div`
  width: 580px; /* 羊皮纸内容真实宽度 */
  height: 100%;
  padding: 2.2rem 2.8rem;
  color: #451a03; /* 羊皮纸暗色墨迹文字 */
  font-family: Georgia, 'Times New Roman', Times, serif;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  overflow-y: auto;
  box-sizing: border-box;

  /* 自定义羊皮纸内滚动条样式 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(180, 83, 9, 0.08);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(180, 83, 9, 0.4);
    border-radius: 3px;
  }
`;

const ParchmentTitle = styled.h2`
  font-size: 1.45rem;
  font-weight: 800;
  text-align: center;
  color: #7c2d12;
  margin: 0;
  letter-spacing: 0.08em;
  border-bottom: 2px dashed rgba(180, 83, 9, 0.25);
  padding-bottom: 0.6rem;
  position: relative;

  &::after {
    content: '◆';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    background: #fbf5e6;
    padding: 0 8px;
    color: #b45309;
    font-size: 0.75rem;
  }
`;

const ParchmentLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 180px;
  gap: 1.5rem;
  margin-top: 0.5rem;

  @media (max-width: 580px) {
    grid-template-columns: 1fr;
  }
`;

const ScrollDesc = styled.p`
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0;
  text-align: justify;
  text-indent: 1.5em;
  color: #5c2807;
`;

const ScrollSidebar = styled.div`
  border-left: 1px dashed rgba(180, 83, 9, 0.2);
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  font-family: 'Outfit', sans-serif;
  font-size: 0.78rem;

  @media (max-width: 580px) {
    border-left: none;
    padding-left: 0;
    border-top: 1px dashed rgba(180, 83, 9, 0.2);
    padding-top: 0.8rem;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const StatLabel = styled.span`
  color: #7c2d12;
  font-weight: 700;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatBarBg = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(180, 83, 9, 0.15);
  border-radius: 3px;
  overflow: hidden;
`;

const StatBarFill = styled.div`
  height: 100%;
  background: ${props => props.$fillColor || '#fbbf24'};
  width: ${props => props.$percentage}%;
  border-radius: 3px;
`;

const SpellIngredients = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

const SpellIngredientTag = styled.span`
  background: rgba(180, 83, 9, 0.1);
  border: 1px solid rgba(180, 83, 9, 0.25);
  color: #7c2d12;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
`;

const PortalButtonWrapper = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: auto;
  padding-top: 1rem;
  font-family: 'Outfit', sans-serif;
`;

const PortalButton = styled.a`
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 0.5rem 1.2rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.25s ease;

  ${props => props.$primary 
    ? `
      background: linear-gradient(135deg, #b45309 0%, #7c2d12 100%);
      color: #ffedd5;
      border: 1px solid #78350f;
      box-shadow: 0 4px 10px rgba(124, 45, 18, 0.25);
      &:hover {
        transform: translateY(-1.5px);
        box-shadow: 0 6px 14px rgba(124, 45, 18, 0.4);
        background: linear-gradient(135deg, #d97706 0%, #9a3412 100%);
      }
    `
    : `
      background: transparent;
      color: #7c2d12;
      border: 1.5px solid #7c2d12;
      &:hover {
        transform: translateY(-1.5px);
        background: rgba(124, 45, 18, 0.08);
      }
    `
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #7c2d12;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  transition: background 0.2s ease;
  z-index: 8;

  &:hover {
    background: rgba(124, 45, 18, 0.1);
  }
`;

// -------------------------------------------------------------------------
// 渲染组件 (React Component)
// -------------------------------------------------------------------------

const Projects = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [shockwaveIndex, setShockwaveIndex] = useState(null);
  const canvasRef = useRef(null);

  // 魔法微粒背景 Canvas 逻辑
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];
    let trail = [];
    let mouse = { x: null, y: null };

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // 微粒 Class
    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        if (!canvas) return;
        this.x = Math.random() * canvas.width;
        this.y = init ? Math.random() * canvas.height : canvas.height + Math.random() * 80;
        this.size = Math.random() * 2.8 + 0.8;
        this.speedY = -(Math.random() * 1.2 + 0.3);
        this.speedX = Math.random() * 0.4 - 0.2;
        
        // 随机产生不同魔法色系微粒 (紫色-奥术，蓝色-冰，金色-火)
        const rand = Math.random();
        if (rand > 0.82) {
          this.color = `rgba(245, 158, 11, ${Math.random() * 0.4 + 0.15})`; // 金色
        } else if (rand > 0.65) {
          this.color = `rgba(6, 182, 212, ${Math.random() * 0.4 + 0.15})`; // 青蓝
        } else {
          this.color = `rgba(167, 139, 250, ${Math.random() * 0.35 + 0.15})`; // 紫色
        }
        
        this.wobbleSpeed = Math.random() * 0.03 + 0.008;
        this.wobbleRange = Math.random() * 15 + 4;
        this.wobbleValue = Math.random() * Math.PI * 2;
      }

      update() {
        this.y += this.speedY;
        this.wobbleValue += this.wobbleSpeed;
        this.x += this.speedX + Math.sin(this.wobbleValue) * 0.2;

        if (this.y < -10) {
          this.reset();
        }
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = this.size * 2;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // 重置
      }
    }

    // 鼠标移动产生闪烁轨迹
    const handleMouseMove = (e) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      
      if (trail.length < 60) {
        trail.push({
          x: mouse.x,
          y: mouse.y,
          size: Math.random() * 3.5 + 1.5,
          color: 'rgba(251, 191, 36, 0.7)',
          life: 1.0,
          decay: Math.random() * 0.05 + 0.025,
          speedX: Math.random() * 0.8 - 0.4,
          speedY: Math.random() * 0.8 - 0.4,
        });
      }
    };

    canvas.parentElement.addEventListener('mousemove', handleMouseMove);

    // 初始化微粒
    for (let i = 0; i < 40; i++) {
      particles.push(new Particle());
    }

    // 动画循环
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 更新与绘制环境浮粒
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // 更新与绘制轨迹
      for (let i = trail.length - 1; i >= 0; i--) {
        const t = trail[i];
        t.x += t.speedX;
        t.y += t.speedY;
        t.life -= t.decay;

        if (t.life <= 0) {
          trail.splice(i, 1);
        } else {
          ctx.fillStyle = `rgba(245, 158, 11, ${t.life})`;
          ctx.shadowBlur = t.size * 2.5;
          ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
          ctx.beginPath();
          ctx.arc(t.x, t.y, t.size * t.life, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      if (canvas.parentElement) {
        canvas.parentElement.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  const handleFilterClick = (filterKey, index) => {
    setActiveFilter(filterKey);
    setShockwaveIndex(index);
    // 动画波动振荡后清除冲击波
    setTimeout(() => setShockwaveIndex(null), 700);
  };

  const filteredProjects = activeFilter === 'all'
    ? PROJECTS_DATA
    : PROJECTS_DATA.filter(p => p.category === activeFilter);

  return (
    <PageWrapper>
      {/* 魔法 Canvas 微粒背景 */}
      <CanvasBackground ref={canvasRef} />

      <ContentWrapper>
        {/* 页头区 */}
        <HeaderSection
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Title>幽霜析粹所 · 项目孵化炉</Title>
          <Subtitle>
            在皑皑雪峰与极寒之下的魔法实验室，陈列着已成形、正炼制与待验证的项目造物。点击可 <span>展开法术卷轴</span>
          </Subtitle>
          <IncubationSeal>
            孵化封条：本页仍在打磨中，当前开放为项目预览与 UI 试炼场。内容可点开查看，但部分造物尚未接入正式演示与复盘手札。
          </IncubationSeal>
        </HeaderSection>

        {/* 符文分类栏 */}
        <FilterContainer>
          {RUNE_FILTERS.map((filter, index) => {
            const isActive = activeFilter === filter.key;
            return (
              <RuneWrapper
                key={filter.key}
                onClick={() => handleFilterClick(filter.key, index)}
              >
                <RuneButton
                  $active={isActive}
                  $glowColor={filter.glow}
                  type="button"
                >
                  {filter.icon}
                  
                  {/* 点击时的魔力波纹扩散 */}
                  <AnimatePresence>
                    {shockwaveIndex === index && (
                      <RuneShockwave
                        $color={filter.glow}
                        initial={{ scale: 0.4, opacity: 0.8 }}
                        animate={{ scale: 2.0, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.65, ease: 'easeOut' }}
                      />
                    )}
                  </AnimatePresence>
                </RuneButton>
                <RuneLabel $active={isActive}>{filter.label}</RuneLabel>
              </RuneWrapper>
            );
          })}
        </FilterContainer>

        {/* 主体双栏布局 */}
        <MainLayout>
          {/* 左栏：卡牌列表网格 */}
          <LeftSection>
            <GridContainer layout>
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((proj) => (
                  <ProjectCard
                    key={proj.id}
                    $color={proj.elementColor}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    onClick={() => setSelectedProject(proj)}
                    whileHover={{ y: -6 }}
                  >
                    <CardGlow $color={proj.elementColor} />
                    
                    {/* 魔法星盘图案 */}
                    <CardHeader $color={proj.elementColor}>
                      <svg className="circle-outer" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <circle cx="50" cy="50" r="45" strokeDasharray="3 3" />
                        <circle cx="50" cy="50" r="38" />
                        <polygon points="50 15 80 68 20 68" />
                      </svg>
                      <svg className="circle-inner" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
                        <circle cx="50" cy="50" r="28" strokeDasharray="2 2" />
                        <polygon points="50 78 75 35 25 35" />
                        <circle cx="50" cy="50" r="8" fill="currentColor" fillOpacity="0.2" />
                      </svg>
                    </CardHeader>

                    <CardBody>
                      <CardMeta>
                        <ElementBadge $color={proj.elementColor}>{proj.element}</ElementBadge>
                        <ManaCost>Mana {proj.mana}</ManaCost>
                      </CardMeta>
                      
                      <CardTitle>{proj.title}</CardTitle>
                      <CardDesc>{proj.shortDesc}</CardDesc>
                      
                      <CardIngredients>
                        {proj.ingredients.map(ing => (
                          <IngredientTag key={ing}>{ing}</IngredientTag>
                        ))}
                      </CardIngredients>
                    </CardBody>
                  </ProjectCard>
                ))}
              </AnimatePresence>
            </GridContainer>
          </LeftSection>

        </MainLayout>
      </ContentWrapper>

      {/* 横向法术卷轴展开弹窗 (Scroll Expand Modal) */}
      <AnimatePresence>
        {selectedProject && (
          <ScrollBackdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProject(null)}
          >
            {/* 点击卷轴内部阻止关闭事件冒泡 */}
            <ScrollWrapper onClick={(e) => e.stopPropagation()}>
              
              {/* 左卷轴木轴 */}
              <Roller
                initial={{ x: 0 }}
                animate={{ x: -290 }} // 朝左移动一半宽度
                exit={{ x: 0 }}
                transition={{ type: 'spring', stiffness: 80, damping: 14 }}
              >
                {/* 滚动条左卷轴自转动效 */}
                <motion.div
                  style={{ display: 'none' }} /* 用于占位，不显示具体DOM，旋转用在Roller上 */
                />
              </Roller>

              {/* 羊皮纸内容区域 - 宽度横向展开 */}
              <ParchmentPaper
                initial={{ width: 0 }}
                animate={{ width: 580 }} // 横向展开至580px
                exit={{ width: 0 }}
                transition={{ type: 'spring', stiffness: 80, damping: 14 }}
              >
                <ParchmentInner>
                  {/* 关闭按钮 */}
                  <CloseButton onClick={() => setSelectedProject(null)}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </CloseButton>

                  {/* 卷轴标题 */}
                  <ParchmentTitle>
                    法术简卷：{selectedProject.title}
                  </ParchmentTitle>

                  {/* 双栏布局 */}
                  <ParchmentLayout>
                    {/* 左：项目详细描述（羊皮纸墨水字体） */}
                    <ScrollDesc>
                      {selectedProject.longDesc}
                    </ScrollDesc>

                    {/* 右：法术属性边栏 */}
                    <ScrollSidebar>
                      <StatItem>
                        <StatLabel>造物属性 (Element)</StatLabel>
                        <span style={{ fontWeight: 800, color: selectedProject.elementColor }}>
                          {selectedProject.element}
                        </span>
                      </StatItem>

                      <StatItem>
                        <StatLabel>魔力消耗 (Mana Cost)</StatLabel>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 800, color: '#b45309' }}>{selectedProject.mana}</span>
                          <StatBarBg>
                            <StatBarFill $percentage={selectedProject.mana} $fillColor="#d97706" />
                          </StatBarBg>
                        </div>
                      </StatItem>

                      <StatItem>
                        <StatLabel>能量强度 (Power Level)</StatLabel>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 800, color: '#7c2d12' }}>{selectedProject.power}</span>
                          <StatBarBg>
                            <StatBarFill $percentage={selectedProject.power} $fillColor="#b45309" />
                          </StatBarBg>
                        </div>
                      </StatItem>

                      <StatItem>
                        <StatLabel>施法材料 (Ingredients)</StatLabel>
                        <SpellIngredients>
                          {selectedProject.ingredients.map(ing => (
                            <SpellIngredientTag key={ing}>{ing}</SpellIngredientTag>
                          ))}
                        </SpellIngredients>
                      </StatItem>
                    </ScrollSidebar>
                  </ParchmentLayout>

                  {/* 底部魔力传送门链接 */}
                  {(selectedProject.codeUrl || selectedProject.demoUrl) && (
                    <PortalButtonWrapper>
                      {selectedProject.codeUrl && (
                        <PortalButton
                          href={selectedProject.codeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateY(0.5px)' }}>
                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                          </svg>
                          源码秘典 (Codex)
                        </PortalButton>
                      )}
                      {selectedProject.demoUrl && (
                        <PortalButton
                          $primary
                          href={selectedProject.demoUrl}
                          target={selectedProject.demoUrl.startsWith('http') ? '_blank' : undefined}
                          rel={selectedProject.demoUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateY(0.5px)' }}>
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          </svg>
                          镜面通道 (Portal)
                        </PortalButton>
                      )}
                    </PortalButtonWrapper>
                  )}
                </ParchmentInner>
              </ParchmentPaper>

              {/* 右卷轴木轴 */}
              <Roller
                initial={{ x: 0 }}
                animate={{ x: 290 }} // 朝右移动一半宽度
                exit={{ x: 0 }}
                transition={{ type: 'spring', stiffness: 80, damping: 14 }}
              >
                {/* 滚动条右卷轴自转动效 */}
                <motion.div
                  style={{ display: 'none' }}
                />
              </Roller>

            </ScrollWrapper>
          </ScrollBackdrop>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default Projects;
