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

@Injectable({ providedIn: "root" })
export class ForesightService {
  constructor(private readonly zone: NgZone) {}

  register(element: Element, options: ForesightOptions): ForesightRegistration {
    const state = signal<Readonly<ForesightElementState>>(createUnregisteredSnapshot(false))
    let optionsRef = options
    let result: ForesightRegisterResult | null = null
    let unsubscribe: (() => void) | null = null
    let isRegistered = false

    // NgZone only wraps the user-facing boundaries (callback, listener) so
    // zone-based consumer apps run change detection after those fire. Signal
    // writes below need no zone.run: they notify change detection on their own,
    // zonefully or zoneless.
    const callback = (s: ForesightElementState) => this.zone.run(() => optionsRef.callback(s))
    const syncState = () => {
      if (result) {
        state.set(result.getSnapshot())
      }
    }

    result = ForesightManager.instance.register({
      ...optionsRef,
      element,
      callback,
    })
    isRegistered = true
    state.set(result.getSnapshot())
    unsubscribe = result.subscribe(syncState)

    return {
      state: state.asReadonly(),
      update: nextOptions => {
        optionsRef = nextOptions

        if (!isRegistered || !ForesightManager.instance.registeredElements.has(element)) {
          return
        }

        ForesightManager.instance.updateElementOptions(element, {
          ...optionsRef,
          callback,
        })
      },
      unregister: () => {
        if (!isRegistered) {
          return
        }

        unsubscribe?.()
        unsubscribe = null
        result?.unregister()
        result = null
        isRegistered = false
        state.set(createUnregisteredSnapshot(false))
      },
      getSnapshot: () => result?.getSnapshot() ?? createUnregisteredSnapshot(false),
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
