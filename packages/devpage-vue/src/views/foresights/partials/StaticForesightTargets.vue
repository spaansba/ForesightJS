<script setup lang="ts">
import { useForesights } from "@foresightjs/vue"
import ForesightStats from "../../../components/ForesightStats.vue"

const slots = useForesights([
  { name: "target-a", callback: () => console.log("Target A prefetch") },
  { name: "target-b", callback: () => console.log("Target B prefetch") },
])
</script>

<template>
  <section class="flex flex-wrap gap-x-6 gap-y-8">
    <article class="flex flex-col items-start gap-3 w-56">
      <h4 class="text-sm font-medium">Target A</h4>
      <button
        :ref="slots[0].setRef"
        :class="[
          'flex items-center justify-center size-40 text-white text-sm font-medium',
          slots[0]?.isPredicted ? 'bg-amber-500' : 'bg-blue-500 hover:bg-blue-600',
        ]"
      >
        Hover to predict
      </button>
      <ForesightStats
        v-if="slots[0]"
        :is-predicted="slots[0].isPredicted"
        :hit-count="slots[0].hitCount"
        :is-callback-running="slots[0].isCallbackRunning"
        :status="slots[0].status"
      />
    </article>
    <article class="flex flex-col items-start gap-3 w-56">
      <h4 class="text-sm font-medium">Target B</h4>
      <button
        :ref="slots[1].setRef"
        :class="[
          'flex items-center justify-center size-40 text-white text-sm font-medium',
          slots[1]?.isPredicted ? 'bg-amber-500' : 'bg-blue-500 hover:bg-blue-600',
        ]"
      >
        Hover to predict
      </button>
      <ForesightStats
        v-if="slots[1]"
        :is-predicted="slots[1].isPredicted"
        :hit-count="slots[1].hitCount"
        :is-callback-running="slots[1].isCallbackRunning"
        :status="slots[1].status"
      />
    </article>
  </section>
</template>
