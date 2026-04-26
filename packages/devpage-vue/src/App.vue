<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router"
import { ForesightDevtools } from "js.foresight-devtools"

ForesightDevtools.initialize({})
</script>

<template>
  <div class="min-h-screen bg-stone-50 text-gray-900">
    <header class="bg-white border-b border-gray-300 sticky top-0 z-10">
      <div class="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <h1 class="text-base font-semibold">ForesightJS Vue Devpage</h1>
        <nav class="flex items-center gap-4 text-sm">
          <RouterLink
            to="/"
            class="text-gray-700 hover:text-gray-900"
            active-class="text-gray-900 font-medium"
          >
            Directive
          </RouterLink>
          <RouterLink
            to="/composable"
            class="text-gray-700 hover:text-gray-900"
            active-class="text-gray-900 font-medium"
          >
            Composable
          </RouterLink>
        </nav>
      </div>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>
