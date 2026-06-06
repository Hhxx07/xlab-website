import { useFrame } from '@react-three/fiber'
import type { MutableRefObject } from 'react'
import type { MovementInput } from './utils/isoDirection'
import { hotspots } from './data/hotspots'
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
import KnowledgeHouse from './modules/KnowledgeHouse'
import GameHouse from './modules/GameHouse'
import LifeHouse from './modules/LifeHouse'
import MovieHouse from './modules/MovieHouse'
import NovelHouse from './modules/NovelHouse'
import SportHouse from './modules/SportHouse'

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
}: {
  controls: MutableRefObject<MovementInput>
  preview?: boolean
}) {
  const playerPosition = useWorldStore((state) => state.playerPosition)
  const setActiveHotspot = useWorldStore((state) => state.setActiveHotspot)

  useFrame(() => {
    if (preview) return
    let nearest = null
    let nearestDistance = Number.POSITIVE_INFINITY

    hotspots.forEach((hotspot) => {
      const dist = distance2D(playerPosition, hotspot.position)
      if (dist < hotspot.radius && dist < nearestDistance) {
        nearest = hotspot
        nearestDistance = dist
      }
    })

    setActiveHotspot(nearest)
  })

  return (
    <>
      <Sky />
      <Ground />
      <Road />
      <NewsBoard />
      {worldModules.map((module) => {
        const House = moduleComponents[module.id]
        return <House key={module.id} position={module.position} />
      })}
      {[
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
      {!preview && <Player controls={controls} />}
      <CameraRig />
    </>
  )
}
