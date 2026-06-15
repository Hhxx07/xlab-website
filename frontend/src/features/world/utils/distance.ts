import { townColliders } from '../data/colliders'

export function distance2D(a: [number, number, number], b: [number, number, number]) {
  const dx = a[0] - b[0]
  const dz = a[2] - b[2]
  return Math.sqrt(dx * dx + dz * dz)
}

function clampBoundary(position: [number, number, number]): [number, number, number] {
  return [
    Math.max(-10, Math.min(10, position[0])),
    position[1],
    Math.max(-10, Math.min(10, position[2])),
  ]
}

function isBlocked(position: [number, number, number]) {
  return townColliders.some((collider) => distance2D(position, collider.position) < collider.radius)
}

export function clampTownPosition(
  position: [number, number, number],
  previous?: [number, number, number],
): [number, number, number] {
  const bounded = clampBoundary(position)
  if (!previous || !isBlocked(bounded)) return bounded

  const slideZ = clampBoundary([previous[0], bounded[1], bounded[2]])
  if (!isBlocked(slideZ)) return slideZ

  const slideX = clampBoundary([bounded[0], bounded[1], previous[2]])
  if (!isBlocked(slideX)) return slideX

  return previous
}
