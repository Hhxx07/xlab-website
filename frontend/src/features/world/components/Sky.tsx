import PixelCloud from './PixelCloud'

export default function Sky() {
  return (
    <group>
      <color attach="background" args={['#bfe8ff']} />
      <PixelCloud position={[-5.5, 5.2, -4.2]} />
      <PixelCloud position={[4.2, 5.8, -2.2]} />
      <PixelCloud position={[1.5, 6.4, 5.2]} />
      <PixelCloud position={[-1.5, 6.1, -7.2]} />
      <PixelCloud position={[7.6, 5.4, 4.8]} />
    </group>
  )
}
