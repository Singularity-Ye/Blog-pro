import { normalFromLatLon } from './sphereUtils';

const PLANET_RADIUS = 1.72;
const CONTINENT_RADIUS = PLANET_RADIUS + 0.035;

export const CONTINENT_PATCHES = [
  {
    id: 'green-chronicle-continent',
    biome: 'forest',
    lat: 38,
    lon: -38,
    widthAngle: 62,
    heightAngle: 54,
    patchRotation: 3.0,
    coastWidth: 0.52,
    hoverLift: 0.035,
  },
  {
    id: 'desert-debug-continent',
    biome: 'desert',
    lat: 24,
    lon: 58,
    widthAngle: 56,
    heightAngle: 48,
    patchRotation: 3.00,
    coastWidth: 0.49,
    hoverLift: 0.032,
  },
  {
    id: 'snow-study-continent',
    biome: 'snow',
    lat: -36,
    lon: 112,
    widthAngle: 54,
    heightAngle: 46,
    patchRotation: 3.0,
    coastWidth: 0.48,
    hoverLift: 0.03,
  },
  {
    id: 'project-city-continent',
    biome: 'city',
    lat: -28,
    lon: -62,
    widthAngle: 58,
    heightAngle: 50,
    patchRotation: 3.1,
    coastWidth: 0.50,
    hoverLift: 0.032,
  },
  {
    id: 'about-life-continent',
    biome: 'about',
    lat: 8,
    lon: -158,
    widthAngle: 60,
    heightAngle: 52,
    patchRotation: 3.00,
    coastWidth: 0.51,
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
