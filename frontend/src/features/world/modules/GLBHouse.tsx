import { Clone, useGLTF } from '@react-three/drei'
import { useEffect } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'

type GLBHouseProps = ThreeElements['group'] & {
  url: string
  modelScale?: number
}

export default function GLBHouse({ url, modelScale = 1, ...props }: GLBHouseProps) {
  const gltf = useGLTF(url)

  useEffect(() => {
    gltf.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
  }, [gltf.scene])

  return (
    <group {...props} scale={modelScale}>
      <Clone object={gltf.scene} />
    </group>
  )
}
