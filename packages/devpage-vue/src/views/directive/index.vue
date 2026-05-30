<script setup lang="ts">
import DirectiveSimple from "./partials/DirectiveSimple.vue"
import DirectiveWithOptions from "./partials/DirectiveWithOptions.vue"
import DirectiveEnabledToggle from "./partials/DirectiveEnabledToggle.vue"
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-8">
    <h1 class="text-xl font-semibold mb-1">v-foresight</h1>
    <p class="mb-8 text-sm text-gray-600">Directive for quick registration without a composable.</p>

    <section class="border-t border-gray-300 py-8 flex flex-wrap gap-x-6 gap-y-8">
      <DirectiveSimple />
      <DirectiveWithOptions />
      <DirectiveEnabledToggle />
    </section>
  </div>
</template>
