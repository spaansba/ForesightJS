<script setup lang="ts">
import { useForesight } from "@foresightjs/vue"
import ForesightStats from "../../../components/ForesightStats.vue"
import { useReactivateAfter } from "../../../composables/useReactivateAfter"

const reactivateAfter = useReactivateAfter()

const { isPredicted, hitCount, isCallbackRunning, status, elementRef } = useForesight(() => ({
  callback: () => console.log("Getter prefetch"),
  name: "getter",
  reactivateAfter: reactivateAfter.value,
}))
</script>

<template>
  <article class="flex flex-col items-start gap-3 w-56">
    <h4 class="text-sm font-medium">Getter options</h4>
    <p class="text-xs text-gray-500">
      Deps tracked automatically. reactivateAfter: {{ reactivateAfter }}ms (top bar)
    </p>
    <button
      type="button"
      :ref="elementRef"
      class="flex items-center justify-center size-40 text-white text-sm font-medium bg-blue-500 hover:bg-blue-600"
    >
      Hover to predict
    </button>
    <ForesightStats :is-predicted :hit-count :is-callback-running :status />
  </article>
</template>
