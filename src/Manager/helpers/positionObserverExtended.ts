import type { PositionObserverEntry, PositionObserverOptions } from "@thednp/position-observer"
import PositionObserver from "@thednp/position-observer"

export type PositionObserverExtendedEntry = PositionObserverEntry & {
  isIntersecting: boolean
}

export type PositionObserverExtendedCallback = (
  entries: PositionObserverExtendedEntry[],
  observer: PositionObserverExtended
) => void

/**
 * The PositionObserverExtended class extends the base PositionObserver
 * to include intersection status in its observation logic. It triggers
 * the callback not only when an element's position changes but also when
 * it enters or leaves the viewport.
 */
export default class PositionObserverExtended extends PositionObserver {
  public entries: Map<Element, PositionObserverExtendedEntry>
  protected _callback: PositionObserverExtendedCallback

  constructor(
    callback: PositionObserverExtendedCallback,
    options?: Partial<PositionObserverOptions>
  ) {
    super(callback as any, options)
    this.entries = new Map()
    this._callback = callback
  }

  public observe = (target: Element) => {
    if (!this._root.contains(target)) return
    this._new(target).then(({ boundingClientRect, isIntersecting }: IntersectionObserverEntry) => {
      if (boundingClientRect && !this.getEntry(target)) {
        const { clientWidth, clientHeight } = this._root
        this.entries.set(target, {
          target,
          boundingClientRect,
          clientWidth: 0,
          clientHeight,
          isIntersecting,
        })
        console.log(isIntersecting)
      }
      if (!this._tick) this._tick = requestAnimationFrame(this._runCallback)
    })
  }

  protected _runCallback = () => {
    if (!this.entries.size) {
      this._tick = 0

      return
    }

    const { clientWidth, clientHeight } = this._root

    const queue = new Promise<PositionObserverExtendedEntry[]>((resolve) => {
      const updates: PositionObserverExtendedEntry[] = []
      this.entries.forEach(
        ({
          target,
          boundingClientRect: oldBoundingBox,
          clientWidth: oldWidth,
          clientHeight: oldHeight,
          isIntersecting: oldIsIntersecting,
        }) => {
          if (!this._root.contains(target)) return

          this._new(target).then(
            ({ boundingClientRect, isIntersecting }: IntersectionObserverEntry) => {
              if (!isIntersecting) {
                if (oldIsIntersecting) {
                  const exitEntry: PositionObserverExtendedEntry = {
                    target,
                    boundingClientRect,
                    clientHeight,
                    clientWidth,
                    isIntersecting,
                  }
                  this.entries.set(target, exitEntry)
                  updates.push(exitEntry)
                }
                return
              }
              const { left, top } = boundingClientRect

              if (
                oldBoundingBox.top !== top ||
                oldBoundingBox.left !== left ||
                oldWidth !== clientWidth ||
                oldHeight !== clientHeight
              ) {
                const newEntry: PositionObserverExtendedEntry = {
                  target,
                  boundingClientRect,
                  clientHeight,
                  clientWidth,
                  isIntersecting,
                }
                this.entries.set(target, newEntry)
                updates.push(newEntry)
              }
            }
          )
        }
      )

      resolve(updates)
    })

    this._tick = requestAnimationFrame(async () => {
      const updates = await queue
      if (updates.length) this._callback(updates, this)
      this._runCallback()
    })
  }
}
