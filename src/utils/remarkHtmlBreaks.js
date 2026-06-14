function normalizeHtmlBreaks(node) {
  if (!node || typeof node !== 'object') return;

  if (Array.isArray(node.children)) {
    const newChildren = [];

    for (const child of node.children) {
      if (
        child &&
        (child.type === 'text' || child.type === 'html') &&
        typeof child.value === 'string'
      ) {
        const parts = child.value.split(/(<br\s*\/?>)/i);

        if (parts.length > 1) {
          for (const part of parts) {
            if (/^<br\s*\/?>$/i.test(part)) {
              newChildren.push({ type: 'break' });
            } else if (part) {
              newChildren.push({ type: child.type, value: part });
            }
          }
          continue;
        }
      }

      normalizeHtmlBreaks(child);
      newChildren.push(child);
    }

    node.children = newChildren;
  }
}

export default function remarkHtmlBreaks() {
  return (tree) => {
    normalizeHtmlBreaks(tree);
  };
}
