import { Injectable, NgZone, signal } from "@angular/core"
import {
  ForesightManager,
  createUnregisteredSnapshot,
  type ForesightElementState,
  type ForesightEvent,
  type ForesightEventMap,
  type ForesightRegisterResult,
} from "js.foresight"
import type { ForesightOptions, ForesightRegistration } from "../types"

export const UNREGISTERED_STATE: Readonly<ForesightElementState> = createUnregisteredSnapshot(false)

@Injectable({ providedIn: "root" })
export class ForesightService {
  constructor(private readonly zone: NgZone) {}

  register(element: Element, options: ForesightOptions): ForesightRegistration {
    const state = signal<Readonly<ForesightElementState>>(UNREGISTERED_STATE)
    let optionsRef = options

    // NgZone wraps every boundary where the manager calls back into Angular
    // (user callback, state writes). The manager fires from rAF and pointer
    // listeners outside the zone, and Angular 17 does not schedule change
    // detection for signal writes made there (18+ does via the hybrid
    // scheduler). zone.run is a passthrough in zoneless apps.
    const callback = (s: ForesightElementState) => this.zone.run(() => optionsRef.callback(s))
    const setState = (s: Readonly<ForesightElementState>) => this.zone.run(() => state.set(s))

    let result: ForesightRegisterResult | null = ForesightManager.instance.register({
      ...optionsRef,
      element,
      callback,
    })
    setState(result.getSnapshot())
    let unsubscribe: (() => void) | null = result.subscribe(() => {
      if (result) {
        setState(result.getSnapshot())
      }
    })

    return {
      state: state.asReadonly(),
      update: nextOptions => {
        optionsRef = nextOptions

        if (!result || !ForesightManager.instance.registeredElements.has(element)) {
          return
        }

        ForesightManager.instance.updateElementOptions(element, {
          ...optionsRef,
          callback,
        })
      },
      unregister: () => {
        if (!result) {
          return
        }

        unsubscribe?.()
        unsubscribe = null
        result.unregister()
        result = null
        setState(UNREGISTERED_STATE)
      },
      getSnapshot: () => result?.getSnapshot() ?? UNREGISTERED_STATE,
    }
  }

  listen<K extends ForesightEvent>(
    eventType: K,
    listener: (event: ForesightEventMap[K]) => void
  ): () => void {
    if (typeof document === "undefined") {
      return () => {}
    }

    const controller = new AbortController()
    const stableListener = (event: ForesightEventMap[K]) => this.zone.run(() => listener(event))

    ForesightManager.instance.addEventListener(eventType, stableListener, {
      signal: controller.signal,
    })

    return () => controller.abort()
  }
}
