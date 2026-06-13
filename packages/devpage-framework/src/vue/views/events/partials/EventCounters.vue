<script setup lang="ts">
import type { ForesightEvent } from "@foresightjs/vue"

defineProps<{
  events: ForesightEvent[]
  counts: Partial<Record<ForesightEvent, number>>
  colors: Partial<Record<ForesightEvent, string>>
}>()
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
    <div v-for="event in events" :key="event" class="border border-gray-300 bg-white px-3 py-2">
      <div class="text-[10px] text-gray-500 truncate">{{ event }}</div>
      <div :class="['text-lg font-semibold tabular-nums', colors[event] ?? 'text-gray-600']">
        {{ counts[event] ?? 0 }}
      </div>
    </div>
  </div>
</template>
