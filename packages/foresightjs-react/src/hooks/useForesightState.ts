import { useSyncExternalStore } from "react"
import {
  createUnregisteredSnapshot,
  type ForesightElementState,
  type ForesightRegisterResult,
} from "js.foresight"

const NOOP_SUBSCRIBE = () => () => {}
const INITIAL_SNAPSHOT = createUnregisteredSnapshot(false)
const GET_INITIAL_SNAPSHOT = () => INITIAL_SNAPSHOT

export const useForesightState = (
  registerResults: ForesightRegisterResult | null,
  subscribed: boolean
): ForesightElementState =>
  useSyncExternalStore<ForesightElementState>(
    subscribed ? (registerResults?.subscribe ?? NOOP_SUBSCRIBE) : NOOP_SUBSCRIBE,
    () => (subscribed ? (registerResults?.getSnapshot() ?? INITIAL_SNAPSHOT) : INITIAL_SNAPSHOT),
    GET_INITIAL_SNAPSHOT
  )
