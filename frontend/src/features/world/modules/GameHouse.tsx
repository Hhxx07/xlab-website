import HouseLabel from '../components/HouseLabel'

export default function GameHouse({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[2.25, 1.35, 1.45]} />
        <meshStandardMaterial color="#8cc7ff" />
      </mesh>
      <mesh position={[-1.38, 0.72, 0]} castShadow>
        <boxGeometry args={[0.52, 1.0, 1.0]} />
        <meshStandardMaterial color="#5d8fd6" />
      </mesh>
      <mesh position={[1.38, 0.72, 0]} castShadow>
        <boxGeometry args={[0.52, 1.0, 1.0]} />
        <meshStandardMaterial color="#5d8fd6" />
      </mesh>
      <mesh position={[0, 1.52, 0]}>
        <boxGeometry args={[2.0, 0.24, 1.2]} />
        <meshStandardMaterial color="#2e3a59" />
      </mesh>
      <mesh position={[0, 0.42, 0.76]}>
        <boxGeometry args={[0.55, 0.72, 0.08]} />
        <meshStandardMaterial color="#f6f7fb" emissive="#5bd2ff" emissiveIntensity={0.5} />
      </mesh>
      {[
        [-0.52, 1.74, 0.62],
        [0.55, 1.74, 0.62],
        [0.82, 1.74, 0.35],
      ].map((pos, index) => (
        <mesh key={index} position={pos as [number, number, number]}>
          <boxGeometry args={[0.18, 0.18, 0.18]} />
          <meshStandardMaterial color={index === 0 ? '#333333' : '#ffdc6a'} />
        </mesh>
      ))}
      <HouseLabel position={[0, 2.35, 0]} label="Games" />
    </group>
  )
}
