import { Directive, Input, OnChanges } from "@angular/core"
import type { ForesightMeta, HitSlop } from "js.foresight"
import type { ForesightDirectiveValue } from "../types"
import { resolveOptions } from "../utils/resolveOptions"
import { ForesightBase } from "./ForesightBase"

@Directive({
  selector: "[fsForesight]",
  standalone: true,
  exportAs: "foresight",
})
export class ForesightDirective extends ForesightBase implements OnChanges {
  @Input("fsForesight") fsForesight: ForesightDirectiveValue = null
  @Input() fsForesightName?: string
  @Input() fsForesightHitSlop?: HitSlop
  @Input() fsForesightMeta?: ForesightMeta
  @Input() fsForesightReactivateAfter?: number
  @Input() fsForesightEnabled?: boolean

  ngOnChanges(): void {
    this.applyOptions(
      resolveOptions({
        value: this.fsForesight,
        name: this.fsForesightName,
        hitSlop: this.fsForesightHitSlop,
        meta: this.fsForesightMeta,
        reactivateAfter: this.fsForesightReactivateAfter,
        enabled: this.fsForesightEnabled,
      })
    )
  }
}
