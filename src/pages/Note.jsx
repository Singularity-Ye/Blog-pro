import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styled from 'styled-components';
import MiniGraph from '../components/GraphView/MiniGraph';

// ── 样式 ──────────────────────────────────────────────────────

const NoteLayout = styled.div`
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  gap: 2rem;
  min-height: calc(100vh - 60px - 80px);
`;

const NoteContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const NoteSidebar = styled.aside`
  width: 300px;
  flex-shrink: 0;
  position: sticky;
  top: 80px;
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 900px) {
    display: none;
  }
`;

const TocContainer = styled.div`
  background: rgba(5, 0, 15, 0.6);
  border: 1px solid rgba(167, 139, 250, 0.15);
  border-radius: 12px;
  padding: 1rem;
`;

const TocTitle = styled.div`
  font-size: 0.75rem;
  color: rgba(167, 139, 250, 0.6);
  font-weight: 500;
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
    color: rgba(224, 231, 255, 0.6);
    transition: color 0.2s;
    &:hover { color: #a78bfa; }
  }
`;

const NoteTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #e0e7ff;
  margin-bottom: 0.5rem;
`;

const NoteMeta = styled.div`
  font-size: 0.8rem;
  color: rgba(224, 231, 255, 0.4);
  margin-bottom: 2rem;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: rgba(167, 139, 250, 0.7);
  margin-bottom: 1.5rem;
  transition: color 0.2s;
  &:hover { color: #a78bfa; }
`;

// Markdown 内容样式
const MarkdownBody = styled.div`
  color: #e0e7ff;
  line-height: 1.8;
  font-size: 0.95rem;

  h1, h2, h3, h4, h5, h6 {
    color: #e0e7ff;
    font-weight: 600;
    margin: 2rem 0 0.75rem;
    scroll-margin-top: 80px;
  }
  h1 { font-size: 1.6rem; }
  h2 { font-size: 1.35rem; border-bottom: 1px solid rgba(167, 139, 250, 0.15); padding-bottom: 0.3rem; }
  h3 { font-size: 1.15rem; }

  p { margin: 0.75rem 0; }

  a {
    color: #a78bfa;
    text-decoration: none;
    border-bottom: 1px solid rgba(167, 139, 250, 0.3);
    transition: border-color 0.2s;
    &:hover { border-color: #a78bfa; }
  }

  code {
    background: rgba(167, 139, 250, 0.1);
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 0.85em;
    font-family: 'IBM Plex Mono', 'Fira Code', monospace;
  }

  pre {
    background: rgba(30, 27, 75, 0.5);
    border: 1px solid rgba(167, 139, 250, 0.15);
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
    code { background: none; padding: 0; }
  }

  blockquote {
    border-left: 3px solid rgba(167, 139, 250, 0.4);
    padding: 0.5rem 1rem;
    margin: 1rem 0;
    color: rgba(224, 231, 255, 0.7);
    background: rgba(167, 139, 250, 0.05);
    border-radius: 0 8px 8px 0;
  }

  ul, ol { padding-left: 1.5rem; margin: 0.75rem 0; }
  li { margin: 0.25rem 0; }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    th, td {
      border: 1px solid rgba(167, 139, 250, 0.15);
      padding: 8px 12px;
      text-align: left;
    }
    th { background: rgba(167, 139, 250, 0.1); font-weight: 600; }
  }

  img {
    max-width: 100%;
    border-radius: 8px;
  }

  hr {
    border: none;
    border-top: 1px solid rgba(167, 139, 250, 0.15);
    margin: 2rem 0;
  }
`;

// ── Wikilink 处理 ─────────────────────────────────────────────

/** 将 [[wikilink]] 语法转为 React 组件 */
function remarkWikilinks() {
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
          parts.push({
            type: 'link',
            url: `/note/${encodeURIComponent(target)}`,
            children: [{ type: 'text', value: display }],
          });
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

// ── 提取标题目录 ──────────────────────────────────────────────

function extractHeadings(markdown) {
  const headings = [];
  const lines = markdown.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        id: match[2].trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-鿿-]/g, ''),
      });
    }
  }
  return headings;
}

// ── 主组件 ────────────────────────────────────────────────────

export default function Note() {
  const { '*': slug } = useParams();
  const [markdown, setMarkdown] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [graphData, setGraphData] = useState(null);

  const decodedSlug = useMemo(() => decodeURIComponent(slug || ''), [slug]);

  // 加载图谱数据
  useEffect(() => {
    fetch('/graph.json')
      .then(r => r.json())
      .then(setGraphData)
      .catch(console.error);
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
        const fmTitle = text.match(/^---[\s\S]*?^title:\s*["']?(.+?)["']?\s*$/m);
        const h1Title = text.match(/^#\s+(.+)$/m);
        const fileName = decodedSlug.split('/').pop();
        setTitle(fmTitle?.[1] || h1Title?.[1] || fileName);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [decodedSlug]);

  const headings = useMemo(() => extractHeadings(markdown), [markdown]);

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
          <BackLink to="/graph">← 返回图谱</BackLink>
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
        <BackLink to="/graph">← 知识图谱</BackLink>
        <NoteTitle>{title}</NoteTitle>
        <NoteMeta>笔记路径: {decodedSlug}</NoteMeta>
        <MarkdownBody>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkWikilinks]}
            components={{
              h1: ({children, ...props}) => {
                const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-鿿-]/g, '');
                return <h1 id={id} {...props}>{children}</h1>;
              },
              h2: ({children, ...props}) => {
                const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-鿿-]/g, '');
                return <h2 id={id} {...props}>{children}</h2>;
              },
              h3: ({children, ...props}) => {
                const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-鿿-]/g, '');
                return <h3 id={id} {...props}>{children}</h3>;
              },
              a: ({href, children, ...props}) => {
                if (href && href.startsWith('/note/')) {
                  return <Link to={href} {...props}>{children}</Link>;
                }
                return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
              },
            }}
          >
            {markdown}
          </ReactMarkdown>
        </MarkdownBody>
      </NoteContent>

      <NoteSidebar>
        {graphData && <MiniGraph currentSlug={decodedSlug} graphData={graphData} />}
        {headings.length > 0 && (
          <TocContainer>
            <TocTitle>目录</TocTitle>
            <TocList>
              {headings.map((h, i) => (
                <TocItem key={i} $level={h.level}>
                  <a href={`#${h.id}`}>{h.text}</a>
                </TocItem>
              ))}
            </TocList>
          </TocContainer>
        )}
      </NoteSidebar>
    </NoteLayout>
  );
}
