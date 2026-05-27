/**
 * Shared frontmatter / YAML-header parsing for markdown files.
 * Used by both Note page and Blog scroll panel.
 */

const RX_NEWLINE = /\r\n?/g;
const RX_BOM = /^﻿/;
const RX_FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/;
const RX_LIST_ITEM = /^\s*-\s+(.+)$/;
const RX_KEY_VALUE = /^([A-Za-z0-9_-]+):\s*(.*)$/;
const RX_QUOTES = /^["']|["']$/g;

export function parseValue(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === '[]') return [];
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((item) => parseValue(item))
      .filter((v) => v !== '');
  }
  return trimmed.replace(RX_QUOTES, '');
}

/**
 * Parse YAML frontmatter block from a markdown string.
 * Returns { body, data } where `data` is a flat key→value map.
 * Supports simple scalars and YAML list continuations (`- item` lines).
 */
export function parseFrontmatter(markdown) {
  const normalized = String(markdown || '').replace(RX_BOM, '').replace(RX_NEWLINE, '\n');
  const match = normalized.match(RX_FRONTMATTER);
  if (!match) return { body: normalized, data: {} };

  const raw = match[1].split('\n');
  const data = {};
  let currentKey = null;

  for (const line of raw) {
    const listItem = line.match(RX_LIST_ITEM);
    if (listItem && currentKey) {
      data[currentKey] = [
        ...(Array.isArray(data[currentKey]) ? data[currentKey] : data[currentKey] != null ? [data[currentKey]] : []),
        parseValue(listItem[1]),
      ];
      continue;
    }

    const pair = line.match(RX_KEY_VALUE);
    if (!pair) continue;
    currentKey = pair[1];
    data[currentKey] = pair[2] ? parseValue(pair[2]) : [];
  }

  return {
    body: normalized.slice(match[0].length),
    data,
  };
}

/**
 * Convenience: extract only the title from frontmatter or first h1.
 * Falls back to the file name stem.
 */
export function extractTitle(markdown, fallbackName) {
  const { body, data } = parseFrontmatter(markdown);
  if (data.title) return String(data.title).trim();

  const h1 = body.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();

  return fallbackName ? fallbackName.replace(/\.md$/i, '') : '';
}
