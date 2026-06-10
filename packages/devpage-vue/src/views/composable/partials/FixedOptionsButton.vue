<script setup lang="ts">
import { useForesight } from "@foresightjs/vue"
import ForesightStats from "../../../components/ForesightStats.vue"

const { isPredicted, hitCount, isCallbackRunning, status, elementRef } = useForesight({
  callback: () => console.log("Fixed options prefetch"),
  name: "fixed-options",
})
</script>

<template>
  <article class="flex flex-col items-start gap-3 w-56">
    <h4 class="text-sm font-medium">Fixed options</h4>
    <p class="text-xs text-gray-500">Pass a plain options object.</p>
    <button
      type="button"
      :ref="elementRef"
      :class="[
        'flex items-center justify-center size-40 text-white text-sm font-medium',
        isPredicted ? 'bg-amber-500' : 'bg-blue-500 hover:bg-blue-600',
      ]"
    >
      Hover to predict
    </button>
    <ForesightStats :is-predicted :hit-count :is-callback-running :status />
  </article>
</template>
