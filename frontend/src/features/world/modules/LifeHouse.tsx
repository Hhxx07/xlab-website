export default function LifeHouse({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[2.4, 1.7, 1.55]} />
        <meshStandardMaterial color="#ffd4ad" />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <boxGeometry args={[2.65, 0.32, 1.75]} />
        <meshStandardMaterial color="#bd6d43" />
      </mesh>
      <mesh position={[0, 0.45, 0.83]}>
        <boxGeometry args={[0.55, 0.88, 0.08]} />
        <meshStandardMaterial color="#74513a" />
      </mesh>
      {[-0.72, 0.72].map((x) => (
        <mesh key={x} position={[x, 1.1, 0.84]}>
          <boxGeometry args={[0.42, 0.42, 0.06]} />
          <meshStandardMaterial color="#fff8e8" />
        </mesh>
      ))}
      <mesh position={[-1.25, 0.35, 0.95]} rotation={[0, 0, 0.4]}>
        <torusGeometry args={[0.26, 0.035, 6, 12]} />
        <meshStandardMaterial color="#39495e" />
      </mesh>
      <mesh position={[-1.68, 0.35, 0.95]} rotation={[0, 0, 0.4]}>
        <torusGeometry args={[0.26, 0.035, 6, 12]} />
        <meshStandardMaterial color="#39495e" />
      </mesh>
      {/* <HouseLabel position={[0, 2.55, 0]} label="生活" /> */}
    </group>
  )
}
