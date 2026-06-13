<script setup lang="ts">
import { RouterView } from "vue-router"
import ForesightRouterLink from "./components/ForesightRouterLink.vue"
import { routeImports } from "./router"
</script>

<template>
  <div class="min-h-screen bg-stone-50 text-gray-900">
    <header class="bg-white border-b border-gray-300 sticky top-0 z-10">
      <div class="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <h1 class="text-base font-semibold">ForesightJS Vue</h1>
        <nav class="flex items-center gap-4 text-sm">
          <ForesightRouterLink
            to="/"
            name="nav-directive"
            :on-prefetch="routeImports['/']"
            class="text-gray-700 hover:text-gray-900"
            active-class="text-gray-900 font-medium"
          >
            Directive
          </ForesightRouterLink>
          <ForesightRouterLink
            to="/composable"
            name="nav-composable"
            :on-prefetch="routeImports['/composable']"
            class="text-gray-700 hover:text-gray-900"
            active-class="text-gray-900 font-medium"
          >
            Composable
          </ForesightRouterLink>
          <ForesightRouterLink
            to="/events"
            name="nav-events"
            :on-prefetch="routeImports['/events']"
            class="text-gray-700 hover:text-gray-900"
            active-class="text-gray-900 font-medium"
          >
            Events
          </ForesightRouterLink>
          <ForesightRouterLink
            to="/detach"
            name="nav-detach"
            :on-prefetch="routeImports['/detach']"
            class="text-gray-700 hover:text-gray-900"
            active-class="text-gray-900 font-medium"
          >
            Detach &amp; Reattach
          </ForesightRouterLink>
          <ForesightRouterLink
            to="/mass"
            name="nav-mass"
            :on-prefetch="routeImports['/mass']"
            class="text-gray-700 hover:text-gray-900"
            active-class="text-gray-900 font-medium"
          >
            Mass test
          </ForesightRouterLink>
        </nav>
      </div>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>
