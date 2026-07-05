import { ChangeDetectionStrategy, Component, computed, signal } from "@angular/core"
import { ForesightDirective, injectForesightEvent, type ForesightEvent } from "@foresightjs/angular"
import {
  ALL_EVENTS,
  EVENT_COLORS,
  MAX_LOG_ENTRIES,
  summarizeEvent,
  type EventLogEntry,
} from "../../shared/foresightEvents"
import { sleep } from "../shared/foresight-controls"

/**
 * Live ForesightManager event stream via `injectForesightEvent`. One static
 * subscription per event type feeds the counters + log; a signal-driven
 * subscription powers the "focused" counter, exercising the Signal overload
 * that re-subscribes when the selected event type changes.
 */
@Component({
  selector: "app-events-page",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ForesightDirective],
  template: `
    <main class="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-semibold">Events</h1>
        <div class="flex gap-2">
          <button
            type="button"
            class="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
            (click)="paused.set(!paused())"
          >
            {{ paused() ? "Resume" : "Pause" }}
          </button>
          <button
            type="button"
            class="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
            (click)="entries.set([])"
          >
            Clear
          </button>
        </div>
      </div>

      <p class="text-sm text-gray-600">
        Stream from <code class="text-xs bg-gray-100 px-1 py-0.5">injectForesightEvent</code>. Hover
        the elements below — or interact with any other framework's page — to generate events on the
        shared manager.
      </p>

      <!-- Interactive elements -->
      <div class="border border-gray-300 bg-white p-4 space-y-3">
        <h2 class="text-sm font-medium text-gray-900">Interactive elements</h2>
        <div class="flex flex-wrap gap-6">
          <div class="flex flex-col items-center gap-2">
            <div
              [fsForesight]="{
                callback: fastCallback,
                name: 'fast-callback',
                hitSlop: 20,
                reactivateAfter: 2000,
              }"
              class="w-28 h-28 flex items-center justify-center text-xs font-medium text-gray-800 border border-gray-300 bg-green-200 cursor-default select-none"
            >
              Fast callback
            </div>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div
              [fsForesight]="{
                callback: slowCallback,
                name: 'slow-callback',
                hitSlop: 20,
                reactivateAfter: 2000,
              }"
              class="w-28 h-28 flex items-center justify-center text-xs font-medium text-gray-800 border border-gray-300 bg-amber-200 cursor-default select-none"
            >
              Slow callback
            </div>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div
              [fsForesight]="{
                callback: errorCallback,
                name: 'error-callback',
                hitSlop: 20,
                reactivateAfter: 2000,
              }"
              class="w-28 h-28 flex items-center justify-center text-xs font-medium text-gray-800 border border-gray-300 bg-red-200 cursor-default select-none"
            >
              Error callback
            </div>
          </div>
          <div class="flex flex-col items-center gap-2">
            @if (toggleMounted()) {
              <div
                [fsForesight]="{ callback: fastCallback, name: 'toggleable', hitSlop: 20 }"
                class="w-28 h-28 flex items-center justify-center text-xs font-medium text-gray-800 border border-gray-300 bg-blue-200 cursor-default select-none"
              >
                Toggleable
              </div>
            } @else {
              <div
                class="w-28 h-28 flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300"
              >
                unmounted
              </div>
            }
            <button
              type="button"
              class="px-2 py-1 text-[10px] border border-gray-400 text-gray-700 hover:bg-gray-100"
              (click)="toggleMounted.set(!toggleMounted())"
            >
              {{ toggleMounted() ? "Unmount" : "Mount" }}
            </button>
          </div>
        </div>
      </div>

      <!-- Counters -->
      <div class="grid grid-cols-2 sm:grid-cols-6 gap-3">
        @for (event of allEvents; track event) {
          <div class="border border-gray-300 bg-white px-3 py-2">
            <div class="text-[10px] text-gray-500 truncate">{{ event }}</div>
            <div class="text-lg font-semibold tabular-nums" [class]="colorFor(event)">
              {{ counts()[event] ?? 0 }}
            </div>
          </div>
        }
      </div>

      <!-- Focused (signal-driven) subscription -->
      <div class="flex items-center gap-3 border border-gray-300 bg-white px-3 py-2 text-sm">
        <label class="text-xs text-gray-600">Focused event</label>
        <select
          class="text-xs border border-gray-400 px-2 py-1"
          [value]="focusedEvent()"
          (change)="onFocusChange($event)"
        >
          @for (event of allEvents; track event) {
            <option [value]="event">{{ event }}</option>
          }
        </select>
        <span class="font-mono text-xs text-gray-700">
          re-subscribed count: {{ focusedCount() }}
        </span>
      </div>

      <!-- Log -->
      <span class="text-xs text-gray-400"
        >{{ entries().length }} / {{ maxEntries }} events logged</span
      >
      <div class="h-125 overflow-y-auto font-mono text-[11px] border border-gray-300 bg-white">
        @if (entries().length === 0) {
          <p class="p-4 text-gray-400 text-xs">
            No events yet. Interact with elements above to see events appear here.
          </p>
        } @else {
          @for (entry of entries(); track entry.id) {
            <div class="flex gap-3 px-3 py-1 border-b border-gray-100 hover:bg-gray-50">
              <span class="text-gray-400 shrink-0 w-20 tabular-nums">{{
                formatTime(entry.timestamp)
              }}</span>
              <span class="shrink-0 w-48" [class]="colorFor(entry.type)">{{ entry.type }}</span>
              <span class="text-gray-700 truncate">{{ entry.summary }}</span>
            </div>
          }
        }
      </div>
    </main>
  `,
})
export class EventsPageComponent {
  protected readonly allEvents = ALL_EVENTS
  protected readonly maxEntries = MAX_LOG_ENTRIES

  protected readonly entries = signal<EventLogEntry[]>([])
  protected readonly paused = signal(false)
  protected readonly toggleMounted = signal(true)
  protected readonly focusedEvent = signal<ForesightEvent>("callbackInvoked")
  protected readonly focusedCount = signal(0)

  protected readonly counts = computed(() =>
    this.entries().reduce<Partial<Record<ForesightEvent, number>>>((acc, entry) => {
      acc[entry.type] = (acc[entry.type] ?? 0) + 1

      return acc
    }, {})
  )

  private nextId = 0

  protected readonly fastCallback = () => sleep(50)
  protected readonly slowCallback = () => sleep(1500)
  protected readonly errorCallback = async () => {
    throw new Error("Intentional error for demo")
  }

  constructor() {
    // One subscription per event type (literal types so the event is narrowed
    // and carries `timestamp`), mirroring the React/Vue events pages.
    injectForesightEvent("elementRegistered", e =>
      this.push(e.type, summarizeEvent(e), e.timestamp)
    )
    injectForesightEvent("elementUnregistered", e =>
      this.push(e.type, summarizeEvent(e), e.timestamp)
    )
    injectForesightEvent("callbackInvoked", e => this.push(e.type, summarizeEvent(e), e.timestamp))
    injectForesightEvent("callbackCompleted", e =>
      this.push(e.type, summarizeEvent(e), e.timestamp)
    )
    injectForesightEvent("managerSettingsChanged", e =>
      this.push(e.type, summarizeEvent(e), e.timestamp)
    )
    injectForesightEvent("deviceStrategyChanged", e =>
      this.push(e.type, summarizeEvent(e), e.timestamp)
    )

    // Signal overload: changing `focusedEvent` tears down and re-creates the
    // subscription for the newly selected event type.
    injectForesightEvent(this.focusedEvent, () => this.focusedCount.update(count => count + 1))
  }

  protected colorFor(event: ForesightEvent): string {
    return EVENT_COLORS[event] ?? "text-gray-600"
  }

  protected formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString()
  }

  protected onFocusChange(event: Event): void {
    this.focusedEvent.set((event.target as HTMLSelectElement).value as ForesightEvent)
    this.focusedCount.set(0)
  }

  private push(type: ForesightEvent, summary: string, timestamp: number): void {
    if (this.paused()) {
      return
    }

    this.entries.update(prev => {
      const next = [{ id: this.nextId++, type, timestamp, summary }, ...prev]

      return next.length > MAX_LOG_ENTRIES ? next.slice(0, MAX_LOG_ENTRIES) : next
    })
  }
}
