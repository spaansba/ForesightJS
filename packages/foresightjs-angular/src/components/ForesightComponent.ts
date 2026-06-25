import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  computed,
  signal,
} from "@angular/core"
import {
  createUnregisteredSnapshot,
  type ForesightCallback,
  type ForesightElementState,
  type HitSlop,
} from "js.foresight"
import { ForesightService } from "../services/ForesightService"
import type { ForesightRegistration } from "../types"
import { resolveOptions } from "../utils/resolveOptions"

@Component({
  selector: "foresight",
  standalone: true,
  template: "<ng-content />",
})
export class ForesightComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) callback!: ForesightCallback
  @Input() foresightName?: string
  @Input() hitSlop?: HitSlop
  @Input() meta?: Record<string, unknown>
  @Input() reactivateAfter?: number
  @Input() enabled?: boolean

  private readonly fallbackState = signal<Readonly<ForesightElementState>>(
    createUnregisteredSnapshot(false)
  )
  private readonly registration = signal<ForesightRegistration | null>(null)

  readonly state = computed(() => this.registration()?.state() ?? this.fallbackState())

  constructor(
    private readonly elementRef: ElementRef<HTMLElement>,
    private readonly foresight: ForesightService
  ) {}

  ngOnChanges(): void {
    const options = resolveOptions({
      value: this.callback,
      name: this.foresightName,
      hitSlop: this.hitSlop,
      meta: this.meta,
      reactivateAfter: this.reactivateAfter,
      enabled: this.enabled,
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
