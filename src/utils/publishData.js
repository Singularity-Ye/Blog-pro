const jsonCache = new Map();

function fetchJsonOnce(url) {
  if (!jsonCache.has(url)) {
    jsonCache.set(
      url,
      fetch(url).then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}`);
        }
        return response.json();
      })
    );
  }

  return jsonCache.get(url);
}

export function fetchGraphData() {
  return fetchJsonOnce('/graph.json');
}

export function fetchNotesIndex() {
  return fetchJsonOnce('/notes-index.json');
}
