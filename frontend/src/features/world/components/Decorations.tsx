import PixelTree from './PixelTree'
import { decorativeTreePositions, rockPositions } from '../data/colliders'

const flowerPositions: Array<[number, number, number]> = [
  [-3.8, 0, 6.7], [-2.9, 0, 6.9], [2.8, 0, 6.6], [3.7, 0, 6.9],
  [-7.4, 0, 1.5], [-7.9, 0, 0.7], [7.5, 0, 1.4], [8.0, 0, 0.4],
  [-1.8, 0, -7.6], [1.8, 0, -7.7], [4.2, 0, -4.2], [-4.4, 0, -4.0],
]

export default function Decorations() {
  return (
    <group>
      {decorativeTreePositions.map((position, index) => (
        <PixelTree key={index} position={position as [number, number, number]} />
      ))}

      {flowerPositions.map((position, index) => (
        <group key={`flower-${index}`} position={position}>
          <mesh position={[0, 0.12, 0]} castShadow>
            <boxGeometry args={[0.08, 0.24, 0.08]} />
            <meshStandardMaterial color="#4f8f45" />
          </mesh>
          <mesh position={[0, 0.28, 0]} castShadow>
            <boxGeometry args={[0.28, 0.12, 0.28]} />
            <meshStandardMaterial color={index % 2 ? '#f7a8b8' : '#fff1a8'} />
          </mesh>
        </group>
      ))}

      {rockPositions.map((position, index) => (
        <mesh key={`rock-${index}`} position={[position[0], 0.12, position[2]]} castShadow receiveShadow rotation={[0, index * 0.4, 0]}>
          <dodecahedronGeometry args={[0.28 + (index % 2) * 0.12, 0]} />
          <meshStandardMaterial color="#8d948a" roughness={0.85} />
        </mesh>
      ))}

      <mesh position={[0, 0.07, -2.6]} receiveShadow>
        <boxGeometry args={[2.4, 0.14, 0.7]} />
        <meshStandardMaterial color="#b77947" />
      </mesh>
      <mesh position={[-0.92, 0.45, -2.6]} castShadow>
        <boxGeometry args={[0.16, 0.76, 0.16]} />
        <meshStandardMaterial color="#7a4a28" />
      </mesh>
      <mesh position={[0.92, 0.45, -2.6]} castShadow>
        <boxGeometry args={[0.16, 0.76, 0.16]} />
        <meshStandardMaterial color="#7a4a28" />
      </mesh>

      <group position={[-1.45, 0, 4.92]}>
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[0.14, 0.84, 0.14]} />
          <meshStandardMaterial color="#4b5563" />
        </mesh>
        <mesh position={[0, 0.92, 0]} castShadow>
          <boxGeometry args={[0.42, 0.32, 0.42]} />
          <meshStandardMaterial color="#fef3c7" emissive="#facc15" emissiveIntensity={0.35} />
        </mesh>
      </group>
    </group>
  )
}
