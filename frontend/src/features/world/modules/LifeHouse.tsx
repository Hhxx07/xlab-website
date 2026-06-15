export default function LifeHouse({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
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
      <mesh position={[1.24, 1.05, 0.91]} castShadow>
        <boxGeometry args={[0.08, 0.7, 0.08]} />
        <meshStandardMaterial color="#7a4a28" />
      </mesh>
      <mesh position={[1.24, 1.44, 0.91]} castShadow>
        <boxGeometry args={[0.42, 0.12, 0.12]} />
        <meshStandardMaterial color="#7a4a28" />
      </mesh>
      <mesh position={[1.48, 1.44, 0.91]} castShadow>
        <boxGeometry args={[0.18, 0.18, 0.18]} />
        <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[-0.95, 2.14, -0.34]} castShadow>
        <boxGeometry args={[0.32, 0.5, 0.32]} />
        <meshStandardMaterial color="#8b5a3c" />
      </mesh>
      {/* <HouseLabel position={[0, 2.55, 0]} label="生活" /> */}
    </group>
  )
}
