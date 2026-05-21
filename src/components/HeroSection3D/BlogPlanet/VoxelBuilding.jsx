function Block({ position, args, color, active = false }) {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={active ? '#f5d0fe' : color}
        emissive={active ? '#c084fc' : '#000000'}
        emissiveIntensity={active ? 0.14 : 0}
        roughness={0.68}
        metalness={0.02}
        flatShading
      />
    </mesh>
  );
}

function Roof({ position, args, color = '#b45309' }) {
  return (
    <mesh position={position} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.82} metalness={0} flatShading />
    </mesh>
  );
}

function VoxelBuilding({ scale = 1, active = false, variant = 0 }) {
  const lift = active ? 0.035 : 0;

  return (
    <group scale={scale}>
      {variant % 3 === 0 && (
        <>
          <Block position={[0, 0.105 + lift, 0]} args={[0.14, 0.21, 0.14]} color="#d8d1bf" />
          <Block position={[0.08, 0.18 + lift, -0.035]} args={[0.1, 0.32, 0.1]} color="#aaa28e" active={active} />
          <Roof position={[0, 0.245 + lift, 0]} args={[0.12, 0.09, 4]} color="#d97706" />
        </>
      )}
      {variant % 3 === 1 && (
        <>
          <Block position={[-0.055, 0.09 + lift, 0]} args={[0.11, 0.18, 0.12]} color="#eee7d4" />
          <Block position={[0.045, 0.13 + lift, 0.045]} args={[0.1, 0.26, 0.1]} color="#b8b0a0" active={active} />
          <Block position={[0.115, 0.055 + lift, -0.04]} args={[0.07, 0.11, 0.08]} color="#8b8273" />
          <mesh position={[0.045, 0.29 + lift, 0.045]}>
            <cylinderGeometry args={[0.012, 0.018, 0.12, 5]} />
            <meshStandardMaterial color="#f0abfc" emissive="#c084fc" emissiveIntensity={0.2} roughness={0.72} metalness={0} />
          </mesh>
        </>
      )}
      {variant % 3 === 2 && (
        <>
          <Block position={[0, 0.07 + lift, 0]} args={[0.22, 0.14, 0.11]} color="#d8d1bf" />
          <Block position={[-0.07, 0.16 + lift, 0.02]} args={[0.08, 0.28, 0.08]} color="#aaa28e" active={active} />
          <Block position={[0.075, 0.135 + lift, -0.015]} args={[0.08, 0.23, 0.08]} color="#8b8273" />
          <Roof position={[0, 0.16 + lift, 0]} args={[0.18, 0.08, 4]} color="#c2410c" />
        </>
      )}
    </group>
  );
}

export default VoxelBuilding;
