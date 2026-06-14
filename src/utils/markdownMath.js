function splitDisplayMathLine(line) {
  const start = line.match(/^(\s*(?:>\s*)*)\$\$(.*)$/);
  if (!start) return [line];

  const prefix = start[1] || '';
  const rest = start[2] || '';
  const trimmedRest = rest.trim();

  if (!trimmedRest) return [line];

  if (trimmedRest.endsWith('$$')) {
    const content = trimmedRest.slice(0, -2).trim();
    return content ? [`${prefix}$$`, `${prefix}${content}`, `${prefix}$$`] : [`${prefix}$$`, `${prefix}$$`];
  }

  return [`${prefix}$$`, `${prefix}${trimmedRest}`];
}

function closeDisplayMathLine(line) {
  const close = line.match(/^(\s*(?:>\s*)*)(.+?)\$\$\s*$/);
  if (!close) return [line];

  const prefix = close[1] || '';
  const content = close[2].trimEnd();
  if (!content || content.trimStart().startsWith('$$')) return [line];

  return [`${prefix}${content}`, `${prefix}$$`];
}

export function normalizeMarkdownMath(markdown) {
  const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let inFence = false;

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }

    if (inFence) {
      out.push(line);
      continue;
    }

    const splitStart = splitDisplayMathLine(line);
    if (splitStart.length > 1 || splitStart[0] !== line) {
      out.push(...splitStart);
      continue;
    }

    out.push(...closeDisplayMathLine(line));
  }

  return out.join('\n');
}
