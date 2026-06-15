export function encodeNotePath(value) {
  return String(value || '')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function safeDecodeNotePath(value) {
  try {
    return decodeURIComponent(value || '');
  } catch {
    return value || '';
  }
}

export function toNoteHref(slug) {
  return `/note/${encodeNotePath(slug)}`;
}
