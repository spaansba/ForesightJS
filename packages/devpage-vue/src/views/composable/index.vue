<script setup lang="ts">
import StringTargetButton from "./partials/StringTargetButton.vue"
import SwappableOptionsButton from "./partials/SwappableOptionsButton.vue"
import GetterOptionsButton from "./partials/GetterOptionsButton.vue"
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-8">
    <h1 class="text-xl font-semibold mb-1">useForesight</h1>
    <p class="mb-8 text-sm text-gray-600">
      Three ways to pass options: fixed object, swappable ref, or reactive getter.
    </p>

    <section class="border-t border-gray-300 py-8 flex flex-wrap gap-x-6 gap-y-8">
      <StringTargetButton />
      <SwappableOptionsButton />
      <GetterOptionsButton />
    </section>
  </div>
</template>
