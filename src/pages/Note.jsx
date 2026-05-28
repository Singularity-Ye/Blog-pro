import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import styled from 'styled-components';
import MiniGraph from '../components/GraphView/MiniGraph';
import { filterGraphByLocal } from '../utils/graphFilters';
import { parseFrontmatter } from '../utils/frontmatter';
import { fetchGraphData } from '../utils/publishData';
import noteReadingBg from '../assets/images/atlas/note-reading.png';

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

  &::before,
  &::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
  }

  &::before {
    z-index: -2;
    background:
      linear-gradient(90deg, rgba(255, 250, 238, 0.14), rgba(255, 246, 224, 0.02) 48%, rgba(229, 190, 119, 0.12)),
      linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(237, 214, 170, 0.2)),
      url(${noteReadingBg}) center center / cover fixed,
      #efe0bd;
  }

  &::after {
    z-index: -1;
    opacity: 0.2;
    background:
      linear-gradient(rgba(158, 104, 34, 0.018) 1px, transparent 1px),
      linear-gradient(90deg, rgba(158, 104, 34, 0.014) 1px, transparent 1px),
      radial-gradient(circle at 24% 24%, rgba(216, 162, 71, 0.12) 0 1px, transparent 2px),
      radial-gradient(circle at 72% 66%, rgba(255, 247, 223, 0.16) 0 1px, transparent 2px);
    background-size: 48px 48px, 48px 48px, 190px 190px, 230px 230px;
    mask-image: radial-gradient(circle at 50% 40%, black, transparent 80%);
    animation: note-dust-drift 30s linear infinite;
  }

  @keyframes note-dust-drift {
    from { transform: translate3d(0, 0, 0); }
    to { transform: translate3d(-80px, 64px, 0); }
  }
`;

const NoteContent = styled.div`
  flex: 1;
  min-width: 0;
  background:
    linear-gradient(135deg, rgba(255, 250, 238, 0.58), rgba(237, 214, 170, 0.28)),
    rgba(255, 246, 224, 0.42);
  backdrop-filter: blur(6px) saturate(1.08);
  -webkit-backdrop-filter: blur(6px) saturate(1.08);
  border: 1.5px solid rgba(196, 154, 69, 0.34);
  border-radius: 12px;
  padding: clamp(1.2rem, 3.5vw, 2.5rem);
  box-shadow: 
    0 20px 50px rgba(43, 31, 15, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.36),
    inset 0 0 30px rgba(255, 247, 223, 0.18);
  outline: 1px solid rgba(255, 255, 255, 0.42);
  outline-offset: -5px;
`;

const NoteSidebar = styled.aside`
  width: 300px;
  flex-shrink: 0;
  align-self: stretch; /* Stretch to parent height to allow inner children to stick */
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 900px) {
    display: none;
  }
`;

const TocContainer = styled.div`
  background:
    linear-gradient(135deg, rgba(255, 250, 238, 0.56), rgba(237, 214, 170, 0.22)),
    rgba(255, 246, 224, 0.38);
  backdrop-filter: blur(5px) saturate(1.06);
  -webkit-backdrop-filter: blur(5px) saturate(1.06);
  border: 1px solid rgba(196, 154, 69, 0.32);
  border-radius: 8px;
  padding: 1rem;
  box-shadow:
    0 10px 24px rgba(91, 70, 48, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.26);
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
  border: 1px solid rgba(196, 154, 69, 0.32);
  border-radius: 20px;
  background: rgba(255, 246, 224, 0.54);
  backdrop-filter: blur(5px) saturate(1.05);
  font-size: 0.8rem;
  color: #6f4616;
  font-weight: 800;
  letter-spacing: 0.05em;
  margin-bottom: 1.8rem;
  cursor: pointer;
  box-shadow: 
    0 4px 12px rgba(91, 70, 48, 0.05),
    inset 0 0 8px rgba(255, 255, 255, 0.34);
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

  svg {
    transition: transform 0.3s ease;
    stroke: #8e652a;
  }

  &:hover {
    color: #8e652a;
    background: rgba(196, 154, 69, 0.12);
    border-color: #c49a45;
    box-shadow: 
      0 6px 16px rgba(196, 154, 69, 0.12),
      inset 0 0 12px rgba(255, 255, 255, 0.6);
    transform: translateY(-1px);

    svg {
      transform: translateX(-4px);
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

  /* Custom scrollbar to keep it premium */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(223, 198, 146, 0.3);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(223, 198, 146, 0.5);
  }
`;

const TocTitle = styled.div`
  font-size: 0.75rem;
  color: #8e652a;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin-bottom: 0.75rem;
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
    color: rgba(95, 59, 18, 0.72);
    transition: color 0.2s;
    &:hover { color: #c49a45; }
  }
`;

const NoteTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #533919;
  margin-bottom: 0.5rem;
`;

const NoteMeta = styled.div`
  font-size: 0.8rem;
  color: rgba(95, 59, 18, 0.52);
  margin-bottom: 2rem;
`;

const PropertyPanel = styled.section`
  display: grid;
  gap: 0.75rem;
  margin: 1.4rem 0 1.8rem;
  padding: 1rem;
  border: 1px solid rgba(216, 162, 71, 0.24);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 250, 238, 0.46), rgba(237, 214, 170, 0.2)),
    rgba(255, 246, 224, 0.24);
  box-shadow:
    0 18px 42px rgba(95, 59, 18, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px) saturate(1.05);
  -webkit-backdrop-filter: blur(5px) saturate(1.05);
`;

const PropertyTitle = styled.div`
  color: #8e652a;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.12em;
`;

const PropertyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.55rem;
`;

const PropertyItem = styled.div`
  min-width: 0;
  padding: 0.55rem 0.65rem;
  border: 1px solid rgba(216, 162, 71, 0.18);
  border-radius: 6px;
  background: rgba(255, 250, 238, 0.36);

  span {
    display: block;
    margin-bottom: 0.18rem;
    color: rgba(95, 59, 18, 0.52);
    font-size: 0.68rem;
  }

  strong {
    display: block;
    overflow: hidden;
    color: #5f3b12;
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
  border: 1px solid rgba(216, 162, 71, 0.28);
  border-radius: 999px;
  background: rgba(216, 162, 71, 0.12);
  color: rgba(95, 59, 18, 0.82);
  font-size: 0.72rem;
  line-height: 1.2;
`;



// Markdown 内容样式
const MarkdownBody = styled.div`
  color: #3f3527;
  line-height: 1.85;
  font-size: 0.96rem;

  h1, h2, h3, h4, h5, h6 {
    color: #6f4616;
    font-weight: 700;
    margin: 2.2rem 0 0.9rem;
    scroll-margin-top: 80px;
  }
  h1 { font-size: 1.65rem; }
  h2 { font-size: 1.4rem; border-bottom: 1.5px solid rgba(196, 154, 69, 0.22); padding-bottom: 0.35rem; }
  h3 { font-size: 1.2rem; }

  p { margin: 0.9rem 0; }

  a {
    color: #8e652a;
    text-decoration: none;
    border-bottom: 1.5px solid rgba(142, 101, 42, 0.3);
    transition: all 0.2s ease;
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

  code {
    background: rgba(196, 154, 69, 0.08);
    color: #8e652a;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 0.85em;
    font-family: 'IBM Plex Mono', 'Fira Code', monospace;
  }

  pre {
    background: rgba(246, 240, 226, 0.65);
    border: 1.2px solid rgba(196, 154, 69, 0.28);
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
    code { 
      background: none; 
      padding: 0; 
      color: #5c4731;
    }
  }

  blockquote {
    border-left: 3.5px solid #c49a45;
    padding: 0.6rem 1.2rem;
    margin: 1.2rem 0;
    color: #63503a;
    background: rgba(196, 154, 69, 0.05);
    border-radius: 0 8px 8px 0;
  }

  .callout {
    margin: 1.2rem 0;
    padding: 0.9rem 1.2rem;
    border-left: 4px solid var(--callout-color, #94a3b8);
    background: color-mix(in srgb, var(--callout-color) 8%, rgba(251, 246, 233, 0.88));
    border-radius: 4px 8px 8px 4px;
    box-shadow: 0 8px 24px rgba(91, 70, 48, 0.04), inset 0 0 10px rgba(255, 255, 255, 0.4);
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
    color: #4a3c2c;
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
      border: 1px solid rgba(231, 199, 126, 0.16);
      padding: 8px 12px;
      text-align: left;
    }
    th { background: rgba(231, 199, 126, 0.1); font-weight: 600; }
  }

  img {
    max-width: 100%;
    border-radius: 8px;
  }

  hr {
    border: none;
    border-top: 1px solid rgba(231, 199, 126, 0.16);
    margin: 2rem 0;
  }

  .mermaid-rendered {
    display: flex;
    justify-content: center;
    margin: 1.8rem auto;
    padding: 1.2rem;
    background: rgba(246, 240, 226, 0.65) !important;
    border: 1.5px dashed rgba(196, 154, 69, 0.35) !important;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(91, 70, 48, 0.05);
    overflow-x: auto;

    svg {
      max-width: 100% !important;
      height: auto !important;

      /* Node boxes */
      .node rect, .node circle, .node polygon, .node path {
        fill: rgba(196, 154, 69, 0.06) !important;
        stroke: rgba(196, 154, 69, 0.4) !important;
        stroke-width: 1.5px !important;
        rx: 8px !important;
        ry: 8px !important;
        transition: all 0.3s ease;
      }

      /* Hover effect */
      .node:hover rect, .node:hover circle, .node:hover polygon, .node:hover path {
        fill: rgba(196, 154, 69, 0.12) !important;
        stroke: #c49a45 !important;
        filter: drop-shadow(0 0 8px rgba(196, 154, 69, 0.2));
      }

      /* Text inside nodes */
      .node .label, .node label, .node text, .node span, .node div {
        fill: #533919 !important;
        color: #533919 !important;
        font-family: inherit !important;
        font-size: 13px !important;
        font-weight: 500 !important;
      }

      /* Connection lines */
      .edgePath .path {
        stroke: rgba(196, 154, 69, 0.5) !important;
        stroke-width: 1.8px !important;
        transition: all 0.3s ease;
      }

      .edgePath:hover .path {
        stroke: #c49a45 !important;
        stroke-width: 2.2px !important;
      }

      /* Edge labels background */
      .edgeLabel rect {
        fill: #fdfaf3 !important;
        rx: 4px !important;
        ry: 4px !important;
        opacity: 0.95 !important;
        stroke: rgba(196, 154, 69, 0.2) !important;
      }

      /* Edge labels text */
      .edgeLabel text, .edgeLabel span, .edgeLabel div {
        fill: #8e652a !important;
        color: #8e652a !important;
        font-size: 11px !important;
        font-weight: 600 !important;
      }

      /* Arrowheads */
      marker {
        fill: rgba(196, 154, 69, 0.55) !important;
        path {
          fill: rgba(196, 154, 69, 0.55) !important;
          stroke: none !important;
          stroke-width: 0 !important;
        }
      }
      
      /* Clusters */
      .cluster rect {
        fill: rgba(196, 154, 69, 0.02) !important;
        stroke: rgba(196, 154, 69, 0.2) !important;
        stroke-width: 1.5px !important;
        stroke-dasharray: 4 4 !important;
        rx: 12px !important;
        ry: 12px !important;
      }
      
      .cluster label, .cluster span, .cluster text {
        fill: rgba(95, 59, 18, 0.6) !important;
        color: rgba(95, 59, 18, 0.6) !important;
        font-size: 12px !important;
        font-weight: 700 !important;
      }
    }
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const decodedSlug = useMemo(() => decodeURIComponent(slug || ''), [slug]);

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
    } else {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/blog');
      }
    }
  };

  // 加载图谱数据
  useEffect(() => {
    fetchGraphData()
      .then(setGraphData)
      .catch((err) => { console.warn('[Note] Failed to load graph data:', err.message); });
  }, []);

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
    () => (graphData ? filterGraphByLocal(graphData, decodedSlug) : null),
    [decodedSlug, graphData]
  );
  const currentNode = useMemo(
    () => graphData?.nodes?.find((node) => node.id === decodedSlug || node.slug === decodedSlug) ?? null,
    [decodedSlug, graphData]
  );
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
      <NoteLayout>
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
      <NoteLayout>
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
    <NoteLayout>
      <NoteContent>
        <BackButton type="button" onClick={handleBackClick}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          返回上一页
        </BackButton>
        <NoteTitle>{title}</NoteTitle>
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
        <MarkdownBody>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, [remarkWikilinks, { resolve: wikilinkResolver }]]}
            components={{
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
      </NoteContent>

      <NoteSidebar>
        {!isMobile && localGraphData && (
          <MiniGraph
            currentSlug={decodedSlug}
            graphData={localGraphData}
            label="局部关系图"
            theme="publishLocal"
            expandHref={`/graph?local=${encodeURIComponent(decodedSlug)}`}
          />
        )}
        {graphData && (
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
