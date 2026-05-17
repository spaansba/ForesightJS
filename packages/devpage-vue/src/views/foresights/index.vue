<script setup lang="ts">
import DynamicForesightList from "./partials/DynamicForesightList.vue"
import StaticForesightTargets from "./partials/StaticForesightTargets.vue"
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-8">
    <h1 class="text-xl font-semibold mb-1">useForesights</h1>
    <p class="mb-8 text-sm text-gray-600">
      Same API as useForesight, just with arrays. Supports dynamic lists and static targets.
    </p>

    <h2 class="text-lg font-medium mb-2">Dynamic list</h2>
    <section class="border-t border-gray-300 py-8">
      <DynamicForesightList />
    </section>

    <h2 class="text-lg font-medium mt-8 mb-2">Static targets</h2>
    <p class="mb-4 text-sm text-gray-600">
      Pass existing element refs directly — no callback refs needed.
    </p>
    <section class="border-t border-gray-300 py-8">
      <StaticForesightTargets />
    </section>
  </div>
</template>
