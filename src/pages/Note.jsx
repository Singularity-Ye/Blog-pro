import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import ImageCarousel from '../components/ImageCarousel';
import CircularGallery from '../components/CircularGallery';
import 'katex/dist/katex.min.css';
import mermaid from 'mermaid';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { parseFrontmatter } from '../utils/frontmatter';
import { fetchGraphData } from '../utils/publishData';
import remarkHtmlBreaks from '../utils/remarkHtmlBreaks';
import { encodeNotePath, safeDecodeNotePath, toNoteHref } from '../utils/notePaths';
import { normalizeMarkdownMath } from '../utils/markdownMath';
import { MouseLeafDrift } from '../components/MouseEffects';
import { scrollPositions } from '../utils/scrollCache';
import noteReadingBgLight from '../assets/images/atlas/note-reading-light.png';
import noteReadingBgDark from '../assets/images/atlas/note-reading-dark.png';
const normalizeComparePath = (p) => {
  return String(p || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[（(]/g, '(')
    .replace(/[）)]/g, ')');
};

const extractLifestyleImages = (text) => {
  if (!text) return [];
  const gallerySectionRegex = /(^|\n)(#{2,3}\s+(?:🖼️\s*)?(?:图集|现场|图录|探店)(?:手札|图集|照片)?)\s*\n([\s\S]*?)(?=\n#{2,3}\s|\n---|$)/;
  const match = text.match(gallerySectionRegex);
  if (!match) return [];
  const content = match[3];
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images = [];
  let imgMatch;
  while ((imgMatch = imgRegex.exec(content)) !== null) {
    images.push({
      src: imgMatch[2],
      alt: imgMatch[1]
    });
  }
  return images;
};

const preprocessMarkdown = (text, isLifestyle = false) => {
  if (!text) return text;
  
  // 移除 Obsidian 3D 圆弧画廊的 iframe 本地自嵌入，防止在网页端重复渲染
  const cleanText = text.replace(/<iframe\s+[^>]*?src=["'][^"']*?galleryOnly=true[^"']*?["'][^>]*?>\s*<\/iframe>/gi, '');
  
  let processed = normalizeMarkdownMath(cleanText)
    .replace(/\*\*([^*\s](?:(?:[^*]|\*[^*])*?[^*\s])?)\*\*/g, (match, content, offset, fullText) => {
      const charBefore = offset > 0 ? fullText[offset - 1] : '';
      const charAfter = offset + match.length < fullText.length ? fullText[offset + match.length] : '';
      
      let prefix = '';
      let suffix = '';
      
      if (/[a-zA-Z0-9\u4e00-\u9fa5]/.test(charBefore)) {
        prefix = ' ';
      }
      
      if (/[a-zA-Z0-9\u4e00-\u9fa5]/.test(charAfter)) {
        suffix = ' ';
      }
      
      return `${prefix}**${content}**${suffix}`;
    });

  if (isLifestyle) {
    // Look for headings like ## 🖼️ 图集手札, ## 图集手札, ## 🖼️ 图集, etc.
    const gallerySectionRegex = /(^|\n)(#{2,3}\s+(?:🖼️\s*)?(?:图集|现场|图录|探店)(?:手札|图集|照片)?)\s*\n([\s\S]*?)(?=\n#{2,3}\s|\n---|$)/g;
    
    processed = processed.replace(gallerySectionRegex, (match, beforeHeading, heading, content) => {
      if (content.includes('class="obsidian-carousel"') || content.includes('className="obsidian-carousel"')) {
        return match;
      }

      // Find all markdown images in this section content
      const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      const images = [];
      let imgMatch;
      while ((imgMatch = imgRegex.exec(content)) !== null) {
        images.push({
          full: imgMatch[0],
          alt: imgMatch[1],
          url: imgMatch[2]
        });
      }

      if (images.length >= 2) {
        // Build the carousel HTML
        const carouselHtml = [
          '<div class="obsidian-carousel" style="display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 8px; width: 100%; max-width: 480px; margin: 15px auto; padding-bottom: 8px; -webkit-overflow-scrolling: touch;">',
          ...images.map(img => `  <div style="flex: 0 0 100%; scroll-snap-align: start; box-sizing: border-box; border-radius: 12px; overflow: hidden; border: 1px solid var(--background-modifier-border);">\n    <img src="${img.url}" alt="${img.alt || '滑动查看'}" style="width: 100%; height: 320px; object-fit: cover; display: block;" />\n  </div>`),
          '</div>',
          '<div style="text-align: center; font-size: 0.85em; color: var(--text-muted); margin-top: -5px; margin-bottom: 15px;">💡 左右滑动或使用滚轮查看更多图片</div>'
        ].join('\n');

        let cleanContent = content;
        images.forEach(img => {
          cleanContent = cleanContent.replace(img.full, '');
        });

        return `${beforeHeading}${heading}\n\n${carouselHtml}\n\n${cleanContent}`;
      }

      return match;
    });
  }

  return processed;
};

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
  { slug: 'computer-organization', kind: 'computer-organization' },
];

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

const ImageZoomModal = ({ src, alt, onClose, theme }) => {
  const isDark = theme === 'dark';
  const viewportRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 800, height: 550 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  
  const scaleRef = useRef(scale);
  const positionRef = useRef(position);
  const isDraggingRef = useRef(false);

  const updateScaleAndPosition = (newScale, newPos) => {
    scaleRef.current = newScale;
    positionRef.current = newPos;
    setScale(newScale);
    setPosition(newPos);
  };

  const resetZoom = () => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    updateScaleAndPosition(1, { x: (rect.width - imgSize.width) / 2, y: (rect.height - imgSize.height) / 2 });
  };

  useEffect(() => {
    setTimeout(() => {
      if (viewportRef.current) {
        const rect = viewportRef.current.getBoundingClientRect();
        const imgW = Math.min(800, rect.width * 0.85);
        const imgH = Math.min(550, rect.height * 0.75);
        setImgSize({ width: imgW, height: imgH });
        updateScaleAndPosition(1, { x: (rect.width - imgW) / 2, y: (rect.height - imgH) / 2 });
      }
    }, 50);
  }, []);

  const zoomIn = () => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const currentScale = scaleRef.current;
    const currentPosition = positionRef.current;
    const newScale = Math.min(currentScale * 1.3, 15);
    const newX = midX - (midX - currentPosition.x) * (newScale / currentScale);
    const newY = midY - (midY - currentPosition.y) * (newScale / currentScale);
    updateScaleAndPosition(newScale, { x: newX, y: newY });
  };

  const zoomOut = () => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const currentScale = scaleRef.current;
    const currentPosition = positionRef.current;
    const newScale = Math.max(currentScale / 1.3, 0.15);
    const newX = midX - (midX - currentPosition.x) * (newScale / currentScale);
    const newY = midY - (midY - currentPosition.y) * (newScale / currentScale);
    updateScaleAndPosition(newScale, { x: newX, y: newY });
  };

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = 1.15;
    const isZoomIn = e.deltaY < 0;
    const currentScale = scaleRef.current;
    const currentPosition = positionRef.current;
    let newScale = isZoomIn ? currentScale * zoomFactor : currentScale / zoomFactor;
    newScale = Math.min(Math.max(newScale, 0.15), 15);
    const newX = mouseX - (mouseX - currentPosition.x) * (newScale / currentScale);
    const newY = mouseY - (mouseY - currentPosition.y) * (newScale / currentScale);
    updateScaleAndPosition(newScale, { x: newX, y: newY });

    if (isDraggingRef.current) {
      dragStart.current = {
        x: e.clientX - newX,
        y: e.clientY - newY
      };
    }
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (viewport) viewport.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;
    const currentPosition = positionRef.current;
    dragStart.current = { x: e.clientX - currentPosition.x, y: e.clientY - currentPosition.y };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    updateScaleAndPosition(scaleRef.current, { x: newX, y: newY });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const focusStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 10005,
    background: isDark ? 'rgba(8, 10, 12, 0.86)' : 'rgba(255, 250, 240, 0.9)',
    backdropFilter: 'blur(25px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    overflow: 'hidden'
  };

  return createPortal(
    <div style={focusStyle} role="dialog" aria-modal="true" aria-label="图片放大聚焦查看">
      <div
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onDoubleClick={resetZoom}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: `${imgSize.width}px`,
            height: `${imgSize.height}px`,
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.12s cubic-bezier(0.25, 1, 0.5, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={src}
            alt={alt}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 12px 48px rgba(0,0,0,0.3)',
              border: '1.5px solid var(--glass-border)',
              pointerEvents: 'none'
            }}
          />
        </div>
      </div>

      <div className="mermaid-focus-control-bar" style={{ zIndex: 10006 }}>
        <button type="button" onClick={zoomOut} className="mermaid-focus-control-btn" style={{ fontSize: '17px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.8, color: 'inherit' }} title="缩小">
          −
        </button>
        <span style={{ minWidth: '52px', textAlign: 'center', fontWeight: '600', letterSpacing: '0.02em', fontSize: '13px' }}>
          {Math.round(scale * 100)}%
        </span>
        <button type="button" onClick={zoomIn} className="mermaid-focus-control-btn" style={{ fontSize: '17px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.8, color: 'inherit' }} title="放大">
          +
        </button>
        <div style={{ width: '1px', height: '16px', background: 'rgba(231, 199, 126, 0.2)' }} />
        <button type="button" onClick={resetZoom} className="mermaid-focus-control-btn" style={{ fontSize: '17px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.8, color: 'inherit' }} title="适应屏幕 (双击重置)">
          ⛶
        </button>
        <div style={{ width: '1px', height: '16px', background: 'rgba(231, 199, 126, 0.2)' }} />
        <span style={{ opacity: 0.6, fontSize: '11px', whiteSpace: 'nowrap' }}>
          滚轮缩放 | 拖拽移动
        </span>
      </div>

      <button
        type="button"
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          zIndex: 10007,
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: '1px solid var(--glass-border)',
          background: isDark ? 'rgba(15, 18, 22, 0.9)' : 'rgba(255, 250, 240, 0.95)',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
          outline: 'none'
        }}
        title="关闭 (Esc)"
        onClick={onClose}
      >
        ×
      </button>
    </div>,
    document.body
  );
};

const ZoomableMarkdownImage = ({ src, alt, style, theme, ...props }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  return (
    <>
      <img
        src={src}
        alt={alt}
        style={{ ...style, cursor: 'zoom-in' }}
        onClick={() => setIsZoomed(true)}
        {...props}
      />
      {isZoomed && (
        <ImageZoomModal
          src={src}
          alt={alt}
          onClose={() => setIsZoomed(false)}
          theme={theme}
        />
      )}
    </>
  );
};

const LifestyleGallery = ({ images, theme }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const galleryItems = useMemo(() => {
    return images.map(img => {
      const parts = (img.alt || '').split('|');
      return {
        image: img.src,
        text: parts[0]?.trim() || '图集图片',
        description: parts[1]?.trim() || ''
      };
    });
  }, [images]);

  const activeImage = useMemo(() => {
    return galleryItems[activeIndex % galleryItems.length];
  }, [galleryItems, activeIndex]);

  const activeDescription = useMemo(() => {
    return activeImage ? activeImage.description : '';
  }, [activeImage]);

  const handleActiveIndexChange = useCallback((idx) => {
    setActiveIndex(idx);
  }, []);

  return (
    <div style={{ margin: '2.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%', alignItems: 'center' }}>
      <div 
        style={{ height: '380px', position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '16px', cursor: 'zoom-in' }}
      >
        <CircularGallery 
          items={galleryItems} 
          bend={1.2} 
          textColor={theme === 'light' ? '#4a2d1b' : '#ffe197'} 
          onActiveIndexChange={handleActiveIndexChange}
          onCenterClick={() => setIsZoomed(true)}
        />
      </div>
      <div style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <AnimatePresence mode="wait">
          {activeDescription ? (
            <motion.div 
              key={activeIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                textAlign: 'left',
                fontSize: '0.92rem',
                color: 'var(--text-primary)',
                background: 'var(--glass-bg-alt)',
                border: '1px solid var(--glass-border)',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                maxWidth: '600px',
                backdropFilter: 'blur(8px)',
                boxShadow: 'var(--glass-shadow)',
                fontStyle: 'italic',
                lineHeight: '1.5',
                borderLeft: '4px solid var(--text-accent)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <div style={{ flex: 1 }}>{activeDescription}</div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsZoomed(true); }}
                style={{
                  background: 'rgba(231, 199, 126, 0.15)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '4px',
                  color: 'var(--text-accent)',
                  padding: '2px 8px',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  outline: 'none'
                }}
              >
                🔍 放大
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                fontStyle: 'italic'
              }}
            >
              左右拖动或滚动滑轮查看图片详情，点击可放大查看
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isZoomed && activeImage && (
        <ImageZoomModal
          src={activeImage.image}
          alt={activeImage.text}
          onClose={() => setIsZoomed(false)}
          theme={theme}
        />
      )}
    </div>
  );
};

// ── 样式 ──────────────────────────────────────────────────────

const NoteLayout = styled.div`
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  padding: ${({ $isEmbed }) => $isEmbed ? '0' : '2rem 1.5rem'};
  gap: 2rem;
  min-height: ${({ $isEmbed }) => $isEmbed ? 'auto' : '100vh'};
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
    display: ${({ $isEmbed }) => $isEmbed ? 'none' : 'block'};
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
    padding: ${({ $isEmbed }) => $isEmbed ? '0' : '1rem 0.75rem'};

    &::before {
      position: absolute;
      background-attachment: scroll;
      filter: none;
      background: none; /* 移动端背景交由 ParallaxBg 处理 */
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
  background: ${({ $isEmbed }) => $isEmbed ? 'transparent' : 'linear-gradient(135deg, var(--glass-bg-alt), rgba(20, 16, 23, 0.02)), var(--glass-bg)'};
  backdrop-filter: ${({ $isEmbed }) => $isEmbed ? 'none' : 'blur(6px) saturate(1.08)'};
  -webkit-backdrop-filter: ${({ $isEmbed }) => $isEmbed ? 'none' : 'blur(6px) saturate(1.08)'};
  border: ${({ $isEmbed }) => $isEmbed ? 'none' : '1.5px solid var(--glass-border)'};
  border-radius: 12px;
  padding: ${({ $isEmbed }) => $isEmbed ? '0' : 'clamp(1.2rem, 3.5vw, 2.5rem)'};
  box-shadow: ${({ $isEmbed }) => $isEmbed ? 'none' : 'var(--glass-shadow), var(--glass-inset), inset 0 0 30px rgba(231, 199, 126, 0.05)'};
  outline: ${({ $isEmbed }) => $isEmbed ? 'none' : '1px solid rgba(255, 255, 255, 0.05)'};
  outline-offset: -5px;
  transition: all 0.5s ease;

  @media (max-width: 900px) {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: ${({ $isEmbed }) => $isEmbed ? 'transparent' : 'linear-gradient(135deg, color-mix(in srgb, var(--glass-bg-alt) 70%, transparent), rgba(20, 16, 23, 0.02)), color-mix(in srgb, var(--glass-bg) 78%, transparent)'};
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

const MobileFloatingBackButton = styled(motion.button)`
  position: fixed;
  right: 2.375rem; /* 与下方宽52px的传送门按钮中心点完美对齐 (38px) */
  bottom: 6rem; /* 位于传送门按钮上方，留出12px的安全防误触空隙 */
  z-index: 9998;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--glass-shadow), inset 0 1px 0 rgba(255,255,255,0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  outline: none;
  transition: all 0.3s ease;

  svg {
    width: 18px;
    height: 18px;
    stroke-width: 2.5;
  }

  &:hover {
    background: var(--button-hover-bg);
    border-color: var(--glass-border-highlight);
    transform: translateY(-2px);
  }

  @media (min-width: 901px) {
    display: none; /* 仅在移动端展示 */
  }
`;

// ── 移动端增强体验组件样式 ──────────────────────────────────────

const ProgressBar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 0%;
  height: 2.5px;
  background: linear-gradient(90deg, #b98234, #e7c77e);
  z-index: 10002;
  transition: width 0.1s ease-out;
  pointer-events: none;
`;

const ParallaxBg = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -2;
  pointer-events: none;
  background: ${({ $theme }) => $theme === 'light'
    ? `linear-gradient(90deg, rgba(255, 250, 238, 0.14), rgba(255, 246, 224, 0.02) 48%, rgba(229, 190, 119, 0.12)),
       linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(237, 214, 170, 0.2)),
       url(${noteReadingBgLight}) center center / cover,
       #efe0bd`
    : `linear-gradient(180deg, rgba(7, 16, 14, 0.4), rgba(7, 16, 14, 0.6)),
       url(${noteReadingBgDark}) center center / cover,
       #07100e`
  };
  transition: transform 0.05s linear;
`;

const MobileStickyHeader = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1.5px solid var(--glass-border);
  z-index: 9999;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  justify-content: space-between;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

  .back-btn {
    background: transparent;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    outline: none;
  }

  .title-text {
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0 1rem;
    flex: 1;
    text-align: center;
  }

  .progress-text {
    font-size: 0.75rem;
    color: var(--text-accent);
    font-weight: 800;
    font-family: monospace;
    min-width: 32px;
    text-align: right;
  }
`;

const MobileFloatingButtonsWrapper = styled.div`
  position: fixed;
  bottom: 6rem;
  right: 2.375rem;
  z-index: 9998;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  pointer-events: auto;

  @media (min-width: 901px) {
    display: none;
  }
`;

const MobileFloatingTocButton = styled(motion.button)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--glass-shadow), inset 0 1px 0 rgba(255,255,255,0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  outline: none;

  svg {
    width: 18px;
    height: 18px;
    stroke-width: 2.5;
  }
`;

const TocDrawerOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(4, 2, 10, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 10000;
`;

const TocDrawer = styled(motion.div)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 65vh;
  background: var(--glass-bg);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: 1.5px solid var(--glass-border);
  border-radius: 20px 20px 0 0;
  z-index: 10001;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -12px 40px rgba(0,0,0,0.3);
  box-sizing: border-box;

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.2rem;
    border-bottom: 1px dashed rgba(231,199,126,0.18);
    padding-bottom: 0.8rem;
  }

  .drawer-title {
    font-size: 1.05rem;
    color: var(--text-accent);
    font-weight: 850;
    margin: 0;
    letter-spacing: 0.04em;
  }

  .drawer-close {
    background: transparent;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 1.2rem;
    padding: 4px;
    line-height: 1;
    outline: none;
  }

  .drawer-content {
    flex: 1;
    overflow-y: auto;
    padding-right: 0.4rem;
    scrollbar-width: thin;
    scrollbar-color: rgba(231, 199, 126, 0.25) transparent;
  }
`;

const DrawerTocItem = styled.div`
  padding: 0.7rem 0;
  border-bottom: 1px solid rgba(231, 199, 126, 0.05);
  padding-left: ${props => Math.min((props.$level - 1) * 1.2, 3.6)}rem;

  a {
    color: ${props => props.$level === 1 ? 'var(--text-accent)' : 'var(--text-primary)'};
    text-decoration: none;
    font-size: 0.92rem;
    font-weight: ${props => props.$level === 1 ? '700' : 'normal'};
    display: block;
    line-height: 1.4;

    &:active {
      color: var(--text-accent);
    }
  }
`;

const PreviewOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(4, 2, 10, 0.4);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  z-index: 10000;
`;

const PreviewDrawer = styled(motion.div)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--glass-bg);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: 1.5px solid var(--glass-border);
  border-radius: 20px 20px 0 0;
  z-index: 10001;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  box-shadow: 0 -12px 40px rgba(0,0,0,0.3);
  box-sizing: border-box;

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px dashed rgba(231,199,126,0.18);
    padding-bottom: 0.6rem;

    h4 {
      margin: 0;
      font-size: 1.02rem;
      color: var(--text-accent);
      font-weight: 850;
    }

    button {
      background: transparent;
      border: none;
      color: var(--text-primary);
      cursor: pointer;
      font-size: 1.1rem;
      padding: 2px;
      outline: none;
    }
  }

  .drawer-body {
    font-size: 0.88rem;
    line-height: 1.7;
    color: var(--text-primary);
    max-height: 25vh;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .drawer-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 0.4rem;

    button, a {
      height: 38px;
      padding: 0 1.2rem;
      border-radius: 8px;
      font-size: 0.82rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      text-decoration: none;
      font-weight: 600;
      border: 1px solid var(--glass-border);
      transition: all 0.2s ease;
      outline: none;
    }

    .btn-cancel {
      background: rgba(255,255,255,0.03);
      color: var(--text-primary);

      &:active {
        background: rgba(255,255,255,0.1);
      }
    }

    .btn-confirm {
      background: linear-gradient(135deg, #b98234, #7b4a18);
      border-color: rgba(255,247,223,0.18);
      color: #fffdec;
      box-shadow: 0 4px 12px rgba(123, 74, 24, 0.25);

      &:active {
        background: linear-gradient(135deg, #c8923e, #8b5520);
      }
    }
  }
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
      width: auto !important;
      height: auto !important;

      /* Node boxes and actor boxes */
      .node rect, .node circle, .node polygon, .node path,
      .actor rect, rect.actor, .note rect, rect.note {
        fill: var(--glass-bg-alt) !important;
        stroke: var(--glass-border) !important;
        stroke-width: 1.5px !important;
        rx: 8px !important;
        ry: 8px !important;
        transition: all 0.3s ease;
      }

      /* Hover effect */
      .node:hover rect, .node:hover circle, .node:hover polygon, .node:hover path,
      .actor:hover rect, rect.actor:hover {
        fill: var(--glass-bg) !important;
        stroke: var(--glass-border-highlight) !important;
        filter: drop-shadow(0 0 8px var(--glass-border));
      }

      /* Theme-responsive custom flowchart node styles */
      .orig rect, .orig circle, .orig polygon, .orig path,
      .coreNode rect, .coreNode circle, .coreNode polygon, .coreNode path,
      .core rect, .core circle, .core polygon, .core path {
        fill: ${({ $theme }) => $theme === 'dark' ? 'rgba(239, 68, 68, 0.2) !important' : '#fff2f2 !important'};
        stroke: #ff8080 !important;
      }
      .runNode rect, .runNode circle, .runNode polygon, .runNode path,
      .run rect, .run circle, .run polygon, .run path,
      .val rect, .val circle, .val polygon, .val path {
        fill: ${({ $theme }) => $theme === 'dark' ? 'rgba(59, 130, 246, 0.2) !important' : '#f2f2ff !important'};
        stroke: #8080ff !important;
      }
      .aug rect, .aug circle, .aug polygon, .aug path,
      .conflictNode rect, .conflictNode circle, .conflictNode polygon, .conflictNode path {
        fill: ${({ $theme }) => $theme === 'dark' ? 'rgba(16, 185, 129, 0.2) !important' : '#f2fff2 !important'};
        stroke: #80ff80 !important;
      }

      /* Text inside nodes and actor/note boxes */
      .node .label, .node label, .node text, .node span, .node div,
      .node .label *, .node label *, .node text *, .node span *, .node div *,
      .actor text, text.actor, .actor span, .actor div,
      .actor text *, text.actor *, .actor span *, .actor div *,
      .note text, text.note, .note span, .note div,
      .note text *, text.note *, .note span *, .note div *,
      svg text, svg tspan, svg span, svg div, svg p, svg label,
      .actorText, .actorText *,
      .noteText, .noteText *,
      .loopText, .loopText *,
      .loopLabel, .loopLabel *,
      .messageText, .messageText * {
        fill: var(--text-primary) !important;
        color: var(--text-primary) !important;
        font-family: inherit !important;
        font-size: 13px !important;
        font-weight: 500 !important;
      }

      /* Connection lines & sequence diagram lines */
      .edgePath .path,
      .messageLine0,
      .messageLine1,
      .actor-line,
      .loopLine {
        stroke: var(--glass-border) !important;
        stroke-width: 1.8px !important;
        transition: all 0.3s ease;
      }

      .edgePath:hover .path,
      .messageLine0:hover,
      .messageLine1:hover {
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

  const sourceDirNorm = normalizeComparePath(sourceSlug.split('/').slice(0, -1).join('/'));
  const sameDir = unique.filter((slug) => normalizeComparePath(slug.split('/').slice(0, -1).join('/')) === sourceDirNorm);
  if (sameDir.length === 1) return { slug: sameDir[0], status: 'resolved' };

  const sameCollectionNorm = normalizeComparePath(sourceCollectionRoot);
  const sameCollection = unique.filter((slug) => normalizeComparePath(slug.split('/')[0]).startsWith(sameCollectionNorm));
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

const adaptMermaidSvgColorsForDarkMode = (svgHtml, isDark) => {
  if (!svgHtml) return svgHtml;

  // Detect custom styled nodes (matching rect/circle/polygon/path/ellipse with fill color)
  // Mermaid CSS rules: #flowchart-nodeId-xx rect { fill: #... }
  const regex = /(#[a-zA-Z0-9_-]+)\s+(?:.node\s+)?(?:rect|circle|polygon|path|ellipse)\s*\{\s*fill\s*:\s*([^;}]+)/gi;
  let match;
  let textOverrides = '';

  while ((match = regex.exec(svgHtml)) !== null) {
    const selector = match[1];
    const fillColor = match[2].trim();

    // Check if there is a valid fill color (not none/transparent)
    if (fillColor && fillColor !== 'none' && fillColor !== 'transparent' && !fillColor.startsWith('rgba(0,0,0,0)')) {
      // Force text color inside this specific node to be dark brown (#4a2d1b) for readability
      textOverrides += `
        ${selector} text,
        ${selector} tspan,
        ${selector} span,
        ${selector} div,
        ${selector} p,
        ${selector} label,
        ${selector} b,
        ${selector} strong,
        ${selector} i,
        ${selector} em,
        ${selector} a,
        ${selector} .label *,
        ${selector} text *,
        ${selector} tspan *,
        ${selector} span *,
        ${selector} div *,
        ${selector} p *,
        ${selector} label * {
          fill: #4a2d1b !important;
          color: #4a2d1b !important;
          font-weight: 600 !important;
        }
      `;
    }
  }

  if (textOverrides) {
    if (svgHtml.includes('</style>')) {
      return svgHtml.replace('</style>', `${textOverrides}</style>`);
    } else {
      return svgHtml.replace(/<style\b([^>]*)>/, (m, attrs) => `<style${attrs}>${textOverrides}`);
    }
  }

  return svgHtml;
};

let mermaidIdCounter = 0;
const Mermaid = ({ value, theme = 'light' }) => {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const [diagramShape, setDiagramShape] = useState('normal');
  const [diagramSize, setDiagramSize] = useState({ width: 0, height: 0 });
  const [isFocused, setIsFocused] = useState(false);
  const elementId = useRef(`mermaid-${++mermaidIdCounter}`);
  const containerRef = useRef(null);

  // Interactive Zoom/Pan States
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const viewportRef = useRef(null);

  const scaleRef = useRef(scale);
  const positionRef = useRef(position);
  const isDraggingRef = useRef(false);
  const initialZoomCenterRef = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef(0);

  const updateScaleAndPosition = (newScale, newPos) => {
    scaleRef.current = newScale;
    positionRef.current = newPos;
    setScale(newScale);
    setPosition(newPos);
  };

  // Helper to extract SVG dimensions
  const getMermaidSvgSize = (svgElement) => {
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const [, , width, height] = viewBox.split(/\s+/).map(Number);
      if (width > 0 && height > 0) return { width, height };
    }
    const width = parseFloat(svgElement.getAttribute('width')) || 0;
    const height = parseFloat(svgElement.getAttribute('height')) || 0;
    return { width, height };
  };

  const getMermaidShape = (width, height) => {
    if (!width || !height) return 'normal';
    const ratio = width / height;
    if (ratio >= 2.1 && width >= 720) return 'wide';
    if (height >= 760 && ratio <= 1.25) return 'tall';
    return 'normal';
  };

  const makeFocusableMermaidSvg = (renderedSvg) => {
    return renderedSvg.replace(/<svg\b([^>]*)>/, (match, attrs) => {
      let nextAttrs = attrs.replace(/\s(?:width|height)="[^"]*"/g, '');
      if (!/\spreserveAspectRatio=/.test(nextAttrs)) {
        nextAttrs += ' preserveAspectRatio="xMidYMid meet"';
      }
      return `<svg${nextAttrs}>`;
    });
  };

  // Auto-center and fit diagram to viewport boundaries
  const resetZoom = () => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const vpWidth = rect.width;
    const vpHeight = rect.height;

    const svgElement = viewportRef.current.querySelector('svg');
    if (!svgElement) return;

    const { width: svgW, height: svgH } = getMermaidSvgSize(svgElement);
    const diagWidth = svgW || 800;
    const diagHeight = svgH || 600;

    const padding = 40;
    const scaleX = (vpWidth - padding) / diagWidth;
    const scaleY = (vpHeight - padding) / diagHeight;
    const initialScale = Math.min(Math.min(scaleX, scaleY), 1.25);

    const initialX = (vpWidth - diagWidth * initialScale) / 2;
    const initialY = (vpHeight - diagHeight * initialScale) / 2;

    updateScaleAndPosition(initialScale, { x: initialX, y: initialY });
  };

  // Zoom handlers (relative to midpoint)
  const zoomIn = () => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const currentScale = scaleRef.current;
    const currentPosition = positionRef.current;
    const newScale = Math.min(currentScale * 1.3, 15);
    const newX = midX - (midX - currentPosition.x) * (newScale / currentScale);
    const newY = midY - (midY - currentPosition.y) * (newScale / currentScale);
    updateScaleAndPosition(newScale, { x: newX, y: newY });
  };

  const zoomOut = () => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const currentScale = scaleRef.current;
    const currentPosition = positionRef.current;
    const newScale = Math.max(currentScale / 1.3, 0.15);
    const newX = midX - (midX - currentPosition.x) * (newScale / currentScale);
    const newY = midY - (midY - currentPosition.y) * (newScale / currentScale);
    updateScaleAndPosition(newScale, { x: newX, y: newY });
  };

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
          setDiagramShape('normal');
          setDiagramSize({ width: 0, height: 0 });
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

  useEffect(() => {
    if (!svg || !containerRef.current) return;
    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) return;

    const { width, height } = getMermaidSvgSize(svgElement);
    const shape = getMermaidShape(width, height);
    setDiagramSize({ width, height });
    setDiagramShape(shape);
  }, [svg]);

  useEffect(() => {
    if (isFocused) {
      const timer = setTimeout(resetZoom, 80);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, svg]);

  useEffect(() => {
    if (!isFocused || typeof document === 'undefined') return;
    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsFocused(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFocused]);

  useEffect(() => {
    scaleRef.current = scale;
    positionRef.current = position;
  }, [scale, position]);

  // Event handlers for mouse wheel, click drag, pinch-to-zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (!viewportRef.current) return;

    const rect = viewportRef.current.getBoundingClientRect();
    
    let mouseX, mouseY;
    if (isDraggingRef.current) {
      mouseX = initialZoomCenterRef.current.x;
      mouseY = initialZoomCenterRef.current.y;
    } else {
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    }

    const zoomFactor = 1.15;
    const isZoomIn = e.deltaY < 0;

    const currentScale = scaleRef.current;
    const currentPosition = positionRef.current;

    let newScale = isZoomIn ? currentScale * zoomFactor : currentScale / zoomFactor;
    newScale = Math.min(Math.max(newScale, 0.15), 15);

    const newX = mouseX - (mouseX - currentPosition.x) * (newScale / currentScale);
    const newY = mouseY - (mouseY - currentPosition.y) * (newScale / currentScale);

    updateScaleAndPosition(newScale, { x: newX, y: newY });

    if (isDraggingRef.current) {
      dragStart.current = {
        x: e.clientX - newX,
        y: e.clientY - newY
      };
    }
  }, []);

  useEffect(() => {
    if (!isFocused || !viewportRef.current) return;
    const viewport = viewportRef.current;
    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      viewport.removeEventListener('wheel', handleWheel);
    };
  }, [isFocused, handleWheel]);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;
    const currentPosition = positionRef.current;
    dragStart.current = { x: e.clientX - currentPosition.x, y: e.clientY - currentPosition.y };

    if (viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      initialZoomCenterRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    updateScaleAndPosition(scaleRef.current, { x: newX, y: newY });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    isDraggingRef.current = false;
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    resetZoom();
  };

  // Touch handlers for pinch & swipe (synchronous, ref-based to avoid render lags/jitter)
  const handleTouchStart = useCallback((e) => {
    const currentPosition = positionRef.current;
    if (e.touches.length === 1) {
      setIsDragging(true);
      isDraggingRef.current = true;
      dragStart.current = {
        x: e.touches[0].clientX - currentPosition.x,
        y: e.touches[0].clientY - currentPosition.y
      };
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      isDraggingRef.current = false;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistance.current = dist;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    // Completely disable default gesture (background scrolling) when focused
    e.preventDefault();
    const currentScale = scaleRef.current;
    const currentPosition = positionRef.current;

    if (isDraggingRef.current && e.touches.length === 1) {
      const newX = e.touches[0].clientX - dragStart.current.x;
      const newY = e.touches[0].clientY - dragStart.current.y;
      updateScaleAndPosition(currentScale, { x: newX, y: newY });
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (lastTouchDistance.current > 0) {
        const factor = dist / lastTouchDistance.current;
        let newScale = currentScale * factor;
        newScale = Math.min(Math.max(newScale, 0.15), 15);
        
        const touchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const touchMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        
        if (viewportRef.current) {
          const rect = viewportRef.current.getBoundingClientRect();
          const midX = touchMidX - rect.left;
          const midY = touchMidY - rect.top;
          
          const newX = midX - (midX - currentPosition.x) * (newScale / currentScale);
          const newY = midY - (midY - currentPosition.y) * (newScale / currentScale);
          
          updateScaleAndPosition(newScale, { x: newX, y: newY });
        }
      }
      lastTouchDistance.current = dist;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    isDraggingRef.current = false;
    lastTouchDistance.current = 0;
  }, []);

  // Listen touch events non-passively on DOM directly to enforce e.preventDefault()
  useEffect(() => {
    if (!isFocused || !viewportRef.current) return;
    const viewport = viewportRef.current;
    
    viewport.addEventListener('touchstart', handleTouchStart, { passive: false });
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
    viewport.addEventListener('touchend', handleTouchEnd, { passive: false });
    viewport.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    
    return () => {
      viewport.removeEventListener('touchstart', handleTouchStart);
      viewport.removeEventListener('touchmove', handleTouchMove);
      viewport.removeEventListener('touchend', handleTouchEnd);
      viewport.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isFocused, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const isDark = theme === 'dark';
  const displaySvg = useMemo(() => adaptMermaidSvgColorsForDarkMode(svg, isDark), [svg, isDark]);
  const focusSvg = useMemo(() => makeFocusableMermaidSvg(displaySvg), [displaySvg]);

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

  const focusStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: isDark ? 'rgba(8, 10, 12, 0.82)' : 'rgba(255, 250, 240, 0.88)',
    backdropFilter: 'blur(20px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    overflow: 'hidden'
  };

  const focusMermaidStyle = `
    .mermaid-focus-dialog .mermaid-rendered {
      width: 100%;
      height: 100%;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      overflow: visible !important;
    }
    .mermaid-focus-dialog .mermaid-rendered svg {
      display: block !important;
      width: 100% !important;
      height: 100% !important;
      max-width: none !important;
      max-height: none !important;
    }
    .mermaid-focus-dialog .mermaid-rendered svg text,
    .mermaid-focus-dialog .mermaid-rendered svg tspan,
    .mermaid-focus-dialog .mermaid-rendered svg span,
    .mermaid-focus-dialog .mermaid-rendered svg div,
    .mermaid-focus-dialog .mermaid-rendered svg p,
    .mermaid-focus-dialog .mermaid-rendered svg label,
    .mermaid-focus-dialog .mermaid-rendered .nodeLabel,
    .mermaid-focus-dialog .mermaid-rendered .edgeLabel,
    .mermaid-focus-dialog .mermaid-rendered .cluster-label {
      fill: ${isDark ? '#ffedd5' : '#4a2d1b'} !important;
      color: ${isDark ? '#ffedd5' : '#4a2d1b'} !important;
      opacity: 1 !important;
      font-weight: 650 !important;
    }
    .mermaid-focus-dialog .mermaid-rendered .node rect,
    .mermaid-focus-dialog .mermaid-rendered .node circle,
    .mermaid-focus-dialog .mermaid-rendered .node polygon,
    .mermaid-focus-dialog .mermaid-rendered .node path,
    .mermaid-focus-dialog .mermaid-rendered .actor rect,
    .mermaid-focus-dialog .mermaid-rendered rect.actor,
    .mermaid-focus-dialog .mermaid-rendered .note rect,
    .mermaid-focus-dialog .mermaid-rendered rect.note {
      fill: ${isDark ? 'rgba(231, 199, 126, 0.08)' : 'rgba(196, 154, 69, 0.08)'} !important;
      stroke: ${isDark ? 'rgba(231, 199, 126, 0.35)' : 'rgba(196, 154, 69, 0.35)'} !important;
      stroke-width: 1.5px !important;
    }
    .mermaid-focus-dialog .mermaid-rendered .edgePath .path,
    .mermaid-focus-dialog .mermaid-rendered .flowchart-link,
    .mermaid-focus-dialog .mermaid-rendered .messageLine0,
    .mermaid-focus-dialog .mermaid-rendered .messageLine1 {
      stroke-opacity: 0.9 !important;
      stroke: ${isDark ? 'rgba(231, 199, 126, 0.55)' : 'rgba(196, 154, 69, 0.55)'} !important;
    }
    .mermaid-focus-control-bar {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 18px;
      background: ${isDark ? 'rgba(15, 18, 22, 0.9)' : 'rgba(255, 250, 240, 0.95)'};
      border: 1px solid ${isDark ? 'rgba(231, 199, 126, 0.25)' : 'rgba(196, 154, 69, 0.35)'};
      border-radius: 30px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, ${isDark ? '0.5' : '0.15'}), inset 0 0 10px rgba(255,255,255,${isDark ? '0.03' : '0.4'});
      backdrop-filter: blur(10px);
      color: ${isDark ? '#ffedd5' : '#4a2d1b'};
      font-size: 13px;
      font-family: system-ui, -apple-system, sans-serif;
      pointer-events: auto;
      user-select: none;
    }
    .mermaid-focus-control-btn {
      background: none;
      border: none;
      color: ${isDark ? '#ffedd5' : '#4a2d1b'};
      font-size: 17px;
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      opacity: 0.8;
      outline: none;
    }
    .mermaid-focus-control-btn:hover {
      opacity: 1;
      background: ${isDark ? 'rgba(231, 199, 126, 0.15)' : 'rgba(196, 154, 69, 0.15)'};
      color: ${isDark ? '#ffd88f' : '#78350f'};
    }
    .mermaid-focus-close-btn {
      position: absolute;
      top: 24px;
      right: 24px;
      z-index: 30;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 1px solid ${isDark ? 'rgba(231, 199, 126, 0.2)' : 'rgba(196, 154, 69, 0.25)'};
      background: ${isDark ? 'rgba(15, 18, 22, 0.9)' : 'rgba(255, 250, 240, 0.95)'};
      color: ${isDark ? '#ffedd5' : '#4a2d1b'};
      cursor: pointer;
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      box-shadow: 0 4px 16px rgba(0, 0, 0, ${isDark ? '0.4' : '0.1'});
      outline: none;
    }
    .mermaid-focus-close-btn:hover {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      transform: scale(1.08);
    }
  `;

  const focusDialog = isFocused && typeof document !== 'undefined' ? createPortal(
    <div className="mermaid-focus-dialog" role="dialog" aria-modal="true" aria-label="流程图聚焦查看" style={focusStyle}>
      <div
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onDoubleClick={handleDoubleClick}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.12s cubic-bezier(0.25, 1, 0.5, 1)',
            width: diagramSize.width ? `${Math.ceil(diagramSize.width)}px` : '100%',
            height: diagramSize.height ? `${Math.ceil(diagramSize.height)}px` : '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            className={`mermaid-rendered mermaid-focus mermaid-${diagramShape}`}
            dangerouslySetInnerHTML={{ __html: focusSvg }}
          />
        </div>
      </div>

      <div className="mermaid-focus-control-bar">
        <button type="button" onClick={zoomOut} className="mermaid-focus-control-btn" title="缩小">
          −
        </button>
        <span style={{ minWidth: '52px', textAlign: 'center', fontWeight: '600', letterSpacing: '0.02em' }}>
          {Math.round(scale * 100)}%
        </span>
        <button type="button" onClick={zoomIn} className="mermaid-focus-control-btn" title="放大">
          +
        </button>
        <div style={{ width: '1px', height: '16px', background: 'rgba(231, 199, 126, 0.2)' }} />
        <button type="button" onClick={resetZoom} className="mermaid-focus-control-btn" title="适应屏幕 (双击重置)">
          ⛶
        </button>
        <div style={{ width: '1px', height: '16px', background: 'rgba(231, 199, 126, 0.2)' }} />
        <span style={{ opacity: 0.6, fontSize: '11px', whiteSpace: 'nowrap' }}>
          滚轮缩放 | 拖拽移动
        </span>
      </div>

      <button type="button" className="mermaid-focus-close-btn" title="关闭 (Esc)" onClick={() => setIsFocused(false)}>
        ×
      </button>

      <style>{focusMermaidStyle}</style>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          aria-label="聚焦查看流程图"
          title="聚焦查看"
          onClick={() => setIsFocused(true)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1,
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            border: '1px solid rgba(74, 45, 27, 0.32)',
            background: 'rgba(255, 250, 239, 0.84)',
            color: '#4a2d1b',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: 1
          }}
        >
          ⛶
        </button>
        <div
          ref={containerRef}
          className={`mermaid-rendered mermaid-${diagramShape}`}
          dangerouslySetInnerHTML={{ __html: displaySvg }}
          style={{
            display: 'flex',
            justifyContent: diagramShape === 'wide' ? 'flex-start' : 'center',
            margin: '1.5rem auto',
            padding: '0.8rem',
            background: 'rgba(74, 45, 27, 0.05)',
            border: '1px dashed rgba(74, 45, 27, 0.2)',
            borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            overflowX: 'auto',
            overflowY: 'visible'
          }}
        />
      </div>

      {focusDialog}
    </>
  );
};

// ── 主组件 ────────────────────────────────────────────────────

const triggerVibration = (ms = 10) => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try { window.navigator.vibrate(ms); } catch (e) {}
  }
};

export default function Note() {
  const { '*': slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get('embed') === 'true';
  const galleryOnly = searchParams.get('galleryOnly') === 'true';
  const [markdown, setMarkdown] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 900 : false);

  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState(null);
  const [previewContent, setPreviewContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const progressBarRef = useRef(null);
  const progressTextRef = useRef(null);
  const bgRef = useRef(null);

  const { mainText, subText } = useMemo(() => parseElegantTitle(title), [title]);

  const [theme, setTheme] = useState(() => {
    const themeParam = new URLSearchParams(window.location.search).get('theme');
    if (themeParam === 'light' || themeParam === 'dark') return themeParam;
    
    const saved = localStorage.getItem('atlas-theme');
    if (saved) return saved;

    if (window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
      if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    }

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
    const themeParam = searchParams.get('theme');
    if (themeParam === 'light' || themeParam === 'dark') {
      setTheme(themeParam);
      return;
    }

    const syncTheme = () => {
      const currentParam = new URLSearchParams(window.location.search).get('theme');
      if (currentParam === 'light' || currentParam === 'dark') {
        setTheme(currentParam);
        return;
      }
      const saved = localStorage.getItem('atlas-theme');
      if (saved) {
        setTheme(saved);
      } else {
        const hour = new Date().getHours();
        setTheme((hour >= 7 && hour < 19) ? 'light' : 'dark');
      }
    };
    window.addEventListener('storage', syncTheme);

    const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const handleSystemThemeChange = (e) => {
      const currentParam = new URLSearchParams(window.location.search).get('theme');
      const saved = localStorage.getItem('atlas-theme');
      if (!currentParam && !saved) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    if (mediaQuery) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    }

    return () => {
      window.removeEventListener('storage', syncTheme);
      if (mediaQuery) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      }
    };
  }, [searchParams]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const decodedSlug = useMemo(() => safeDecodeNotePath(slug || ''), [slug]);

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

  const currentNode = useMemo(() => {
    if (!graphData?.nodes) return null;
    const normalizedDecoded = normalizeComparePath(decodedSlug);
    return graphData.nodes.find(
      (node) => 
        normalizeComparePath(node.id) === normalizedDecoded || 
        normalizeComparePath(node.slug) === normalizedDecoded
    ) ?? null;
  }, [decodedSlug, graphData]);

  const handleBackClick = useCallback(() => {
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
  }, [location, navigate, currentNode]);

  // 加载笔记内容
  useEffect(() => {
    if (!decodedSlug) return;
    setLoading(true);
    scrollPositions.isNoteLoading = true; // 锁定滚动记录，防止因页面高度塌陷覆盖已存的滚动高度
    setError(null);

    fetch(`/notes/${encodeNotePath(decodedSlug)}.md`)
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
        // 延迟解锁，给滚动条滚动恢复留出时间
        setTimeout(() => {
          scrollPositions.isNoteLoading = false;
        }, 100);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
        scrollPositions.isNoteLoading = false;
      });

    return () => {
      scrollPositions.isNoteLoading = false;
    };
  }, [decodedSlug]);

  const getInitialProgress = useCallback(() => {
    if (typeof window === 'undefined') return 0;
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight <= 0) return 0;
    return Math.min(Math.max((window.scrollY / totalHeight) * 100, 0), 100);
  }, []);

  // 滚动方向、进度以及背景视差偏移监听 (通过直接 DOM 操作更新进度条和视差背景，彻底避免 scroll 事件触发 React 重绘带来的卡顿)
  useEffect(() => {
    if (loading || !isMobile) {
      setIsHeaderSticky(false);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (currentScrollY / totalHeight) * 100 : 0;
      const clampedProgress = Math.min(Math.max(progress, 0), 100);

      // 1. 直操 DOM 更新顶部进度条
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${clampedProgress}%`;
      }

      // 2. 直操 DOM 更新顶部 Sticky 标题栏中的百分比文字
      if (progressTextRef.current) {
        progressTextRef.current.textContent = `${Math.round(clampedProgress)}%`;
      }

      // 3. 直操 DOM 更新视差背景 transform 属性 (使用 translate3d 开启 GPU 加速)
      if (bgRef.current) {
        bgRef.current.style.transform = `translate3d(0, ${currentScrollY * 0.35}px, 0)`;
      }

      // 4. 只有当 Sticky 状态发生改变时才触发 state 更新，防止无意义重绘
      const sticky = currentScrollY > 200;
      setIsHeaderSticky(prev => {
        if (prev !== sticky) return sticky;
        return prev;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [loading, isMobile]);

  // 手势横滑返回上一页 (Swipe Right to Back)
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e) => {
    if (!isMobile) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, [isMobile]);

  const handleTouchEnd = useCallback((e) => {
    if (!isMobile) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    if (diffX > 100 && Math.abs(diffY) < 40) {
      const isInteractive = e.target.closest('pre, code, table, canvas, svg, button, a, input, select, textarea');
      if (!isInteractive) {
        triggerVibration(10);
        handleBackClick();
      }
    }
  }, [isMobile, handleBackClick]);

  // 双链在移动端的防误触摘要卡片点击事件
  const handleWikiLinkClick = useCallback(async (href, label) => {
    triggerVibration(10);
    const slug = href.replace(/^\/note\//, '');
    setPreviewTarget({ slug, label: String(label), href });
    setIsPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewContent('正在检索星宿轨迹...');

    try {
      const res = await fetch(`/notes/${slug}.md`);
      if (res.ok) {
        const text = await res.text();
        const { body } = parseFrontmatter(text);
        const cleanBody = body
          .replace(/---\n[\s\S]*?\n---\n/g, '')
          .replace(/[#>*`[\]()]/g, '')
          .trim()
          .slice(0, 180);
        setPreviewContent(cleanBody + (body.length > 180 ? '...' : ''));
      } else {
        setPreviewContent('无法读取此笔记摘要，该笔记可能尚未同步发布。');
      }
    } catch (err) {
      console.error('Failed to load wiki-link preview:', err);
      setPreviewContent('获取笔记摘要失败。');
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  // 目录与预览卡片打开时锁定 Body 滚动
  useEffect(() => {
    if (isMobile && (isMobileTocOpen || isPreviewOpen)) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isMobileTocOpen, isPreviewOpen]);

  const parsedNote = useMemo(() => {
    const { body, data } = parseFrontmatter(markdown);
    return { body, properties: buildProperties(data) };
  }, [markdown]);
  const headings = useMemo(() => extractHeadings(parsedNote.body), [parsedNote.body]);
  const hasGallery = useMemo(() => {
    return extractLifestyleImages(parsedNote.body).length >= 2;
  }, [parsedNote.body]);
  const relatedNotes = useMemo(() => {
    if (!isMobile || !graphData || !decodedSlug) return [];
    
    const normalizedDecoded = normalizeComparePath(decodedSlug);
    const connectedIds = new Set();
    graphData.links?.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      if (normalizeComparePath(sourceId) === normalizedDecoded) {
        connectedIds.add(normalizeComparePath(targetId));
      } else if (normalizeComparePath(targetId) === normalizedDecoded) {
        connectedIds.add(normalizeComparePath(sourceId));
      }
    });
    
    return graphData.nodes?.filter(node => 
      connectedIds.has(normalizeComparePath(node.id)) || 
      connectedIds.has(normalizeComparePath(node.slug))
    ) ?? [];
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

  const remarkPlugins = useMemo(() => {
    return [remarkGfm, remarkMath, remarkHtmlBreaks, [remarkWikilinks, { resolve: wikilinkResolver }]];
  }, [wikilinkResolver]);

  const rehypePlugins = useMemo(() => {
    return [rehypeKatex, rehypeRaw];
  }, []);

  const markdownComponents = useMemo(() => {
    return {
      div: ({node, className, children, ...props}) => {
        if (className === 'obsidian-carousel') {
          const images = [];
          const extractImages = (childrenArray) => {
            React.Children.forEach(childrenArray, child => {
              if (child && (child.type === 'img' || (child.props && child.props.src))) {
                images.push({ src: child.props.src, alt: child.props.alt || child.props.title });
              } else if (child && child.props && child.props.children) {
                extractImages(child.props.children);
              }
            });
          };
          extractImages(children);
          
          const isLifestyle = currentNode?.collection === 'travel' || currentNode?.collection === 'food';
          if (isLifestyle && images.length > 0) {
            return <LifestyleGallery images={images} theme={theme} />;
          }
          
          return <ImageCarousel images={images} />;
        }
        return <div className={className} {...props}>{children}</div>;
      },
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
          if (isMobile) {
            return (
              <a 
                href={href} 
                onClick={(e) => {
                  e.preventDefault();
                  handleWikiLinkClick(href, children);
                }}
                {...props}
              >
                {children}
              </a>
            );
          }
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
          <ZoomableMarkdownImage
            src={src}
            alt={cleanAlt}
            theme={theme}
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
          return <Mermaid value={codeText} theme={theme} />;
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
    };
  }, [currentNode?.collection, theme, isMobile, handleWikiLinkClick]);

  useEffect(() => {
    if (loading || !location.hash) return undefined;

    let frameId = 0;
    const timeoutId = window.setTimeout(() => {
      frameId = window.requestAnimationFrame(() => {
        const targetId = safeDecodeNotePath(location.hash.slice(1));
        document.getElementById(targetId)?.scrollIntoView({ block: 'start' });
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [decodedSlug, loading, location.hash, parsedNote.body]);

  // 恢复笔记页面历史滚动高度
  useEffect(() => {
    if (!loading && !location.hash) {
      const savedScroll = scrollPositions[location.key] || 0;
      const timer = setTimeout(() => {
        window.scrollTo({
          top: savedScroll,
          behavior: 'auto'
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [loading, location.key, location.hash]);

  if (loading) {
    if (galleryOnly) {
      return (
        <NoteLayout $theme={theme} $isEmbed={true} style={{ minHeight: 'auto', padding: 0 }}>
          <div style={{ color: theme === 'light' ? '#63503a' : 'rgba(224,231,255,0.5)', padding: '4rem 0', textAlign: 'center', width: '100%' }}>
            正在加载图集...
          </div>
        </NoteLayout>
      );
    }
    return (
      <NoteLayout $theme={theme} $isEmbed={isEmbed}>
        <NoteContent $isEmbed={isEmbed}>
          <div style={{ color: 'rgba(224,231,255,0.5)', padding: '4rem 0', textAlign: 'center' }}>
            加载中...
          </div>
        </NoteContent>
      </NoteLayout>
    );
  }

  if (error) {
    if (galleryOnly) {
      return (
        <NoteLayout $theme={theme} $isEmbed={true} style={{ minHeight: 'auto', padding: 0 }}>
          <div style={{ color: '#ef4444', padding: '4rem 0', textAlign: 'center', width: '100%' }}>
            {error}
          </div>
        </NoteLayout>
      );
    }
    return (
      <NoteLayout $theme={theme} $isEmbed={isEmbed}>
        <NoteContent $isEmbed={isEmbed}>
          {!isEmbed && (
            <BackButton type="button" onClick={handleBackClick}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              返回上一页
            </BackButton>
          )}
          <div style={{ color: 'rgba(224,231,255,0.5)', padding: '4rem 0', textAlign: 'center' }}>
            {error}
          </div>
        </NoteContent>
      </NoteLayout>
    );
  }

  if (galleryOnly) {
    const images = extractLifestyleImages(parsedNote.body);
    return (
      <NoteLayout $theme={theme} $isEmbed={true} style={{ minHeight: 'auto', padding: 0 }}>
        {images.length > 0 ? (
          <LifestyleGallery images={images} theme={theme} />
        ) : (
          <div style={{ color: theme === 'light' ? '#63503a' : 'rgba(224,231,255,0.5)', padding: '4rem 0', textAlign: 'center', width: '100%' }}>
            未在此笔记中找到图集。请确保图集放置在“## 🖼️ 图集手札”等标题下。
          </div>
        )}
      </NoteLayout>
    );
  }

  return (
    <NoteLayout 
      $theme={theme}
      $isEmbed={isEmbed}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {(() => {
        const initProg = getInitialProgress();
        return (
          <>
            {!isEmbed && isMobile && (
              <ProgressBar 
                ref={progressBarRef} 
                style={{ width: `${initProg}%` }} 
              />
            )}
            {!isEmbed && isMobile && (
              <ParallaxBg 
                ref={bgRef} 
                $theme={theme} 
                style={{ transform: `translate3d(0, ` + (typeof window !== 'undefined' ? window.scrollY * 0.35 : 0) + `px, 0)` }} 
              />
            )}
            
            {!isEmbed && isMobile && isHeaderSticky && (
              <MobileStickyHeader>
                <button onClick={() => { triggerVibration(10); handleBackClick(); }} className="back-btn" aria-label="返回">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </button>
                <div className="title-text">{mainText}</div>
                <div className="progress-text" ref={progressTextRef}>{Math.round(initProg)}%</div>
              </MobileStickyHeader>
            )}
          </>
        );
      })()}

      {!isEmbed && !isMobile && <MouseLeafDrift theme={theme} />}
      <NoteContent $isEmbed={isEmbed}>
        {!isEmbed && (
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
        )}
        {!isEmbed && (
          <BackButton type="button" onClick={handleBackClick}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            返回上一页
          </BackButton>
        )}
        {(() => {
          return (
            <>
              <NoteTitle>{mainText}</NoteTitle>
              {subText && <NoteSubtitle>{subText}</NoteSubtitle>}
            </>
          );
        })()}
        {!isEmbed && <NoteMeta>笔记路径: {decodedSlug}</NoteMeta>}
        {!isEmbed && parsedNote.properties.length > 0 && (
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
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
            components={markdownComponents}
          >
            {preprocessMarkdown(parsedNote.body, currentNode?.collection === 'travel' || currentNode?.collection === 'food')}
          </ReactMarkdown>
        </MarkdownBody>

        {/* 移动端专用的相关笔记列表 */}
        {!isEmbed && isMobile && relatedNotes.length > 0 && (
          <MobileRelatedNotes>
            <RelatedNotesTitle>✦ 相关星轨关联</RelatedNotesTitle>
            <RelatedNotesList>
              {relatedNotes.map((note) => (
                <RelatedNoteLink key={note.id} to={toNoteHref(note.slug || note.id)}>
                  <span style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                    <span className="bullet">✦</span>
                    <span className="title" title={note.title}>{note.title}</span>
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </RelatedNoteLink>
              ))}
            </RelatedNotesList>
          </MobileRelatedNotes>
        )}
      </NoteContent>

      {!isEmbed && !isMobile && (
        <NoteSidebar>
          {collectionGraphHref && (
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
          {hasGallery && (
            <TocContainer>
              <TocTitle>Obsidian 联动</TocTitle>
              <TocList>
                <TocItem $level={1}>
                  <a 
                    href="#copy-embed" 
                    onClick={(e) => {
                      e.preventDefault();
                      const embedUrl = `${window.location.origin}${toNoteHref(decodedSlug)}?embed=true&galleryOnly=true`;
                      const iframeTag = `<iframe src="${embedUrl}" style="width: 100%; height: 480px; border: none; background: transparent;" scrolling="no"></iframe>`;
                      navigator.clipboard.writeText(iframeTag)
                        .then(() => alert('Obsidian 3D 轮播画廊嵌入代码已复制到剪贴板！可以直接粘贴到 Obsidian 笔记中了 🌟'))
                        .catch(() => alert('复制失败，请手动复制代码。'));
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    复制 3D 轮播图嵌入代码
                  </a>
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
      )}

      {isMobile && (
        <>
          <MobileFloatingButtonsWrapper>
            {headings.length > 0 && (
              <MobileFloatingTocButton
                type="button"
                onClick={() => { triggerVibration(10); setIsMobileTocOpen(true); }}
                whileTap={{ scale: 0.9 }}
                aria-label="查看目录"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="21" y1="10" x2="7" y2="10"></line>
                  <line x1="21" y1="6" x2="3" y2="6"></line>
                  <line x1="21" y1="14" x2="3" y2="14"></line>
                  <line x1="21" y1="18" x2="7" y2="18"></line>
                </svg>
              </MobileFloatingTocButton>
            )}
            <MobileFloatingBackButton
              type="button"
              onClick={() => { triggerVibration(10); handleBackClick(); }}
              whileTap={{ scale: 0.9 }}
              aria-label="返回上一页"
              style={{ position: 'static', bottom: 'auto', right: 'auto' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </MobileFloatingBackButton>
          </MobileFloatingButtonsWrapper>

          {/* 目录抽屉面板 */}
          <AnimatePresence>
            {isMobileTocOpen && (
              <>
                <TocDrawerOverlay 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileTocOpen(false)}
                />
                <TocDrawer
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                >
                  <div className="drawer-header">
                    <h4 className="drawer-title">✦ 笈中纲要</h4>
                    <button className="drawer-close" onClick={() => setIsMobileTocOpen(false)}>✕</button>
                  </div>
                  <div className="drawer-content">
                    {headings.map((h, i) => (
                      <DrawerTocItem key={i} $level={h.level}>
                        <a 
                          href={`#${h.id}`} 
                          onClick={() => {
                            triggerVibration(10);
                            setIsMobileTocOpen(false);
                          }}
                        >
                          {h.text}
                        </a>
                      </DrawerTocItem>
                    ))}
                  </div>
                </TocDrawer>
              </>
            )}
          </AnimatePresence>

          {/* 双链预览抽屉面板 */}
          <AnimatePresence>
            {isPreviewOpen && (
              <>
                <PreviewOverlay 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsPreviewOpen(false)}
                />
                <PreviewDrawer
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                >
                  <div className="drawer-header">
                    <h4>✦ 星络预览: {previewTarget?.label}</h4>
                    <button onClick={() => setIsPreviewOpen(false)}>✕</button>
                  </div>
                  <div className="drawer-body">
                    {previewLoading ? '正在检索星宿轨迹...' : previewContent}
                  </div>
                  <div className="drawer-actions">
                    <button onClick={() => setIsPreviewOpen(false)} className="btn-cancel">取消</button>
                    <Link 
                      to={previewTarget?.href || '#'} 
                      onClick={() => {
                        setIsPreviewOpen(false);
                        triggerVibration(10);
                      }} 
                      className="btn-confirm"
                    >
                      进入笔记
                    </Link>
                  </div>
                </PreviewDrawer>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </NoteLayout>
  );
}
