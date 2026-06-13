<script setup lang="ts">
import { useReactivateAfter } from "../../../composables/useReactivateAfter"

const reactivateAfter = useReactivateAfter()
</script>

<template>
  <article class="flex flex-col items-start gap-3 w-56">
    <h4 class="text-sm font-medium">With options</h4>
    <button
      type="button"
      v-foresight="{
        callback: () => console.log('Options button hovered'),
        hitSlop: { top: 20, bottom: 40, left: 20, right: 20 },
        name: 'button-with-options',
        reactivateAfter,
      }"
      class="flex items-center justify-center size-40 bg-green-500 hover:bg-green-600 text-white text-sm font-medium"
    >
      Large hit area
    </button>
    <p class="text-xs text-gray-600">hitSlop, name and reactivateAfter set via options object.</p>
  </article>
</template>
