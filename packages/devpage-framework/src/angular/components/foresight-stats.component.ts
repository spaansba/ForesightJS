import { ChangeDetectionStrategy, Component, input } from "@angular/core"
import type { ForesightElementState } from "@foresightjs/angular"

/**
 * Presentational readout of a registration's signal state — the Angular twin of
 * the React/Vue `ForesightStats`. Pass the whole immutable `ForesightElementState`
 * (from a directive `#ref="foresight"`, the `<foresight>` component, or a
 * `ForesightService` registration) and it renders the four headline fields.
 */
@Component({
  selector: "app-foresight-stats",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="w-56 font-mono text-[11px] border border-gray-300 divide-y divide-gray-200 bg-white"
    >
      <div class="flex justify-between px-2 py-1">
        <span class="text-gray-500">predicted</span>
        <span class="text-gray-900">{{ state().isPredicted ? "yes" : "no" }}</span>
      </div>
      <div class="flex justify-between px-2 py-1">
        <span class="text-gray-500">hits</span>
        <span class="text-gray-900">{{ state().hitCount }}</span>
      </div>
      <div class="flex justify-between px-2 py-1">
        <span class="text-gray-500">cb running</span>
        <span class="text-gray-900">{{ state().isCallbackRunning ? "yes" : "no" }}</span>
      </div>
      <div class="flex justify-between px-2 py-1">
        <span class="text-gray-500">status</span>
        <span class="text-gray-900">{{ state().status ?? "-" }}</span>
      </div>
    </div>
  `,
})
export class ForesightStatsComponent {
  readonly state = input.required<ForesightElementState>()
}
