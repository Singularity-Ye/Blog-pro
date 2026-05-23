function endpointId(endpoint) {
  if (typeof endpoint === 'string') return endpoint;
  if (endpoint && typeof endpoint === 'object') return endpoint.id;
  return '';
}

export function normalizeGraph(graphData) {
  const nodes = graphData?.nodes ?? [];
  const links = (graphData?.links ?? [])
    .map((link) => ({
      ...link,
      source: endpointId(link.source),
      target: endpointId(link.target),
    }))
    .filter((link) => link.source && link.target);

  return { nodes, links };
}

export function filterGraphByCollection(graphData, collection) {
  const { nodes, links } = normalizeGraph(graphData);
  if (!collection) return { nodes, links };

  const filteredNodes = nodes.filter((node) => node.collection === collection);
  const nodeIds = new Set(filteredNodes.map((node) => node.id));
  const filteredLinks = links.filter((link) => nodeIds.has(link.source) && nodeIds.has(link.target));

  return { nodes: filteredNodes, links: filteredLinks };
}

export function filterGraphByLocal(graphData, centerId, options = {}) {
  const { includeNeighborLinks = true } = options;
  const { nodes, links } = normalizeGraph(graphData);
  if (!centerId) return { nodes: [], links: [] };

  const neighborIds = new Set([centerId]);
  const localLinks = [];

  for (const link of links) {
    if (link.source === centerId || link.target === centerId) {
      neighborIds.add(link.source);
      neighborIds.add(link.target);
      localLinks.push(link);
    }
  }

  const filteredNodes = nodes.filter((node) => neighborIds.has(node.id));
  const filteredLinks = includeNeighborLinks
    ? links.filter((link) => neighborIds.has(link.source) && neighborIds.has(link.target))
    : localLinks;

  return { nodes: filteredNodes, links: filteredLinks };
}

export function getGraphStats(graphData) {
  const { nodes, links } = normalizeGraph(graphData);
  return { nodeCount: nodes.length, linkCount: links.length };
}
