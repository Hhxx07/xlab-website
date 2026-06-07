import HouseLabel from '../components/HouseLabel'

export default function SportHouse({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.72, 0]} rotation={[0, 0, -0.18]} castShadow>
        <boxGeometry args={[2.1, 1.35, 1.45]} />
        <meshStandardMaterial color="#c7f0c5" />
      </mesh>
      <mesh position={[0, 1.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.18, 1.18, 0.3, 24]} />
        <meshStandardMaterial color="#f7fafc" />
      </mesh>
      <mesh position={[0, 0.18, 1.16]}>
        <boxGeometry args={[1.85, 0.05, 0.38]} />
        <meshStandardMaterial color="#5cb56a" />
      </mesh>
      <mesh position={[0, 0.25, 0.85]}>
        <boxGeometry args={[0.5, 0.48, 0.08]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      {[-1.25, 1.25].map((x) => (
        <mesh key={x} position={[x, 1.25, 0.78]} rotation={[0, 0, x > 0 ? -0.6 : 0.6]}>
          <boxGeometry args={[0.12, 0.75, 0.12]} />
          <meshStandardMaterial color="#f43f5e" />
        </mesh>
      ))}
      {/* <HouseLabel position={[0, 2.5, 0]} label="体育" /> */}
    </group>
  )
}
