import BlogPlanet from './BlogPlanet';

function Scene({ activeBiome, onBiomeHover, onBiomeSelect, onNavigate, rotationMode }) {
  return (
    <>
      <fog attach="fog" args={['#dff8ff', 9, 20]} />

      <ambientLight intensity={0.5} color="#e7fbff" />
      <hemisphereLight args={['#f6fdff', '#7ec8a6', 1.18]} />
      <directionalLight
        position={[-4.5, 6.5, 7.5]}
        intensity={2.35}
        color="#fff4cf"
        castShadow={false}
      />
      <directionalLight
        position={[4, 2, 5]}
        intensity={0.55}
        color="#b8ecff"
      />

      <BlogPlanet
        activeBiome={activeBiome}
        onBiomeHover={onBiomeHover}
        onBiomeSelect={onBiomeSelect}
        onNavigate={onNavigate}
        rotationMode={rotationMode}
      />
    </>
  );
}

export default Scene;
