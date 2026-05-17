<script setup lang="ts">
import { useForesight } from "@foresightjs/vue"
import ForesightStats from "../../../components/ForesightStats.vue"

const { isPredicted, hitCount, isCallbackRunning, status } = useForesight("btn", {
  callback: () => console.log("String target prefetch"),
  name: "string-target",
})
</script>

<template>
  <article class="flex flex-col items-start gap-3 w-56">
    <h4 class="text-sm font-medium">String target</h4>
    <p class="text-xs text-gray-500">Pass ref name as string.</p>
    <button
      ref="btn"
      :class="[
        'flex items-center justify-center size-40 text-white text-sm font-medium',
        isPredicted ? 'bg-amber-500' : 'bg-blue-500 hover:bg-blue-600',
      ]"
    >
      Hover to predict
    </button>
    <ForesightStats
      :is-predicted="isPredicted"
      :hit-count="hitCount"
      :is-callback-running="isCallbackRunning"
      :status="status"
    />
  </article>
</template>
