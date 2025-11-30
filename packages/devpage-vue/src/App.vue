<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router"
import { ForesightDevtools } from "js.foresight-devtools"

ForesightDevtools.initialize({})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-6 h-16">
          <h1 class="text-xl font-bold text-gray-900">ForesightJS Vue Devpage</h1>
          <div class="flex gap-4">
            <RouterLink
              to="/"
              class="px-4 py-2 rounded hover:bg-gray-100"
              active-class="bg-blue-100 text-blue-700"
            >
              Directive
            </RouterLink>
            <RouterLink
              to="/composable"
              class="px-4 py-2 rounded hover:bg-gray-100"
              active-class="bg-blue-100 text-blue-700"
            >
              Composable
            </RouterLink>
          </div>
        </div>
      </div>
    </nav>

    <main>
      <RouterView />
    </main>
  </div>
</template>
