import { Canvas } from '@react-three/fiber'
import { OrthographicCamera, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import type { MutableRefObject } from 'react'
import type { MovementInput } from './utils/isoDirection'
import WorldScene from './WorldScene'

import { FREE_CAMERA } from '../../config/debug';

// 调试模式改成自由相机

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
        powerPreference: 'default',
      }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <color attach="background" args={['#bae6fd']} />

      {FREE_CAMERA ? ( 
        <>
          <PerspectiveCamera
            makeDefault
            position={[6, 6, 8]}
            fov={50}
            near={0.1}
            far={1000}
          />

          <OrbitControls
            makeDefault
            target={[0, 0, 0]}
            enableDamping
            dampingFactor={0.08}
            enablePan
            enableZoom
            enableRotate
          />
        </>
      ) : (
        <OrthographicCamera
          makeDefault
          position={[8, 8, 8]}
          zoom={preview ? 38 : 48}
          near={0.1}
          far={100}
          onUpdate={(self) => self.lookAt(0, 0, 0)}
        />
      )}

      <WorldScene controls={controls} preview={preview} />
    </Canvas>
  )
}