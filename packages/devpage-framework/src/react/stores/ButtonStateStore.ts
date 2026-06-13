import { create } from "zustand"
import { getReactivateAfter, onReset, subscribeReactivateAfter } from "../../shared/controls"

type ButtonStateActions = {
  toggleVisibility: () => void
  toggleResized: () => void
  toggleRemoved: () => void
}

type ButtonStateStore = {
  isVisible: boolean
  isResized: boolean
  isRemoved: boolean
  reactivateAfter: number
  resetKey: number
  actions: ButtonStateActions
}

const useButtonStateStore = create<ButtonStateStore>(set => ({
  name: "button-state-store",
  isVisible: true,
  isRemoved: false,
  isResized: true,
  // `reactivateAfter` is owned by the shared top bar; mirror it here.
  reactivateAfter: getReactivateAfter(),
  resetKey: 0,
  actions: {
    toggleVisibility: () => set(state => ({ isVisible: !state.isVisible })),
    toggleResized: () => set(state => ({ isResized: !state.isResized })),
    toggleRemoved: () => set(state => ({ isRemoved: !state.isRemoved })),
  },
}))

// Bridge the shared top-bar controls into this store.
subscribeReactivateAfter(() => {
  useButtonStateStore.setState({ reactivateAfter: getReactivateAfter() })
})

// The element reactivation happens globally in triggerReset(); here we only
// restore this demo's local UI toggles.
onReset(() => {
  useButtonStateStore.setState(state => ({
    isVisible: true,
    isRemoved: false,
    isResized: true,
    resetKey: state.resetKey + 1,
  }))
})

export const useIsVisible = () => useButtonStateStore(state => state.isVisible)
export const useIsResized = () => useButtonStateStore(state => state.isResized)
export const useIsRemoved = () => useButtonStateStore(state => state.isRemoved)
export const useReactivateAfter = () => useButtonStateStore(state => state.reactivateAfter)
export const useResetKey = () => useButtonStateStore(state => state.resetKey)
export const useButtonActions = () => useButtonStateStore(state => state.actions)
