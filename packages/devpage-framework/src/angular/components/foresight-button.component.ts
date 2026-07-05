import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core"
import { ForesightDirective, type ForesightOptions } from "@foresightjs/angular"
import { ForesightStatsComponent } from "./foresight-stats.component"
import { injectReactivateAfter } from "../shared/foresight-controls"

/**
 * Angular twin of the React `BaseForesightButton`: a `[fsForesight]` button
 * followed by its `ForesightStats` readout. The shared top-bar `reactivateAfter`
 * is merged in first so a caller's `registerOptions` can still override it.
 */
@Component({
  selector: "app-foresight-button",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ForesightDirective, ForesightStatsComponent],
  template: `
    <button
      type="button"
      [id]="registerOptions().name"
      [fsForesight]="options()"
      #f="foresight"
      [class]="buttonClass()"
    >
      <ng-content>
        <span class="text-center leading-tight">{{ registerOptions().name || "Unnamed" }}</span>
      </ng-content>
    </button>
    <app-foresight-stats [state]="f.state()" />
  `,
})
export class ForesightButtonComponent {
  readonly registerOptions = input.required<ForesightOptions>()
  readonly className = input("")

  private readonly reactivateAfter = injectReactivateAfter()

  protected readonly options = computed<ForesightOptions>(() => ({
    reactivateAfter: this.reactivateAfter(),
    ...this.registerOptions(),
  }))

  protected readonly buttonClass = computed(
    () =>
      `flex items-center justify-center text-slate-900 font-medium text-sm focus:outline-none ${this.className()}`
  )
}
