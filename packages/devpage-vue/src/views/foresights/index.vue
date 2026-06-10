<script setup lang="ts">
import DynamicForesightList from "./partials/DynamicForesightList.vue"
import StaticForesightTargets from "./partials/StaticForesightTargets.vue"
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-8">
    <h1 class="text-xl font-semibold mb-1">useForesights</h1>
    <p class="mb-8 text-sm text-gray-600">
      Pass an options array, get back slots with elementRef and reactive state. Supports dynamic lists
      and static targets.
    </p>

    <h2 class="text-lg font-medium mb-2">Dynamic list</h2>
    <section class="border-t border-gray-300 py-8">
      <DynamicForesightList />
    </section>

    <h2 class="text-lg font-medium mt-8 mb-2">Static targets</h2>
    <p class="mb-4 text-sm text-gray-600">
      Bind elements via <code class="text-xs bg-gray-100 px-1 py-0.5">:ref="slots[i].elementRef"</code>
      - no separate ref management needed.
    </p>
    <section class="border-t border-gray-300 py-8">
      <StaticForesightTargets />
    </section>
  </div>
</template>
