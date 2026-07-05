import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from "@angular/core"
import {
  ForesightComponent,
  ForesightService,
  type ForesightElementState,
  type ForesightRegistration,
} from "@foresightjs/angular"
import { createUnregisteredSnapshot } from "js.foresight"
import { ForesightButtonComponent } from "../components/foresight-button.component"
import { ForesightStatsComponent } from "../components/foresight-stats.component"
import {
  injectReactivateAfter,
  injectResetKey,
  randomDelayCallback,
  sleep,
} from "../shared/foresight-controls"

/**
 * DOM-lifecycle and API-surface showcase (Angular twin of the React Elements
 * page): resizing, removal, CSS visibility, enabled/hitSlop toggles, the
 * `<foresight>` component, the `ForesightService`, and callback edge cases.
 * Local toggles reset when the shared top-bar "Reset" fires.
 */
@Component({
  selector: "app-elements-page",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ForesightButtonComponent, ForesightComponent, ForesightStatsComponent],
  template: `
    <main class="max-w-6xl mx-auto px-6 pb-16">
      <!-- Resizable -->
      <section class="border-t border-gray-300 pb-8">
        <div
          class="sticky top-12 z-5 -mx-6 px-6 py-4 bg-stone-50/95 backdrop-blur flex items-center justify-between mb-6"
        >
          <h3 class="text-lg font-semibold text-gray-900">Resizable elements</h3>
          <button
            type="button"
            class="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
            (click)="isResized.set(!isResized())"
          >
            Resize: {{ isResized() ? "on" : "off" }}
          </button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
          <article class="flex flex-col items-center gap-3 w-40">
            <h4 class="text-sm font-medium text-gray-900 self-start">Size change</h4>
            <app-foresight-button
              [className]="
                (isResized() ? 'size-40' : 'size-20') +
                ' bg-green-600 text-white transition-all duration-500'
              "
              [registerOptions]="{
                callback: slowCallback,
                name: 'resizeable-size-change',
                hitSlop: 30,
              }"
            />
            <p class="text-xs text-gray-600">Width/height classes change.</p>
          </article>

          <article class="flex flex-col items-center gap-3 w-40">
            <h4 class="text-sm font-medium text-gray-900 self-start">Border change</h4>
            <app-foresight-button
              [className]="
                (isResized() ? 'border-8' : 'border-2') +
                ' box-content size-20 bg-purple-600 border-purple-800 text-white transition-all duration-500'
              "
              [registerOptions]="{
                callback: slowCallback,
                name: 'resizeable-border-change',
                hitSlop: 30,
              }"
            />
            <p class="text-xs text-gray-600">Border width affects boundaries.</p>
          </article>

          <article class="flex flex-col items-center gap-3 w-40">
            <h4 class="text-sm font-medium text-gray-900 self-start">Content change</h4>
            <app-foresight-button
              className="min-w-20 min-h-20 max-w-40 bg-red-600 text-white transition-all duration-500 px-3 py-2"
              [registerOptions]="{
                callback: slowCallback,
                name: 'resizeable-content-change',
                hitSlop: 30,
              }"
            >
              <span class="text-center font-medium text-sm">
                {{ isResized() ? "Much longer button text that causes expansion" : "Click" }}
              </span>
            </app-foresight-button>
            <p class="text-xs text-gray-600">Inner text grows the box.</p>
          </article>

          <article class="flex flex-col items-center gap-3 w-40">
            <h4 class="text-sm font-medium text-gray-900 self-start">Font size change</h4>
            <app-foresight-button
              className="min-w-20 min-h-20 bg-yellow-600 text-white transition-all duration-500"
              [registerOptions]="{
                callback: slowCallback,
                name: 'resizeable-font-change',
                hitSlop: 30,
              }"
            >
              <span class="font-bold" [class.text-4xl]="isResized()" [class.text-sm]="!isResized()">
                Button
              </span>
            </app-foresight-button>
            <p class="text-xs text-gray-600">Font size affects element size.</p>
          </article>

          <article class="flex flex-col items-center gap-3 w-40">
            <h4 class="text-sm font-medium text-gray-900 self-start">Transform scale</h4>
            <app-foresight-button
              [className]="
                (isResized() ? 'scale-150' : 'scale-100') +
                ' size-20 bg-indigo-600 text-white transition-all duration-500'
              "
              [registerOptions]="{
                callback: slowCallback,
                name: 'resizeable-transform-scale',
                hitSlop: 30,
              }"
            />
            <p class="text-xs text-gray-600"></p>
          </article>

          <article class="flex flex-col items-center gap-3 w-40">
            <h4 class="text-sm font-medium text-gray-900 self-start">Asymmetric resize</h4>
            <app-foresight-button
              [className]="
                (isResized() ? 'w-32 h-12' : 'w-12 h-32') +
                ' bg-teal-600 text-white transition-all duration-500'
              "
              [registerOptions]="{
                callback: slowCallback,
                name: 'resizeable-asymmetric',
                hitSlop: 30,
              }"
            />
            <p class="text-xs text-gray-600">Width/height swap.</p>
          </article>

          <article class="flex flex-col items-center gap-3 w-40">
            <h4 class="text-sm font-medium text-gray-900 self-start">Max width</h4>
            <app-foresight-button
              [className]="
                (isResized() ? 'max-w-none w-48' : 'max-w-20 w-48') +
                ' h-20 bg-orange-600 text-white transition-all duration-500'
              "
              [registerOptions]="{
                callback: slowCallback,
                name: 'resizeable-max-width',
                hitSlop: 30,
              }"
            />
            <p class="text-xs text-gray-600">max-width constraint changes.</p>
          </article>
        </div>
      </section>

      <!-- Removable -->
      <section class="border-t border-gray-300 pb-8">
        <div
          class="sticky top-12 z-5 -mx-6 px-6 py-4 bg-stone-50/95 backdrop-blur flex items-center justify-between mb-6"
        >
          <h3 class="text-lg font-semibold text-gray-900">Removable elements</h3>
          <button
            type="button"
            class="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
            (click)="isRemoved.set(!isRemoved())"
          >
            Remove: {{ isRemoved() ? "on" : "off" }}
          </button>
        </div>
        @if (!isRemoved()) {
          <article class="flex flex-col items-center gap-3 w-40">
            <h4 class="text-sm font-medium text-gray-900 self-start">removeable</h4>
            <app-foresight-button
              className="size-40 bg-teal-600 text-white"
              [registerOptions]="{ callback: slowCallback, name: 'removeable', hitSlop: 0 }"
            />
          </article>
        }
      </section>

      <!-- Visibility -->
      <section class="border-t border-gray-300 pb-8">
        <div
          class="sticky top-12 z-5 -mx-6 px-6 py-4 bg-stone-50/95 backdrop-blur flex items-center justify-between mb-6"
        >
          <h3 class="text-lg font-semibold text-gray-900">Visibility elements</h3>
          <button
            type="button"
            class="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
            (click)="isVisible.set(!isVisible())"
          >
            Visible: {{ isVisible() ? "on" : "off" }}
          </button>
        </div>
        <article class="flex flex-col items-center gap-3 w-40" [class.invisible]="!isVisible()">
          <h4 class="text-sm font-medium text-gray-900 self-start">Visibility</h4>
          <app-foresight-button
            className="size-40 bg-blue-400 text-white"
            [registerOptions]="{ callback: slowCallback, name: 'visibility', hitSlop: 0 }"
          />
          <p class="text-xs text-gray-600">
            Toggles via CSS only - MutationObserver should not unregister.
          </p>
        </article>
      </section>

      <!-- Enabled toggle -->
      <section class="border-t border-gray-300 pb-8">
        <div class="sticky top-12 z-5 -mx-6 px-6 py-4 bg-stone-50/95 backdrop-blur mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Enabled toggle</h3>
        </div>
        <article class="flex flex-col items-center gap-3 w-40">
          <h4 class="text-sm font-medium text-gray-900 self-start">Enabled</h4>
          <app-foresight-button
            [className]="'size-40 ' + (enabled() ? 'bg-teal-200' : 'bg-gray-300 text-gray-500')"
            [registerOptions]="{
              callback: slowCallback,
              name: 'enabled',
              hitSlop: 20,
              enabled: enabled(),
            }"
          >
            <span class="text-center leading-tight">{{ enabled() ? "enabled" : "disabled" }}</span>
          </app-foresight-button>
          <button
            type="button"
            class="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
            (click)="enabled.set(!enabled())"
          >
            enabled: {{ enabled() ? "on" : "off" }}
          </button>
        </article>
      </section>

      <!-- Dynamic hitSlop -->
      <section class="border-t border-gray-300 pb-8">
        <div class="sticky top-12 z-5 -mx-6 px-6 py-4 bg-stone-50/95 backdrop-blur mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Dynamic hitSlop</h3>
        </div>
        <article class="flex flex-col items-center gap-3 w-40">
          <h4 class="text-sm font-medium text-gray-900 self-start">Dynamic hitSlop</h4>
          <app-foresight-button
            className="size-40 bg-indigo-200"
            [registerOptions]="{ callback: slowCallback, name: 'hit-slop', hitSlop: hitSlop() }"
          >
            <span class="text-center leading-tight">hit-slop ({{ hitSlop() }}px)</span>
          </app-foresight-button>
          <button
            type="button"
            class="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
            (click)="hitSlop.set(hitSlop() === 20 ? 100 : 20)"
          >
            hitSlop: {{ hitSlop() }}px
          </button>
        </article>
      </section>

      <!-- Foresight component + service -->
      <section class="border-t border-gray-300 pb-8">
        <div class="sticky top-12 z-5 -mx-6 px-6 py-4 bg-stone-50/95 backdrop-blur mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Foresight component &amp; service</h3>
        </div>
        <div class="flex flex-wrap gap-x-6 gap-y-8">
          <article class="flex flex-col items-center gap-3 w-40">
            <h4 class="text-sm font-medium text-gray-900 self-start">&lt;foresight&gt;</h4>
            <foresight
              #fc
              [callback]="slowCallback"
              foresightName="component-basic"
              [hitSlop]="20"
              [reactivateAfter]="reactivateAfter()"
              class="flex items-center justify-center size-40 bg-sky-200 text-slate-900 font-medium text-sm cursor-default select-none"
            >
              <span class="text-center leading-tight"
                >component (hits: {{ fc.state().hitCount }})</span
              >
            </foresight>
            <app-foresight-stats [state]="fc.state()" />
          </article>

          <article class="flex flex-col items-center gap-3 w-40">
            <h4 class="text-sm font-medium text-gray-900 self-start">ForesightService</h4>
            <button
              #manualBtn
              type="button"
              class="flex items-center justify-center size-40 bg-sky-200 text-slate-900 font-medium text-sm"
            >
              <span class="text-center leading-tight">
                {{ serviceState().isRegistered ? "service (registered)" : "unregistered" }}
              </span>
            </button>
            <app-foresight-stats [state]="serviceState()" />
            <button
              type="button"
              class="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
              (click)="toggleRegistration()"
            >
              {{ serviceState().isRegistered ? "unregister" : "re-register" }}
            </button>
          </article>
        </div>
      </section>

      <!-- Edge cases -->
      <section class="border-t border-gray-300 pb-8">
        <div class="sticky top-12 z-5 -mx-6 px-6 py-4 bg-stone-50/95 backdrop-blur mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Edge cases</h3>
        </div>
        <div class="flex flex-wrap gap-x-6 gap-y-8">
          <article class="flex flex-col items-center gap-3 w-40">
            <h4 class="text-sm font-medium text-gray-900 self-start">Error in callback</h4>
            <app-foresight-button
              className="size-40 bg-red-500 text-white"
              [registerOptions]="{ callback: errorCallback, name: 'callback error', hitSlop: 20 }"
            />
            <p class="text-xs text-gray-600">Callback throws after a random delay.</p>
          </article>

          <article class="flex flex-col items-center gap-3 w-40">
            <h4 class="text-sm font-medium text-gray-900 self-start">Unnamed</h4>
            <app-foresight-button
              className="size-40 bg-neutral-700 text-white"
              [registerOptions]="{ callback: slowCallback, hitSlop: 20 }"
            />
            <p class="text-xs text-gray-600">Element registered without a name.</p>
          </article>
        </div>
      </section>
    </main>
  `,
})
export class ElementsPageComponent implements AfterViewInit, OnDestroy {
  private readonly foresight = inject(ForesightService)
  private readonly manualBtn = viewChild.required<ElementRef<HTMLButtonElement>>("manualBtn")

  protected readonly reactivateAfter = injectReactivateAfter()
  protected readonly isResized = signal(true)
  protected readonly isRemoved = signal(false)
  protected readonly isVisible = signal(true)
  protected readonly enabled = signal(true)
  protected readonly hitSlop = signal(20)

  protected readonly slowCallback = randomDelayCallback
  protected readonly errorCallback = async () => {
    await sleep(Math.floor(Math.random() * 1000))
    throw new Error("Test error - callback always fails")
  }

  private readonly registration = signal<ForesightRegistration | null>(null)
  protected readonly serviceState = computed<ForesightElementState>(
    () => this.registration()?.state() ?? createUnregisteredSnapshot(false)
  )

  constructor() {
    const resetKey = injectResetKey()
    effect(() => {
      resetKey()
      this.isResized.set(true)
      this.isRemoved.set(false)
      this.isVisible.set(true)
      this.enabled.set(true)
      this.hitSlop.set(20)
    })
  }

  ngAfterViewInit(): void {
    this.registerService()
  }

  ngOnDestroy(): void {
    this.registration()?.unregister()
  }

  protected toggleRegistration(): void {
    if (this.serviceState().isRegistered) {
      this.registration()?.unregister()

      return
    }

    this.registerService()
  }

  private registerService(): void {
    this.registration.set(
      this.foresight.register(this.manualBtn().nativeElement, {
        callback: randomDelayCallback,
        name: "service-manual",
        hitSlop: 30,
        reactivateAfter: this.reactivateAfter(),
      })
    )
  }
}
