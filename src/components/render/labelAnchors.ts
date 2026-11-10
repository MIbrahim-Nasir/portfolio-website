import { graph } from '@/data/profile';
import { cities, graphNodes, llToXYZ } from './shapes';

const dubaiP = llToXYZ(cities.dubai.lat, cities.dubai.lon, 2.55);
const hydP = llToXYZ(cities.hyderabad.lat, cities.hyderabad.lon, 2.5);

// 3D anchors for the DOM labels (rendered by <Labels/> outside the canvas)
export const LABELS = [
  ...graphNodes.map((n) => {
    const meta = graph.nodes.find((g) => g.id === n.id)!;
    return {
      kind: 'graph' as const,
      p: [n.p[0], n.p[1] - n.r - 0.3, n.p[2]],
      label: meta.label,
      sub: meta.sub,
    };
  }),
  { kind: 'city' as const, p: dubaiP, label: 'Dubai', sub: '25.2°N 55.3°E' },
  { kind: 'city' as const, p: hydP, label: 'Hyderabad', sub: '17.4°N 78.5°E' },
];
