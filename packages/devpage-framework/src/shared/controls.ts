import { ForesightManager } from "js.foresight"

// Framework-agnostic store backing the shared top bar. Both the React and Vue
// demos read `reactivateAfter` from here and listen for resets, so the bar's
// controls drive whichever framework is currently mounted.

type Listener = () => void

let reactivateAfter = 5000
const reactivateListeners = new Set<Listener>()
const resetListeners = new Set<Listener>()

export const getReactivateAfter = () => reactivateAfter

export const setReactivateAfter = (ms: number) => {
  reactivateAfter = ms
  reactivateListeners.forEach(listener => listener())
}

export const subscribeReactivateAfter = (listener: Listener) => {
  reactivateListeners.add(listener)

  return () => {
    reactivateListeners.delete(listener)
  }
}

export const onReset = (listener: Listener) => {
  resetListeners.add(listener)

  return () => {
    resetListeners.delete(listener)
  }
}

export const triggerReset = () => {
  // Reactivate every element the manager tracks — works regardless of framework.
  const manager = ForesightManager.instance
  for (const element of manager.registeredElements.keys()) {
    manager.reactivate(element)
  }

  // Let each framework reset its own local UI state on top of that.
  resetListeners.forEach(listener => listener())
}
