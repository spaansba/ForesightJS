<script setup lang="ts">
import { shallowRef } from "vue"
import { useForesight, type ForesightRegisterOptionsWithoutElement } from "@foresightjs/vue"
import ForesightStats from "../../../components/ForesightStats.vue"

const optionsA: ForesightRegisterOptionsWithoutElement = {
  callback: () => console.log("Ref A prefetch"),
  name: "ref-a",
  reactivateAfter: Infinity,
}
const optionsB: ForesightRegisterOptionsWithoutElement = {
  callback: () => console.log("Ref B prefetch"),
  name: "ref-b",
  reactivateAfter: 1000,
}

const currentOptions = shallowRef(optionsA)

const { isPredicted, hitCount, isCallbackRunning, status, setRef } = useForesight(currentOptions)

const swap = () => {
  currentOptions.value = currentOptions.value === optionsA ? optionsB : optionsA
}
</script>

<template>
  <article class="flex flex-col items-start gap-3 w-56">
    <h4 class="text-sm font-medium">Ref options</h4>
    <p class="text-xs text-gray-500">Swap entire options object. name: {{ currentOptions.name }}</p>
    <button
      :ref="setRef"
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
    <button class="text-xs px-2 py-1 border border-gray-300 hover:bg-gray-100" @click="swap">
      Swap options
    </button>
  </article>
</template>
