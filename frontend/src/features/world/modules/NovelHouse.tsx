export default function NovelHouse({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[-0.55, 0.75, 0]} rotation={[0, 0, 0.08]} castShadow>
        <boxGeometry args={[1.15, 1.5, 1.55]} />
        <meshStandardMaterial color="#f2e7d0" />
      </mesh>
      <mesh position={[0.55, 0.75, 0]} rotation={[0, 0, -0.08]} castShadow>
        <boxGeometry args={[1.15, 1.5, 1.55]} />
        <meshStandardMaterial color="#eadcc0" />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[0.18, 0.22, 1.72]} />
        <meshStandardMaterial color="#8b7358" />
      </mesh>
      <mesh position={[0, 0.42, 0.86]}>
        <boxGeometry args={[0.26, 0.9, 0.08]} />
        <meshStandardMaterial color="#c94b55" />
      </mesh>
      <mesh position={[0.86, 1.06, 0.88]}>
        <boxGeometry args={[0.42, 0.26, 0.06]} />
        <meshStandardMaterial color="#31343a" />
      </mesh>
      {/* <HouseLabel position={[0, 2.42, 0]} label="小说" /> */}
    </group>
  )
}
