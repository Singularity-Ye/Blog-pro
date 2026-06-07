import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';

import { BIOMES } from './biomeConfig';
import BiomeLabel from './BiomeLabel';
import ContinentPatch from './ContinentPatch';
import PlanetBase from './PlanetBase';
import { createPlanetData } from './planetData';
import { getPointOnSphere } from './sphereUtils';

function PlanetSurface({ activeBiome, onBiomeHover, onBiomeSelect }) {
  const groupRef = useRef();
  const burstRef = useRef(0);
  const hoverTileRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const leaveTimerRef = useRef(null);
  const pendingHoverRef = useRef(null);
  const data = useMemo(() => createPlanetData(), []);
  const [hoverTile, setHoverTile] = useState(null);

  const activeKey = hoverTile?.biome || activeBiome;
  const activeContinentId = hoverTile?.id;
  const activeConfig = activeKey ? BIOMES[activeKey] : null;
  const labelPosition = hoverTile
    ? getPointOnSphere(hoverTile.normal, hoverTile.radius + 0.42)
    : null;

  useFrame(() => {
    if (!groupRef.current) return;

    const burst = burstRef.current;

    burstRef.current *= 0.9;
    if (burstRef.current < 0.001) burstRef.current = 0;

    groupRef.current.scale.setScalar(1 + burst * 0.035);
  });

  useEffect(() => () => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
    }
    if (leaveTimerRef.current) {
      window.clearTimeout(leaveTimerRef.current);
    }
  }, []);

  const handleHover = (tile) => {
    document.body.style.cursor = 'pointer';

    if (leaveTimerRef.current) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }

    if (hoverTileRef.current?.id === tile.id || pendingHoverRef.current?.id === tile.id) {
      return;
    }

    pendingHoverRef.current = tile;

    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
    }

    hoverTimerRef.current = window.setTimeout(() => {
      hoverTileRef.current = pendingHoverRef.current;
      pendingHoverRef.current = null;
      setHoverTile(hoverTileRef.current);
      onBiomeHover?.(hoverTileRef.current?.biome ?? null);
    }, 180);
  };

  const handleLeave = () => {
    document.body.style.cursor = 'auto';

    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    pendingHoverRef.current = null;

    if (leaveTimerRef.current) {
      window.clearTimeout(leaveTimerRef.current);
    }

    leaveTimerRef.current = window.setTimeout(() => {
      hoverTileRef.current = null;
      setHoverTile(null);
      onBiomeHover?.(null);
    }, 420);
  };

  const handleSelect = (tile) => {
    burstRef.current = 1;
    hoverTileRef.current = tile;
    setHoverTile(tile);
    onBiomeSelect?.(tile.biome);
  };

  return (
    <group ref={groupRef}>
      <PlanetBase 
        radius={data.radius} 
        onHover={() => onBiomeHover?.('ocean')}
        onLeave={handleLeave}
      />

      {data.continents.map((continent) => (
        <ContinentPatch
          key={continent.id}
          continent={continent}
          active={activeContinentId === continent.id || (!activeContinentId && activeKey === continent.biome)}
          onHover={handleHover}
          onLeave={handleLeave}
          onSelect={handleSelect}
        />
      ))}



      <BiomeLabel config={activeConfig} position={labelPosition} />
    </group>
  );
}

export default PlanetSurface;
