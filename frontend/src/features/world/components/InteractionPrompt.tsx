import type { WorldHotspot } from '../data/hotspots'

export default function InteractionPrompt({ hotspot }: { hotspot: WorldHotspot | null }) {
  if (!hotspot) return null

  return (
    <div className="pointer-events-none fixed bottom-8 left-1/2 z-40 -translate-x-1/2 rounded-md border border-white/20 bg-slate-950/88 px-5 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur">
      {hotspot.interactionText}
    </div>
  )
}
