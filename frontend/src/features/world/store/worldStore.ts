import { create } from 'zustand'
import type { WorldHotspot } from '../data/hotspots'
import type { WorldModuleId } from '../data/worldModules'

type SceneId = 'town' | WorldModuleId

type WorldState = {
  playerPosition: [number, number, number]
  currentScene: SceneId
  activeHotspot: WorldHotspot | null
  activeNoteSlug: string | null
  isNoteModalOpen: boolean
  isNewsModalOpen: boolean
  movementEnabled: boolean
  visitedModules: WorldModuleId[]
  setPlayerPosition: (position: [number, number, number]) => void
  setActiveHotspot: (hotspot: WorldHotspot | null) => void
  openNote: (slug: string) => void
  openNews: () => void
  closeModal: () => void
  enterHouse: (module: WorldModuleId, noteSlug?: string) => void
  exitHouse: () => void
}

export const useWorldStore = create<WorldState>((set) => ({
  playerPosition: [0, 0, 0],
  currentScene: 'town',
  activeHotspot: null,
  activeNoteSlug: null,
  isNoteModalOpen: false,
  isNewsModalOpen: false,
  movementEnabled: true,
  visitedModules: [],
  setPlayerPosition: (position) =>
    set((state) => {
      const current = state.playerPosition
      if (
        current[0] === position[0] &&
        current[1] === position[1] &&
        current[2] === position[2]
      ) {
        return state
      }
      return { playerPosition: position }
    }),
  setActiveHotspot: (hotspot) =>
    set((state) => {
      if (state.activeHotspot?.id === hotspot?.id) {
        return state
      }
      return { activeHotspot: hotspot }
    }),
  openNote: (slug) =>
    set({
      activeNoteSlug: slug,
      isNoteModalOpen: true,
      isNewsModalOpen: false,
      movementEnabled: false,
    }),
  openNews: () =>
    set({
      isNewsModalOpen: true,
      isNoteModalOpen: false,
      movementEnabled: false,
    }),
  closeModal: () =>
    set({
      isNoteModalOpen: false,
      isNewsModalOpen: false,
      movementEnabled: true,
    }),
  enterHouse: (module, noteSlug) =>
    set((state) => ({
      currentScene: module,
      activeNoteSlug: noteSlug ?? null,
      isNoteModalOpen: true,
      movementEnabled: false,
      visitedModules: state.visitedModules.includes(module)
        ? state.visitedModules
        : [...state.visitedModules, module],
    })),
  exitHouse: () => set({ currentScene: 'town', movementEnabled: true }),
}))
