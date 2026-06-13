<script setup lang="ts">
import { useForesight } from "@foresightjs/vue"
import ForesightStats from "../../../components/ForesightStats.vue"

const { isPredicted, hitCount, isCallbackRunning, status, elementRef } = useForesight({
  callback: () => console.log("Teleport target prefetch"),
  name: "teleport-target",
})
</script>

<template>
  <article class="flex flex-col items-start gap-3 w-56">
    <h4 class="text-sm font-medium">useForesight</h4>
    <button
      type="button"
      :ref="elementRef"
      class="flex items-center justify-center size-40 text-white text-sm font-medium bg-teal-400 hover:bg-teal-500"
    >
      {{ isPredicted ? "predicted!" : "Hover to predict" }}
    </button>
    <ForesightStats :is-predicted :hit-count :is-callback-running :status />
  </article>
</template>
