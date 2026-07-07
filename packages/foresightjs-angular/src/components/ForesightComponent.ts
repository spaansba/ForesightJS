import { Component, Input, OnChanges } from "@angular/core"
import type { ForesightCallback, HitSlop } from "js.foresight"
import { ForesightBase } from "../directives/ForesightBase"
import { resolveOptions } from "../utils/resolveOptions"

@Component({
  selector: "foresight",
  standalone: true,
  template: "<ng-content />",
})
export class ForesightComponent extends ForesightBase implements OnChanges {
  @Input({ required: true }) callback!: ForesightCallback
  @Input() foresightName?: string
  @Input() hitSlop?: HitSlop
  @Input() meta?: Record<string, unknown>
  @Input() reactivateAfter?: number
  @Input() enabled?: boolean

  ngOnChanges(): void {
    this.applyOptions(
      resolveOptions({
        value: this.callback,
        name: this.foresightName,
        hitSlop: this.hitSlop,
        meta: this.meta,
        reactivateAfter: this.reactivateAfter,
        enabled: this.enabled,
      })
    )
  }
}
