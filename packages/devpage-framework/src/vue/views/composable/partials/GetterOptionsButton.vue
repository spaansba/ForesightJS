<script setup lang="ts">
import { ref } from "vue"
import { useForesight } from "@foresightjs/vue"
import ForesightStats from "../../../components/ForesightStats.vue"

const reactivateAfter = ref(Infinity)

const { isPredicted, hitCount, isCallbackRunning, status, elementRef } = useForesight(() => ({
  callback: () => console.log("Getter prefetch"),
  name: "getter",
  reactivateAfter: reactivateAfter.value,
}))

const toggle = () => {
  reactivateAfter.value = reactivateAfter.value === Infinity ? 2000 : Infinity
}
</script>

<template>
  <article class="flex flex-col items-start gap-3 w-56">
    <h4 class="text-sm font-medium">Getter options</h4>
    <p class="text-xs text-gray-500">
      Deps tracked automatically. reactivateAfter:
      {{ reactivateAfter === Infinity ? "off" : `${reactivateAfter}ms` }}
    </p>
    <button
      type="button"
      :ref="elementRef"
      class="flex items-center justify-center size-40 text-white text-sm font-medium bg-blue-500 hover:bg-blue-600"
    >
      Hover to predict
    </button>
    <ForesightStats :is-predicted :hit-count :is-callback-running :status />
    <button
      type="button"
      class="text-xs px-2 py-1 border border-gray-300 hover:bg-gray-100"
      @click="toggle"
    >
      Toggle reactivation
    </button>
  </article>
</template>
