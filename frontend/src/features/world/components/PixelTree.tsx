export default function PixelTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.28, 0.7, 0.28]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[0.9, 0.65, 0.9]} />
        <meshStandardMaterial color="#3f9d52" />
      </mesh>
      <mesh position={[0.08, 1.35, -0.06]} castShadow>
        <boxGeometry args={[0.65, 0.5, 0.65]} />
        <meshStandardMaterial color="#54b96b" />
      </mesh>
    </group>
  )
}
