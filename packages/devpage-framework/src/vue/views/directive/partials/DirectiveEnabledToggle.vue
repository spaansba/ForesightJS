<script setup lang="ts">
import { ref } from "vue"

const enabled = ref(true)
</script>

<template>
  <article class="flex flex-col items-start gap-3 w-56">
    <h4 class="text-sm font-medium">Enabled toggle</h4>
    <p class="text-xs text-gray-600">Toggle <code>enabled</code> to control registration.</p>
    <button
      type="button"
      v-foresight="{
        callback: () => console.log('Enabled-toggle directive prefetch'),
        name: 'directive-enabled-toggle',
        enabled,
      }"
      :class="[
        'flex items-center justify-center size-40 text-sm font-medium',
        enabled ? 'bg-teal-400 hover:bg-teal-500 text-white' : 'bg-gray-300 text-gray-500',
      ]"
    >
      {{ enabled ? "Hover to predict" : "Disabled" }}
    </button>
    <button
      type="button"
      class="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
      @click="enabled = !enabled"
    >
      enabled: {{ enabled ? "on" : "off" }}
    </button>
  </article>
</template>
