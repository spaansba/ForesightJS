<script setup lang="ts">
import { ref, computed } from "vue"
import {
  useForesightEvent,
  type ForesightEvent,
  type ForesightEventMap,
  type ForesightElementState,
  type CallbackHitType,
} from "@foresightjs/vue"
import InteractiveTargets from "./partials/InteractiveTargets.vue"
import EventCounters from "./partials/EventCounters.vue"
import EventLog from "./partials/EventLog.vue"

type EventLogEntry = {
  id: number
  type: ForesightEvent
  timestamp: number
  summary: string
}

const MAX_LOG_ENTRIES = 200

const ALL_EVENTS: ForesightEvent[] = [
  "elementRegistered",
  "elementReactivated",
  "elementUnregistered",
  "callbackInvoked",
  "callbackCompleted",
  "managerSettingsChanged",
  "deviceStrategyChanged",
]

const EVENT_COLORS: Partial<Record<ForesightEvent, string>> = {
  elementRegistered: "text-green-700",
  elementReactivated: "text-blue-700",
  elementUnregistered: "text-red-700",
  elementDataUpdated: "text-gray-600",
  callbackInvoked: "text-amber-700",
  callbackCompleted: "text-purple-700",
  managerSettingsChanged: "text-cyan-700",
  deviceStrategyChanged: "text-teal-700",
}

const formatHitType = (hitType: CallbackHitType): string => {
  return hitType.subType ? `${hitType.kind}:${hitType.subType}` : hitType.kind
}

const formatElementName = (state: ForesightElementState): string => {
  return state.name || state.id.slice(0, 8)
}

const summarizeEvent = (event: ForesightEventMap[ForesightEvent]): string => {
  switch (event.type) {
    case "elementRegistered":
      return `"${formatElementName(event.state)}" registered`
    case "elementReactivated":
      return `"${formatElementName(event.state)}" reactivated`
    case "elementUnregistered":
      return `"${formatElementName(event.state)}" unregistered (${event.unregisterReason})`
    case "callbackInvoked":
      return `"${formatElementName(event.state)}" callback invoked [${formatHitType(event.hitType)}]`
    case "callbackCompleted":
      return `"${formatElementName(event.state)}" callback ${event.status ?? "done"} (${event.elapsed.toFixed(1)}ms) [${formatHitType(event.hitType)}]`
    case "managerSettingsChanged":
      return `settings changed: ${event.updatedSettings.map(s => s.setting).join(", ")}`
    case "deviceStrategyChanged":
      return `device strategy: ${event.oldStrategy} -> ${event.newStrategy}`
    default:
      return event.type
  }
}

const entries = ref<EventLogEntry[]>([])
const isPaused = ref(false)
let nextId = 0

const pushEntry = (type: ForesightEvent, summary: string, timestamp: number) => {
  if (isPaused.value) return
  const entry: EventLogEntry = { id: nextId++, type, timestamp, summary }
  const next = [entry, ...entries.value]
  entries.value = next.length > MAX_LOG_ENTRIES ? next.slice(0, MAX_LOG_ENTRIES) : next
}

useForesightEvent("elementRegistered", e => {
  pushEntry(e.type, summarizeEvent(e), e.timestamp)
})
useForesightEvent("elementReactivated", e => {
  pushEntry(e.type, summarizeEvent(e), e.timestamp)
})
useForesightEvent("elementUnregistered", e => {
  pushEntry(e.type, summarizeEvent(e), e.timestamp)
})
useForesightEvent("elementDataUpdated", e => {
  pushEntry(e.type, summarizeEvent(e), Date.now())
})
useForesightEvent("callbackInvoked", e => {
  pushEntry(e.type, summarizeEvent(e), e.timestamp)
})
useForesightEvent("callbackCompleted", e => {
  pushEntry(e.type, summarizeEvent(e), e.timestamp)
})
useForesightEvent("managerSettingsChanged", e => {
  pushEntry(e.type, summarizeEvent(e), e.timestamp)
})
useForesightEvent("deviceStrategyChanged", e => {
  pushEntry(e.type, summarizeEvent(e), e.timestamp)
})

const eventCounts = computed(() =>
  entries.value.reduce(
    (acc, entry) => {
      acc[entry.type] = (acc[entry.type] ?? 0) + 1
      return acc
    },
    {} as Partial<Record<ForesightEvent, number>>
  )
)

const clearLog = () => {
  entries.value = []
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-8 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Events</h1>
      <div class="flex gap-2">
        <button
          class="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
          @click="isPaused = !isPaused"
        >
          {{ isPaused ? "Resume" : "Pause" }}
        </button>
        <button
          class="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
          @click="clearLog"
        >
          Clear
        </button>
      </div>
    </div>

    <p class="text-sm text-gray-600">
      Live event stream from
      <code class="text-xs bg-gray-100 px-1 py-0.5">useForesightEvent</code>. Each event type is a
      separate composable subscription. Hover over the elements below to generate events.
    </p>

    <InteractiveTargets />
    <EventCounters :events="ALL_EVENTS" :counts="eventCounts" :colors="EVENT_COLORS" />
    <EventLog :entries="entries" :max-entries="MAX_LOG_ENTRIES" :colors="EVENT_COLORS" />
  </div>
</template>
