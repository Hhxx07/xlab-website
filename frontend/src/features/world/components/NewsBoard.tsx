import HouseLabel from './HouseLabel'

export default function NewsBoard() {
  return (
    <group position={[0, 0, 2.1]}>
      <mesh position={[-0.55, 0.55, 0]}>
        <boxGeometry args={[0.14, 1.1, 0.14]} />
        <meshStandardMaterial color="#6f4425" />
      </mesh>
      <mesh position={[0.55, 0.55, 0]}>
        <boxGeometry args={[0.14, 1.1, 0.14]} />
        <meshStandardMaterial color="#6f4425" />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[1.55, 0.9, 0.16]} />
        <meshStandardMaterial color="#f8e7b8" />
      </mesh>
      <mesh position={[0, 1.58, 0]}>
        <boxGeometry args={[1.75, 0.22, 0.22]} />
        <meshStandardMaterial color="#d78d3f" />
      </mesh>
      {/* <HouseLabel position={[0, 1.85, 0.12]} label="News" /> */}
    </group>
  )
}
