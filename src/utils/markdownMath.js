function normalizeEscapedDollarsInMath(markdown) {
  const text = String(markdown || '');
  let out = '';
  let inInlineMath = false;
  let inDisplayMath = false;
  let inFence = false;

  for (let i = 0; i < text.length; i += 1) {
    if (text.startsWith('```', i) && (i === 0 || text[i - 1] === '\n')) {
      inFence = !inFence;
      out += '```';
      i += 2;
      continue;
    }

    if (inFence) {
      out += text[i];
      continue;
    }

    if (!inFence && !inInlineMath && text.startsWith('\\[', i)) {
      inDisplayMath = true;
      out += '\\[';
      i += 1;
      continue;
    }

    if (!inFence && inDisplayMath && text.startsWith('\\]', i)) {
      inDisplayMath = false;
      out += '\\]';
      i += 1;
      continue;
    }

    if ((inInlineMath || inDisplayMath) && text[i] === '\\' && text[i + 1] === '$') {
      out += '\\text{＄}';
      i += 1;
      continue;
    }

    if (text[i] === '$' && text[i - 1] !== '\\') {
      if (text[i + 1] === '$') {
        inDisplayMath = !inDisplayMath;
        out += '$$';
        i += 1;
        continue;
      }

      if (!inDisplayMath) {
        inInlineMath = !inInlineMath;
      }
    }

    out += text[i];
  }

  return out;
}

function splitDisplayMathLine(line) {
  const bracketStart = line.match(/^(\s*(?:>\s*)*)\\\[(.*)$/);
  if (bracketStart) {
    const prefix = bracketStart[1] || '';
    const rest = bracketStart[2] || '';
    const trimmedRest = rest.trim();

    if (!trimmedRest) return [`${prefix}$$`];

    if (trimmedRest.endsWith('\\]')) {
      const content = trimmedRest.slice(0, -2).trim();
      return content ? [`${prefix}$$`, `${prefix}${content}`, `${prefix}$$`] : [`${prefix}$$`, `${prefix}$$`];
    }

    return [`${prefix}$$`, `${prefix}${trimmedRest}`];
  }

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
  const standaloneBracketClose = line.match(/^(\s*(?:>\s*)*)\\\]\s*$/);
  if (standaloneBracketClose) {
    return [`${standaloneBracketClose[1] || ''}$$`];
  }

  const bracketClose = line.match(/^(\s*(?:>\s*)*)(.+?)\\\]\s*$/);
  if (bracketClose) {
    const prefix = bracketClose[1] || '';
    const content = bracketClose[2].trimEnd();
    if (!content || content.trimStart().startsWith('\\[')) return [`${prefix}$$`];

    return [`${prefix}${content}`, `${prefix}$$`];
  }

  const close = line.match(/^(\s*(?:>\s*)*)(.+?)\$\$\s*$/);
  if (!close) return [line];

  const prefix = close[1] || '';
  const content = close[2].trimEnd();
  if (!content || content.trimStart().startsWith('$$')) return [line];

  return [`${prefix}${content}`, `${prefix}$$`];
}

export function normalizeMarkdownMath(markdown) {
  const lines = normalizeEscapedDollarsInMath(markdown).replace(/\r\n?/g, '\n').split('\n');
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
