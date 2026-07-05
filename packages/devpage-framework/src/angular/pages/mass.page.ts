import { ChangeDetectionStrategy, Component, computed, signal } from "@angular/core"
import { ForesightDirective } from "@foresightjs/angular"

/**
 * Stress test: register N elements at once through the directive and confirm the
 * manager stays responsive. Each button highlights when predicted; "Reset test"
 * bumps the @for track key so every button is destroyed and re-registered fresh.
 */
@Component({
  selector: "app-mass-page",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ForesightDirective],
  template: `
    <main class="max-w-6xl mx-auto px-6 py-8">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold mb-1">Mass performance test</h1>
          <p class="text-sm text-gray-600">
            {{ buttonCount().toLocaleString() }} registered elements. Hover to trigger callbacks.
          </p>
        </div>
        <div class="flex items-center gap-4 text-sm">
          <span class="text-xs text-gray-700 font-mono">{{ hitCount() }} hits</span>
          <label class="flex items-center gap-2 text-xs text-gray-700">
            Count
            <input
              type="number"
              [value]="buttonCount()"
              (input)="updateCount($event)"
              min="1"
              max="10000"
              class="w-20 px-2 py-1 text-xs border border-gray-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </label>
          <button
            type="button"
            class="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
            (click)="resetTest()"
          >
            Reset test
          </button>
        </div>
      </div>

      <div class="flex flex-wrap gap-1">
        @for (i of buttons(); track resetKey() + "-" + i) {
          <button
            type="button"
            [fsForesight]="{ callback: onHit, hitSlop: 0 }"
            #ref="foresight"
            class="flex justify-center items-center size-10 text-xs font-medium border"
            [class.bg-emerald-500]="ref.state().isPredicted"
            [class.text-white]="ref.state().isPredicted"
            [class.border-emerald-600]="ref.state().isPredicted"
            [class.bg-white]="!ref.state().isPredicted"
            [class.text-gray-700]="!ref.state().isPredicted"
            [class.border-gray-300]="!ref.state().isPredicted"
          >
            {{ i }}
          </button>
        }
      </div>
    </main>
  `,
})
export class MassPageComponent {
  protected readonly buttonCount = signal(1000)
  protected readonly hitCount = signal(0)
  protected readonly resetKey = signal(0)

  protected readonly buttons = computed(() =>
    Array.from({ length: this.buttonCount() }, (_, index) => index)
  )

  protected readonly onHit = () => this.hitCount.update(count => count + 1)

  protected updateCount(event: Event): void {
    const raw = parseInt((event.target as HTMLInputElement).value, 10) || 1
    this.buttonCount.set(Math.max(1, Math.min(10000, raw)))
  }

  protected resetTest(): void {
    this.hitCount.set(0)
    this.resetKey.update(key => key + 1)
  }
}
