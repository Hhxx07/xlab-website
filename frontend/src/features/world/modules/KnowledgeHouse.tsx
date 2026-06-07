import HouseLabel from '../components/HouseLabel'

export default function KnowledgeHouse({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[2.2, 1.5, 1.55]} />
        <meshStandardMaterial color="#fff8dc" />
      </mesh>
      <mesh position={[0, 1.65, 0]} castShadow>
        <boxGeometry args={[2.45, 0.25, 1.75]} />
        <meshStandardMaterial color="#f5d56e" />
      </mesh>
      <mesh position={[0, 0.45, 0.82]} castShadow>
        <boxGeometry args={[0.52, 0.9, 0.08]} />
        <meshStandardMaterial color="#a87142" />
      </mesh>
      <mesh position={[-0.66, 0.86, 0.86]}>
        <boxGeometry args={[0.45, 0.36, 0.06]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      <mesh position={[1.03, 1.9, 0]} rotation={[0, 0, -0.35]}>
        <boxGeometry args={[0.18, 1.3, 0.18]} />
        <meshStandardMaterial color="#f6c445" />
      </mesh>
      <mesh position={[1.27, 2.46, 0]} rotation={[0, 0, -0.35]}>
        <coneGeometry args={[0.15, 0.34, 4]} />
        <meshStandardMaterial color="#313131" />
      </mesh>
      {/* <HouseLabel position={[0, 2.45, 0]} label="知识" /> */}
    </group>
  )
}
