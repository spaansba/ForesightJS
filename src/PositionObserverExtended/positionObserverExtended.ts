import PositionObserver, {
  type PositionObserverCallback,
  type PositionObserverOptions,
} from "@thednp/position-observer"

/**
 * The PositionObserverExtended class extends the base PositionObserver
 * to include intersection status in its observation logic. It triggers
 * the callback not only when an element's position changes but also when
 * it enters or leaves the viewport.
 */
export default class PositionObserverExtended extends PositionObserver {
  constructor(callback: PositionObserverCallback, options?: Partial<PositionObserverOptions>) {
    super(callback, options)
    this._w = 0
  }
  protected _rc = () => {
    /* istanbul ignore if @preserve - a guard must be set */
    if (!this.entries.size) {
      this._t = 0
      return
    }
    const { clientWidth, clientHeight } = this._r

    const queue = new Promise<IntersectionObserverEntry[]>((resolve) => {
      const updates: IntersectionObserverEntry[] = []
      this.entries.forEach(
        ({ target, boundingClientRect: oldBoundingBox, isIntersecting: oldIsIntersecting }) => {
          /* istanbul ignore if @preserve - a guard must be set when target has been removed */
          if (!this._r.contains(target)) return

          this._n(target).then((ioEntry) => {
            /* istanbul ignore if @preserve - make sure to only count visible entries */
            if (!ioEntry.isIntersecting) {
              if (this._cm === 1) {
                // 1 = "intersecting"
                return
              } else if (this._cm === 2) {
                // 2 = "update"
                if (oldIsIntersecting) {
                  this.entries.set(target, ioEntry)
                  updates.push(ioEntry)
                }
                return
              }
            }
            // 0 = "all"
            const { left, top } = ioEntry.boundingClientRect

            /* istanbul ignore else @preserve - only schedule entries that changed position */
            if (
              oldBoundingBox.top !== top ||
              oldBoundingBox.left !== left ||
              this._w !== clientWidth ||
              this._h !== clientHeight
            ) {
              this.entries.set(target, ioEntry)
              updates.push(ioEntry)
            }
          })
        }
      )
      // update root client width & height
      this._w = clientWidth
      this._h = clientHeight

      resolve(updates)
    })

    this._t = requestAnimationFrame(async () => {
      // execute the queue
      const updates: IntersectionObserverEntry[] = await queue

      // only execute the callback if position actually changed
      /* istanbul ignore else @preserve */
      if (updates.length) this._c(updates, this)

      this._rc()
    })
  }
}
