"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ForesightManager,
  type ForesightElementState,
  type ForesightRegisterResult,
} from "js.foresight"
import type { ForesightOptions } from "../types"
import { serializeOption } from "./serializeOption"

// Registers and patches without subscribing to per-element state, for consumers that never read the state
export const useForesightRegistration = <T extends HTMLElement = HTMLElement>(
  options: ForesightOptions
): {
  element: T | null
  elementRef: (node: T | null) => void
  registerResults: ForesightRegisterResult | null
} => {
  const optionsRef = useRef(options)
  optionsRef.current = options

  const [element, setElement] = useState<T | null>(null)
  const [registerResults, setRegisterResults] = useState<ForesightRegisterResult | null>(null)

  const elementRef = useCallback((node: T | null) => {
    setElement(node)
  }, [])

  // Register/unregister when the DOM node attaches or swaps.
  useEffect(() => {
    if (!element) {
      return
    }

    const result = ForesightManager.instance.register({
      ...optionsRef.current,
      element,
      callback: (state: ForesightElementState) => optionsRef.current.callback(state),
    })
    setRegisterResults(result)

    return () => {
      result.unregister()
      setRegisterResults(null)
    }
  }, [element])

  // Patch options on the existing registration without tearing it down.
  // meta and hitSlop are compared by content, not identity - an inline
  // `meta={{...}}` object would otherwise re-fire this effect every render and
  // loop with the useSyncExternalStore re-render it triggers.
  const metaKey = serializeOption(options.meta)
  const hitSlopKey = serializeOption(options.hitSlop)
  useEffect(() => {
    if (
      !registerResults ||
      !element ||
      !ForesightManager.instance.registeredElements.has(element)
    ) {
      return
    }

    ForesightManager.instance.updateElementOptions(element, {
      ...optionsRef.current,
      callback: (state: ForesightElementState) => optionsRef.current.callback(state),
    })
  }, [
    options.reactivateAfter,
    options.name,
    metaKey,
    options.enabled,
    hitSlopKey,
    element,
    registerResults,
  ])

  return { element, elementRef, registerResults }
}
