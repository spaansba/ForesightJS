<script setup lang="ts">
import { vForesight } from "../directives/vForesight"
</script>

<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold mb-6">Directive Test Page</h1>
    <p class="mb-8 text-gray-600">Testing v-foresight directive</p>

    <div class="space-y-6">
      <div>
        <h2 class="text-xl font-semibold mb-3">Simple Callback</h2>
        <button
          v-foresight="() => console.log('Simple Button')"
          class="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Hover to Predict
        </button>
      </div>

      <div>
        <h2 class="text-xl font-semibold mb-3">With options</h2>
        <button
          v-foresight="{
            callback: () => console.log('Button with Hit Slop'),
            hitSlop: { top: 20, bottom: 20, left: 20, right: 20 },
            name: 'button-with-options',
            reactivateAfter: 3000,
          }"
          class="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Large Hit Area
        </button>
      </div>
    </div>
  </div>
</template>
