"use client"

import { useEffect, useRef } from "react"
import { ForesightManager, type ForesightEvent, type ForesightEventMap } from "js.foresight"

export const useForesightEvent = <K extends ForesightEvent>(
  eventType: K,
  listener: (event: ForesightEventMap[K]) => void
): void => {
  const listenerRef = useRef(listener)
  listenerRef.current = listener

  useEffect(() => {
    const controller = new AbortController()
    const stableListener = (event: ForesightEventMap[K]) => listenerRef.current(event)

    ForesightManager.instance.addEventListener(eventType, stableListener, {
      signal: controller.signal,
    })

    return () => controller.abort()
  }, [eventType])
}
