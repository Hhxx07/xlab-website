import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import WorldCanvas from '../features/world/WorldCanvas'
import InteractionPrompt from '../features/world/components/InteractionPrompt'
import NoteModal from '../features/world/components/NoteModal'
import type { WorldCameraMode } from '../features/world/CameraRig'
import { useKeyboardControls } from '../features/world/controls/useKeyboardControls'
import { useWorldStore } from '../features/world/store/worldStore'

export default function WorldPage() {
  const navigate = useNavigate()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const activeHotspot = useWorldStore((state) => state.activeHotspot)
  const activeNoteSlug = useWorldStore((state) => state.activeNoteSlug)
  const isNoteModalOpen = useWorldStore((state) => state.isNoteModalOpen)
  const isNewsModalOpen = useWorldStore((state) => state.isNewsModalOpen)
  const openNote = useWorldStore((state) => state.openNote)
  const openNews = useWorldStore((state) => state.openNews)
  const closeModal = useWorldStore((state) => state.closeModal)
  const [cameraMode, setCameraMode] = useState<WorldCameraMode>('third')
  const [holdProgress, setHoldProgress] = useState(0)
  const [warping, setWarping] = useState(false)
  const [musicEnabled, setMusicEnabled] = useState(true)

  const openLocalContent = useCallback(() => {
    if (!activeHotspot) return
    if (activeHotspot.type === 'open_news') {
      openNews()
      return
    }
    if (activeHotspot.noteSlug) {
      openNote(activeHotspot.noteSlug)
    }
  }, [activeHotspot, openNews, openNote])

  const enterGaussianWorld = useCallback(() => {
    if (!activeHotspot || activeHotspot.module === 'town') return
    setWarping(true)
    window.setTimeout(() => {
      const pos = useWorldStore.getState().playerPosition
      navigate(`/world/gaussian/${activeHotspot.module}`, {
        state: { returnPosition: pos },
      })
    }, 620)
  }, [activeHotspot, navigate])

  const handleEscape = useCallback(() => {
    if (isNoteModalOpen || isNewsModalOpen) {
      closeModal()
      return
    }
    navigate('/')
  }, [closeModal, isNewsModalOpen, isNoteModalOpen, navigate])

  const controls = useKeyboardControls(openLocalContent, handleEscape, enterGaussianWorld, setHoldProgress)

  useEffect(() => {
    audioRef.current = new Audio('/world/audio/town-theme.mp3')
    audioRef.current.loop = true
    audioRef.current.volume = 0.42
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (musicEnabled) {
      void audio.play().catch(() => {
        // Browser autoplay policies may block playback until the first user gesture.
      })
    } else {
      audio.pause()
    }
  }, [musicEnabled])

  useEffect(() => {
    const handleMusicToggle = (event: KeyboardEvent) => {
      if (event.code === 'KeyM') setMusicEnabled((value) => !value)
    }
    window.addEventListener('keydown', handleMusicToggle)
    return () => window.removeEventListener('keydown', handleMusicToggle)
  }, [])

  useEffect(() => {
    const handleEnter = (event: KeyboardEvent) => {
      if (event.code === 'Enter' && isNoteModalOpen && activeNoteSlug) {
        navigate(`/notes/${activeNoteSlug}`)
      }
    }

    window.addEventListener('keydown', handleEnter)
    return () => window.removeEventListener('keydown', handleEnter)
  }, [activeNoteSlug, isNoteModalOpen, navigate])

  return (
    <div className="fixed inset-0 overflow-hidden bg-sky-100">
      <WorldCanvas controls={controls} cameraMode={cameraMode} />

      <div className="pointer-events-none fixed left-5 top-5 z-30 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">XLab</p>
        <h1 className="mt-1 text-lg font-black text-slate-950">像素小镇</h1>
      </div>

      <Link
        to="/"
        className="fixed right-5 top-5 z-30 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-bold text-slate-950 shadow-sm backdrop-blur transition-colors hover:bg-white"
      >
        返回首页
      </Link>

      <div className="fixed right-5 top-20 z-30 flex overflow-hidden rounded-full border border-white/70 bg-white/85 p-1 shadow-sm backdrop-blur">
        {(['third', 'fixed', 'free'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setCameraMode(mode)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              cameraMode === mode ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-white'
            }`}
          >
            {mode === 'third' ? '第三人称' : mode === 'fixed' ? '固定' : '自由'}
          </button>
        ))}
      </div>

      <div className="fixed bottom-5 left-5 z-30 max-w-xs rounded-2xl border border-white/70 bg-white/85 p-4 text-sm text-slate-700 shadow-sm backdrop-blur">
        <p className="font-black text-slate-950">控制</p>
        <p className="mt-2">WASD / 方向键：移动</p>
        <p>E：短按打开笔记，长按进入高斯世界</p>
        <p>M：音乐 {musicEnabled ? '开' : '关'}</p>
        <p>Esc：关闭窗口 / 返回首页</p>
      </div>

      <button
        type="button"
        onClick={() => setMusicEnabled((value) => !value)}
        className="fixed right-5 bottom-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/88 text-sm font-black text-slate-800 shadow-sm backdrop-blur transition hover:bg-white"
        aria-label="toggle music"
      >
        M
      </button>

      {warping && (
        <div className="pointer-events-none fixed inset-0 z-[70] grid place-items-center bg-[radial-gradient(circle,#fef3c7_0%,rgba(56,189,248,0.42)_38%,rgba(15,23,42,0.72)_100%)] text-sm font-black uppercase tracking-[0.18em] text-white backdrop-blur-md">
          穿梭中
        </div>
      )}

      <InteractionPrompt hotspot={activeHotspot} holdProgress={holdProgress} />
      <NoteModal noteSlug={activeNoteSlug} showNews={isNewsModalOpen} onClose={closeModal} />
    </div>
  )
}
