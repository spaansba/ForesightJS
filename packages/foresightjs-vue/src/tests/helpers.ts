import { nextTick } from "vue"
import { createUnregisteredSnapshot, type ForesightElementState } from "js.foresight"
import { mockState } from "./setup"

// Pushes a new snapshot through the mocked manager and notifies every
// subscriber, like the real manager does on a state change.
export const emitSnapshot = async (partial: Partial<ForesightElementState>) => {
  mockState.currentSnapshot = { ...createUnregisteredSnapshot(false), ...partial }
  mockState.listeners.forEach(l => l())
  await nextTick()
}
