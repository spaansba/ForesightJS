import { Directive, ElementRef, OnDestroy, computed, signal } from "@angular/core"
import { ForesightService, UNREGISTERED_STATE } from "../services/ForesightService"
import type { ForesightOptions, ForesightRegistration, ForesightStateSignal } from "../types"

@Directive()
export abstract class ForesightBase implements OnDestroy {
  private readonly registration = signal<ForesightRegistration | null>(null)

  readonly state: ForesightStateSignal = computed(
    () => this.registration()?.state() ?? UNREGISTERED_STATE
  )

  constructor(
    private readonly elementRef: ElementRef<Element>,
    private readonly foresight: ForesightService
  ) {}

  protected applyOptions(options: ForesightOptions | null): void {
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

    this.registration.set(this.foresight.register(this.elementRef.nativeElement, options))
  }

  ngOnDestroy(): void {
    this.registration()?.unregister()
    this.registration.set(null)
  }
}
