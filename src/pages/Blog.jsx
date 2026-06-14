import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import mermaid from 'mermaid';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BLOG_NEW_ASSETS } from '../constants/blogAssets';
import { parseFrontmatter } from '../utils/frontmatter';
import { fetchNotesIndex, fetchGraphData } from '../utils/publishData';
import remarkHtmlBreaks from '../utils/remarkHtmlBreaks';

// Helper to fix bold (** or __) formatting next to Chinese/English text and punctuation
const preprocessMarkdown = (text) => {
  if (!text) return text;
  return text
    // 1. letter/number/Chinese + ** + opening punctuation -> insert space before **
    .replace(/([a-zA-Z0-9\u4e00-\u9fa5])\*\*([“"「『（(【[])/g, '$1 **$2')
    // 2. closing punctuation + ** + letter/number/Chinese -> insert space after **
    .replace(/([”"」』）)】\]])\*\*([a-zA-Z0-9\u4e00-\u9fa5])/g, '$1** $2');
};

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

const LoadingScreen = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: #080610;
  z-index: 999999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  color: #ffedd5;
  user-select: none;
  -webkit-user-select: none;
  
  .magic-circle {
    width: 80px;
    height: 80px;
    border: 2px dashed rgba(231, 199, 126, 0.25);
    border-radius: 50%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    animation: loadingSpin 15s linear infinite;
    
    &::before {
      content: '';
      position: absolute;
      width: 60px;
      height: 60px;
      border: 1px solid rgba(231, 199, 126, 0.45);
      border-radius: 50%;
      border-left-color: transparent;
      border-right-color: transparent;
      animation: loadingSpinCounter 6s linear infinite;
    }
    
    &::after {
      content: '🔮';
      font-size: 1.5rem;
      animation: loadingBreathe 2s ease-in-out infinite alternate;
    }
  }

  .loading-text {
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: rgba(255, 237, 213, 0.85);
    text-shadow: 0 0 10px rgba(231, 199, 126, 0.35);
  }

  .loading-bar-bg {
    width: 140px;
    height: 2px;
    background: rgba(231, 199, 126, 0.1);
    border-radius: 2px;
    overflow: hidden;
    position: relative;
  }

  .loading-bar-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: linear-gradient(90deg, transparent, #e7c77e, transparent);
    animation: loadingBarMove 1.5s infinite linear;
  }

  @keyframes loadingSpin {
    to { transform: rotate(360deg); }
  }

  @keyframes loadingSpinCounter {
    to { transform: rotate(-360deg); }
  }

  @keyframes loadingBreathe {
    0% { transform: scale(0.9); opacity: 0.7; }
    100% { transform: scale(1.1); opacity: 1; }
  }

  @keyframes loadingBarMove {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;
// -------------------------------------------------------------------------
// 长廊场景配置定义 (Scene Corridor Config)
// -------------------------------------------------------------------------
const BLOG_SCENES = {
  overview: {
    id: 'overview',
    title: '松果屋总览',
    subtitle: '夜色落在树冠之间，灯火从木门与林桥深处慢慢亮起。\n这里是松窗灵笈台的入口，也是所有手札、卷轴与旧档案的起点。',
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
        desc: '沿着木桥进入松窗灵笈台，翻阅长文、技术笔记与专题卷轴。',
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
        filter: (notes) => notes.find(n => n.slug === '博客网站/05_闲情 (幕后与手札)/松果灵感书屋的诞生记')
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
        filter: (notes) => notes.find(n => n.slug === '01_藏经阁（知识库）/思辨录（认知与方法论）/屋主札记：在林间对抗知识腐化')
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
        label: '修真见闻', 
        collection: 'travel', 
        transform: 'rotate(15deg)',
        filter: (notes) => notes.find(n => n.slug === '知识杂货铺/你吃的每一根香蕉都是同一棵树的克隆体')
      },
      { 
        id: 'green-3', 
        type: 'green', 
        left: '68%', 
        top: '38%', 
        width: '70px', 
        label: '心境碎片', 
        collection: 'desk-thoughts', 
        transform: 'rotate(-20deg)',
        filter: (notes) => notes.filter(n => n.collection === 'desk-thoughts' && !n.title.includes('索引'))[0] || notes.filter(n => n.collection === 'desk-thoughts')[0] 
      },
      { 
        id: 'green-4', 
        type: 'green', 
        left: '78%', 
        top: '56%', 
        width: '70px', 
        label: '松果碎语', 
        collection: 'desk-thoughts', 
        transform: 'rotate(10deg)',
        filter: (notes) => notes.filter(n => n.collection === 'desk-thoughts' && !n.title.includes('索引'))[1] || notes.filter(n => n.collection === 'desk-thoughts')[1] 
      },
    ],
  },
  outdoor: {
    id: 'outdoor',
    title: '松窗灵笈台',
    subtitle: '木桥通往更深的林廊，卷轴悬在枝叶与灯火之间。\n这里收藏着篇幅更长的记录：技术、建站、图谱与慢慢整理成形的思考。',
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
        label: 'Linux与嵌入式', 
        transform: 'rotate(3deg)',
        collections: ['linux-notes', 'embedded'] 
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
        desc: '离开旅行书案，回到松窗灵笈台之中。',
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
        type: 'map-cutout',
        left: '0%',
        top: '0%',
        width: '100%',
        height: '100%',
        label: '杭州旅游地图册', 
        imgSrc: BLOG_NEW_ASSETS.mapCutout,
        hitKey: 'travelMap',
        hitLeft: '5.98%',
        hitTop: '27.95%',
        hitWidth: '33.91%',
        hitHeight: '36.13%',
        labelLeft: '28%',
        labelTop: '56%',
        collections: ['travel'],
        articleMeta: 'MAP · HANGZHOU'
      },
      {
        id: 'travel-map-scroll',
        type: 'cutout-scroll',
        left: '0%',
        top: '0%',
        width: '100%',
        height: '100%',
        label: '5月3日攻略',
        imgSrc: BLOG_NEW_ASSETS.mapScroll,
        hitKey: 'mapScroll',
        hitLeft: '36.9%',
        hitTop: '49.84%',
        hitWidth: '8.61%',
        hitHeight: '9.56%',
        labelLeft: '41.3%',
        labelTop: '59.8%',
        articleSlug: '杭州旅游攻略/五一路线/5月3日攻略',
        collections: ['travel'],
        articleMeta: 'TRAVEL · SCHEDULE'
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
        id: 'archive-legacy-plans', 
        type: 'cutout-prop', 
        left: '0%', 
        top: '0%', 
        width: '100%', 
        height: '100%',
        hitKey: 'archiveLegacyPlans',
        hitLeft: '9.75%', 
        hitTop: '17.64%', 
        hitWidth: '11.36%', 
        hitHeight: '32.84%',
        labelLeft: '15.4%',
        labelTop: '13.5%',
        label: '旧方案与重制记录',
        articleMeta: 'ARCHIVE · SCHEMES',
        imgSrc: BLOG_NEW_ASSETS.archiveDrawerStack01,
        collections: ['blog-design'],
        filter: (notes) => notes.filter((note) => {
          return note.slug.includes('博客页-废弃方案');
        })
      },
      { 
        id: 'archive-issue-logs', 
        type: 'cutout-prop', 
        left: '0%', 
        top: '0%', 
        width: '100%', 
        height: '100%',
        hitKey: 'archiveIssueLogs',
        hitLeft: '68.42%', 
        hitTop: '43.46%', 
        hitWidth: '14.95%', 
        hitHeight: '21.57%',
        labelLeft: '68%',
        labelTop: '48.5%',
        label: '问题总录与补救日志',
        articleMeta: 'ARCHIVE · ISSUES',
        imgSrc: BLOG_NEW_ASSETS.archiveDrawerStack02,
        collections: ['blog-design', 'project'],
        filter: (notes) => notes.filter((note) => {
          return /代码审查报告|故障排查|错误复盘|排错记录/.test(note.title) || 
                 /待解决问题|故障排查/.test(note.slug);
        })
      }
    ],
  },
  workshop: {
    id: 'workshop',
    title: '建站工坊',
    subtitle: '蓝图、卷轴和发光仪器堆在工作台上。\n这里不仅记录着松果屋的搭造成长史，更陈列着正在调制中的未来企划与奇思妙想。',
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
        id: 'workshop-astrolabe', 
        type: 'cutout-prop', 
        left: '0%', 
        top: '0%', 
        width: '100%', 
        height: '100%',
        label: 'Obsidian 知识星盘',
        imgSrc: BLOG_NEW_ASSETS.workshopAstrolabe,
        hitKey: 'workshopAstrolabe',
        hitLeft: '34.03%',
        hitTop: '33.05%',
        hitWidth: '8.67%',
        hitHeight: '20.62%',
        labelLeft: '38.3%',
        labelTop: '29%',
        articleSlug: '01_藏经阁（知识库）/思辨录（认知与方法论）/Obsidian本质理解：Markdown、HTML 与 AI 时代的知识工作流',
        articleMeta: 'WORKSHOP · OBSIDIAN'
      },
      { 
        id: 'workshop-blueprint-map', 
        type: 'cutout-prop', 
        left: '0%', 
        top: '0%', 
        width: '100%', 
        height: '100%',
        label: '空间长廊蓝图',
        imgSrc: BLOG_NEW_ASSETS.workshopBlueprintMap,
        hitKey: 'workshopBlueprintMap',
        hitLeft: '40.13%',
        hitTop: '57.17%',
        hitWidth: '24.7%',
        hitHeight: '16.9%',
        labelLeft: '52.5%',
        labelTop: '71%',
        articleSlug: '博客网站/99_遗迹 (历史陈迹)/博客页-废弃方案/博客页空间长廊重构方案v0.2',
        articleMeta: 'WORKSHOP · BLUEPRINT'
      },
      {
        id: 'workshop-potions',
        type: 'cutout-prop',
        left: '0%',
        top: '0%',
        width: '100%',
        height: '100%',
        label: '未来构想魔药',
        imgSrc: BLOG_NEW_ASSETS.workshopPotions,
        hitKey: 'workshopPotions',
        hitLeft: '75.06%',
        hitTop: '57.39%',
        hitWidth: '10.29%',
        hitHeight: '22.95%',
        labelLeft: '80.2%',
        labelTop: '82%',
        articleMeta: 'WORKSHOP · FUTURE',
        collections: ['blog-design'],
        filter: (notes) => notes.filter((note) => {
          return note.slug.includes('博客页-重制版');
        })
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
  width: min(420px, calc(100% - 32px));
  padding: 1.45rem;
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
  font-size: 0.82rem;
  color: rgba(61, 34, 18, 0.85);
  line-height: 1.58;
  margin: 0;
  font-style: italic;
  display: -webkit-box;
  -webkit-line-clamp: 4;
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
  { from: 'overview', to: 'indoor', label: '叩门', x1: 50, y1: 18, x2: 30, y2: 40, color: '#fbbf24' },
  { from: 'overview', to: 'outdoor', label: '出林', x1: 50, y1: 18, x2: 70, y2: 40, color: '#10b981' },
  { from: 'outdoor', to: 'travel', label: '栈道', x1: 70, y1: 40, x2: 70, y2: 72, color: '#fb923c' },
  { from: 'indoor', to: 'junction', label: '拱门', x1: 30, y1: 40, x2: 30, y2: 64, color: '#818cf8' },
  { from: 'junction', to: 'archive', label: '旧柜', x1: 30, y1: 64, x2: 18, y2: 82, color: '#c084fc' },
  { from: 'junction', to: 'workshop', label: '工坊', x1: 30, y1: 64, x2: 46, y2: 82, color: '#38bdf8' }
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
  background: rgba(12, 10, 24, 0.72);
  border: 1px solid rgba(251, 191, 36, 0.22);
  border-radius: 20px;
  color: #ffedd5;
  font-size: 0.68rem;
  padding: 4px 12px;
  text-align: center;
  letter-spacing: 0.06em;
  white-space: nowrap;
  pointer-events: none;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  opacity: 0.65;
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  &::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #fbbf24;
    margin-right: 6px;
    box-shadow: 0 0 6px rgba(251, 191, 36, 0.6);
    transition: all 0.3s ease;
  }
  
  ${LeafItem}:hover & {
    opacity: 1;
    transform: translateY(-4px);
    background: rgba(12, 10, 24, 0.9);
    border-color: #fbbf24;
    color: #fbbf24;
    box-shadow: 0 4px 20px rgba(251, 191, 36, 0.35), 0 0 10px rgba(251, 191, 36, 0.2);
    
    &::before {
      background: #fbbf24;
      box-shadow: 0 0 10px #fbbf24, 0 0 4px #fbbf24;
    }
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
      animation: ${props => props.$imgSrc ? 'none' : css`${scrollSway} 2.5s infinite ease-in-out`};
    }
  }
`;

const ScrollLabel = styled.div`
  margin-top: 0.35rem;
  background: rgba(4, 12, 10, 0.72);
  border: 1px solid rgba(16, 185, 129, 0.22);
  border-radius: 20px;
  color: #e2fbf2;
  font-size: 0.68rem;
  padding: 4px 12px;
  text-align: center;
  letter-spacing: 0.06em;
  white-space: nowrap;
  pointer-events: none;
  font-weight: 800;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  opacity: 0.65;
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  &::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
    margin-right: 6px;
    box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
    transition: all 0.3s ease;
  }
  
  ${ScrollItem}:hover & {
    opacity: 1;
    transform: translateY(-4px);
    background: rgba(4, 12, 10, 0.9);
    border-color: #10b981;
    color: #10b981;
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.35), 0 0 10px rgba(16, 185, 129, 0.2);
    
    &::before {
      background: #10b981;
      box-shadow: 0 0 10px #10b981, 0 0 4px #10b981;
    }
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
  background: rgba(12, 10, 24, 0.72);
  border: 1px solid rgba(245, 158, 11, 0.22);
  border-radius: 20px;
  color: #ffedd5;
  font-size: 0.68rem;
  padding: 4px 12px;
  text-align: center;
  letter-spacing: 0.06em;
  white-space: nowrap;
  pointer-events: none;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  opacity: 0.65;
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  &::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #fb923c;
    margin-right: 6px;
    box-shadow: 0 0 6px rgba(251, 146, 60, 0.6);
    transition: all 0.3s ease;
  }
  
  ${MapBookItem}:hover & {
    opacity: 1;
    transform: translateY(-4px);
    background: rgba(12, 10, 24, 0.9);
    border-color: #fb923c;
    color: #fb923c;
    box-shadow: 0 4px 20px rgba(251, 146, 60, 0.35), 0 0 10px rgba(251, 146, 60, 0.2);
    
    &::before {
      background: #fb923c;
      box-shadow: 0 0 10px #fb923c, 0 0 4px #fb923c;
    }
  }
`;

const travelMapPulse = keyframes`
  0% {
    filter: sepia(0.1) saturate(1.1) brightness(0.85) contrast(1.05) drop-shadow(0 4px 10px rgba(231, 199, 126, 0.15)) brightness(1.0);
  }
  100% {
    filter: sepia(0.1) saturate(1.1) brightness(0.85) contrast(1.05) drop-shadow(0 8px 24px rgba(231, 199, 126, 0.38)) brightness(1.04);
  }
`;

const CUTOUT_HIT_ASSETS = {
  travelMap: BLOG_NEW_ASSETS.mapCutout,
  mapScroll: BLOG_NEW_ASSETS.mapScroll,
  workshopAstrolabe: BLOG_NEW_ASSETS.workshopAstrolabe,
  workshopBlueprintMap: BLOG_NEW_ASSETS.workshopBlueprintMap,
  workshopPotions: BLOG_NEW_ASSETS.workshopPotions,
  archiveLegacyPlans: BLOG_NEW_ASSETS.archiveDrawerStack01,
  archiveIssueLogs: BLOG_NEW_ASSETS.archiveDrawerStack02
};

const getItemThemeColor = (itemId, alpha = 1) => {
  const colors = {
    'workshop-astrolabe': `rgba(56, 189, 248, ${alpha})`, // Sky blue
    'workshop-blueprint-map': `rgba(14, 165, 233, ${alpha})`, // Blueprint cyan
    'workshop-potions': `rgba(249, 115, 22, ${alpha})`, // Potion orange
    'travel-map': `rgba(245, 158, 11, ${alpha})`, // Gold/amber
    'travel-map-scroll': `rgba(251, 146, 60, ${alpha})`, // Soft orange
    'travel-scroll': `rgba(16, 185, 129, ${alpha})`, // Emerald green
    'archive-legacy-plans': `rgba(192, 132, 252, ${alpha})`, // Purple/lavender
    'archive-issue-logs': `rgba(192, 132, 252, ${alpha})`, // Purple/lavender
  };
  return colors[itemId] || `rgba(251, 191, 36, ${alpha})`;
};

const getItemGlowFilter = (itemId) => {
  switch (itemId) {
    case 'workshop-astrolabe':
      return 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.95)) drop-shadow(0 0 28px rgba(129, 140, 248, 0.65)) brightness(1.2) saturate(1.2)';
    case 'workshop-blueprint-map':
      return 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.95)) drop-shadow(0 0 28px rgba(14, 165, 233, 0.55)) brightness(1.18) saturate(1.1)';
    case 'workshop-potions':
      return 'drop-shadow(0 0 12px rgba(251, 146, 60, 0.95)) drop-shadow(0 0 28px rgba(239, 68, 68, 0.65)) brightness(1.25) saturate(1.2)';
    case 'travel-map':
      return 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.95)) drop-shadow(0 0 28px rgba(217, 119, 6, 0.6)) brightness(1.15) saturate(1.15)';
    case 'travel-map-scroll':
      return 'drop-shadow(0 0 10px rgba(251, 146, 60, 0.95)) drop-shadow(0 0 20px rgba(244, 63, 94, 0.5)) brightness(1.2) saturate(1.1)';
    case 'travel-scroll':
      return 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.95)) drop-shadow(0 0 25px rgba(52, 211, 153, 0.55)) brightness(1.2) saturate(1.15)';
    case 'archive-legacy-plans':
    case 'archive-issue-logs':
      return 'drop-shadow(0 0 12px rgba(231, 199, 126, 0.95)) drop-shadow(0 0 28px rgba(192, 132, 252, 0.45)) brightness(1.2) saturate(1.15)';
    default:
      return 'drop-shadow(0 0 12px rgba(231, 199, 126, 0.95)) drop-shadow(0 0 28px rgba(217, 119, 6, 0.45)) brightness(1.18) saturate(1.15)';
  }
};

const TravelMapCutoutItem = styled(motion.div)`
  position: absolute;
  left: ${props => props.$left};
  top: ${props => props.$top};
  width: ${props => props.$width};
  height: ${props => props.$height || '100%'};
  z-index: 19;
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;

  /* Match scale(1.05) of the active BgLayer exactly to prevent misalignment! */
  transform: scale(1.05);
  transform-origin: center center;
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
`;

const TravelCutoutHitLayer = styled.button`
  position: absolute;
  left: ${props => props.$left || 0};
  top: ${props => props.$top || 0};
  width: ${props => props.$width || '100%'};
  height: ${props => props.$height || '100%'};
  z-index: 40;
  display: block;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: ${props => props.$hasHit ? 'pointer' : 'default'};
  pointer-events: auto;
  user-select: none;
  -webkit-user-select: none;
`;

const TravelMapImage = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  background-image: url(${props => props.$imgSrc});
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  pointer-events: none;
  filter: ${props => getLightingFilter(props.$sceneId, false)} drop-shadow(0 12px 18px rgba(0, 0, 0, 0.48));
  animation: ${travelMapPulse} 4s ease-in-out infinite alternate;
  transition: filter 0.4s cubic-bezier(0.25, 1, 0.5, 1);

  /* Add safety clip-path to prevent poorly cutout background pixels or lamps from other scenes lighting up */
  clip-path: ${props => {
    if (props.$hitLeft && props.$hitTop && props.$hitWidth && props.$hitHeight) {
      const parse = (val) => parseFloat(val);
      const l = parse(props.$hitLeft);
      const t = parse(props.$hitTop);
      const w = parse(props.$hitWidth);
      const h = parse(props.$hitHeight);
      
      const margin = props.$sceneId === 'workshop' ? 3 : 6; // Tighter safety margin for workshop desk to prevent books bleed glow
      const clipTop = Math.max(0, t - margin);
      const clipLeft = Math.max(0, l - margin);
      const clipBottom = Math.max(0, 100 - (t + h + margin));
      const clipRight = Math.max(0, 100 - (l + w + margin));
      
      return `inset(${clipTop}% ${clipRight}% ${clipBottom}% ${clipLeft}%)`;
    }
    return 'none';
  }};

  /* Gold Light Sheen Sweep Overlay */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      105deg,
      transparent 30%,
      rgba(255, 250, 230, 0.18) 40%,
      rgba(255, 230, 150, 0.35) 50%,
      rgba(255, 250, 230, 0.18) 60%,
      transparent 70%
    );
    background-size: 200% 100%;
    background-position: 150% 0;
    transition: background-position 0.6s ease;
    pointer-events: none;
    mix-blend-mode: overlay;
    z-index: 2;
    -webkit-mask-image: url(${props => props.$imgSrc});
    mask-image: url(${props => props.$imgSrc});
    -webkit-mask-size: cover;
    mask-size: cover;
    -webkit-mask-position: center center;
    mask-position: center center;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }

  /* Radial warm glow from the table lamp */
  &::after {
    content: '';
    position: absolute;
    left: 2%;
    top: 30%;
    width: 36%;
    height: 42%;
    background: radial-gradient(ellipse at center, rgba(251, 191, 36, 0.24), rgba(251, 146, 60, 0.08) 45%, transparent 72%);
    opacity: 0;
    transition: opacity 0.35s ease;
    pointer-events: none;
    mix-blend-mode: screen;
    -webkit-mask-image: url(${props => props.$imgSrc});
    mask-image: url(${props => props.$imgSrc});
    -webkit-mask-size: cover;
    mask-size: cover;
    -webkit-mask-position: center center;
    mask-position: center center;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }

  ${props => props.$isHovered && css`
    animation-play-state: paused;
    filter: ${props => getLightingFilter(props.$sceneId, true)} ${props => getItemGlowFilter(props.$itemId)};

    &::before {
      background-position: -50% 0;
    }

    &::after {
      opacity: ${props => props.$sceneId === 'travel' ? 1 : 0};
    }
  `}
`;

const TravelMapCutoutLabel = styled.div`
  position: absolute;
  left: ${props => props.$labelLeft || '28%'};
  top: ${props => props.$labelTop || '56%'};
  margin-top: 0;
  transform: ${props => props.$itemId === 'archive-issue-logs' ? 'translate(-100%, 0)' : 'translate(-50%, 0)'};
  z-index: 25;
  pointer-events: none;
  opacity: 0.65;
  border: 1px solid rgba(231, 199, 126, 0.22);
  background: rgba(12, 10, 24, 0.72);
  border-radius: 20px;
  padding: 5px 12px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.45);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  max-width: 180px;
  overflow: hidden;
  white-space: nowrap;

  .label-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #f59e0b;
    margin-right: 6px;
    flex-shrink: 0;
    box-shadow: 0 0 6px rgba(245, 158, 11, 0.6);
    transition: all 0.3s ease;
  }

  .label-text-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    transition: all 0.4s ease;
  }

  .label-title {
    color: #ffedd5;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    transition: color 0.3s ease;
  }

  .label-meta {
    max-height: 0;
    opacity: 0;
    font-size: 0.55rem;
    font-weight: 800;
    color: rgba(255, 237, 213, 0.45);
    letter-spacing: 0.08em;
    margin-top: 0px;
    transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
    overflow: hidden;
  }

  ${props => props.$isHovered && css`
    opacity: 1;
    transform: ${props => props.$itemId === 'archive-issue-logs' ? 'translate(-100%, -6px)' : 'translate(-50%, -6px)'};
    max-width: 280px;
    padding: 6px 14px;
    background: rgba(12, 10, 24, 0.92);
    border-color: ${props => getItemThemeColor(props.$itemId, 0.8)};
    box-shadow: 
      0 8px 24px rgba(0, 0, 0, 0.5),
      0 0 15px ${props => getItemThemeColor(props.$itemId, 0.35)};
    
    .label-dot {
      background: ${props => getItemThemeColor(props.$itemId)};
      box-shadow: 
        0 0 10px ${props => getItemThemeColor(props.$itemId)}, 
        0 0 4px ${props => getItemThemeColor(props.$itemId)};
    }

    .label-title {
      color: ${props => getItemThemeColor(props.$itemId)};
    }

    .label-meta {
      max-height: 14px;
      opacity: 1;
      margin-top: 2px;
    }
  `}
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
  background: rgba(12, 10, 24, 0.72);
  border: 1px solid rgba(231, 199, 126, 0.22);
  border-radius: 20px;
  color: #ffedd5;
  font-size: 0.68rem;
  padding: 4px 12px;
  text-align: center;
  letter-spacing: 0.06em;
  white-space: nowrap;
  pointer-events: none;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  opacity: 0.65;
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  &::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #fcd34d;
    margin-right: 6px;
    box-shadow: 0 0 6px rgba(252, 211, 77, 0.6);
    transition: all 0.3s ease;
  }
  
  ${NoteBoxItem}:hover & {
    opacity: 1;
    transform: translateY(-4px);
    background: rgba(12, 10, 24, 0.9);
    border-color: #fcd34d;
    color: #fcd34d;
    box-shadow: 0 4px 20px rgba(252, 211, 77, 0.35), 0 0 10px rgba(252, 211, 77, 0.2);
    
    &::before {
      background: #fcd34d;
      box-shadow: 0 0 10px #fcd34d, 0 0 4px #fcd34d;
    }
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
  background: rgba(12, 10, 24, 0.72);
  border: 1px solid rgba(192, 132, 252, 0.22);
  border-radius: 20px;
  color: #f5f3ff;
  font-size: 0.68rem;
  padding: 4px 12px;
  text-align: center;
  letter-spacing: 0.06em;
  white-space: nowrap;
  pointer-events: none;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  opacity: 0.65;
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  &::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #c084fc;
    margin-right: 6px;
    box-shadow: 0 0 6px rgba(192, 132, 252, 0.6);
    transition: all 0.3s ease;
  }
  
  ${DrawerItem}:hover & {
    opacity: 1;
    transform: translateY(-4px);
    background: rgba(12, 10, 24, 0.9);
    border-color: #a78bfa;
    color: #c084fc;
    box-shadow: 0 4px 20px rgba(167, 139, 250, 0.35), 0 0 10px rgba(167, 139, 250, 0.2);
    
    &::before {
      background: #c084fc;
      box-shadow: 0 0 10px #c084fc, 0 0 4px #c084fc;
    }
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
  background: rgba(12, 10, 24, 0.72);
  border: 1px solid rgba(56, 189, 248, 0.22);
  border-radius: 20px;
  color: #f0f9ff;
  font-size: 0.68rem;
  padding: 4px 12px;
  text-align: center;
  letter-spacing: 0.06em;
  white-space: nowrap;
  pointer-events: none;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  opacity: 0.65;
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  &::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #38bdf8;
    margin-right: 6px;
    box-shadow: 0 0 6px rgba(56, 189, 248, 0.6);
    transition: all 0.3s ease;
  }
  
  ${BlueprintItem}:hover & {
    opacity: 1;
    transform: translateY(-4px);
    background: rgba(12, 10, 24, 0.9);
    border-color: #38bdf8;
    color: #38bdf8;
    box-shadow: 0 4px 20px rgba(56, 189, 248, 0.35), 0 0 12px rgba(56, 189, 248, 0.2);
    
    &::before {
      background: #38bdf8;
      box-shadow: 0 0 10px #38bdf8, 0 0 4px #38bdf8;
    }
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
  align-items: center;
  gap: 10px;
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
  height: 280px;
  border-radius: 50%;
  background-color: rgba(12, 10, 24, 0.75);
  background-image: 
    radial-gradient(circle at center, rgba(12, 10, 24, 0.35) 0%, rgba(12, 10, 24, 0.85) 100%),
    url(${props => props.$bgSrc});
  background-size: cover;
  background-position: center;
  border: 1.5px solid #e7c77e;
  box-shadow: 
    0 15px 35px rgba(0, 0, 0, 0.75),
    0 0 25px rgba(231, 199, 126, 0.25),
    inset 0 0 15px rgba(231, 199, 126, 0.15);
  display: flex;
  flex-direction: column;
  overflow: visible; /* allow pendulum to hang outside */
  position: relative;
  pointer-events: auto;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  &::before {
    content: '';
    position: absolute;
    inset: 4px;
    border: 1px double rgba(231, 199, 126, 0.25);
    border-radius: 50%;
    pointer-events: none;
    z-index: 10;
  }
`;

const MinimapTitle = styled(motion.h4)`
  font-size: 0.8rem;
  font-weight: 800;
  color: #ffedd5;
  margin: 0;
  letter-spacing: 0.08em;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.95);
  background: rgba(12, 10, 24, 0.82);
  border: 1px solid rgba(231, 199, 126, 0.35);
  border-radius: 20px;
  padding: 4px 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.5),
    0 0 10px rgba(231, 199, 126, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  pointer-events: auto;
  user-select: none;
  
  span {
    color: #e7c77e;
    font-size: 0.7rem;
    opacity: 0.9;
  }
`;

const swingAnimation = keyframes`
  0%, 100% { transform: translateX(-50%) rotate(-6deg); }
  50% { transform: translateX(-50%) rotate(6deg); }
`;

const MinimapPendulum = styled(motion.button)`
  position: absolute;
  bottom: -32px;
  left: 50%;
  transform: translateX(-50%);
  transform-origin: top center;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  z-index: 30;
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  animation: ${swingAnimation} 3.5s ease-in-out infinite;

  &:hover {
    animation-play-state: paused;
  }
`;

const PendulumChain = styled.div`
  width: 1.5px;
  height: 18px;
  background: linear-gradient(to bottom, #e7c77e 0%, rgba(231, 199, 126, 0.3) 100%);
  box-shadow: 0 0 2px rgba(231, 199, 126, 0.4);
`;

const PendulumKey = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(12, 10, 24, 0.9);
  border: 1.5px solid #e7c77e;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 11px;
  color: #e7c77e;
  box-shadow: 
    0 0 10px rgba(231, 199, 126, 0.5),
    0 4px 6px rgba(0, 0, 0, 0.6);
  transition: all 0.25s ease;

  &:hover {
    background: #e7c77e;
    color: #0c0a18;
    box-shadow: 0 0 16px #e7c77e;
    transform: scale(1.15);
  }
`;

const MinimapGraphArea = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background: transparent;
  border-radius: 50%;
  overflow: visible;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    pointer-events: none;
    box-shadow: inset 0 0 35px rgba(3, 1, 8, 0.72);
    z-index: 8;
  }
`;

const MinimapEdgeLabel = styled.div`
  position: absolute;
  transform: translate(-50%, -50%);
  background: rgba(12, 10, 24, 0.75);
  border: 1px solid rgba(231, 199, 126, 0.18);
  border-radius: 4px;
  color: #ffedd5;
  font-size: 0.52rem;
  padding: 1px 4px;
  white-space: nowrap;
  z-index: 5;
  pointer-events: none;
  scale: 0.85;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
`;

const CompassTooltip = styled(motion.div)`
  position: absolute;
  right: 56px;
  top: 6px;
  white-space: nowrap;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(12, 10, 24, 0.95);
  border: 1px solid #e7c77e;
  color: #ffedd5;
  font-size: 0.75rem;
  font-weight: 800;
  box-shadow: 
    0 6px 20px rgba(0, 0, 0, 0.75), 
    0 0 10px rgba(231, 199, 126, 0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  pointer-events: none;
  z-index: 1001;
  letter-spacing: 0.05em;

  &::after {
    content: '';
    position: absolute;
    right: -4px;
    top: 50%;
    width: 6px;
    height: 6px;
    background: rgba(12, 10, 24, 0.95);
    border-right: 1px solid #e7c77e;
    border-top: 1px solid #e7c77e;
    transform: translateY(-50%) rotate(45deg);
  }
`;

const PendulumTooltip = styled(motion.div)`
  position: absolute;
  top: 48px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(12, 10, 24, 0.95);
  border: 1px solid #e7c77e;
  color: #ffedd5;
  font-size: 0.75rem;
  font-weight: 800;
  box-shadow: 
    0 6px 20px rgba(0, 0, 0, 0.75), 
    0 0 10px rgba(231, 199, 126, 0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  pointer-events: none;
  z-index: 1001;
  letter-spacing: 0.05em;

  &::after {
    content: '';
    position: absolute;
    top: -4px;
    left: 50%;
    width: 6px;
    height: 6px;
    background: rgba(12, 10, 24, 0.95);
    border-left: 1px solid #e7c77e;
    border-top: 1px solid #e7c77e;
    transform: translateX(-50%) rotate(45deg);
  }
`;

const NodeTooltip = styled(motion.div)`
  position: absolute;
  bottom: 34px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  max-width: min(260px, 70vw);
  overflow: visible;
  padding: 5px 10px;
  border-radius: 6px;
  background: rgba(12, 10, 24, 0.96);
  border: 1px solid ${props => props.$themeColor || '#e7c77e'};
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 800;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.6), 
    0 0 8px ${props => props.$themeColor || '#e7c77e'}33;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  pointer-events: none;
  z-index: 1001;
  letter-spacing: 0.05em;

  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    width: 6px;
    height: 6px;
    background: rgba(12, 10, 24, 0.96);
    border-right: 1px solid ${props => props.$themeColor || '#e7c77e'};
    border-bottom: 1px solid ${props => props.$themeColor || '#e7c77e'};
    transform: translateX(-50%) rotate(45deg);
  }
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
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${props => props.$isCurrent ? 'rgba(231, 199, 126, 0.25)' : 'rgba(12, 10, 24, 0.6)'};
  border: 1.5px solid ${props => props.$isCurrent ? '#fbbf24' : props.$themeColor || '#e7c77e'};
  box-shadow: ${props => props.$isCurrent 
    ? '0 0 10px #fbbf24, inset 0 0 5px rgba(251, 191, 36, 0.3)' 
    : '0 2px 4px rgba(0,0,0,0.5)'};
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 11px;
  color: ${props => props.$isCurrent ? '#fbbf24' : '#e7c77e'};
  text-shadow: 0 0 3px rgba(231, 199, 126, 0.4);
  transition: all 0.25s ease;
  position: relative;

  ${MinimapNodeContainer}:hover & {
    transform: scale(1.15);
    box-shadow: 0 0 12px ${props => props.$themeColor || '#e7c77e'};
    border-color: #ffffff;
    color: #ffffff;
    background: rgba(231, 199, 126, 0.85);
  }
`;

const MinimapNodeLabel = styled.div`
  margin-top: 3px;
  font-size: 0.65rem;
  font-weight: 800;
  color: ${props => props.$isCurrent ? '#fbbf24' : '#ffedd5'};
  text-shadow: 
    0 1.5px 3px rgba(0, 0, 0, 0.95),
    0 0 5px rgba(12, 10, 24, 0.8);
  white-space: nowrap;
  scale: 0.95;
  display: flex;
  align-items: center;
  gap: 2.5px;
  letter-spacing: 0.05em;
  transition: all 0.25s ease;
  
  ${MinimapNodeContainer}:hover & {
    color: #ffffff;
    text-shadow: 0 0 5px ${props => props.$themeColor || '#e7c77e'};
  }
`;

const MinimapPointerBadge = styled(motion.div)`
  position: absolute;
  top: -12px;
  font-size: 10px;
  pointer-events: none;
  z-index: 12;
`;


const MinimapOrbitRing = styled.circle`
  transform-origin: center;
  animation: rotateOrbit 60s linear infinite;
  
  @keyframes rotateOrbit {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
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
  width: min(780px, 64vw);
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
  padding: 4.8rem 6.2rem 5rem 6.2rem; /* Constrain content vertically and horizontally to prevent rod/edge overlapping */

  ${props => props.$sceneMode === 'outdoor' && css`
    width: min(1080px, 82vw);
    height: min(680px, 74vh);
    min-height: 560px;
    padding: 6.4rem 8.6rem 5.4rem 8.6rem;
  `}

  ${props => props.$sceneMode === 'travel' && css`
    width: min(1120px, 84vw);
    height: min(640px, 70vh);
    min-height: 540px;
    padding: 5.6rem 7.8rem 5.2rem 7.8rem;
  `}

  ${props => props.$sceneMode === 'archive' && css`
    width: min(1080px, 82vw);
    height: min(650px, 72vh);
    min-height: 540px;
    padding: 5.7rem 7.4rem 5.6rem 7.4rem;
  `}

  @media (max-width: 760px) {
    width: min(440px, 94vw);
    height: min(520px, calc(100vh - 3rem));
    min-height: 0;
    padding: 4.2rem 3.6rem 4.5rem 3.6rem;
  }
`;

const ScrollHeader = styled.div`
  border-bottom: 2px dashed rgba(118, 73, 26, 0.18);
  padding-bottom: 0.6rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: Georgia, serif;

  ${props => props.$sceneMode === 'outdoor' && css`
    border-bottom-color: rgba(231, 199, 126, 0.26);
    margin-bottom: 0.75rem;
  `}

  ${props => props.$sceneMode === 'travel' && css`
    border-bottom-color: rgba(82, 142, 164, 0.26);
    margin-bottom: 0.75rem;
  `}

  ${props => props.$sceneMode === 'archive' && css`
    border-bottom-color: rgba(104, 65, 32, 0.22);
    margin-bottom: 0.75rem;
  `}
`;

const ScrollTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 800;
  color: #3a2413;
  margin: 0;
  letter-spacing: 0.05em;

  ${props => props.$sceneMode === 'outdoor' && css`
    color: #f6d99a;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.72);
  `}

  ${props => props.$sceneMode === 'travel' && css`
    color: #245169;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
  `}

  ${props => props.$sceneMode === 'archive' && css`
    color: #3f2816;
    text-shadow: 0 1px 0 rgba(255, 248, 223, 0.72), 0 6px 18px rgba(72, 39, 18, 0.18);
  `}
`;

const ScrollMeta = styled.span`
  font-size: 0.7rem;
  color: #76491a;
  font-family: monospace;
  text-transform: uppercase;
  font-weight: bold;

  ${props => props.$sceneMode === 'outdoor' && css`
    color: rgba(246, 217, 154, 0.72);
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.65);
  `}

  ${props => props.$sceneMode === 'travel' && css`
    color: rgba(46, 98, 122, 0.76);
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
  `}

  ${props => props.$sceneMode === 'archive' && css`
    color: rgba(91, 54, 24, 0.72);
    text-shadow: 0 1px 0 rgba(255, 248, 223, 0.7);
  `}
`;

const ScrollCloseButton = styled.button`
  position: absolute;
  top: 3.2rem;
  right: 3.8rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #3a2413;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  transition: background 0.2s ease;
  z-index: 200;

  ${props => props.$sceneMode === 'outdoor' && css`
    color: #d99645;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
  `}

  ${props => props.$sceneMode === 'travel' && css`
    color: #2e6f88;
  `}

  ${props => props.$sceneMode === 'archive' && css`
    color: #6b3f1f;
  `}

  &:hover {
    background: rgba(118, 73, 26, 0.1);
  }
  
  @media (max-width: 760px) {
    top: 2.8rem;
    right: 2.2rem;
  }
`;

const ScrollContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 10px 0.9rem 0.75rem;
  box-sizing: border-box;
  border-radius: 12px;
  background: rgba(255, 246, 222, 0.24);
  box-shadow: inset 0 0 24px rgba(118, 73, 26, 0.08);
  backdrop-filter: blur(2px);

  ${props => props.$sceneMode === 'outdoor' && css`
    padding: 0.65rem 0.7rem 0.8rem;
    background:
      linear-gradient(180deg, rgba(37, 23, 12, 0.58), rgba(18, 11, 7, 0.42)),
      rgba(12, 8, 5, 0.34);
    border: 1px solid rgba(231, 199, 126, 0.16);
    box-shadow:
      inset 0 0 30px rgba(0, 0, 0, 0.28),
      0 12px 28px rgba(0, 0, 0, 0.22);
  `}

  ${props => props.$sceneMode === 'travel' && css`
    padding: 0.65rem 0.75rem 0.8rem;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.44), rgba(225, 244, 246, 0.28)),
      rgba(222, 242, 244, 0.24);
    border: 1px solid rgba(82, 142, 164, 0.18);
    box-shadow:
      inset 0 0 26px rgba(82, 142, 164, 0.08),
      0 12px 28px rgba(43, 93, 116, 0.12);
  `}

  ${props => props.$sceneMode === 'archive' && css`
    padding: 0.7rem 0.8rem 0.85rem;
    background:
      linear-gradient(180deg, rgba(255, 247, 221, 0.52), rgba(218, 181, 122, 0.22)),
      rgba(245, 224, 181, 0.28);
    border: 1px solid rgba(104, 65, 32, 0.18);
    box-shadow:
      inset 0 0 28px rgba(117, 71, 31, 0.08),
      0 14px 30px rgba(61, 36, 18, 0.16);
  `}

  /* Custom subtle scrollbar matching scroll theme */
  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(118, 73, 26, 0.04);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(118, 73, 26, 0.28);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(118, 73, 26, 0.45);
  }
`;



// ── 新松果档案阅读面板 (Parchment Reader Modal) ──
const ReaderBackdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(6, 4, 10, 0.72);
  backdrop-filter: blur(8px);
  z-index: 10100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(0.4rem, 1.2vw, 1rem);
`;

const ReaderPanel = styled(motion.div)`
  position: relative;
  width: min(1280px, 96vw);
  height: min(92vh, 860px);
  min-height: 620px;
  background-image: url(${props => props.$bgSrc});
  background-size: 100% 100%;
  background-repeat: no-repeat;
  border-radius: 16px;
  box-shadow: 
    0 35px 80px rgba(0, 0, 0, 0.65),
    inset 0 0 50px rgba(118, 73, 26, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  padding: 3.2rem clamp(7.4rem, 8.2vw, 9rem) 4.6rem clamp(6.2rem, 7vw, 7.6rem);

  @media (max-width: 768px) {
    padding: 2.8rem 2rem 3.8rem 2.2rem;
    width: min(460px, 94vw);
    height: min(90vh, 640px);
  }
`;

const ReaderHeader = styled.div`
  border-bottom: 2px dashed rgba(118, 73, 26, 0.2);
  padding-bottom: 0.55rem;
  margin-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: Georgia, serif;
`;

const ReaderTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
`;

const ReaderTitle = styled.h2`
  font-size: clamp(1.18rem, 2.2vw, 1.4rem);
  font-weight: 900;
  color: #3a2413;
  margin: 0;
  letter-spacing: 0.02em;
  line-height: 1.35;
`;

const ReaderMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const ReaderMetaLabel = styled.span`
  font-size: 0.72rem;
  color: #76491a;
  background: rgba(118, 73, 26, 0.08);
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 700;
  text-transform: uppercase;
  font-family: monospace;
`;

const ReaderCloseButton = styled.button`
  position: absolute;
  top: 2.7rem;
  right: 4.2rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #76491a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.2s;
  z-index: 210;

  &:hover {
    background: rgba(118, 73, 26, 0.08);
    transform: scale(1.1);
  }
  
  @media (max-width: 768px) {
    top: 2rem;
    right: 2rem;
  }
`;

const ReaderContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 18px 0.6rem 0;
  box-sizing: border-box;

  /* Custom scrollbar matching paper theme */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(118, 73, 26, 0.04);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(118, 73, 26, 0.28);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(118, 73, 26, 0.45);
  }
`;

const ReaderBackButton = styled.button`
  align-self: flex-start;
  background: rgba(118, 73, 26, 0.05);
  border: 1px solid rgba(118, 73, 26, 0.35);
  border-radius: 6px;
  color: #76491a;
  padding: 5px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  margin-bottom: 1rem;

  &:hover {
    background: rgba(118, 73, 26, 0.12);
    border-color: #76491a;
    transform: translateY(-1px);
  }
`;

const ReaderTeleportLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(231, 199, 126, 0.08);
  border: 1px dashed rgba(196, 154, 69, 0.5);
  border-radius: 20px;
  color: #8e652a;
  padding: 5px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 2px 8px rgba(118, 73, 26, 0.04);
  flex-shrink: 0;
  white-space: nowrap;

  &:hover {
    background: rgba(196, 154, 69, 0.16);
    border-style: solid;
    border-color: #c49a45;
    color: #76491a;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(196, 154, 69, 0.18);
  }

  &:active {
    transform: translateY(1px);
  }

  @media (max-width: 480px) {
    padding: 4px 8px;
    font-size: 0.72rem;
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
  --article-title: #3a2413;
  --article-meta: #76491a;
  --article-desc: rgba(72, 42, 20, 0.78);
  --article-pill-bg: rgba(118, 73, 26, 0.08);
  --article-pill-border: rgba(118, 73, 26, 0.16);
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 12px 15px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(255, 250, 235, 0.88), rgba(240, 220, 178, 0.72));
  border: 1px solid rgba(118, 73, 26, 0.24);
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  animation: ${paperSlideIn} 0.35s ease both;
  box-shadow: 0 8px 18px rgba(34, 20, 10, 0.08);
  backdrop-filter: blur(2px);

  ${props => props.$sceneMode === 'outdoor' && css`
    --article-title: #fff0c9;
    --article-meta: #f2c36d;
    --article-desc: rgba(255, 235, 198, 0.78);
    --article-pill-bg: rgba(255, 232, 174, 0.12);
    --article-pill-border: rgba(255, 232, 174, 0.2);
    background:
      linear-gradient(135deg, rgba(67, 39, 19, 0.86), rgba(117, 75, 31, 0.62)),
      rgba(24, 14, 8, 0.58);
    border-color: rgba(231, 199, 126, 0.24);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
  `}

  ${props => props.$sceneMode === 'travel' && css`
    --article-title: #24465a;
    --article-meta: #2e6f88;
    --article-desc: rgba(36, 70, 90, 0.74);
    --article-pill-bg: rgba(120, 176, 194, 0.16);
    --article-pill-border: rgba(82, 142, 164, 0.2);
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(218, 239, 243, 0.62)),
      rgba(229, 246, 248, 0.58);
    border-color: rgba(82, 142, 164, 0.2);
    box-shadow: 0 9px 20px rgba(43, 93, 116, 0.1);
  `}

  ${props => props.$sceneMode === 'archive' && css`
    --article-title: #3b2414;
    --article-meta: #7a4a22;
    --article-desc: rgba(68, 40, 20, 0.74);
    --article-pill-bg: rgba(126, 79, 36, 0.12);
    --article-pill-border: rgba(126, 79, 36, 0.22);
    background:
      linear-gradient(135deg, rgba(255, 247, 224, 0.88), rgba(226, 194, 139, 0.68)),
      rgba(236, 208, 156, 0.58);
    border-color: rgba(116, 72, 31, 0.24);
    box-shadow: 0 9px 20px rgba(68, 39, 17, 0.12);
  `}

  &:hover {
    background: linear-gradient(135deg, rgba(255, 250, 235, 0.96), rgba(250, 229, 184, 0.86));
    border-color: rgba(118, 73, 26, 0.48);
    transform: translateX(6px);
    box-shadow: 0 10px 22px rgba(34, 20, 10, 0.14);

    ${props => props.$sceneMode === 'outdoor' && css`
      background:
        linear-gradient(135deg, rgba(92, 54, 24, 0.92), rgba(144, 91, 35, 0.78)),
        rgba(34, 20, 10, 0.68);
      border-color: rgba(246, 217, 154, 0.48);
      box-shadow: 0 14px 30px rgba(0, 0, 0, 0.3), 0 0 18px rgba(231, 199, 126, 0.12);
    `}

    ${props => props.$sceneMode === 'travel' && css`
      background:
        linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(204, 235, 241, 0.78)),
        rgba(232, 249, 251, 0.78);
      border-color: rgba(82, 142, 164, 0.42);
      box-shadow: 0 12px 26px rgba(43, 93, 116, 0.16), 0 0 18px rgba(115, 185, 207, 0.14);
    `}

    ${props => props.$sceneMode === 'archive' && css`
      background:
        linear-gradient(135deg, rgba(255, 250, 235, 0.96), rgba(236, 202, 145, 0.82)),
        rgba(242, 216, 165, 0.76);
      border-color: rgba(116, 72, 31, 0.46);
      box-shadow: 0 12px 26px rgba(68, 39, 17, 0.18), 0 0 18px rgba(198, 141, 62, 0.12);
    `}
  }
`;

const ArticleHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const ArticleTitle = styled.span`
  font-size: 0.9rem;
  font-weight: 850;
  color: var(--article-title);
  text-shadow: 0 1px 0 rgba(255, 248, 230, 0.6);
`;

const ArticleMeta = styled.span`
  font-size: 0.68rem;
  color: var(--article-meta);
  background: var(--article-pill-bg);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
`;

const ArticleDesc = styled.div`
  font-size: 0.74rem;
  color: var(--article-desc);
  line-height: 1.4;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  
  .tag-pill {
    background: var(--article-pill-bg);
    border: 0.5px solid var(--article-pill-border);
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 0.68rem;
  }
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

  a {
    color: #8e652a;
    text-decoration: none;
    border-bottom: 1.5px solid rgba(142, 101, 42, 0.3);
    transition: all 0.2s ease;
    cursor: pointer;
    &:hover { 
      color: #c49a45;
      border-bottom-color: #c49a45;
    }
  }

  .unresolved-wikilink {
    color: rgba(95, 59, 18, 0.52);
    border-bottom: 1.5px dashed rgba(196, 154, 69, 0.34);
    cursor: help;
  }

  .callout {
    margin: 1rem 0;
    padding: 0.8rem 1.1rem;
    border-left: 4px solid var(--callout-color, #76491a);
    background: color-mix(in srgb, var(--callout-color) 7%, rgba(240, 230, 210, 0.4));
    border-radius: 4px 6px 6px 4px;
    box-shadow: 0 3px 12px rgba(118, 73, 26, 0.05);
    overflow: hidden;
  }

  .callout-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    margin-bottom: 0.4rem;
    color: color-mix(in srgb, var(--callout-color) 90%, #3b2211);
    font-size: 0.88rem;
  }

  .callout-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--callout-color, #76491a);
    flex-shrink: 0;
    
    svg {
      width: 16px;
      height: 16px;
      stroke-width: 2.2px;
    }
  }

  .callout-title-text {
    line-height: 1.2;
  }

  .callout-content {
    color: #3b2211;
    font-size: 0.82rem;
    line-height: 1.6;
    font-style: normal;

    p {
      margin: 0.3rem 0;
    }
    p:first-child {
      margin-top: 0;
    }
    p:last-child {
      margin-bottom: 0;
    }
    ul, ol {
      margin: 0.3rem 0;
    }
  }

  .mermaid-rendered {
    display: flex;
    justify-content: center;
    margin: 1.5rem auto;
    padding: 1rem;
    background: rgba(74, 45, 27, 0.03) !important;
    border: 1px dashed rgba(74, 45, 27, 0.25) !important;
    border-radius: 10px;
    box-shadow: inset 0 0 12px rgba(74, 45, 27, 0.05);
    overflow-x: auto;

    svg {
      max-width: 100% !important;
      height: auto !important;

      /* Node boxes and actor boxes */
      .node rect, .node circle, .node polygon, .node path,
      .actor rect, rect.actor, .note rect, rect.note {
        fill: #faf6eb !important;
        stroke: rgba(74, 45, 27, 0.4) !important;
        stroke-width: 1.5px !important;
        rx: 6px !important;
        ry: 6px !important;
        transition: all 0.3s ease;
      }

      /* Hover effect */
      .node:hover rect, .node:hover circle, .node:hover polygon, .node:hover path,
      .actor:hover rect, rect.actor:hover {
        fill: #fff !important;
        stroke: #854d0e !important;
        filter: drop-shadow(0 2px 6px rgba(74, 45, 27, 0.15));
      }

      /* Text inside nodes and actor/note boxes */
      .node .label, .node label, .node text, .node span, .node div,
      .actor text, text.actor, .actor span, .actor div,
      .note text, text.note, .note span, .note div,
      .messageText {
        fill: #4a2d1b !important;
        color: #4a2d1b !important;
        font-family: inherit !important;
        font-size: 12.5px !important;
        font-weight: 600 !important;
      }

      /* Connection lines & sequence diagram lines */
      .edgePath .path,
      .messageLine0,
      .messageLine1,
      .actor-line,
      .loopLine {
        stroke: rgba(74, 45, 27, 0.45) !important;
        stroke-width: 1.6px !important;
        transition: all 0.3s ease;
      }

      .edgePath:hover .path,
      .messageLine0:hover,
      .messageLine1:hover {
        stroke: #854d0e !important;
        stroke-width: 2px !important;
      }

      /* Edge labels background & container */
      .edgeLabel,
      .edgeLabel rect,
      .edgeLabel span,
      .edgeLabel div {
        background: transparent !important;
        background-color: transparent !important;
        fill: transparent !important;
        border: none !important;
        stroke: none !important;
        box-shadow: none !important;
      }

      /* Edge labels text */
      .edgeLabel text, .edgeLabel span, .edgeLabel div {
        fill: #4a2d1b !important;
        color: #4a2d1b !important;
        font-size: 10.5px !important;
        font-weight: 700 !important;
      }

      /* Arrowheads */
      marker {
        fill: rgba(74, 45, 27, 0.5) !important;
        path {
          fill: rgba(74, 45, 27, 0.5) !important;
          stroke: none !important;
        }
      }
      
      /* Clusters */
      .cluster rect {
        fill: rgba(74, 45, 27, 0.02) !important;
        stroke: rgba(74, 45, 27, 0.2) !important;
        stroke-width: 1.5px !important;
        stroke-dasharray: 3 3 !important;
        rx: 10px !important;
        ry: 10px !important;
      }
      
      .cluster label, .cluster span, .cluster text {
        fill: rgba(74, 45, 27, 0.6) !important;
        color: rgba(74, 45, 27, 0.6) !important;
        font-size: 11.5px !important;
        font-weight: 700 !important;
      }
    }
  }
`;

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
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, title, alias) => alias || title)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  const normalizeLine = (line) => line
    .replace(/^>\s*/, '')
    .replace(/^[-*+]\s+\[[ xX]\]\s+/, '')
    .replace(/^[-*+]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/[*_`#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const isNoiseLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    if (/^#{1,6}\s+/.test(trimmed)) return true;
    if (/^[-*_]{3,}$/.test(trimmed)) return true;
    if (/^\|?[\s:-]+\|[\s|:-]*$/.test(trimmed)) return true;
    if (/^\|.*\|$/.test(trimmed)) return true;
    if (/^>\s*(obsidian|wikilink|todo|tip|note|warning|注意|提示|应变|手机端|离线|全程|遇到)/i.test(trimmed)) return true;
    if (/^(obsidian|wikilink|todo|tip|note|warning|注意|提示|应变|手机端|离线|全程|遇到)/i.test(trimmed)) return true;
    return false;
  };

  const paragraphs = cleanText
    .split(/\n{2,}/)
    .map(block => block
      .split(/\r?\n/)
      .filter(line => !isNoiseLine(line))
      .map(normalizeLine)
      .filter(Boolean)
      .join(' ')
      .trim()
    )
    .filter(Boolean);

  const scoreParagraph = (paragraph) => {
    const chineseCount = (paragraph.match(/[\u4e00-\u9fa5]/g) || []).length;
    const punctuationCount = (paragraph.match(/[。！？；，、]/g) || []).length;
    const metaPenalty = /(obsidian|wikilink|todo|提示|注意|应变|手机端|离线|全程|遇到|物品|原因)/i.test(paragraph) ? 80 : 0;
    const shortPenalty = paragraph.length < 28 ? 40 : 0;
    return chineseCount * 2 + punctuationCount * 8 + Math.min(paragraph.length, 160) - metaPenalty - shortPenalty;
  };

  const best = paragraphs
    .map(paragraph => ({ paragraph, score: scoreParagraph(paragraph) }))
    .sort((a, b) => b.score - a.score)[0]?.paragraph || '';

  const snippet = best || cleanText
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean)
    .find(line => !isNoiseLine(line)) || '';

  return snippet.length > 150 ? `${snippet.slice(0, 150)}...` : snippet;
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
// Mermaid 流程图渲染组件 (Mermaid)
// -------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    suppressErrors: true,
    theme: 'base',
    securityLevel: 'strict',
    themeVariables: {
      background: 'transparent',
      primaryColor: '#faf6eb',
      textColor: '#4a2d1b',
      lineColor: '#4a2d1b',
    }
  });
}

// ── Obsidian Callouts 解析与组件 ────────────────────────────────

const CALLOUT_MAP = {
  note: { title: 'Note', color: '#2563eb', icon: 'pencil', theme: 'note' },
  info: { title: 'Info', color: '#16a34a', icon: 'info', theme: 'info' },
  todo: { title: 'Todo', color: '#1d4ed8', icon: 'todo', theme: 'todo' },
  tip: { title: 'Tip', color: '#b45309', icon: 'tip', theme: 'tip' },
  hint: { title: 'Tip', color: '#b45309', icon: 'tip', theme: 'tip' },
  important: { title: 'Important', color: '#6d28d9', icon: 'important', theme: 'important' },
  success: { title: 'Success', color: '#15803d', icon: 'success', theme: 'success' },
  check: { title: 'Success', color: '#15803d', icon: 'success', theme: 'success' },
  done: { title: 'Success', color: '#15803d', icon: 'success', theme: 'success' },
  question: { title: 'Question', color: '#6d28d9', icon: 'question', theme: 'question' },
  help: { title: 'Question', color: '#6d28d9', icon: 'question', theme: 'question' },
  faq: { title: 'Question', color: '#6d28d9', icon: 'question', theme: 'question' },
  warning: { title: 'Warning', color: '#ea580c', icon: 'warning', theme: 'warning' },
  caution: { title: 'Warning', color: '#ea580c', icon: 'warning', theme: 'warning' },
  attention: { title: 'Warning', color: '#ea580c', icon: 'warning', theme: 'warning' },
  failure: { title: 'Failure', color: '#dc2626', icon: 'failure', theme: 'failure' },
  fail: { title: 'Failure', color: '#dc2626', icon: 'failure', theme: 'failure' },
  missing: { title: 'Failure', color: '#dc2626', icon: 'failure', theme: 'failure' },
  danger: { title: 'Danger', color: '#be123c', icon: 'danger', theme: 'danger' },
  error: { title: 'Danger', color: '#be123c', icon: 'danger', theme: 'danger' },
  bug: { title: 'Bug', color: '#be185d', icon: 'bug', theme: 'bug' },
  example: { title: 'Example', color: '#7c3aed', icon: 'example', theme: 'example' },
  quote: { title: 'Quote', color: '#78350f', icon: 'quote', theme: 'quote' },
  cite: { title: 'Quote', color: '#78350f', icon: 'quote', theme: 'quote' },
};

const CalloutIcon = ({ iconType }) => {
  switch (iconType) {
    case 'pencil':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="callout-icon-svg"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>;
    case 'info':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="callout-icon-svg"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;
    case 'todo':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="callout-icon-svg"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="m9 12 2 2 4-4"/></svg>;
    case 'tip':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="callout-icon-svg"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5.5 5.5 0 0 0 7 8c0 1.3.5 2.6 1.5 3.5.7.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>;
    case 'success':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="callout-icon-svg"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>;
    case 'question':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="callout-icon-svg"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case 'warning':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="callout-icon-svg"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case 'failure':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="callout-icon-svg"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
    case 'danger':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="callout-icon-svg"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case 'bug':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="callout-icon-svg"><rect width="8" height="14" x="8" y="6" rx="4"/><path d="m19 7-3 2"/><path d="m5 7 3 2"/><path d="m19 19-3-2"/><path d="m5 19 3-2"/><path d="M20 13h-4"/><path d="M4 13h4"/><path d="m10 4 1 2"/><path d="m14 4-1 2"/></svg>;
    case 'example':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="callout-icon-svg"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
    case 'quote':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="callout-icon-svg"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 2.5-1 4-3 5v1Zm11 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 2.5-1 4-3 5v1Z"/></svg>;
    case 'important':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="callout-icon-svg"><path d="M12 8v4"/><path d="M12 16h.01"/><path d="M4.93 4.93a10 10 0 1 1 14.14 14.14A10 10 0 0 1 4.93 4.93z"/></svg>;
    default:
      return null;
  }
};

function findAndModifyCallout(children) {
  if (!children) return { isCallout: false, children };

  let found = null;

  function processNode(node) {
    if (typeof node === 'string') {
      const match = node.match(/^\s*\[!([a-zA-Z_-]+)\](?:[ \t]+([^\r\n]*))?(?:\r?\n([\s\S]*))?/);
      if (match) {
        found = {
          type: match[1].toLowerCase(),
          title: match[2] !== undefined ? match[2].trim() : '',
          restText: match[3] || ''
        };
        return found.restText;
      }
      return node;
    }

    if (React.isValidElement(node)) {
      if (found) return node;
      const nodeChildren = node.props.children;
      if (Array.isArray(nodeChildren)) {
        const newChildren = [...nodeChildren];
        for (let i = 0; i < newChildren.length; i++) {
          const item = newChildren[i];
          if (typeof item === 'string' && !item.trim()) {
            continue;
          }
          newChildren[i] = processNode(item);
          if (found) {
            return React.cloneElement(node, {}, newChildren);
          }
          break;
        }
      } else if (nodeChildren) {
        const processed = processNode(nodeChildren);
        if (found) {
          return React.cloneElement(node, {}, processed);
        }
      }
    }

    return node;
  }

  let modifiedChildren;
  if (Array.isArray(children)) {
    modifiedChildren = [...children];
    for (let i = 0; i < modifiedChildren.length; i++) {
      const item = modifiedChildren[i];
      if (typeof item === 'string' && !item.trim()) {
        continue;
      }
      modifiedChildren[i] = processNode(item);
      if (found) {
        break;
      }
      break;
    }
  } else {
    const processed = processNode(children);
    if (found) {
      modifiedChildren = processed;
    }
  }

  if (found) {
    return {
      isCallout: true,
      type: found.type,
      title: found.title,
      children: modifiedChildren
    };
  }

  return { isCallout: false, children };
}

let mermaidIdCounter = 0;
const Mermaid = ({ value }) => {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const elementId = useRef(`mermaid-${++mermaidIdCounter}`);

  useEffect(() => {
    let active = true;
    const removeMermaidErrorArtifacts = () => {
      if (typeof document === 'undefined') return;
      [elementId.current, `d${elementId.current}`].forEach((id) => {
        document.getElementById(id)?.remove();
      });
    };
    const renderDiagram = async () => {
      try {
        await mermaid.parse(value, { suppressErrors: true });
        const { svg: renderedSvg } = await mermaid.render(elementId.current, value);
        if (active) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        removeMermaidErrorArtifacts();
        console.warn('Mermaid render failed, showing raw diagram:', err.message);
        if (active) {
          setError(err);
          setSvg('');
        }
      }
    };
    renderDiagram();
    return () => {
      active = false;
      removeMermaidErrorArtifacts();
    };
  }, [value]);

  if (error) {
    return (
      <pre style={{ background: 'rgba(74, 45, 27, 0.06)', border: '1px dashed rgba(118, 73, 26, 0.25)', padding: '10px', borderRadius: '6px', overflowX: 'auto' }}>
        <code>{value}</code>
      </pre>
    );
  }

  if (!svg) {
    return <div style={{ padding: '20px', color: '#4a2d1b', textAlign: 'center' }}>绘制星图导图中...</div>;
  }

  return (
    <div 
      className="mermaid-rendered" 
      dangerouslySetInnerHTML={{ __html: svg }} 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        margin: '1.5rem auto',
        padding: '0.8rem',
        background: 'rgba(74, 45, 27, 0.05)',
        border: '1px dashed rgba(74, 45, 27, 0.2)',
        borderRadius: '10px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        overflowX: 'auto'
      }} 
    />
  );
};

// ── Obsidian Wikilinks 解析与辅助函数 ────────────────────────────────────
function toNoteHref(slug) {
  return `/note/${String(slug).split('/').map(encodeURIComponent).join('/')}`;
}

function normalizeLinkKey(value) {
  return String(value || '').trim().replace(/\.md$/i, '').toLowerCase();
}

function getIndexCandidates(index, group, key) {
  const value = index?.[group]?.[normalizeLinkKey(key)];
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function chooseWikilinkCandidate(candidates, sourceSlug, sourceCollectionRoot) {
  const unique = [...new Set(candidates.filter(Boolean))];
  if (unique.length <= 1) return { slug: unique[0] || null, status: unique[0] ? 'resolved' : 'unresolved' };

  const sourceDir = sourceSlug.split('/').slice(0, -1).join('/');
  const sameDir = unique.filter((slug) => slug.split('/').slice(0, -1).join('/') === sourceDir);
  if (sameDir.length === 1) return { slug: sameDir[0], status: 'resolved' };

  const sameCollection = unique.filter((slug) => slug.startsWith(`${sourceCollectionRoot}/`));
  if (sameCollection.length === 1) return { slug: sameCollection[0], status: 'resolved' };

  return { slug: null, status: 'ambiguous' };
}

function remarkWikilinks(options = {}) {
  const resolveWikilink = options.resolve;
  return (tree) => {
    const visit = (node, parent) => {
      if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i--) {
          visit(node.children[i], node);
        }
      }
      if (node.type === 'text' && parent) {
        const regex = /\[\[([^\]|#]+)(?:\|([^\]]*))?(?:#[^\]]*)?\]\]/g;
        let match;
        const parts = [];
        let lastIndex = 0;

        while ((match = regex.exec(node.value)) !== null) {
          if (match.index > lastIndex) {
            parts.push({ type: 'text', value: node.value.slice(lastIndex, match.index) });
          }
          const target = match[1].trim();
          const display = match[2] ? match[2].trim() : target;
          const result = resolveWikilink?.(target);
          const resolvedSlug = typeof result === 'string' ? result : result?.slug;
          if (resolvedSlug && result?.status !== 'ambiguous') {
            parts.push({
              type: 'link',
              url: toNoteHref(resolvedSlug),
              children: [{ type: 'text', value: display }],
            });
          } else {
            parts.push({
              type: 'link',
              url: `#${result?.status === 'ambiguous' ? 'wikilink-ambiguous' : 'wikilink-unresolved'}:${encodeURIComponent(target)}`,
              children: [{ type: 'text', value: display }],
            });
          }
          lastIndex = match.index + match[0].length;
        }

        if (parts.length > 0) {
          if (lastIndex < node.value.length) {
            parts.push({ type: 'text', value: node.value.slice(lastIndex) });
          }
          const idx = parent.children.indexOf(node);
          parent.children.splice(idx, 1, ...parts);
        }
      }
    };
    visit(tree, null);
  };
}

// -------------------------------------------------------------------------
// 主组件 (Blog)
// -------------------------------------------------------------------------
export default function Blog() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sceneMode, setSceneMode] = useState('overview'); // overview, indoor, outdoor, travel, archive, workshop
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isMinimapOpen, setIsMinimapOpen] = useState(true);
  const [isCompassHovered, setIsCompassHovered] = useState(false);
  const [isPendulumHovered, setIsPendulumHovered] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [cutoutOpacityGrids, setCutoutOpacityGrids] = useState({});
  const [hoveredCutoutId, setHoveredCutoutId] = useState(null);
  const [isTeleporting, setIsTeleporting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [notesData, setNotesData] = useState([]);

  // 恢复由图谱等页面返回时的博客长廊阅读器状态，保持现场
  useEffect(() => {
    if (location.state?.restoreBlogState) {
      const s = location.state.restoreBlogState;
      if (s.sceneMode) setSceneMode(s.sceneMode);
      if (s.selectedArticleSlug) setSelectedArticleSlug(s.selectedArticleSlug);
      if (s.isReaderOpen) setIsReaderOpen(s.isReaderOpen);
      if (s.isModalOpen) setIsModalOpen(s.isModalOpen);
      if (s.notesData) setNotesData(s.notesData);
      if (s.modalNotes) setModalNotes(s.modalNotes);
      if (s.activeScrollTitle) setActiveScrollTitle(s.activeScrollTitle);
      if (s.activeScrollMeta) setActiveScrollMeta(s.activeScrollMeta);
      if (s.archiveMode) setArchiveMode(s.archiveMode);
      
      // 清理路由 state 以防重载重复触发
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Preload background images to prevent flash-on-load
  useEffect(() => {
    const preloadImages = async () => {
      const primaryImages = [
        BLOG_NEW_ASSETS.bgMain, // overview background
        BLOG_NEW_ASSETS.bgWall,  // indoor background
      ];

      const promises = primaryImages.map((src) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = src;
          img.onload = resolve;
          img.onerror = resolve;
        });
      });

      await Promise.all(promises);
      // Brief delay for smooth fade-out
      setTimeout(() => {
        setIsPageLoading(false);
      }, 700);
    };

    preloadImages();
  }, []);
  
  // 摘叶子与传送节点交互状态
  const [isLeafPreviewOpen, setIsLeafPreviewOpen] = useState(false);
  const [activeLeafNote, setActiveLeafNote] = useState(null);
  const [leafSnippet, setLeafSnippet] = useState('');
  const [leafSnippetLoading, setLeafSnippetLoading] = useState(false);
  const [shakingLeafId, setShakingLeafId] = useState(null);
  
  const currentScene = BLOG_SCENES[sceneMode];
  const cutoutItems = currentScene.items.filter(item => item.type === 'map-cutout' || item.type === 'cutout-scroll' || item.type === 'cutout-prop');
  const travelCutoutItems = cutoutItems;

  // Pre-calculate compact opacity grids for transparent cutout assets.
  useEffect(() => {
    let cancelled = false;

    Object.entries(CUTOUT_HIT_ASSETS).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const scale = 0.1;
        const w = Math.floor(img.width * scale);
        const h = Math.floor(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h).data;
        const grid = new Uint8Array(w * h);
        for (let i = 0; i < grid.length; i++) {
          grid[i] = imgData[i * 4 + 3] > 20 ? 1 : 0;
        }

        if (!cancelled) {
          setCutoutOpacityGrids(prev => ({
            ...prev,
            [key]: { width: w, height: h, grid }
          }));
        }
      };
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCutoutLayerMouseMove = (items, e) => {
    const sceneLayer = e.currentTarget.parentElement;
    if (!sceneLayer) return;

    const rect = sceneLayer.getBoundingClientRect();
    const screenRx = (e.clientX - rect.left) / rect.width;
    const screenRy = (e.clientY - rect.top) / rect.height;
    const rx = 0.5 + (screenRx - 0.5) / 1.05;
    const ry = 0.5 + (screenRy - 0.5) / 1.05;

    if (rx < 0 || rx > 1 || ry < 0 || ry > 1) {
      setHoveredCutoutId(null);
      return;
    }

    const hitItem = [...items].reverse().find(item => {
      const opacityGrid = cutoutOpacityGrids[item.hitKey];
      if (!opacityGrid) return false;

      const gx = Math.min(opacityGrid.width - 1, Math.max(0, Math.floor(rx * opacityGrid.width)));
      const gy = Math.min(opacityGrid.height - 1, Math.max(0, Math.floor(ry * opacityGrid.height)));
      const index = gy * opacityGrid.width + gx;
      return opacityGrid.grid[index] === 1;
    });

    setHoveredCutoutId(hitItem?.id || null);
  };

  const handleCutoutLayerMouseLeave = () => {
    setHoveredCutoutId(null);
  };

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
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [activeScrollTitle, setActiveScrollTitle] = useState('');
  const [activeScrollMeta, setActiveScrollMeta] = useState('');
  const [modalNotes, setModalNotes] = useState([]);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState(null);
  const [graphData, setGraphData] = useState(null);

  // 获取图谱索引数据，用于解析 Obsidian 双链
  useEffect(() => {
    fetchGraphData()
      .then(data => setGraphData(data))
      .catch(err => console.warn('[Blog] Failed to load graph data:', err));
  }, []);
  
  // Article detail state
  const [articleTitle, setArticleTitle] = useState('');
  const [articleBody, setArticleBody] = useState('');
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState(null);

  // Obsidian 双链解析器
  const wikilinkResolver = useMemo(() => {
    if (!selectedArticleSlug) return () => null;
    const sourceCollectionRoot = selectedArticleSlug.split('/')[0] || '';
    const sourceDir = selectedArticleSlug.split('/').slice(0, -1).join('/');
    const index = graphData?.wikilinkIndex;

    if (index) {
      return (target) => {
        const cleanTarget = String(target).split('#')[0].split('^')[0];
        const key = normalizeLinkKey(cleanTarget);

        if (key.includes('/')) {
          return chooseWikilinkCandidate([
            ...getIndexCandidates(index, 'pathIndex', key),
            ...getIndexCandidates(index, 'pathIndex', `${sourceDir}/${key}`),
            ...getIndexCandidates(index, 'pathIndex', `${sourceCollectionRoot}/${key}`),
          ], selectedArticleSlug, sourceCollectionRoot);
        }

        return chooseWikilinkCandidate([
          ...getIndexCandidates(index, 'pathIndex', `${sourceDir}/${key}`),
          ...getIndexCandidates(index, 'aliasIndex', key),
          ...getIndexCandidates(index, 'titleIndex', key),
          ...getIndexCandidates(index, 'basenameIndex', key),
          ...getIndexCandidates(index, 'pathIndex', key),
        ], selectedArticleSlug, sourceCollectionRoot);
      };
    }

    return (target) => {
      const linkMap = new Map();
      for (const node of graphData?.nodes ?? []) {
        const slugValue = node.slug || node.id;
        const fileName = slugValue?.split('/').pop();
        const candidates = [node.title, node.id, node.slug, node.path, fileName, ...(node.aliases || [])];
        for (const candidate of candidates) {
          const mapKey = normalizeLinkKey(candidate);
          if (!mapKey) continue;
          linkMap.set(mapKey, [...(linkMap.get(mapKey) || []), slugValue]);
        }
      }
      return chooseWikilinkCandidate(linkMap.get(normalizeLinkKey(target)) || [], selectedArticleSlug, sourceCollectionRoot);
    };
  }, [selectedArticleSlug, graphData]);

  // Search & Filter state for Archive scene
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchTag, setSelectedSearchTag] = useState('');
  const [archiveMode, setArchiveMode] = useState(null); // 'search' or 'recent' or null

  const handleOpenNote = (slug) => {
    setSelectedArticleSlug(slug);
    setIsModalOpen(false);
    setIsReaderOpen(true);
  };

  const handleBackToCatalog = () => {
    setIsReaderOpen(false);
    if (modalNotes.length > 0 || archiveMode) {
      setIsModalOpen(true);
    }
    setSelectedArticleSlug(null);
  };

  const handleCloseReader = () => {
    setIsReaderOpen(false);
    setSelectedArticleSlug(null);
  };

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
    fetchNotesIndex()
      .then(data => {
        setNotesData(data.notes || []);
        setNotesLoading(false);
      })
      .catch(err => {
        console.warn('[Blog] Failed to load notes index:', err.message);
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
        setArticleTitle(parsed.data.title || fileName);
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
      const getTime = (note) => {
        const value = note.updatedAt || note.date || note.createdAt;
        const time = value ? new Date(value).getTime() : 0;
        return Number.isFinite(time) ? time : 0;
      };
      const recent = [...notesData]
        .sort((a, b) => getTime(b) - getTime(a))
        .slice(0, 15);
      setModalNotes(recent);
      setIsModalOpen(true);
      return;
    }

    if (item.articleSlug) {
      setSelectedArticleSlug(item.articleSlug);
      setActiveScrollTitle(item.label || '旅行攻略');
      setActiveScrollMeta(item.articleMeta || 'TRAVEL · HANGZHOU');
      setModalNotes([]);
      setIsReaderOpen(true);
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
          console.warn('[Blog] Failed to load leaf snippet:', err.message);
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
    setIsReaderOpen(true);
  };

  return (
    <PageWrapper>
      {/* 🔮 载入画面 (Page Loading Screen Overlay) */}
      <AnimatePresence>
        {isPageLoading && (
          <LoadingScreen
            key="page-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
          >
            <div className="magic-circle" />
            <div className="loading-text">正在唤醒树屋书斋...</div>
            <div className="loading-bar-bg">
              <div className="loading-bar-fill" />
            </div>
          </LoadingScreen>
        )}
      </AnimatePresence>

      {/* 🗺️ 右上角游园星图 (Collapsible Minimap) */}
      <MinimapContainer>
        <AnimatePresence>
          {!isMinimapOpen ? (
            <div 
              style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              onMouseEnter={() => setIsCompassHovered(true)}
              onMouseLeave={() => setIsCompassHovered(false)}
            >
              <MinimapCompass
                onClick={() => setIsMinimapOpen(true)}
                whileHover={{ scale: 1.15, rotate: 360 }}
                whileTap={{ scale: 0.9 }}
                initial={{ scale: 0, opacity: 0, rotate: -180 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0, rotate: 180 }}
                transition={{ type: 'spring', stiffness: 150, damping: 16 }}
              >
                🧭
              </MinimapCompass>
              <AnimatePresence>
                {isCompassHovered && (
                  <CompassTooltip
                    initial={{ opacity: 0, x: 12, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 12, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                  >
                    展开游园星图
                  </CompassTooltip>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              {/* Title floating capsule above circular paper */}
              <MinimapTitle
                initial={{ opacity: 0, y: -15, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.8 }}
                transition={{ type: 'spring', damping: 14 }}
              >
                🧭 游园星图 <span>(双路径)</span>
              </MinimapTitle>

              <MinimapPaper
                $bgSrc={BLOG_NEW_ASSETS.bgMinimap}
                initial={{ scale: 0, rotate: -360, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, rotate: 360, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 16 }}
              >
                <MinimapGraphArea>
                  {/* Connections & Celestial Astrolabe SVG Background */}
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                    {/* Decorative astronomical concentric circles (Astrolabe grid) */}
                    <circle cx="50%" cy="50%" r="22%" fill="none" stroke="rgba(231, 199, 126, 0.12)" strokeWidth="1" strokeDasharray="3 3" />
                    <MinimapOrbitRing cx="50%" cy="50%" r="42%" fill="none" stroke="rgba(231, 199, 126, 0.08)" strokeWidth="1" strokeDasharray="6 4" />
                    <circle cx="50%" cy="50%" r="62%" fill="none" stroke="rgba(231, 199, 126, 0.05)" strokeWidth="1" />
                    <circle cx="50%" cy="50%" r="80%" fill="none" stroke="rgba(231, 199, 126, 0.03)" strokeWidth="1.5" strokeDasharray="10 5" />
                    
                    {/* Astronomical axis lines (crosshairs) */}
                    <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="rgba(231, 199, 126, 0.05)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="rgba(231, 199, 126, 0.05)" strokeWidth="1" strokeDasharray="4 4" />

                    {/* Astrolabe Cardinal Direction Markers */}
                    <text x="50%" y="9%" fill="rgba(231, 199, 126, 0.45)" fontSize="7" fontWeight="800" textAnchor="middle" fontFamily="Courier New, monospace">N</text>
                    <text x="50%" y="94%" fill="rgba(231, 199, 126, 0.45)" fontSize="7" fontWeight="800" textAnchor="middle" fontFamily="Courier New, monospace">S</text>
                    <text x="9%" y="52%" fill="rgba(231, 199, 126, 0.45)" fontSize="7" fontWeight="800" textAnchor="middle" fontFamily="Courier New, monospace">W</text>
                    <text x="91%" y="52%" fill="rgba(231, 199, 126, 0.45)" fontSize="7" fontWeight="800" textAnchor="middle" fontFamily="Courier New, monospace">E</text>

                    {/* Decorative twinkling stars */}
                    <g className="twinkle-stars">
                      <circle cx="15%" cy="25%" r="1" fill="#fff" opacity="0.6">
                        <animate attributeName="opacity" values="0.2;1;0.2" dur="3s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="85%" cy="20%" r="1.5" fill="#e7c77e" opacity="0.8">
                        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="12%" cy="75%" r="1.2" fill="#fff" opacity="0.5">
                        <animate attributeName="opacity" values="0.1;0.9;0.1" dur="4s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="88%" cy="85%" r="1" fill="#e7c77e" opacity="0.7">
                        <animate attributeName="opacity" values="0.2;1;0.2" dur="2.5s" repeatCount="indefinite" />
                      </circle>
                    </g>

                    {/* Node Connections */}
                    {MAP_EDGES.map((edge, idx) => (
                      <g key={idx}>
                        {/* Background path track */}
                        <line 
                          x1={`${edge.x1}%`} 
                          y1={`${edge.y1}%`} 
                          x2={`${edge.x2}%`} 
                          y2={`${edge.y2}%`} 
                          stroke="rgba(231, 199, 126, 0.08)" 
                          strokeWidth="1.5" 
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
                      overview: { x: 50, y: 18, icon: '☼', label: '总览' },
                      indoor: { x: 30, y: 40, icon: '⌂', label: '屋内' },
                      outdoor: { x: 70, y: 40, icon: '☘', label: '林间' },
                      travel: { x: 70, y: 72, icon: '⎈', label: '旅案' },
                      junction: { x: 30, y: 64, icon: '☍', label: '回廊' },
                      archive: { x: 20, y: 82, icon: '▤', label: '旧柜' },
                      workshop: { x: 48, y: 82, icon: '⚙', label: '工坊' }
                    }[scene.id] || { x: 50, y: 50, icon: '★', label: '未知' };
   
                    const isCurrent = sceneMode === scene.id;
   
                    return (
                      <MinimapNodeContainer
                        key={scene.id}
                        $x={coords.x}
                        $y={coords.y}
                        onClick={() => changeScene(scene.id)}
                        onMouseEnter={() => setHoveredNodeId(scene.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                      >
                        <MinimapMedallion $isCurrent={isCurrent} $themeColor={scene.themeColor}>
                          {coords.icon}
                        </MinimapMedallion>
                        <MinimapNodeLabel $isCurrent={isCurrent} $themeColor={scene.themeColor}>
                          {coords.label}
                        </MinimapNodeLabel>
                        
                        {isCurrent && (
                          <MinimapPointerBadge
                            animate={{ y: [-3, 1, -3] }}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                          >
                            ✨
                          </MinimapPointerBadge>
                        )}

                        <AnimatePresence>
                          {hoveredNodeId === scene.id && (
                            <NodeTooltip
                              $themeColor={scene.themeColor}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.15 }}
                            >
                              传送到: {scene.title}
                            </NodeTooltip>
                          )}
                        </AnimatePresence>
                      </MinimapNodeContainer>
                    );
                  })}
                </MinimapGraphArea>

                {/* Hanging mechanical swinging pendulum key to trigger closure */}
                <MinimapPendulum
                  onClick={() => {
                    setIsMinimapOpen(false);
                    setIsPendulumHovered(false);
                  }}
                  onMouseEnter={() => setIsPendulumHovered(true)}
                  onMouseLeave={() => setIsPendulumHovered(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PendulumChain />
                  <PendulumKey>🔑</PendulumKey>
                  <AnimatePresence>
                    {isPendulumHovered && (
                      <PendulumTooltip
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                      >
                        锁上星图 (收起)
                      </PendulumTooltip>
                    )}
                  </AnimatePresence>
                </MinimapPendulum>
              </MinimapPaper>
            </>
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

                if (item.type === 'map-cutout' || item.type === 'cutout-scroll' || item.type === 'cutout-prop') {
                  const isCutoutHovered = hoveredCutoutId === item.id;
                  return (
                    <TravelMapCutoutItem
                      key={item.id}
                      $left={item.left}
                      $top={item.top}
                      $width={item.width}
                      $height={item.height}
                      $sceneId={currentScene.id}
                      $isHovered={isCutoutHovered}
                      $hitLeft={item.hitLeft}
                      $hitTop={item.hitTop}
                      $hitWidth={item.hitWidth}
                      $hitHeight={item.hitHeight}
                    >
                      <TravelMapImage 
                        $imgSrc={item.imgSrc} 
                        $sceneId={currentScene.id} 
                        $isHovered={isCutoutHovered} 
                        $itemId={item.id}
                        $hitLeft={item.hitLeft}
                        $hitTop={item.hitTop}
                        $hitWidth={item.hitWidth}
                        $hitHeight={item.hitHeight}
                      />
                      <TravelMapCutoutLabel
                        $isHovered={isCutoutHovered}
                        $labelLeft={item.labelLeft}
                        $labelTop={item.labelTop}
                        $itemId={item.id}
                      >
                        <div className="label-dot" />
                        <div className="label-text-wrapper">
                          <span className="label-title">{item.label}</span>
                          {item.articleMeta && (
                            <span className="label-meta">{item.articleMeta}</span>
                          )}
                        </div>
                      </TravelMapCutoutLabel>
                    </TravelMapCutoutItem>
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
                      $height={item.height}
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

              {travelCutoutItems.length > 0 && (
                <TravelCutoutHitLayer
                  type="button"
                  $hasHit={Boolean(hoveredCutoutId)}
                  onMouseMove={(e) => handleCutoutLayerMouseMove(travelCutoutItems, e)}
                  onMouseLeave={handleCutoutLayerMouseLeave}
                  onClick={() => {
                    const hitItem = travelCutoutItems.find(item => item.id === hoveredCutoutId);
                    if (hitItem) handleItemClick(hitItem);
                  }}
                  aria-label="旅行素材交互层"
                />
              )}
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
              $bgSrc={sceneMode === 'travel' ? BLOG_NEW_ASSETS.oceanMap : sceneMode === 'archive' ? BLOG_NEW_ASSETS.archiveIndexBg : BLOG_NEW_ASSETS.scrollOpen}
              $sceneMode={sceneMode}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 85, damping: 14 }}
            >
              {/* 关闭按钮 */}
              <ScrollCloseButton $sceneMode={sceneMode} onClick={() => setIsModalOpen(false)}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </ScrollCloseButton>

              {/* 卷轴头部 */}
              <ScrollHeader $sceneMode={sceneMode}>
                <ScrollTitle $sceneMode={sceneMode}>{activeScrollTitle}</ScrollTitle>
                <ScrollMeta $sceneMode={sceneMode}>{activeScrollMeta}</ScrollMeta>
              </ScrollHeader>

              {/* 卷轴主要内容区 */}
              <ScrollContentArea $sceneMode={sceneMode}>
                {archiveMode === 'search' ? (
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
                            $sceneMode={sceneMode}
                            onClick={() => handleOpenNote(note.slug)}
                          >
                            <ArticleHeaderRow>
                              <ArticleTitle>✦ {note.title}</ArticleTitle>
                              <ArticleMeta>{note.collectionLabel || '归档'}</ArticleMeta>
                            </ArticleHeaderRow>
                            {note.tags && note.tags.length > 0 && (
                              <ArticleDesc>
                                {note.tags.slice(0, 4).map(t => (
                                  <span key={t} className="tag-pill">#{t}</span>
                                ))}
                              </ArticleDesc>
                            )}
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
                            $sceneMode={sceneMode}
                            onClick={() => handleOpenNote(note.slug)}
                          >
                            <ArticleHeaderRow>
                              <ArticleTitle>✦ {note.title}</ArticleTitle>
                              <ArticleMeta>{note.collectionLabel || '归档'}</ArticleMeta>
                            </ArticleHeaderRow>
                            {note.tags && note.tags.length > 0 && (
                              <ArticleDesc>
                                {note.tags.slice(0, 4).map(t => (
                                  <span key={t} className="tag-pill">#{t}</span>
                                ))}
                              </ArticleDesc>
                            )}
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

      {/* ─────────────────────────────────────────────────────────────
         新松果档案正文阅读器 Modal (NoteReaderModal)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isReaderOpen && (
          <ReaderBackdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseReader}
          >
            <ReaderPanel
              $bgSrc={BLOG_NEW_ASSETS.parchmentReader}
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 60, scale: 0.92, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 60, scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 95, damping: 15 }}
            >
              {/* 关闭按钮 */}
              <ReaderCloseButton onClick={handleCloseReader} title="收起法典">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </ReaderCloseButton>

              {/* 阅读器头部 */}
              <ReaderHeader>
                <ReaderTitleRow>
                  <ReaderTitle>{articleTitle || '无标题'}</ReaderTitle>
                </ReaderTitleRow>
                <ReaderMetaRow>
                  {activeScrollMeta && (
                    <ReaderMetaLabel>
                      {activeScrollMeta}
                    </ReaderMetaLabel>
                  )}
                  {selectedArticleSlug && !articleLoading && (
                    <ReaderTeleportLink
                      to={toNoteHref(selectedArticleSlug)}
                      state={{
                        fromBlog: true,
                        blogState: { sceneMode, selectedArticleSlug, isReaderOpen, isModalOpen, modalNotes, activeScrollTitle, activeScrollMeta, archiveMode }
                      }}
                      title="在星砂浑天图谱中定位此笔记并展开关系网络"
                    >
                      🪐 显影于星沙图谱
                    </ReaderTeleportLink>
                  )}
                </ReaderMetaRow>
              </ReaderHeader>

              {/* 返回列表按钮 */}
              {(modalNotes.length > 0 || archiveMode) && (
                <ReaderBackButton onClick={handleBackToCatalog}>
                  ← 返回目录
                </ReaderBackButton>
              )}

              {/* 核心正文阅读区 */}
              <ReaderContentArea>
                {articleLoading ? (
                  <LoadingWrapper>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} style={{ fontSize: '1.8rem' }}>📖</motion.div>
                    <span>正在翻开羊皮手卷...</span>
                  </LoadingWrapper>
                ) : articleError ? (
                  <EmptyState>
                    <p>⚠️ 卷页失效：{articleError}</p>
                  </EmptyState>
                ) : (
                  <MarkdownBody>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath, remarkHtmlBreaks, [remarkWikilinks, { resolve: wikilinkResolver }]]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        a: ({href, children, ...props}) => {
                          if (href?.startsWith('#wikilink-unresolved:')) {
                            return (
                              <span className="unresolved-wikilink" title="未发布或未收录">
                                {children}
                              </span>
                            );
                          }
                          if (href?.startsWith('#wikilink-ambiguous:')) {
                            return (
                              <span className="unresolved-wikilink" title="存在多个同名笔记，请在 Obsidian 中补全路径">
                                {children}
                              </span>
                            );
                          }
                          if (href && href.startsWith('/note/')) {
                            return (
                              <Link
                                to={href}
                                state={{
                                  fromBlog: true,
                                  blogState: { sceneMode, selectedArticleSlug, isReaderOpen, isModalOpen, modalNotes, activeScrollTitle, activeScrollMeta, archiveMode }
                                }}
                                {...props}
                              >
                                {children}
                              </Link>
                            );
                          }
                          return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                        },
                        code: (props) => {
                          const { className, children, ...rest } = props;
                          const match = /language-(\w+)/.exec(className || '');
                          const codeText = String(children).replace(/\n$/, '');
                          if (match && match[1] === 'mermaid') {
                            return <Mermaid value={codeText} />;
                          }
                          return <code className={className} {...rest}>{children}</code>;
                        },
                        blockquote: (props) => {
                          const { children, ...rest } = props;
                          const calloutData = findAndModifyCallout(children);
                          if (calloutData.isCallout) {
                            const config = CALLOUT_MAP[calloutData.type] || { title: calloutData.type, color: '#94a3b8', icon: 'info', theme: 'info' };
                            const displayTitle = calloutData.title || config.title;
                            return (
                              <div className={`callout callout-${config.theme}`} style={{ '--callout-color': config.color }}>
                                <div className="callout-title">
                                  <span className="callout-icon">
                                    <CalloutIcon iconType={config.icon} />
                                  </span>
                                  <span className="callout-title-text">{displayTitle}</span>
                                </div>
                                <div className="callout-content">
                                  {calloutData.children}
                                </div>
                              </div>
                            );
                          }
                          return <blockquote {...rest}>{children}</blockquote>;
                        }
                      }}
                    >
                      {preprocessMarkdown(articleBody)}
                    </ReactMarkdown>
                  </MarkdownBody>
                )}
              </ReaderContentArea>
            </ReaderPanel>
          </ReaderBackdrop>
        )}
      </AnimatePresence>

    </PageWrapper>
  );
}
