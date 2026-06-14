import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import mermaid from 'mermaid';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import MiniGraph from '../components/GraphView/MiniGraph';
import { filterGraphByLocal } from '../utils/graphFilters';
import { parseFrontmatter } from '../utils/frontmatter';
import { fetchGraphData } from '../utils/publishData';
import remarkHtmlBreaks from '../utils/remarkHtmlBreaks';
import { MouseLeafDrift } from '../components/MouseEffects';
import noteReadingBgLight from '../assets/images/atlas/note-reading-light.png';
import noteReadingBgDark from '../assets/images/atlas/note-reading-dark.png';
// Helper to recursively replace <br> / <br/> / <br /> strings with React <br /> components
const renderChildrenWithBr = (children) => {
  if (!children) return children;
  
  const processNode = (node) => {
    if (typeof node === 'string') {
      const parts = node.split(/(<br\s*\/?>)/gi);
      if (parts.length > 1) {
        return parts.map((part, index) => {
          if (part.match(/<br\s*\/?>/i)) {
            return <br key={index} />;
          }
          return part;
        });
      }
      return node;
    }
    if (React.isValidElement(node) && node.props && node.props.children) {
      return React.cloneElement(node, {
        ...node.props,
        children: renderChildrenWithBr(node.props.children)
      });
    }
    if (Array.isArray(node)) {
      return node.map((child, index) => {
        const processed = processNode(child);
        return Array.isArray(processed)
          ? processed.map((p, pIdx) =>
              React.isValidElement(p) ? React.cloneElement(p, { key: `${index}-${pIdx}` }) : p
            )
          : processed;
      });
    }
    return node;
  };

  return React.Children.map(children, processNode);
};

const METADATA_COLLECTIONS = [
  { slug: 'travel', kind: 'travel' },
  { slug: 'project', kind: 'project' },
  { slug: 'blog-design', kind: 'blog-design' },
  { slug: 'compiler-theory', kind: 'compiler-theory' },
  { slug: 'linux-notes', kind: 'linux-notes' },
  { slug: 'embedded', kind: 'embedded' },
  { slug: 'knowledge-grocery', kind: 'knowledge-grocery' },
  { slug: 'internal-skills', kind: 'internal-skills' },
  { slug: 'weaveink', kind: 'weaveink' },
  { slug: 'laohan-criticism', kind: 'laohan-criticism' },
  { slug: 'laotou-criticism', kind: 'laotou-criticism' },
  { slug: 'guanxin-pavilion', kind: 'guanxin-pavilion' },
];

const COLLECTION_LABELS = {
  travel: '落沙行路 · 杭州旅游攻略',
  project: '万象构筑 · 个人建站流程',
  'blog-design': '松窗灵笈 · 个人博客构建',
  'compiler-theory': '天玄奥道 · 编译原理',
  'linux-notes': '天玄奥道 · Linux 笔记',
  embedded: '天玄奥道 · 嵌入式开发',
  'knowledge-grocery': '青灯闲情 · 知识杂货铺',
  'internal-skills': '太玄 · 认知札记',
  weaveink: '代号《织墨》(WeaveInk)',
  'laohan-criticism': '老韩宇宙',
  'laotou-criticism': '老头宇宙',
  'guanxin-pavilion': '观心阁',
};

export function parseElegantTitle(title) {
  if (!title) return { mainText: '', subText: null };
  
  // 1. 优先匹配括号包裹的内容，并剥离括号
  const parenMatch = title.match(/^([^(（]+)[(（](.+?)[)）]\s*$/);
  if (parenMatch) {
    return {
      mainText: parenMatch[1].trim(),
      subText: parenMatch[2].trim()
    };
  }
  
  // 2. 管道符分割
  if (title.includes('|')) {
    const parts = title.split('|');
    return {
      mainText: parts[0].trim(),
      subText: parts[1].trim()
    };
  }
  
  // 3. 中点分割，保留中点作为卷轴修饰符
  if (title.includes('·')) {
    const parts = title.split('·');
    return {
      mainText: parts[0].trim(),
      subText: `· ${parts[1].trim()}`
    };
  }
  
  // 4. 横线分割
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    return {
      mainText: parts[0].trim(),
      subText: parts[1].trim()
    };
  }
  
  return {
    mainText: title.trim(),
    subText: null
  };
}

// ── 样式 ──────────────────────────────────────────────────────

const NoteLayout = styled.div`
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  gap: 2rem;
  min-height: 100vh;
  position: relative;
  isolation: isolate;

  /* Global variables depending on theme */
  --bg-primary: ${({ $theme }) => $theme === 'light' ? '#f5efe3' : '#07100e'};
  --text-primary: ${({ $theme }) => $theme === 'light' ? '#2c251d' : '#f5efe3'};
  --text-muted: ${({ $theme }) => $theme === 'light' ? 'rgba(44, 37, 29, 0.7)' : 'rgba(255, 240, 212, 0.84)'};
  --text-accent: ${({ $theme }) => $theme === 'light' ? '#996316' : '#ffe197'};

  --glass-bg: ${({ $theme }) => $theme === 'light' ? 'rgba(242, 233, 218, 0.76)' : 'rgba(28, 18, 12, 0.52)'};
  --glass-bg-alt: ${({ $theme }) => $theme === 'light' ? 'rgba(232, 220, 202, 0.45)' : 'rgba(20, 13, 8, 0.45)'};
  --glass-border: ${({ $theme }) => $theme === 'light' ? 'rgba(180, 127, 45, 0.35)' : 'rgba(216, 162, 71, 0.36)'};
  --glass-border-highlight: ${({ $theme }) => $theme === 'light' ? 'rgba(180, 127, 45, 0.6)' : 'rgba(231, 199, 126, 0.7)'};
  --glass-shadow: ${({ $theme }) => $theme === 'light' ? '0 12px 32px rgba(120, 90, 60, 0.12)' : '0 20px 48px rgba(0, 0, 0, 0.24)'};
  --glass-inset: ${({ $theme }) => $theme === 'light' ? 'inset 0 1px 0 rgba(255, 255, 255, 0.5)' : 'inset 0 1px 0 rgba(255, 247, 223, 0.22)'};

  /* Markdown custom styles */
  --md-code-bg: ${({ $theme }) => $theme === 'light' ? 'rgba(196, 154, 69, 0.08)' : 'rgba(231, 199, 126, 0.12)'};
  --md-code-color: ${({ $theme }) => $theme === 'light' ? '#8e652a' : '#ffe197'};
  --md-pre-bg: ${({ $theme }) => $theme === 'light' ? 'rgba(246, 240, 226, 0.65)' : 'rgba(15, 12, 10, 0.68)'};
  --md-blockquote-bg: ${({ $theme }) => $theme === 'light' ? 'rgba(196, 154, 69, 0.05)' : 'rgba(231, 199, 126, 0.06)'};
  --md-blockquote-text: ${({ $theme }) => $theme === 'light' ? '#63503a' : '#e2d4bd'};
  --md-table-border: ${({ $theme }) => $theme === 'light' ? 'rgba(196, 154, 69, 0.16)' : 'rgba(231, 199, 126, 0.2)'};

  --button-bg: ${({ $theme }) => $theme === 'light' ? 'rgba(255, 246, 224, 0.54)' : 'rgba(28, 18, 12, 0.6)'};
  --button-hover-bg: ${({ $theme }) => $theme === 'light' ? 'rgba(196, 154, 69, 0.12)' : 'rgba(231, 199, 126, 0.15)'};

  &::before,
  &::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
  }

  &::before {
    z-index: -2;
    background: ${({ $theme }) => $theme === 'light'
      ? `linear-gradient(90deg, rgba(255, 250, 238, 0.14), rgba(255, 246, 224, 0.02) 48%, rgba(229, 190, 119, 0.12)),
         linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(237, 214, 170, 0.2)),
         url(${noteReadingBgLight}) center center / cover fixed,
         #efe0bd`
      : `linear-gradient(180deg, rgba(7, 16, 14, 0.4), rgba(7, 16, 14, 0.6)),
         url(${noteReadingBgDark}) center center / cover fixed,
         #07100e`
    };
    filter: ${({ $theme }) => $theme === 'light' ? 'none' : 'brightness(0.9) contrast(1.1)'};
    transition: background 0.5s ease, filter 0.5s ease;
  }

  &::after {
    z-index: -1;
    opacity: ${({ $theme }) => $theme === 'light' ? 0.2 : 0.42};
    background: ${({ $theme }) => $theme === 'light'
      ? `linear-gradient(rgba(158, 104, 34, 0.018) 1px, transparent 1px),
         linear-gradient(90deg, rgba(158, 104, 34, 0.014) 1px, transparent 1px),
         radial-gradient(circle at 24% 24%, rgba(216, 162, 71, 0.12) 0 1px, transparent 2px),
         radial-gradient(circle at 72% 66%, rgba(255, 247, 223, 0.16) 0 1px, transparent 2px)`
      : `linear-gradient(rgba(216, 162, 71, 0.02) 1px, transparent 1px),
         linear-gradient(90deg, rgba(216, 162, 71, 0.015) 1px, transparent 1px),
         radial-gradient(circle at 24% 24%, rgba(231, 199, 126, 0.15) 0 1px, transparent 2px),
         radial-gradient(circle at 72% 66%, rgba(231, 199, 126, 0.2) 0 1px, transparent 2px)`
    };
    background-size: 48px 48px, 48px 48px, 190px 190px, 230px 230px;
    mask-image: radial-gradient(circle at 50% 40%, black, transparent 80%);
    animation: note-dust-drift 30s linear infinite;
    transition: opacity 0.5s ease;
  }

  @keyframes note-dust-drift {
    from { transform: translate3d(0, 0, 0); }
    to { transform: translate3d(-80px, 64px, 0); }
  }

  @media (max-width: 900px) {
    padding: 1rem 0.75rem;

    &::before {
      position: absolute;
      background-attachment: scroll;
      filter: none;
    }

    &::after {
      display: none;
      animation: none;
    }
  }
`;

const NoteContent = styled.div`
  flex: 1;
  min-width: 0;
  position: relative;
  background:
    linear-gradient(135deg, var(--glass-bg-alt), rgba(20, 16, 23, 0.02)),
    var(--glass-bg);
  backdrop-filter: blur(6px) saturate(1.08);
  -webkit-backdrop-filter: blur(6px) saturate(1.08);
  border: 1.5px solid var(--glass-border);
  border-radius: 12px;
  padding: clamp(1.2rem, 3.5vw, 2.5rem);
  box-shadow: 
    var(--glass-shadow),
    var(--glass-inset),
    inset 0 0 30px rgba(231, 199, 126, 0.05);
  outline: 1px solid rgba(255, 255, 255, 0.05);
  outline-offset: -5px;
  transition: all 0.5s ease;

  @media (max-width: 900px) {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--glass-bg-alt) 70%, transparent), rgba(20, 16, 23, 0.02)),
      color-mix(in srgb, var(--glass-bg) 78%, transparent);
  }
`;

const NoteSidebar = styled.aside`
  width: 300px;
  flex-shrink: 0;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 900px) {
    display: none;
  }
`;

const MobileRelatedNotes = styled.div`
  margin: 3rem 0 1.5rem;
  padding: 1.5rem;
  border-radius: 12px;
  background:
    linear-gradient(135deg, var(--glass-bg-alt), rgba(20, 16, 23, 0.02)),
    var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: var(--glass-shadow);

  @media (max-width: 900px) {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
`;

const RelatedNotesTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-accent, #e7c77e);
  margin-bottom: 1.2rem;
  letter-spacing: 0.06em;
  border-bottom: 1px dashed rgba(231, 199, 126, 0.2);
  padding-bottom: 0.6rem;
`;

const RelatedNotesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RelatedNoteLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.8rem;
  border-radius: 6px;
  border: 1px solid rgba(231, 199, 126, 0.12);
  background: rgba(255, 255, 255, 0.01);
  color: var(--text-primary);
  font-size: 0.82rem;
  transition: all 0.25s ease;
  text-decoration: none;
  min-width: 0;

  .bullet {
    color: var(--text-accent, #e7c77e);
    margin-right: 0.6rem;
    font-size: 0.7rem;
    opacity: 0.7;
    flex-shrink: 0;
  }

  .title {
    flex: 1;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 1rem;
  }

  .category {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    background: rgba(231, 199, 126, 0.1);
    color: var(--text-accent, #e7c77e);
    border: 1px solid rgba(231, 199, 126, 0.18);
    flex-shrink: 0;
  }

  &:hover,
  &:active {
    border-color: var(--glass-border-highlight, #ffe197);
    background: rgba(231, 199, 126, 0.06);
    transform: translateX(4px);
  }
`;

const TocContainer = styled.div`
  background:
    linear-gradient(135deg, var(--glass-bg-alt), rgba(20, 16, 23, 0.02)),
    var(--glass-bg);
  backdrop-filter: blur(5px) saturate(1.06);
  -webkit-backdrop-filter: blur(5px) saturate(1.06);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: 1rem;
  box-shadow:
    var(--glass-shadow),
    var(--glass-inset);
  transition: all 0.5s ease;

  @media (max-width: 900px) {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
`;

const StickySidebarContent = styled.div`
  position: sticky;
  top: 80px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: calc(100vh - 100px);
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  width: fit-content;
  padding: 0.5rem 1.2rem;
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  background: var(--button-bg);
  backdrop-filter: blur(5px) saturate(1.05);
  font-size: 0.8rem;
  color: var(--text-accent);
  font-weight: 800;
  letter-spacing: 0.05em;
  margin-bottom: 1.8rem;
  cursor: pointer;
  box-shadow: 
    var(--glass-shadow),
    var(--glass-inset);
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

  @media (max-width: 900px) {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  svg {
    transition: transform 0.3s ease;
    stroke: var(--text-accent);
  }

  &:hover {
    color: var(--text-primary);
    background: var(--button-hover-bg);
    border-color: var(--glass-border-highlight);
    transform: translateY(-1px);

    svg {
      transform: translateX(-4px);
      stroke: var(--text-primary);
    }
  }

  &:active {
    transform: translateY(1px);
  }
`;

const SidebarBackButton = styled(BackButton)`
  width: 100%;
  justify-content: center;
  margin-bottom: 0;
  flex-shrink: 0;
`;

const ScrollableToc = styled(TocContainer)`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--glass-border);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(--glass-border-highlight);
  }
`;

const TocTitle = styled.div`
  font-size: 0.75rem;
  color: var(--text-accent);
  font-weight: 900;
  letter-spacing: 0.08em;
  margin-bottom: 0.75rem;
  transition: color 0.5s ease;
`;

const TocList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const TocItem = styled.li`
  padding: 4px 0;
  padding-left: ${props => (props.$level - 1) * 12}px;
  font-size: 0.8rem;
  a {
    color: var(--text-muted);
    transition: color 0.2s;
    &:hover { color: var(--text-accent); }
  }
`;

const NoteTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  transition: color 0.5s ease;
`;

const NoteSubtitle = styled.div`
  margin-top: 0.25rem;
  margin-bottom: 0.75rem;
  font-size: clamp(1.05rem, 1.8vw, 1.3rem);
  font-weight: 300;
  color: var(--text-accent);
  letter-spacing: 0.08em;
  opacity: 0.85;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
  text-shadow: ${({ $theme }) => $theme === 'light' ? 'none' : '0 0 8px rgba(231,199,126,0.25)'};
  transition: color 0.5s ease;
`;

const NoteMeta = styled.div`
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 2rem;
  transition: color 0.5s ease;
`;

const PropertyPanel = styled.section`
  display: grid;
  gap: 0.75rem;
  margin: 1.4rem 0 1.8rem;
  padding: 1rem;
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  background:
    linear-gradient(135deg, var(--glass-bg-alt), rgba(20, 16, 23, 0.02)),
    var(--glass-bg);
  box-shadow:
    var(--glass-shadow),
    var(--glass-inset);
  backdrop-filter: blur(5px) saturate(1.05);
  -webkit-backdrop-filter: blur(5px) saturate(1.05);
  transition: all 0.5s ease;

  @media (max-width: 900px) {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
`;

const PropertyTitle = styled.div`
  color: var(--text-accent);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  transition: color 0.5s ease;
`;

const PropertyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.55rem;
`;

const PropertyItem = styled.div`
  min-width: 0;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--glass-border);
  border-radius: 6px;
  background: var(--glass-bg-alt);
  transition: all 0.5s ease;

  span {
    display: block;
    margin-bottom: 0.18rem;
    color: var(--text-muted);
    font-size: 0.68rem;
  }

  strong {
    display: block;
    overflow: hidden;
    color: var(--text-primary);
    font-size: 0.86rem;
    line-height: 1.45;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.1rem;
`;

const TagChip = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  max-width: 100%;
  margin: 0;
  padding: 0.1rem 0.46rem;
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  background: var(--glass-bg-alt);
  color: var(--text-accent);
  font-size: 0.72rem;
  line-height: 1.2;
  transition: all 0.5s ease;
`;

const MarkdownBody = styled.div`
  color: var(--text-primary);
  line-height: 1.85;
  font-size: 0.96rem;
  transition: color 0.5s ease;

  h1, h2, h3, h4, h5, h6 {
    color: var(--text-accent);
    font-weight: 700;
    margin: 2.2rem 0 0.9rem;
    scroll-margin-top: 80px;
    transition: color 0.5s ease;
  }
  h1 { font-size: 1.65rem; }
  h2 { font-size: 1.4rem; border-bottom: 1.5px solid var(--glass-border); padding-bottom: 0.35rem; }
  h3 { font-size: 1.2rem; }

  p { margin: 0.9rem 0; }

  a {
    color: var(--text-accent);
    text-decoration: none;
    border-bottom: 1.5px solid var(--glass-border);
    transition: all 0.2s ease;
    &:hover { 
      color: var(--text-primary);
      border-bottom-color: var(--glass-border-highlight);
    }
  }

  .unresolved-wikilink {
    color: var(--text-muted);
    border-bottom: 1.5px dashed var(--glass-border);
    cursor: help;
  }

  code {
    background: var(--md-code-bg);
    color: var(--md-code-color);
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 0.85em;
    font-family: 'IBM Plex Mono', 'Fira Code', monospace;
    transition: all 0.5s ease;
  }

  pre {
    background: var(--md-pre-bg);
    border: 1.2px solid var(--glass-border);
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
    transition: all 0.5s ease;
    code { 
      background: none; 
      padding: 0; 
      color: var(--text-primary);
    }
  }

  blockquote {
    border-left: 3.5px solid var(--text-accent);
    padding: 0.6rem 1.2rem;
    margin: 1.2rem 0;
    color: var(--md-blockquote-text);
    background: var(--md-blockquote-bg);
    border-radius: 0 8px 8px 0;
    transition: all 0.5s ease;
  }

  .callout {
    margin: 1.2rem 0;
    padding: 0.9rem 1.2rem;
    border-left: 4px solid var(--callout-color, #94a3b8);
    background: ${({ $theme }) => $theme === 'light'
      ? 'color-mix(in srgb, var(--callout-color) 8%, rgba(251, 246, 233, 0.88))'
      : 'color-mix(in srgb, var(--callout-color) 12%, rgba(20, 16, 14, 0.88))'
    };
    border-radius: 4px 8px 8px 4px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04), inset 0 0 10px rgba(255, 255, 255, 0.05);
    overflow: hidden;
  }

  .callout-title {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: var(--callout-color, #94a3b8);
    font-size: 0.92rem;
    letter-spacing: 0.03em;
  }

  .callout-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--callout-color, #94a3b8);
    flex-shrink: 0;
    
    svg {
      width: 17px;
      height: 17px;
      stroke-width: 2.2px;
    }
  }

  .callout-title-text {
    line-height: 1.2;
  }

  .callout-content {
    color: var(--text-primary);
    font-size: 0.9rem;
    line-height: 1.65;

    p {
      margin: 0.4rem 0;
    }
    p:first-child {
      margin-top: 0;
    }
    p:last-child {
      margin-bottom: 0;
    }
    ul, ol {
      margin: 0.4rem 0;
    }
  }

  ul, ol { padding-left: 1.5rem; margin: 0.75rem 0; }
  li { margin: 0.25rem 0; }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    th, td {
      border: 1px solid var(--md-table-border);
      padding: 8px 12px;
      text-align: left;
    }
    th { background: var(--glass-bg-alt); font-weight: 600; }
  }

  img {
    max-width: 100%;
    border-radius: 8px;
  }

  hr {
    border: none;
    border-top: 1px solid var(--glass-border);
    margin: 2rem 0;
  }

  .mermaid-rendered {
    display: flex;
    justify-content: center;
    margin: 1.8rem auto;
    padding: 1.2rem;
    background: var(--md-pre-bg) !important;
    border: 1.5px dashed var(--glass-border) !important;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
    overflow-x: auto;
    transition: all 0.5s ease;

    svg {
      max-width: 100% !important;
      height: auto !important;

      /* Node boxes */
      .node rect, .node circle, .node polygon, .node path {
        fill: var(--glass-bg-alt) !important;
        stroke: var(--glass-border) !important;
        stroke-width: 1.5px !important;
        rx: 8px !important;
        ry: 8px !important;
        transition: all 0.3s ease;
      }

      /* Hover effect */
      .node:hover rect, .node:hover circle, .node:hover polygon, .node:hover path {
        fill: var(--glass-bg) !important;
        stroke: var(--glass-border-highlight) !important;
        filter: drop-shadow(0 0 8px var(--glass-border));
      }

      /* Text inside nodes */
      .node .label, .node label, .node text, .node span, .node div {
        fill: var(--text-primary) !important;
        color: var(--text-primary) !important;
        font-family: inherit !important;
        font-size: 13px !important;
        font-weight: 500 !important;
      }

      /* Connection lines */
      .edgePath .path {
        stroke: var(--glass-border) !important;
        stroke-width: 1.8px !important;
        transition: all 0.3s ease;
      }

      .edgePath:hover .path {
        stroke: var(--glass-border-highlight) !important;
        stroke-width: 2.2px !important;
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
        fill: var(--text-primary) !important;
        color: var(--text-primary) !important;
        font-size: 11px !important;
        font-weight: 600 !important;
      }

      /* Arrowheads */
      marker {
        fill: var(--glass-border) !important;
        path {
          fill: var(--glass-border) !important;
          stroke: none !important;
          stroke-width: 0 !important;
        }
      }
      
      /* Clusters */
      .cluster rect {
        fill: var(--glass-bg-alt) !important;
        stroke: var(--glass-border) !important;
        stroke-width: 1.5px !important;
        stroke-dasharray: 4 4 !important;
        rx: 12px !important;
        ry: 12px !important;
      }
      
      .cluster label, .cluster span, .cluster text {
        fill: var(--text-muted) !important;
        color: var(--text-muted) !important;
        font-size: 12px !important;
        font-weight: 700 !important;
      }
    }
  }
`;

const ThemeToggleWrapper = styled.div`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  z-index: 9999;
  
  @media (max-width: 900px) {
    top: 1.25rem;
    right: 1.25rem;
  }
`;

const ToggleLabel = styled.span`
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: var(--text-accent);
  text-shadow: ${({ $theme }) => $theme === 'light' ? 'none' : '0 0 8px rgba(231,199,126,0.4)'};
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  padding: 0.18rem 0.45rem;
  border-radius: 4px;
  backdrop-filter: blur(8px);
  pointer-events: none;
  user-select: none;
  transition: all 0.3s ease;
  white-space: nowrap;
`;

const ThemeToggle = styled.button`
  width: 38px;
  height: 76px;
  border-radius: 19px;
  border: 1.5px solid var(--glass-border);
  background: ${({ $theme }) => $theme === 'light' 
    ? 'linear-gradient(to bottom, #7ec0ee, #bce3ff)' 
    : 'linear-gradient(to bottom, #090f1d, #141c30)'};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 3px 0;
  position: relative;
  overflow: hidden;
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(12px);
  transition: background 0.5s ease, border-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    border-color: var(--glass-border-highlight);
    box-shadow: 0 0 15px rgba(216, 162, 71, 0.4);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ToggleKnob = styled(motion.div)`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  position: relative;
  z-index: 2;
  background: ${({ $theme }) => $theme === 'light' 
    ? 'radial-gradient(circle at 30% 30%, #ffdf79, #fdb813)' 
    : 'radial-gradient(circle at 30% 30%, #f1f5f9, #94a3b8)'};
  box-shadow: ${({ $theme }) => $theme === 'light' 
    ? '0 0 8px rgba(253, 184, 19, 0.6), inset -2px -2px 4px rgba(0,0,0,0.1)' 
    : '0 0 8px rgba(226, 232, 240, 0.4), inset -3px -3px 0px 0px #64748b'};
`;

const DecorationLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .cloud {
    position: absolute;
    background: rgba(255, 255, 255, 0.85);
    border-radius: 50%;
    opacity: ${({ $theme }) => $theme === 'light' ? 1 : 0};
    transform: translateX(${({ $theme }) => $theme === 'light' ? '0' : '-15px'});
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .cloud-1 { width: 14px; height: 14px; bottom: 22px; left: 6px; }
  .cloud-2 { width: 22px; height: 12px; bottom: 12px; left: 10px; border-radius: 6px; }

  .star {
    position: absolute;
    background: white;
    width: 2px;
    height: 2px;
    border-radius: 50%;
    opacity: ${({ $theme }) => $theme === 'light' ? 0 : 0.8};
    transform: translateX(${({ $theme }) => $theme === 'light' ? '15px' : '0'});
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .star-1 { top: 12px; left: 10px; animation: toggle-twinkle 2s infinite alternate; }
  .star-2 { top: 22px; left: 24px; animation: toggle-twinkle 1.5s infinite alternate 0.5s; }
  .star-3 { top: 32px; left: 8px; animation: toggle-twinkle 3s infinite alternate 1s; }

  @keyframes toggle-twinkle {
    0% { opacity: 0.3; }
    100% { opacity: 1; }
  }
`;


// ── Wikilink 处理 ─────────────────────────────────────────────

function toNoteHref(slug) {
  return `/note/${String(slug).split('/').map(encodeURIComponent).join('/')}`;
}

function getTextContent(value) {
  if (Array.isArray(value)) return value.map(getTextContent).join('');
  if (value === null || value === undefined || typeof value === 'boolean') return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value?.props?.children) return getTextContent(value.props.children);
  return '';
}

function slugifyHeading(value) {
  return getTextContent(value)
    .trim()
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^\p{Letter}\p{Number}_\s-]/gu, '')
    .replace(/\s+/g, '-');
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

/** 将 [[wikilink]] 语法转为站内笔记链接 */
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

// ── Obsidian Callouts 解析与组件 ────────────────────────────────

const CALLOUT_MAP = {
  note: { title: 'Note', color: '#60a5fa', icon: 'pencil', theme: 'note' },
  info: { title: 'Info', color: '#5aa38f', icon: 'info', theme: 'info' },
  todo: { title: 'Todo', color: '#3b82f6', icon: 'todo', theme: 'todo' },
  tip: { title: 'Tip', color: '#fbbf24', icon: 'tip', theme: 'tip' },
  hint: { title: 'Tip', color: '#fbbf24', icon: 'tip', theme: 'tip' },
  important: { title: 'Important', color: '#a78bfa', icon: 'important', theme: 'important' },
  success: { title: 'Success', color: '#34d399', icon: 'success', theme: 'success' },
  check: { title: 'Success', color: '#34d399', icon: 'success', theme: 'success' },
  done: { title: 'Success', color: '#34d399', icon: 'success', theme: 'success' },
  question: { title: 'Question', color: '#a78bfa', icon: 'question', theme: 'question' },
  help: { title: 'Question', color: '#a78bfa', icon: 'question', theme: 'question' },
  faq: { title: 'Question', color: '#a78bfa', icon: 'question', theme: 'question' },
  warning: { title: 'Warning', color: '#f97316', icon: 'warning', theme: 'warning' },
  caution: { title: 'Warning', color: '#f97316', icon: 'warning', theme: 'warning' },
  attention: { title: 'Warning', color: '#f97316', icon: 'warning', theme: 'warning' },
  failure: { title: 'Failure', color: '#ef4444', icon: 'failure', theme: 'failure' },
  fail: { title: 'Failure', color: '#ef4444', icon: 'failure', theme: 'failure' },
  missing: { title: 'Failure', color: '#ef4444', icon: 'failure', theme: 'failure' },
  danger: { title: 'Danger', color: '#f43f5e', icon: 'danger', theme: 'danger' },
  error: { title: 'Danger', color: '#f43f5e', icon: 'danger', theme: 'danger' },
  bug: { title: 'Bug', color: '#ec4899', icon: 'bug', theme: 'bug' },
  example: { title: 'Example', color: '#c084fc', icon: 'example', theme: 'example' },
  quote: { title: 'Quote', color: '#e7c77e', icon: 'quote', theme: 'quote' },
  cite: { title: 'Quote', color: '#e7c77e', icon: 'quote', theme: 'quote' },
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

// ── 提取标题目录 ──────────────────────────────────────────────

function extractHeadings(markdown) {
  const headings = [];
  const lines = markdown.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        id: slugifyHeading(match[2]),
      });
    }
  }
  return headings;
}

function Heading({ as: Tag, children, ...props }) {
  return (
    <Tag id={slugifyHeading(children)} {...props}>
      {children}
    </Tag>
  );
}

const PROPERTY_LABELS = {
  type: '类型',
  name: '名称',
  city: '城市',
  district: '区域',
  category: '分类',
  duration: '建议停留',
  date: '日期',
  open_time: '开放时间',
  price: '价格',
  ticket: '票价',
  verified: '已核验',
  source: '来源',
  tags: '标签',
};

const PROPERTY_ORDER = [
  'type',
  'name',
  'city',
  'district',
  'category',
  'duration',
  'date',
  'open_time',
  'price',
  'ticket',
  'verified',
  'source',
  'tags',
];

const TYPE_LABELS = {
  place: '地点',
  note: '笔记',
  project: '项目',
  guide: '指南',
};

function toDisplayValue(val) {
  if (val === true) return '是';
  if (val === false) return '否';
  return val;
}

function buildProperties(data) {
  return PROPERTY_ORDER
    .filter((key) => data[key] != null && data[key] !== '' && PROPERTY_LABELS[key])
    .map((key) => {
      const raw = data[key];
      const value = Array.isArray(raw) ? raw.filter(Boolean).map(toDisplayValue) : toDisplayValue(raw);
      return {
        key,
        label: PROPERTY_LABELS[key],
        value: key === 'type' ? (TYPE_LABELS[value] || value) : value,
      };
    })
    .filter((item) => (Array.isArray(item.value) ? item.value.length : item.value));
}
function getDisplayValue(value) {
  return Array.isArray(value) ? value.join(' / ') : value;
}

// ── Mermaid 流程图渲染组件 ─────────────────────────────────────
if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    suppressErrors: true,
    theme: 'base',
    securityLevel: 'strict',
    themeVariables: {
      background: 'transparent',
      primaryColor: 'rgba(231, 199, 126, 0.08)',
      textColor: '#ffedd5',
      lineColor: '#e7c77e',
    }
  });
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
      <pre style={{ background: 'rgba(9, 19, 17, 0.45)', border: '1px dashed rgba(231, 199, 126, 0.25)', padding: '10px', borderRadius: '6px', overflowX: 'auto' }}>
        <code>{value}</code>
      </pre>
    );
  }

  if (!svg) {
    return <div style={{ padding: '20px', color: '#ffedd5', textAlign: 'center' }}>绘制星图导图中...</div>;
  }

  return (
    <div 
      className="mermaid-rendered" 
      dangerouslySetInnerHTML={{ __html: svg }} 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        margin: '1.8rem auto',
        padding: '1.2rem',
        background: 'rgba(246, 240, 226, 0.65)',
        border: '1.5px dashed rgba(196, 154, 69, 0.35)',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(91, 70, 48, 0.05)',
        overflowX: 'auto'
      }} 
    />
  );
};

// ── 主组件 ────────────────────────────────────────────────────

export default function Note() {
  const { '*': slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [markdown, setMarkdown] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 900 : false);

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('atlas-theme');
    if (saved) return saved;
    const hour = new Date().getHours();
    return (hour >= 7 && hour < 19) ? 'light' : 'dark';
  });
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('atlas-theme', next);
    window.dispatchEvent(new Event('storage'));
  };

  useEffect(() => {
    const syncTheme = () => {
      const saved = localStorage.getItem('atlas-theme');
      if (saved) {
        setTheme(saved);
      } else {
        const hour = new Date().getHours();
        setTheme((hour >= 7 && hour < 19) ? 'light' : 'dark');
      }
    };
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const decodedSlug = useMemo(() => decodeURIComponent(slug || ''), [slug]);

  // 加载图谱数据
  useEffect(() => {
    if (graphData) return undefined;

    let cancelled = false;
    let idleId = null;
    let timeoutId = null;

    const loadGraph = () => {
      fetchGraphData()
        .then((data) => {
          if (!cancelled) setGraphData(data);
        })
        .catch((err) => { console.warn('[Note] Failed to load graph data:', err.message); });
    };

    if (isMobile) {
      if (loading) return undefined;
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(loadGraph, { timeout: 2500 });
      } else {
        timeoutId = window.setTimeout(loadGraph, 1500);
      }
    } else {
      loadGraph();
    }

    return () => {
      cancelled = true;
      if (idleId !== null && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [isMobile, loading, graphData]);

  const currentNode = useMemo(
    () => graphData?.nodes?.find((node) => node.id === decodedSlug || node.slug === decodedSlug) ?? null,
    [decodedSlug, graphData]
  );

  const handleBackClick = () => {
    const fromBlog = location.state?.fromBlog;
    const blogState = location.state?.blogState;
    if (fromBlog && blogState) {
      navigate('/blog', { state: { restoreBlogState: blogState } });
      return;
    }

    const fromBook = location.state?.fromBook;
    const activeTab = location.state?.activeTab;
    if (fromBook) {
      navigate('/blog', { state: { openBook: fromBook, activeTab } });
      return;
    }

    if (location.key === 'default' || window.history.length <= 1) {
      const matched = METADATA_COLLECTIONS.find(item => item.kind === currentNode?.collection);
      const atlasHref = matched ? `/atlas/${matched.slug}` : '/atlas';
      navigate(atlasHref);
    } else {
      navigate(-1);
    }
  };

  // 加载笔记内容
  useEffect(() => {
    if (!decodedSlug) return;
    setLoading(true);
    setError(null);

    fetch(`/notes/${decodedSlug}.md`)
      .then(r => {
        if (!r.ok) throw new Error(`笔记未找到: ${decodedSlug}`);
        return r.text();
      })
      .then(text => {
        setMarkdown(text);
        // 提取标题
        const parsed = parseFrontmatter(text);
        const fmTitle = text.replace(/\r\n?/g, '\n').match(/^---\n[\s\S]*?^title:\s*["']?(.+?)["']?\s*$/m);
        const h1Title = parsed.body.match(/^#\s+(.+)$/m);
        const fileName = decodedSlug.split('/').pop();
        setTitle(fmTitle?.[1] || h1Title?.[1] || fileName);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [decodedSlug]);

  const parsedNote = useMemo(() => {
    const { body, data } = parseFrontmatter(markdown);
    return { body, properties: buildProperties(data) };
  }, [markdown]);
  const headings = useMemo(() => extractHeadings(parsedNote.body), [parsedNote.body]);
  const localGraphData = useMemo(
    () => (!isMobile && graphData ? filterGraphByLocal(graphData, decodedSlug) : null),
    [decodedSlug, graphData, isMobile]
  );
  const relatedNotes = useMemo(() => {
    if (!isMobile || !graphData || !decodedSlug) return [];
    
    const connectedIds = new Set();
    graphData.links?.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      if (sourceId === decodedSlug) {
        connectedIds.add(targetId);
      } else if (targetId === decodedSlug) {
        connectedIds.add(sourceId);
      }
    });
    
    return graphData.nodes?.filter(node => connectedIds.has(node.id) || connectedIds.has(node.slug)) ?? [];
  }, [graphData, decodedSlug, isMobile]);
  const wikilinkResolver = useMemo(() => {
    const sourceCollectionRoot = decodedSlug.split('/')[0] || currentNode?.collection || '';
    const sourceDir = decodedSlug.split('/').slice(0, -1).join('/');
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
          ], decodedSlug, sourceCollectionRoot);
        }

        return chooseWikilinkCandidate([
          ...getIndexCandidates(index, 'pathIndex', `${sourceDir}/${key}`),
          ...getIndexCandidates(index, 'aliasIndex', key),
          ...getIndexCandidates(index, 'titleIndex', key),
          ...getIndexCandidates(index, 'basenameIndex', key),
          ...getIndexCandidates(index, 'pathIndex', key),
        ], decodedSlug, sourceCollectionRoot);
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
      return chooseWikilinkCandidate(linkMap.get(normalizeLinkKey(target)) || [], decodedSlug, sourceCollectionRoot);
    };
  }, [currentNode?.collection, decodedSlug, graphData]);
  const collectionGraphHref = currentNode?.collection
    ? `/graph?collection=${encodeURIComponent(currentNode.collection)}`
    : '/graph';

  useEffect(() => {
    if (loading || !location.hash) return undefined;

    let frameId = 0;
    const timeoutId = window.setTimeout(() => {
      frameId = window.requestAnimationFrame(() => {
        const targetId = decodeURIComponent(location.hash.slice(1));
        document.getElementById(targetId)?.scrollIntoView({ block: 'start' });
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [decodedSlug, loading, location.hash, parsedNote.body]);

  if (loading) {
    return (
      <NoteLayout $theme={theme}>
        <NoteContent>
          <div style={{ color: 'rgba(224,231,255,0.5)', padding: '4rem 0', textAlign: 'center' }}>
            加载中...
          </div>
        </NoteContent>
      </NoteLayout>
    );
  }

  if (error) {
    return (
      <NoteLayout $theme={theme}>
        <NoteContent>
          <BackButton type="button" onClick={handleBackClick}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            返回上一页
          </BackButton>
          <div style={{ color: 'rgba(224,231,255,0.5)', padding: '4rem 0', textAlign: 'center' }}>
            {error}
          </div>
        </NoteContent>
      </NoteLayout>
    );
  }

  return (
    <NoteLayout $theme={theme}>
      <MouseLeafDrift theme={theme} />
      <NoteContent>
        <ThemeToggleWrapper>
          <ToggleLabel $theme={theme}>
            {theme === 'light' ? '推演 · 晨曦' : '推演 · 幽夜'}
          </ToggleLabel>
          <ThemeToggle $theme={theme} onClick={toggleTheme} aria-label="切换主题">
            <DecorationLayer $theme={theme}>
              <div className="cloud cloud-1" />
              <div className="cloud cloud-2" />
              <div className="star star-1" />
              <div className="star star-2" />
              <div className="star star-3" />
            </DecorationLayer>
            <ToggleKnob 
              $theme={theme}
              animate={{ y: theme === 'light' ? 0 : 42 }}
              transition={{ type: 'spring', stiffness: 250, damping: 25 }}
            />
          </ThemeToggle>
        </ThemeToggleWrapper>
        <BackButton type="button" onClick={handleBackClick}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          返回上一页
        </BackButton>
        {(() => {
          const { mainText, subText } = parseElegantTitle(title);
          return (
            <>
              <NoteTitle>{mainText}</NoteTitle>
              {subText && <NoteSubtitle>{subText}</NoteSubtitle>}
            </>
          );
        })()}
        <NoteMeta>笔记路径: {decodedSlug}</NoteMeta>
        {parsedNote.properties.length > 0 && (
          <PropertyPanel>
            <PropertyTitle>档案属性</PropertyTitle>
            <PropertyGrid>
              {parsedNote.properties.map((item) => (
                <PropertyItem key={item.key}>
                  <span>{item.label}</span>
                  {item.key === 'tags' && Array.isArray(item.value) ? (
                    <TagList>
                      {item.value.map((tag) => (
                        <TagChip key={tag}>{tag}</TagChip>
                      ))}
                    </TagList>
                  ) : (
                    <strong title={getDisplayValue(item.value)}>{getDisplayValue(item.value)}</strong>
                  )}
                </PropertyItem>
              ))}
            </PropertyGrid>
          </PropertyPanel>
        )}
        <MarkdownBody $theme={theme}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath, remarkHtmlBreaks, [remarkWikilinks, { resolve: wikilinkResolver }]]}
            rehypePlugins={[rehypeKatex]}
            components={{
              table: ({children, ...props}) => (
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '1rem 0' }}>
                  <table {...props}>{children}</table>
                </div>
              ),
              td: ({children, ...props}) => <td {...props}>{renderChildrenWithBr(children)}</td>,
              th: ({children, ...props}) => <th {...props}>{renderChildrenWithBr(children)}</th>,
              p: ({children, ...props}) => <p {...props}>{renderChildrenWithBr(children)}</p>,
              li: ({children, ...props}) => <li {...props}>{renderChildrenWithBr(children)}</li>,
              h1: ({children, ...props}) => <Heading as="h1" {...props}>{children}</Heading>,
              h2: ({children, ...props}) => <Heading as="h2" {...props}>{children}</Heading>,
              h3: ({children, ...props}) => <Heading as="h3" {...props}>{children}</Heading>,
              h4: ({children, ...props}) => <Heading as="h4" {...props}>{children}</Heading>,
              h5: ({children, ...props}) => <Heading as="h5" {...props}>{children}</Heading>,
              h6: ({children, ...props}) => <Heading as="h6" {...props}>{children}</Heading>,
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
                  return <Link to={href} {...props}>{children}</Link>;
                }
                return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
              },
              img: ({src, alt, ...props}) => {
                let width = undefined;
                let cleanAlt = alt || '';
                if (cleanAlt.includes('|')) {
                  const parts = cleanAlt.split('|');
                  cleanAlt = parts[0];
                  const sizePart = parts[1];
                  if (/^\d+$/.test(sizePart)) {
                    width = sizePart + 'px';
                  } else if (sizePart.includes('x')) {
                    const [w] = sizePart.split('x');
                    width = w + 'px';
                  }
                }
                return (
                  <img
                    src={src}
                    alt={cleanAlt}
                    style={{
                      width: width || '100%',
                      maxWidth: '100%',
                      height: 'auto',
                      display: 'block',
                      margin: '1.8rem auto',
                      borderRadius: '8px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      border: '1px solid rgba(231, 199, 126, 0.16)'
                    }}
                    {...props}
                  />
                );
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
            {parsedNote.body}
          </ReactMarkdown>
        </MarkdownBody>

        {/* 移动端专用的相关笔记列表 */}
        {isMobile && relatedNotes.length > 0 && (
          <MobileRelatedNotes>
            <RelatedNotesTitle>✦ 相关星轨关联</RelatedNotesTitle>
            <RelatedNotesList>
              {relatedNotes.map((node) => (
                <RelatedNoteLink key={node.id} to={toNoteHref(node.slug ?? node.id)}>
                  <span style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <span className="bullet">✦</span>
                    <span className="title">{node.title}</span>
                  </span>
                  <span className="category">
                    {COLLECTION_LABELS[node.collection] || node.collection || '一般笔记'}
                  </span>
                </RelatedNoteLink>
              ))}
            </RelatedNotesList>
          </MobileRelatedNotes>
        )}
      </NoteContent>

      <NoteSidebar>
        {!isMobile && localGraphData && (
          <MiniGraph
            currentSlug={decodedSlug}
            graphData={localGraphData}
            label="局部关系图"
            theme={theme}
            expandHref={`/graph?local=${encodeURIComponent(decodedSlug)}`}
          />
        )}
        {!isMobile && graphData && (
          <TocContainer>
            <TocTitle>图谱视图</TocTitle>
            <TocList>
              <TocItem $level={1}>
                <Link to={`/graph?local=${encodeURIComponent(decodedSlug)}`} state={{ backgroundLocation: location }}>展开局部关系图</Link>
              </TocItem>
              <TocItem $level={1}>
                <Link to={collectionGraphHref} state={{ backgroundLocation: location }}>展开分类全局图</Link>
              </TocItem>
            </TocList>
          </TocContainer>
        )}
        <StickySidebarContent>
          <SidebarBackButton type="button" onClick={handleBackClick}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            返回上一页
          </SidebarBackButton>
          {headings.length > 0 && (
            <ScrollableToc>
              <TocTitle>目录</TocTitle>
              <TocList>
                {headings.map((h, i) => (
                  <TocItem key={i} $level={h.level}>
                    <a href={`#${h.id}`}>{h.text}</a>
                  </TocItem>
                ))}
              </TocList>
            </ScrollableToc>
          )}
        </StickySidebarContent>
      </NoteSidebar>
    </NoteLayout>
  );
}
