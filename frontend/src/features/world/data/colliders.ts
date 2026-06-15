import { worldModules } from './worldModules'

export type CircleCollider = {
  id: string
  position: [number, number, number]
  radius: number
}

export const decorativeTreePositions: Array<[number, number, number]> = [
  [-10.2, 0, 8.4], [-9.5, 0, 6.2], [-10.4, 0, -7.7], [-7.4, 0, -8.8],
  [10.1, 0, 8.1], [8.5, 0, 6.7], [10.5, 0, -8.0], [7.2, 0, -8.7],
  [-4.8, 0, 9.6], [4.8, 0, 9.5], [-4.9, 0, -9.5], [4.9, 0, -9.4],
]

export const groveTreePositions: Array<[number, number, number]> = [
  [-8.5, 0, 7.5], [-8.2, 0, -6.4], [8.5, 0, 7.2], [8.6, 0, -6.7],
  [-2.6, 0, 8.5], [3.2, 0, -8.5], [-9.2, 0, 0.5], [9.2, 0, 0.8],
]

export const rockPositions: Array<[number, number, number]> = [
  [-9.1, 0, 3.8], [9.0, 0, 4.1], [-8.7, 0, -3.6], [8.8, 0, -3.8],
  [-2.2, 0, 1.2], [2.3, 0, -1.1],
]

export const townColliders: CircleCollider[] = [
  ...worldModules.map((module) => ({
    id: `house-${module.id}`,
    position: module.position,
    radius: module.id === 'life' || module.id === 'novel' ? 1.75 : 1.65,
  })),
  ...decorativeTreePositions.map((position, index) => ({
    id: `tree-decor-${index}`,
    position,
    radius: 0.58,
  })),
  ...groveTreePositions.map((position, index) => ({
    id: `tree-grove-${index}`,
    position,
    radius: 0.58,
  })),
  ...rockPositions.map((position, index) => ({
    id: `rock-${index}`,
    position,
    radius: 0.48,
  })),
]
