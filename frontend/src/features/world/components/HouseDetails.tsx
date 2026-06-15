import { worldModules } from '../data/worldModules'

export default function HouseDetails({ isNight }: { isNight: boolean }) {
  return (
    <group>
      {worldModules.map((module, index) => {
        const [x, , z] = module.position
        const frontZ = module.id === 'life' ? z - 1.02 : z + 1.02

        return (
          <group key={module.id}>
            <mesh position={[x - 0.88, 1.02, frontZ]} castShadow>
              <boxGeometry args={[0.12, 0.58, 0.08]} />
              <meshStandardMaterial color="#6b4a32" />
            </mesh>
            <mesh position={[x + 0.88, 1.02, frontZ]} castShadow>
              <boxGeometry args={[0.12, 0.58, 0.08]} />
              <meshStandardMaterial color="#6b4a32" />
            </mesh>
            <mesh position={[x, 0.07, frontZ + (module.id === 'life' ? -0.28 : 0.28)]} receiveShadow>
              <boxGeometry args={[1.35, 0.08, 0.5]} />
              <meshStandardMaterial color="#b88756" roughness={0.8} />
            </mesh>
            <mesh position={[x + 1.18, 1.42, frontZ]} castShadow>
              <boxGeometry args={[0.22, 0.22, 0.16]} />
              <meshStandardMaterial
                color={isNight ? '#fde68a' : '#fff7ed'}
                emissive={isNight ? '#f59e0b' : '#000000'}
                emissiveIntensity={isNight ? 1.4 : 0}
              />
            </mesh>
            {isNight && (
              <pointLight
                position={[x + 1.18, 1.55, frontZ]}
                color="#fbbf24"
                intensity={1.1}
                distance={4.8}
                decay={2}
              />
            )}
            <mesh position={[x - 0.75 + (index % 3) * 0.22, 2.35, z - 0.35]} castShadow>
              <boxGeometry args={[0.28, 0.46, 0.28]} />
              <meshStandardMaterial color="#7c4a2d" roughness={0.75} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
