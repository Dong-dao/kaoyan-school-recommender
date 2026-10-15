import React from 'react';

/** 极简 Markdown 渲染（用于报告展示）。支持标题/粗体/斜体/行内代码/列表/引用/表格行/链接。 */
const MarkdownView: React.FC<{ content: string }> = ({ content }) => {
  const esc = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');

  const lines = content.split('\n');
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  let key = 0;

  const flushList = () => {
    if (list.length) {
      out.push(
        <ul key={`ul-${key++}`} style={{ margin: '4px 0', paddingLeft: 22 }}>
          {list.map((it, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: it }} />
          ))}
        </ul>
      );
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList();
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      list.push(esc(line.replace(/^\s*[-*+]\s+/, '')));
      continue;
    }
    flushList();
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      const n = h[1].length;
      const Tag = `h${Math.min(n + 1, 6)}` as 'h2' | 'h3' | 'h4' | 'h5';
      out.push(
        <Tag key={`h-${key++}`} style={{ margin: '14px 0 6px' }} dangerouslySetInnerHTML={{ __html: esc(h[2]) }} />
      );
      continue;
    }
    if (/^\s*>\s?/.test(line)) {
      out.push(
        <blockquote
          key={`q-${key++}`}
          style={{ margin: '6px 0', padding: '4px 12px', borderLeft: '3px solid #cbd5e1', color: '#475569', background: '#f8fafc' }}
          dangerouslySetInnerHTML={{ __html: esc(line.replace(/^\s*>\s?/, '')) }}
        />
      );
      continue;
    }
    if (line.includes('|')) {
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter((c, i, arr) => !(i === 0 && c === '') && !(i === arr.length - 1 && c === ''));
      const isSep = cells.every((c) => /^:?-{2,}:?$/.test(c.replace(/\s/g, '')));
      if (isSep) continue;
      out.push(
        <div
          key={`row-${key++}`}
          style={{ display: 'flex', gap: 8, padding: '3px 0', borderBottom: '1px solid #eee' }}
        >
          {cells.map((c, i) => (
            <span key={i} style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: esc(c) }} />
          ))}
        </div>
      );
      continue;
    }
    out.push(
      <p key={`p-${key++}`} style={{ margin: '6px 0' }} dangerouslySetInnerHTML={{ __html: esc(line) }} />
    );
  }
  flushList();
  return <div style={{ fontFamily: 'inherit' }}>{out}</div>;
};

export default MarkdownView;
