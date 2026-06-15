function normalizeEscapedDollarsInMath(markdown) {
  const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
  const outLines = [];
  let inDisplayMath = false;
  let inFence = false;

  for (const line of lines) {
    let out = '';
    let inInlineMath = false;

    for (let i = 0; i < line.length; i += 1) {
      if (line.startsWith('```', i) && i === 0) {
      inFence = !inFence;
      out += '```';
      i += 2;
      continue;
    }

    if (inFence) {
      out += line[i];
      continue;
    }

    if (!inFence && !inInlineMath && line.startsWith('\\[', i)) {
      inDisplayMath = true;
      out += '\\[';
      i += 1;
      continue;
    }

    if (!inFence && inDisplayMath && line.startsWith('\\]', i)) {
      inDisplayMath = false;
      out += '\\]';
      i += 1;
      continue;
    }

    if ((inInlineMath || inDisplayMath) && line[i] === '\\' && line[i + 1] === '$') {
      out += '\\text{＄}';
      i += 1;
      continue;
    }

    if (line[i] === '$' && line[i - 1] !== '\\') {
      if (line[i + 1] === '$') {
        inDisplayMath = !inDisplayMath;
        out += '$$';
        i += 1;
        continue;
      }

      if (!inDisplayMath) {
        inInlineMath = !inInlineMath;
      }
    }

    out += line[i];
  }

    outLines.push(out);
  }

  return outLines.join('\n');
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
