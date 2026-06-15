import type { WorldHotspot } from '../data/hotspots'

export default function InteractionPrompt({
  hotspot,
  holdProgress = 0,
  isNight = false,
}: {
  hotspot: WorldHotspot | null
  holdProgress?: number
  isNight?: boolean
}) {
  if (!hotspot) return null
  const canTeleport = isNight && hotspot.module !== 'town' && hotspot.type !== 'toggle_night'

  return (
    <div className="pointer-events-none fixed bottom-8 left-1/2 z-40 w-[min(92vw,520px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-amber-100/40 bg-slate-950/88 px-5 py-4 text-sm font-semibold text-white shadow-2xl backdrop-blur">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <span>{hotspot.label}</span>
        <span className="text-xs text-amber-100/80">
          {hotspot.type === 'toggle_night'
            ? '短按 E 切换白天 / 夜晚'
            : canTeleport
              ? '短按 E 打开笔记 · 长按 3 秒进入高斯世界'
              : '短按 E 打开笔记 · 夜晚才能长按传送'}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/16">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#fef3c7,#f59e0b)] transition-[width]"
          style={{ width: `${Math.round(holdProgress * 100)}%` }}
        />
      </div>
    </div>
  )
}
