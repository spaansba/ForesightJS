import { useSyncExternalStore } from "react"
import {
  createUnregisteredSnapshot,
  type ForesightElementState,
  type ForesightRegisterResult,
} from "js.foresight"

const NOOP_SUBSCRIBE = () => () => {}
const INITIAL_SNAPSHOT = createUnregisteredSnapshot(false)
const GET_INITIAL_SNAPSHOT = () => INITIAL_SNAPSHOT

// Pass null to opt out of state-driven re-renders without breaking hook order.
export const useForesightState = (
  registerResults: ForesightRegisterResult | null
): ForesightElementState =>
  useSyncExternalStore<ForesightElementState>(
    registerResults?.subscribe ?? NOOP_SUBSCRIBE,
    () => registerResults?.getSnapshot() ?? INITIAL_SNAPSHOT,
    GET_INITIAL_SNAPSHOT
  )
