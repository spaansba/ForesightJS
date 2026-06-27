import { Directive, ElementRef, Input, OnChanges, OnDestroy, computed, signal } from "@angular/core"
import { createUnregisteredSnapshot, type ForesightElementState, type HitSlop } from "js.foresight"
import { ForesightService } from "../services/ForesightService"
import type { ForesightDirectiveValue, ForesightRegistration } from "../types"
import { resolveOptions } from "../utils/resolveOptions"

type ForesightDirectiveElement = HTMLElement | SVGElement

@Directive({
  selector: "[fsForesight]",
  standalone: true,
  exportAs: "foresight",
})
export class ForesightDirective implements OnChanges, OnDestroy {
  @Input("fsForesight") fsForesight: ForesightDirectiveValue = null
  @Input() fsForesightName?: string
  @Input() fsForesightHitSlop?: HitSlop
  @Input() fsForesightMeta?: Record<string, unknown>
  @Input() fsForesightReactivateAfter?: number
  @Input() fsForesightEnabled?: boolean

  private readonly fallbackState = signal<Readonly<ForesightElementState>>(
    createUnregisteredSnapshot(false)
  )
  private readonly registration = signal<ForesightRegistration | null>(null)

  readonly state = computed(() => this.registration()?.state() ?? this.fallbackState())

  constructor(
    private readonly elementRef: ElementRef<ForesightDirectiveElement>,
    private readonly foresight: ForesightService
  ) {}

  ngOnChanges(): void {
    const options = resolveOptions({
      value: this.fsForesight,
      name: this.fsForesightName,
      hitSlop: this.fsForesightHitSlop,
      meta: this.fsForesightMeta,
      reactivateAfter: this.fsForesightReactivateAfter,
      enabled: this.fsForesightEnabled,
    })

    const registration = this.registration()
    if (!options) {
      registration?.unregister()
      this.registration.set(null)

      return
    }

    if (registration) {
      registration.update(options)

      return
    }

    const nextRegistration = this.foresight.register(this.elementRef.nativeElement, options)
    this.registration.set(nextRegistration)
  }

  ngOnDestroy(): void {
    this.registration()?.unregister()
    this.registration.set(null)
  }
}
