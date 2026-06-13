<script setup lang="ts">
import { ref } from "vue"
import { useForesight } from "@foresightjs/vue"
import { useReactivateAfter } from "../../../composables/useReactivateAfter"

const toggleableMounted = ref(true)
const reactivateAfter = useReactivateAfter()

const fast = useForesight(() => ({
  callback: async () => {
    await new Promise(resolve => setTimeout(resolve, 50))
  },
  name: "fast-callback",
  hitSlop: 20,
  reactivateAfter: reactivateAfter.value,
}))

const slow = useForesight(() => ({
  callback: async () => {
    await new Promise(resolve => setTimeout(resolve, 1500))
  },
  name: "slow-callback",
  hitSlop: 20,
  reactivateAfter: reactivateAfter.value,
}))

const error = useForesight(() => ({
  callback: async () => {
    throw new Error("Intentional error")
  },
  name: "error-callback",
  hitSlop: 20,
  reactivateAfter: reactivateAfter.value,
}))

const toggle = useForesight({
  callback: () => {},
  name: "toggleable",
  hitSlop: 20,
})
</script>

<template>
  <div class="border border-gray-300 bg-white p-4 space-y-3">
    <h2 class="text-sm font-medium text-gray-900">Interactive elements</h2>
    <div class="flex flex-wrap gap-6">
      <div class="flex flex-col items-center gap-2">
        <div
          :ref="fast.elementRef"
          class="w-28 h-28 flex items-center justify-center text-xs font-medium text-gray-800 border border-gray-300 cursor-default select-none bg-green-200"
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
          :ref="slow.elementRef"
          class="w-28 h-28 flex items-center justify-center text-xs font-medium text-gray-800 border border-gray-300 cursor-default select-none bg-amber-200"
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
          :ref="error.elementRef"
          class="w-28 h-28 flex items-center justify-center text-xs font-medium text-gray-800 border border-gray-300 cursor-default select-none bg-red-200"
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

      <div class="flex flex-col items-center gap-2">
        <div
          v-if="toggleableMounted"
          :ref="toggle.elementRef"
          class="w-28 h-28 flex items-center justify-center text-xs font-medium text-gray-800 border border-gray-300 bg-blue-200 cursor-default select-none"
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
          type="button"
          class="px-2 py-1 text-[10px] border border-gray-400 text-gray-700 hover:bg-gray-100"
          @click="toggleableMounted = !toggleableMounted"
        >
          {{ toggleableMounted ? "Unmount" : "Mount" }}
        </button>
      </div>
    </div>
  </div>
</template>
