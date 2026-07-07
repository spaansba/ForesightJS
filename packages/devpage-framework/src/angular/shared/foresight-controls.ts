import { DestroyRef, inject, signal, type Signal } from "@angular/core"
import { getReactivateAfter, onReset, subscribeReactivateAfter } from "../../shared/controls"

/**
 * Reactive mirror of the shared top-bar "Reactivate ms" control. Must be called
 * from an injection context (a field initialiser or constructor).
 */
export const injectReactivateAfter = (): Signal<number> => {
  const value = signal(getReactivateAfter())
  const unsubscribe = subscribeReactivateAfter(() => value.set(getReactivateAfter()))
  inject(DestroyRef).onDestroy(unsubscribe)

  return value.asReadonly()
}

/**
 * Bumps every time the shared top-bar "Reset" button is pressed. triggerReset()
 * already reactivates the manager's elements globally; pages read this to also
 * restore their own local UI toggles on top of that.
 */
export const injectResetKey = (): Signal<number> => {
  const key = signal(0)
  const unsubscribe = onReset(() => key.update(value => value + 1))
  inject(DestroyRef).onDestroy(unsubscribe)

  return key.asReadonly()
}

/** Shared throwaway "prefetch" used across the demo to exercise async callbacks. */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const randomDelayCallback = () => sleep(Math.floor(Math.random() * 1000))
