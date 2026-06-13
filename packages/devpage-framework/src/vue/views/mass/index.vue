<script setup lang="ts">
import { ref } from "vue"
import { Foresight } from "@foresightjs/vue"

const resetKey = ref(0)
const hitCount = ref(0)
const buttonCount = ref(1000)

const onHit = () => {
  hitCount.value++
}

const resetTest = () => {
  resetKey.value++
  hitCount.value = 0
}

const setCount = (value: number) => {
  buttonCount.value = Math.max(1, Math.min(10000, value || 1))
}
</script>

<template>
  <main class="max-w-6xl mx-auto px-6 py-8">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold mb-1">Mass performance test</h1>
        <p class="text-sm text-gray-600">
          {{ buttonCount.toLocaleString() }} registered elements. Hover to trigger callbacks.
        </p>
      </div>
      <div class="flex items-center gap-4 text-sm">
        <span class="text-xs text-gray-700 font-mono">{{ hitCount }} hits</span>
        <label class="flex items-center gap-2 text-xs text-gray-700">
          Count
          <input
            type="number"
            :value="buttonCount"
            min="1"
            max="10000"
            class="w-20 px-2 py-1 text-xs border border-gray-400 focus:outline-none"
            @input="setCount(Number(($event.target as HTMLInputElement).value))"
          />
        </label>
        <button
          type="button"
          class="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
          @click="resetTest"
        >
          Reset test
        </button>
      </div>
    </div>

    <!-- Re-keying the container on reset re-mounts every button, clearing state. -->
    <div :key="resetKey" class="flex flex-wrap gap-1">
      <Foresight
        v-for="i in buttonCount"
        :key="i"
        :hit-slop="0"
        :callback="onHit"
        #default="{ elementRef, isPredicted }"
      >
        <button
          type="button"
          :ref="elementRef"
          :class="[
            'flex justify-center items-center size-10 text-xs font-medium border',
            isPredicted
              ? 'bg-emerald-500 text-white border-emerald-600'
              : 'bg-white text-gray-700 border-gray-300',
          ]"
        >
          {{ i - 1 }}
        </button>
      </Foresight>
    </div>
  </main>
</template>
