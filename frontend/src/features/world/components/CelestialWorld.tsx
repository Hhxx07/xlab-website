export default function CelestialWorld({ isNight }: { isNight: boolean }) {
  const stars = [
    [-8, 9.2, -7], [-5, 10.4, -9], [-1.8, 8.8, -10], [3.2, 9.8, -8.4],
    [7.4, 8.6, -6.8], [-9.2, 9.6, 0], [9.1, 9.1, 1.4], [-4.8, 10.2, 7.5],
    [1.2, 8.7, 9.4], [6.8, 10.1, 6.6],
  ] as Array<[number, number, number]>

  return (
    <group>
      <mesh position={[0, -5.8, 0]}>
        <sphereGeometry args={[15.5, 48, 48]} />
        <meshBasicMaterial color={isNight ? '#0f172a' : '#dff6ff'} transparent opacity={0.42} side={2} />
      </mesh>

      {isNight ? (
        <>
          <mesh position={[-7.8, 9.5, -6.8]}>
            <sphereGeometry args={[0.52, 32, 32]} />
            <meshStandardMaterial color="#f8fafc" emissive="#dbeafe" emissiveIntensity={0.9} />
          </mesh>
          {stars.map((position, index) => (
            <mesh key={index} position={position}>
              <sphereGeometry args={[0.055 + (index % 3) * 0.025, 12, 12]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          ))}
        </>
      ) : (
        <mesh position={[9.5, 10.5, -6]}>
          <sphereGeometry args={[0.65, 32, 32]} />
          <meshStandardMaterial color="#ffd36b" emissive="#ffb84d" emissiveIntensity={1.2} />
        </mesh>
      )}
    </group>
  )
}
