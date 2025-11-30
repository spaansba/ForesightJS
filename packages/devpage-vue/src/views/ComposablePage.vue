<script setup lang="ts">
import { useForesight } from "../composables/useForesight"
import { onMounted } from "vue"
import TestComponent from "../components/TestComponent.vue"

const { templateRef } = useForesight<InstanceType<typeof TestComponent>>({
  templateRefKey: "customComponent",
  callback: () => console.log("Simple Composable Button"),
  reactivateAfter: 2000,
})

useForesight({
  templateRefKey: "buttonRef",
  callback: () => console.log("HTML Element Button"),
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
          class="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Hover to Predict
        </TestComponent>
      </div>
    </div>

    <div class="space-y-6">
      <!-- Simple usage -->
      <div>
        <h2 class="text-xl font-semibold mb-3">Simple Usage</h2>
        <button ref="buttonRef" class="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600">
          Hover to Predict
        </button>
      </div>
    </div>
  </div>
</template>
