import { useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import WorldCanvas from '../features/world/WorldCanvas'
import InteractionPrompt from '../features/world/components/InteractionPrompt'
import NoteModal from '../features/world/components/NoteModal'
import { useKeyboardControls } from '../features/world/controls/useKeyboardControls'
import { useWorldStore } from '../features/world/store/worldStore'

export default function WorldPage() {
  const navigate = useNavigate()
  const activeHotspot = useWorldStore((state) => state.activeHotspot)
  const activeNoteSlug = useWorldStore((state) => state.activeNoteSlug)
  const isNoteModalOpen = useWorldStore((state) => state.isNoteModalOpen)
  const isNewsModalOpen = useWorldStore((state) => state.isNewsModalOpen)
  const openNote = useWorldStore((state) => state.openNote)
  const openNews = useWorldStore((state) => state.openNews)
  const closeModal = useWorldStore((state) => state.closeModal)

  const handleAction = useCallback(() => {
    if (!activeHotspot) return

    if (activeHotspot.type === 'open_news') {
      openNews()
      return
    }

    if (activeHotspot.type === 'open_note' && activeHotspot.noteSlug) {
      openNote(activeHotspot.noteSlug)
      return
    }

    if (activeHotspot.type === 'enter_house' && activeHotspot.module !== 'town') {
      const pos = useWorldStore.getState().playerPosition
      navigate(`/world/gaussian/${activeHotspot.module}`, {
        state: { returnPosition: pos },
      })
    }
  }, [activeHotspot, navigate, openNews, openNote])

  const handleEscape = useCallback(() => {
    if (isNoteModalOpen || isNewsModalOpen) {
      closeModal()
      return
    }
    navigate('/')
  }, [closeModal, isNewsModalOpen, isNoteModalOpen, navigate])

  const controls = useKeyboardControls(handleAction, handleEscape)

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
      <WorldCanvas controls={controls} />

      <div className="pointer-events-none fixed left-5 top-5 z-30 rounded-md border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
          XLab
        </p>
        <h1 className="mt-1 text-lg font-semibold text-slate-950">像素小镇</h1>
      </div>

      <Link
        to="/"
        className="fixed right-5 top-5 z-30 rounded-md border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm backdrop-blur transition-colors hover:bg-white"
      >
        返回首页
      </Link>

      <div className="fixed bottom-5 left-5 z-30 max-w-xs rounded-md border border-white/70 bg-white/85 p-4 text-sm text-slate-700 shadow-sm backdrop-blur">
        <p className="font-semibold text-slate-950">控制</p>
        <p className="mt-2">WASD / 方向键：移动</p>
        <p>E：交互</p>
        <p>Esc：关闭窗口 / 返回首页</p>
      </div>

      <InteractionPrompt hotspot={activeHotspot} />
      <NoteModal
        noteSlug={activeNoteSlug}
        showNews={isNewsModalOpen}
        onClose={closeModal}
      />
    </div>
  )
}
