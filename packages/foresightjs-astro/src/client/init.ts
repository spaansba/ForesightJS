import { ForesightManager } from "js.foresight"
import { prefetch } from "astro:prefetch"
import type { ForesightClientOptions } from "../types"
import { optionsForAnchor, shouldRegister } from "./attributes"

let initialized = false

export const initForesight = (options: ForesightClientOptions = {}): void => {
  if (initialized || typeof document === "undefined") {
    return
  }

  initialized = true

  const manager = ForesightManager.initialize(options.manager)

  const anchors = new Set<HTMLAnchorElement>()

  const syncLinks = () => {
    // The manager parks disconnected elements waiting for a reconnect, but
    // view transitions swap the whole document, so anchors from the previous
    // page never come back. Drop them instead of letting them pile up.
    for (const anchor of anchors) {
      if (!anchor.isConnected) {
        manager.unregister(anchor)
        anchors.delete(anchor)
      }
    }

    for (const anchor of document.querySelectorAll<HTMLAnchorElement>("a[href]")) {
      if (
        manager.registeredElements.has(anchor) ||
        anchor.origin !== location.origin ||
        !shouldRegister(anchor, options)
      ) {
        continue
      }

      manager.register({
        element: anchor,
        callback: () => prefetch(anchor.href),
        ...optionsForAnchor(anchor, options),
      })
      anchors.add(anchor)
    }
  }

  syncLinks()
  document.addEventListener("astro:page-load", syncLinks)

  let scheduled = false

  const observer = new MutationObserver(() => {
    if (scheduled) {
      return
    }

    scheduled = true
    queueMicrotask(() => {
      scheduled = false
      syncLinks()
    })
  })

  observer.observe(document.documentElement, { childList: true, subtree: true })
}
