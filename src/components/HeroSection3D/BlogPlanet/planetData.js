import { normalFromLatLon } from './sphereUtils';

const PLANET_RADIUS = 1.72;
const CONTINENT_RADIUS = PLANET_RADIUS + 0.035;

export const CONTINENT_PATCHES = [
  {
    id: 'green-chronicle-continent',
    biome: 'forest',
    lat: 18,
    lon: -58,
    widthAngle: 58,
    heightAngle: 42,
    patchRotation: 2.9,
    coastWidth: 0.25,
    hoverLift: 0.035,
  },
  {
    id: 'desert-debug-continent',
    biome: 'desert',
    lat: -10,
    lon: 14,
    widthAngle: 54,
    heightAngle: 40,
    patchRotation: 3.1,
    coastWidth: 0.24,
    hoverLift: 0.032,
  },
  {
    id: 'snow-study-continent',
    biome: 'snow',
    lat: 38,
    lon: 42,
    widthAngle: 44,
    heightAngle: 36,
    patchRotation: 2.94,
    coastWidth: 0.21,
    hoverLift: 0.03,
  },
  {
    id: 'project-city-continent',
    biome: 'city',
    lat: -30,
    lon: -122,
    widthAngle: 50,
    heightAngle: 38,
    patchRotation: 2.86,
    coastWidth: 0.22,
    hoverLift: 0.032,
  },
];

export function createPlanetData() {
  const continents = CONTINENT_PATCHES.map((continent) => ({
    ...continent,
    normal: normalFromLatLon(continent.lat, continent.lon),
    radius: CONTINENT_RADIUS,
  }));

  return {
    radius: PLANET_RADIUS,
    continents,
  };
}
