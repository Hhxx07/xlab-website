import { Html } from '@react-three/drei'

export default function HouseLabel({
  position,
  label,
}: {
  position: [number, number, number]
  label: string
}) {
  return (
    <Html position={position} center distanceFactor={9}>
      <div className="pointer-events-none rounded-md border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm backdrop-blur">
        {label}
      </div>
    </Html>
  )
}
