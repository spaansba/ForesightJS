<script setup lang="ts">
import { useForesight } from "../composables/useForesight"
import { onMounted } from "vue"
import TestComponent from "../components/TestComponent.vue"

const fakePrefetch = async (label: string) => {
  console.log(`${label} prefetch start`)
  await new Promise(r => setTimeout(r, 1000))
  console.log(`${label} prefetch done`)
}

const { templateRef, state: stateA } = useForesight<InstanceType<typeof TestComponent>>({
  templateRefKey: "customComponent",
  callback: () => fakePrefetch("Simple Composable Button"),
  reactivateAfter: 2000,
})

const { state: stateB } = useForesight({
  templateRefKey: "buttonRef",
  callback: () => fakePrefetch("HTML Element Button"),
})

onMounted(() => {
  // Elementref has type safety meaning we can call exposed methods on TestComponent
  templateRef.value?.x()
})
</script>

<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold mb-6">Composable Test Page</h1>
    <p class="mb-8 text-gray-600">Testing useForesight composable</p>

    <div class="space-y-6">
      <!-- Simple usage -->
      <div>
        <h2 class="text-xl font-semibold mb-3">Simple Usage</h2>
        <TestComponent
          ref="customComponent"
          :class="[
            'px-6 py-3 text-white rounded transition-colors',
            stateA?.isPredicted ? 'bg-amber-500' : 'bg-blue-500 hover:bg-blue-600',
          ]"
        >
          Hover to Predict
        </TestComponent>
        <pre class="mt-2 text-xs font-mono text-gray-700">{{ stateA }}</pre>
      </div>
    </div>

    <div class="space-y-6">
      <!-- Simple usage -->
      <div>
        <h2 class="text-xl font-semibold mb-3">Simple Usage</h2>
        <button
          ref="buttonRef"
          :class="[
            'px-6 py-3 text-white rounded transition-colors',
            stateB?.isPredicted ? 'bg-amber-500' : 'bg-blue-500 hover:bg-blue-600',
          ]"
        >
          hits: {{ stateB?.hitCount ?? 0 }}{{ stateB?.isPredicted ? " · predicting" : "" }}
        </button>
        <pre class="mt-2 text-xs font-mono text-gray-700">{{ stateB }}</pre>
      </div>
    </div>
  </div>
</template>
