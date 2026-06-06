export function distance2D(a: [number, number, number], b: [number, number, number]) {
  const dx = a[0] - b[0]
  const dz = a[2] - b[2]
  return Math.sqrt(dx * dx + dz * dz)
}

export function clampTownPosition(position: [number, number, number]): [number, number, number] {
  return [
    Math.max(-10, Math.min(10, position[0])),
    position[1],
    Math.max(-10, Math.min(10, position[2])),
  ]
}
