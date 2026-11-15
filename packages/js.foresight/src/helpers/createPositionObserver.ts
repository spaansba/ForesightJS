export type PositionEntry = {
  target: Element
  boundingClientRect: DOMRect
  isIntersecting: boolean
}

export type PositionObserver = {
  observe: (element: Element) => void
  unobserve: (element: Element) => void
  disconnect: () => void
}

type Box = { top: number; left: number; width: number; height: number }

const THRESHOLD = Array.from({ length: 1001 }, (_, i) => i / 1000)

const sameRect = (a: DOMRectReadOnly, b: DOMRectReadOnly) =>
  a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height

const hasArea = (box: Box) => box.width > 0 && box.height > 0

const getViewport = (): Box => ({
  top: 0,
  left: 0,
  width: window.visualViewport?.width ?? window.innerWidth,
  height: window.visualViewport?.height ?? window.innerHeight,
})

const toRootMargin = (visible: Box, viewport: Box) => {
  const width = Math.max(visible.width, 3)
  const height = Math.max(visible.height, 3)
  const top = visible.top + 1
  const left = visible.left + 1
  const right = viewport.width - visible.left - width + 1
  const bottom = viewport.height - visible.top - height + 1

  return [top, right, bottom, left].map(side => `${-Math.round(side)}px`).join(" ")
}

export const createPositionObserver = (
  callback: (entries: PositionEntry[]) => void
): PositionObserver => {
  const positionObservers = new Map<Element, IntersectionObserver>()
  const visibilityEntries = new WeakMap<Element, IntersectionObserverEntry>()
  const lastEntries = new WeakMap<Element, PositionEntry>()
  const abortController = new AbortController()
  let viewport = getViewport()

  const notify = (entries: PositionEntry[]) => {
    const changed = entries.filter(entry => {
      const last = lastEntries.get(entry.target)
      if (
        last &&
        last.isIntersecting === entry.isIntersecting &&
        sameRect(last.boundingClientRect, entry.boundingClientRect)
      ) {
        return false
      }

      lastEntries.set(entry.target, entry)

      return true
    })

    if (changed.length > 0) {
      callback(changed)
    }
  }

  const getVisibleBox = (element: Element, rect: DOMRect): Box => {
    const visibility = visibilityEntries.get(element)
    if (!visibility) {
      return rect
    }

    const { boundingClientRect: bounds, intersectionRect: clip } = visibility
    const left = rect.left + clip.left - bounds.left
    const top = rect.top + clip.top - bounds.top

    return {
      left,
      top,
      width: rect.right - (bounds.right - clip.right) - left,
      height: rect.bottom - (bounds.bottom - clip.bottom) - top,
    }
  }

  const intersectsViewport = (rect: DOMRect) =>
    Math.min(rect.right, viewport.width) > Math.max(rect.left, 0) &&
    Math.min(rect.bottom, viewport.height) > Math.max(rect.top, 0)

  const untrack = (element: Element) => {
    positionObservers.get(element)?.disconnect()
    positionObservers.delete(element)
  }

  const track = (element: Element, rect: DOMRect): Box => {
    untrack(element)

    const visible = getVisibleBox(element, rect)
    let current = rect
    let ratio: number | undefined

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[entries.length - 1]
        if (!entry) {
          return
        }

        const next = entry.boundingClientRect
        const moved = !sameRect(next, current)
        if (!moved && entry.intersectionRatio === ratio) {
          return
        }

        const isFirst = ratio === undefined
        current = next
        if (!intersectsViewport(next)) {
          return
        }

        ratio = entry.intersectionRatio
        if (isFirst && !moved) {
          return
        }

        notify([{ target: element, boundingClientRect: next, isIntersecting: true }])
        track(element, next)
      },
      { rootMargin: toRootMargin(visible, viewport), threshold: THRESHOLD }
    )

    observer.observe(element)
    positionObservers.set(element, observer)

    return visible
  }

  const resizeObserver = new ResizeObserver(entries => {
    const changed: PositionEntry[] = []
    for (const { target, borderBoxSize } of entries) {
      const size = borderBoxSize[0]
      const last = lastEntries.get(target)?.boundingClientRect
      if (
        last &&
        size &&
        Math.round(last.width) === Math.round(size.inlineSize) &&
        Math.round(last.height) === Math.round(size.blockSize)
      ) {
        continue
      }

      const rect = target.getBoundingClientRect()
      track(target, rect)
      changed.push({
        target,
        boundingClientRect: rect,
        isIntersecting: visibilityEntries.get(target)?.isIntersecting ?? false,
      })
    }
    notify(changed)
  })

  const visibilityObserver = new IntersectionObserver(
    entries => {
      const changed: PositionEntry[] = []
      for (const entry of entries) {
        const { target, isIntersecting, boundingClientRect, intersectionRect } = entry
        const previous = visibilityEntries.get(target)
        visibilityEntries.set(target, entry)
        if (
          previous &&
          previous.isIntersecting === isIntersecting &&
          sameRect(previous.intersectionRect, intersectionRect)
        ) {
          continue
        }

        if (isIntersecting) {
          track(target, boundingClientRect)
          resizeObserver.observe(target)
        } else {
          untrack(target)
          resizeObserver.unobserve(target)
        }

        changed.push({ target, boundingClientRect, isIntersecting })
      }
      notify(changed)
    },
    { threshold: THRESHOLD }
  )

  const handleViewportResize = () => {
    const next = getViewport()
    if (next.width === viewport.width && next.height === viewport.height) {
      return
    }

    viewport = next
    const changed: PositionEntry[] = []
    for (const element of [...positionObservers.keys()]) {
      const rect = element.getBoundingClientRect()
      changed.push({
        target: element,
        boundingClientRect: rect,
        isIntersecting: hasArea(track(element, rect)),
      })
    }
    notify(changed)
  }

  ;(window.visualViewport ?? window).addEventListener("resize", handleViewportResize, {
    signal: abortController.signal,
  })

  return {
    observe: element => visibilityObserver.observe(element),
    unobserve: element => {
      untrack(element)
      visibilityObserver.unobserve(element)
      resizeObserver.unobserve(element)
      visibilityEntries.delete(element)
      lastEntries.delete(element)
    },
    disconnect: () => {
      positionObservers.forEach(observer => observer.disconnect())
      positionObservers.clear()
      visibilityObserver.disconnect()
      resizeObserver.disconnect()
      abortController.abort()
    },
  }
}
