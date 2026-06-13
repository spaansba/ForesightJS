<script setup lang="ts">
import type { ForesightEvent } from "@foresightjs/vue"

type EventLogEntry = {
  id: number
  type: ForesightEvent
  timestamp: number
  summary: string
}

defineProps<{
  entries: EventLogEntry[]
  maxEntries: number
  colors: Partial<Record<ForesightEvent, string>>
}>()
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs text-gray-400"
        >{{ entries.length }} / {{ maxEntries }} events logged</span
      >
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
        <span :class="['shrink-0 w-48', colors[entry.type] ?? 'text-gray-600']">
          {{ entry.type }}
        </span>
        <span class="text-gray-700 truncate">{{ entry.summary }}</span>
      </div>
    </div>
  </div>
</template>
