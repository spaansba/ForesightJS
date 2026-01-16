import { create } from "zustand"

type ButtonStateActions = {
  toggleVisibility: () => void
  toggleResized: () => void
  toggleRemoved: () => void
  resetAll: () => void
}

type ButtonStateStore = {
  isVisible: boolean
  isResized: boolean
  isRemoved: boolean
  resetKey: number
  actions: ButtonStateActions
}

const useButtonStateStore = create<ButtonStateStore>(set => ({
  name: "button-state-store",
  isVisible: true,
  isRemoved: false,
  isResized: true,
  resetKey: 0,
  actions: {
    toggleVisibility: () => set(state => ({ isVisible: !state.isVisible })),
    toggleResized: () => set(state => ({ isResized: !state.isResized })),
    toggleRemoved: () => set(state => ({ isRemoved: !state.isRemoved })),
    resetAll: () =>
      set(state => ({
        isVisible: true,
        isRemoved: false,
        isResized: true,
        resetKey: state.resetKey + 1,
      })),
  },
}))

export const useIsVisible = () => useButtonStateStore(state => state.isVisible)
export const useIsResized = () => useButtonStateStore(state => state.isResized)
export const useIsRemoved = () => useButtonStateStore(state => state.isRemoved)
export const useResetKey = () => useButtonStateStore(state => state.resetKey)
export const useButtonActions = () => useButtonStateStore(state => state.actions)
