<script setup lang="ts">
import { ref, computed, useTemplateRef } from "vue"
import {
  useForesight,
  useForesightEvent,
  type ForesightEvent,
  type ForesightEventMap,
  type ForesightElementState,
  type CallbackHitType,
} from "@foresightjs/vue"

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

const toggleableMounted = ref(true)

const pushEntry = (type: ForesightEvent, summary: string, timestamp: number) => {
  if (isPaused.value) {
    return
  }

  const entry: EventLogEntry = { id: nextId++, type, timestamp, summary }
  const next = [entry, ...entries.value]
  entries.value = next.length > MAX_LOG_ENTRIES ? next.slice(0, MAX_LOG_ENTRIES) : next
}

// Subscribe to all event types
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

// Demo element refs
const fastRef = useTemplateRef<HTMLDivElement>("fast-callback")
const slowRef = useTemplateRef<HTMLDivElement>("slow-callback")
const errorRef = useTemplateRef<HTMLDivElement>("error-callback")
const toggleRef = useTemplateRef<HTMLDivElement>("toggleable")

// Demo element composables
const fast = useForesight(fastRef, {
  callback: async () => {
    await new Promise(resolve => setTimeout(resolve, 50))
  },
  name: "fast-callback",
  hitSlop: 20,
  reactivateAfter: 2000,
})

const slow = useForesight(slowRef, {
  callback: async () => {
    await new Promise(resolve => setTimeout(resolve, 1500))
  },
  name: "slow-callback",
  hitSlop: 20,
  reactivateAfter: 2000,
})

const error = useForesight(errorRef, {
  callback: async () => {
    throw new Error("Intentional error for demo")
  },
  name: "error-callback",
  hitSlop: 20,
  reactivateAfter: 2000,
})

const toggle = useForesight(toggleRef, {
  callback: () => {},
  name: "toggleable",
  hitSlop: 20,
})

const eventCounts = computed(() =>
  entries.value.reduce(
    (acc, entry) => {
      acc[entry.type] = (acc[entry.type] ?? 0) + 1
      {
        return acc
      }
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

    <!-- Demo elements -->
    <div class="border border-gray-300 bg-white p-4 space-y-3">
      <h2 class="text-sm font-medium text-gray-900">Interactive elements</h2>
      <div class="flex flex-wrap gap-6">
        <div class="flex flex-col items-center gap-2">
          <div
            ref="fast-callback"
            :class="[
              'w-28 h-28 flex items-center justify-center text-xs font-medium text-gray-800 border border-gray-300 cursor-default select-none',
              'bg-green-200',
              fast.isPredicted.value ? 'outline-1 outline-amber-500' : '',
            ]"
          >
            Fast callback
          </div>
          <div class="font-mono text-[10px] text-gray-500 text-center space-y-0.5">
            <div>hits: {{ fast.hitCount.value }} | {{ fast.status.value ?? "idle" }}</div>
            <div>
              {{
                fast.isCallbackRunning.value
                  ? "running..."
                  : fast.isPredicted.value
                    ? "predicted"
                    : "waiting"
              }}
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center gap-2">
          <div
            ref="slow-callback"
            :class="[
              'w-28 h-28 flex items-center justify-center text-xs font-medium text-gray-800 border border-gray-300 cursor-default select-none',
              'bg-amber-200',
              slow.isPredicted.value ? 'outline-1 outline-amber-500' : '',
            ]"
          >
            Slow callback
          </div>
          <div class="font-mono text-[10px] text-gray-500 text-center space-y-0.5">
            <div>hits: {{ slow.hitCount.value }} | {{ slow.status.value ?? "idle" }}</div>
            <div>
              {{
                slow.isCallbackRunning.value
                  ? "running..."
                  : slow.isPredicted.value
                    ? "predicted"
                    : "waiting"
              }}
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center gap-2">
          <div
            ref="error-callback"
            :class="[
              'w-28 h-28 flex items-center justify-center text-xs font-medium text-gray-800 border border-gray-300 cursor-default select-none',
              'bg-red-200',
              error.isPredicted.value ? 'outline-1 outline-amber-500' : '',
            ]"
          >
            Error callback
          </div>
          <div class="font-mono text-[10px] text-gray-500 text-center space-y-0.5">
            <div>hits: {{ error.hitCount.value }} | {{ error.status.value ?? "idle" }}</div>
            <div>
              {{
                error.isCallbackRunning.value
                  ? "running..."
                  : error.isPredicted.value
                    ? "predicted"
                    : "waiting"
              }}
            </div>
          </div>
        </div>

        <!-- Toggleable element -->
        <div class="flex flex-col items-center gap-2">
          <div
            v-if="toggleableMounted"
            ref="toggleable"
            :class="[
              'w-28 h-28 flex items-center justify-center text-xs font-medium text-gray-800 border border-gray-300 bg-blue-200 cursor-default select-none',
              toggle.isPredicted.value ? 'outline-1 outline-amber-500' : '',
            ]"
          >
            Toggleable
          </div>
          <div
            v-else
            class="w-28 h-28 flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300"
          >
            unmounted
          </div>
          <button
            class="px-2 py-1 text-[10px] border border-gray-400 text-gray-700 hover:bg-gray-100"
            @click="toggleableMounted = !toggleableMounted"
          >
            {{ toggleableMounted ? "Unmount" : "Mount" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Summary counters -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div
        v-for="event in ALL_EVENTS"
        :key="event"
        class="border border-gray-300 bg-white px-3 py-2"
      >
        <div class="text-[10px] text-gray-500 truncate">{{ event }}</div>
        <div :class="['text-lg font-semibold tabular-nums', EVENT_COLORS[event] ?? 'text-gray-600']">
          {{ eventCounts[event] ?? 0 }}
        </div>
      </div>
    </div>

    <!-- Log -->
    <div class="flex items-center justify-between">
      <span class="text-xs text-gray-400">{{ entries.length }} / {{ MAX_LOG_ENTRIES }} events logged</span>
    </div>
    <div class="h-[500px] overflow-y-auto font-mono text-[11px] border border-gray-300 bg-white">
      <p v-if="entries.length === 0" class="p-4 text-gray-400 text-xs">
        No events yet. Hover over the elements above to see events appear here.
      </p>
      <div
        v-for="entry in entries"
        :key="entry.id"
        class="flex gap-3 px-3 py-1 border-b border-gray-100 hover:bg-gray-50"
      >
        <span class="text-gray-400 shrink-0 w-20 tabular-nums">
          {{ new Date(entry.timestamp).toLocaleTimeString() }}
        </span>
        <span :class="['shrink-0 w-48', EVENT_COLORS[entry.type] ?? 'text-gray-600']">
          {{ entry.type }}
        </span>
        <span class="text-gray-700 truncate">{{ entry.summary }}</span>
      </div>
    </div>
  </div>
</template>
