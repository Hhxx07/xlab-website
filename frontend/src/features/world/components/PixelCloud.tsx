export default function PixelCloud({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[
        [-0.45, 0, 0],
        [0, 0.12, 0],
        [0.45, 0, 0],
      ].map((part, index) => (
        <mesh key={index} position={part as [number, number, number]}>
          <boxGeometry args={[0.8, 0.35, 0.45]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  )
}
