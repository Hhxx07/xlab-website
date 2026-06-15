import { useFrame } from '@react-three/fiber'
import type { MutableRefObject } from 'react'
import { useRef } from 'react'
import type { MovementInput } from './utils/isoDirection'
import { hotspots, type WorldHotspot } from './data/hotspots'
import { worldModules } from './data/worldModules'
import { distance2D } from './utils/distance'
import { useWorldStore } from './store/worldStore'

import Ground from './components/Ground'
import Road from './components/Road'
import Sky from './components/Sky'
import PixelTree from './components/PixelTree'
import NewsBoard from './components/NewsBoard'
import Player from './Player'
import CameraRig from './CameraRig'
import type { WorldCameraMode } from './CameraRig'
import Decorations from './components/Decorations'
import InteractionGlow from './components/InteractionGlow'
import HouseSlot from './modules/HouseSlot'

import KnowledgeHouse from './modules/KnowledgeHouse'
import GameHouse from './modules/GameHouse'
import LifeHouse from './modules/LifeHouse'
import MovieHouse from './modules/MovieHouse'
import NovelHouse from './modules/NovelHouse'
import SportHouse from './modules/SportHouse'

import { DEBUG } from '../../config/debug';
import { DEBUG_HOUSES } from '../../config/debug';

const moduleComponents = {
  knowledge: KnowledgeHouse,
  game: GameHouse,
  life: LifeHouse,
  movie: MovieHouse,
  novel: NovelHouse,
  sport: SportHouse,
}

export default function WorldScene({
  controls,
  preview = false,
  cameraMode = 'third',
}: {
  controls: MutableRefObject<MovementInput>
  preview?: boolean
  cameraMode?: WorldCameraMode
}) {
  const setActiveHotspot = useWorldStore((state) => state.setActiveHotspot)
  const activeHotspot = useWorldStore((state) => state.activeHotspot)
  const lastHotspotId = useRef<string | null>(null)

  useFrame(() => {
    if (!DEBUG.useHotspotFrame) return
    if (preview) return

    const playerPosition = useWorldStore.getState().playerPosition

    let nearest: WorldHotspot | null = null
    let nearestDistance = Number.POSITIVE_INFINITY

    for (const hotspot of hotspots) {
      const dist = distance2D(playerPosition, hotspot.position)

      if (dist < hotspot.radius && dist < nearestDistance) {
        nearest = hotspot
        nearestDistance = dist
      }
    }

    const nextHotspotId = nearest?.id ?? null

    if (lastHotspotId.current !== nextHotspotId) {
      lastHotspotId.current = nextHotspotId
      setActiveHotspot(nearest)
    }
  })

  return (
    <>
      <ambientLight intensity={0.62} />
      <hemisphereLight args={['#fff8dc', '#7aa06b', 1.8]} />
      <directionalLight
        position={[8, 11, 5]}
        intensity={2.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <mesh position={[9.5, 10.5, -6]} castShadow>
        <sphereGeometry args={[0.65, 32, 32]} />
        <meshStandardMaterial color="#ffd36b" emissive="#ffb84d" emissiveIntensity={1.2} />
      </mesh>

      {DEBUG.sky && <Sky />}
      {DEBUG.ground && <Ground />}
      {DEBUG.road && <Road />}
      {DEBUG.newsBoard && <NewsBoard />}
      <Decorations />
      <InteractionGlow hotspot={activeHotspot} />

      {DEBUG.houses &&
        worldModules.map((module) => {
          const House = moduleComponents[module.id as keyof typeof moduleComponents]

          if (!House) {
            console.warn('[WorldScene] 未找到对应房子组件:', module.id)
            return null
          }

          const shouldShow =
            DEBUG_HOUSES[module.id as keyof typeof DEBUG_HOUSES]

          if (!shouldShow) return null

          return <HouseSlot key={module.id} position={module.position} modelUrl={module.modelUrl} Fallback={House} />
    })}

      {DEBUG.trees &&
        [
          [-8.5, 0, 7.5],
          [-8.2, 0, -6.4],
          [8.5, 0, 7.2],
          [8.6, 0, -6.7],
          [-2.6, 0, 8.5],
          [3.2, 0, -8.5],
          [-9.2, 0, 0.5],
          [9.2, 0, 0.8],
        ].map((position, index) => (
          <PixelTree key={index} position={position as [number, number, number]} />
        ))}

      {DEBUG.player && !preview && <Player controls={controls} />}
      {cameraMode !== 'free' && <CameraRig mode={cameraMode} />}
    </>
  )
}
