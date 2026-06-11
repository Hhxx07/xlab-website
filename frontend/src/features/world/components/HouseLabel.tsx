import { Html } from '@react-three/drei' // 导入三维世界的html库

export default function HouseLabel({ // 创建类型，同时绑定两个变量；声明两个变量的类型 本质上是一个函数，在react里面当做一个组件使用，生成对应的3d模型
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
