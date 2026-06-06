import HouseLabel from '../components/HouseLabel'

export default function MovieHouse({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[2.05, 1.5, 1.45]} />
        <meshStandardMaterial color="#d8dcff" />
      </mesh>
      <mesh position={[0, 1.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.58, 0.58, 2.25, 16]} />
        <meshStandardMaterial color="#565d7d" />
      </mesh>
      <mesh position={[0, 0.62, 0.86]}>
        <cylinderGeometry args={[0.48, 0.48, 0.12, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0, 0.62, 0.94]}>
        <cylinderGeometry args={[0.28, 0.28, 0.08, 16]} />
        <meshStandardMaterial color="#93c5fd" />
      </mesh>
      {[-0.72, 0.72].map((x) => (
        <mesh key={x} position={[x, 0.12, 1.28]}>
          <boxGeometry args={[0.42, 0.05, 0.9]} />
          <meshStandardMaterial color="#2f354a" />
        </mesh>
      ))}
      <HouseLabel position={[0, 2.55, 0]} label="电影" />
    </group>
  )
}
