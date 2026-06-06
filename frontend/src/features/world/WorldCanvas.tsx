import { Canvas } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import type { MutableRefObject } from 'react'
import type { MovementInput } from './utils/isoDirection'
import WorldScene from './WorldScene'

const emptyControls: MutableRefObject<MovementInput> = {
  current: {
    up: false,
    down: false,
    left: false,
    right: false,
  },
}

export default function WorldCanvas({
  controls = emptyControls,
  preview = false,
}: {
  controls?: MutableRefObject<MovementInput>
  preview?: boolean
}) {
  return (
    <Canvas
      dpr={1}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <OrthographicCamera
        makeDefault
        position={[8, 8, 8]}
        zoom={preview ? 38 : 48}
        near={0.1}
        far={100}
      />
      <WorldScene controls={controls} preview={preview} />
    </Canvas>
  )
}
