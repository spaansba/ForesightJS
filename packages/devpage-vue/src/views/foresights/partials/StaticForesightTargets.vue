<script setup lang="ts">
import { computed, useTemplateRef } from "vue"
import { useForesights } from "@foresightjs/vue"
import ForesightStats from "../../../components/ForesightStats.vue"

const targetA = useTemplateRef<HTMLButtonElement>("targetA")
const targetB = useTemplateRef<HTMLButtonElement>("targetB")

const states = useForesights(
  computed(() => [targetA.value, targetB.value]),
  [
    { name: "target-a", callback: () => console.log("Target A prefetch") },
    { name: "target-b", callback: () => console.log("Target B prefetch") },
  ]
)
</script>

<template>
  <section class="flex flex-wrap gap-x-6 gap-y-8">
    <article class="flex flex-col items-start gap-3 w-56">
      <h4 class="text-sm font-medium">Target A</h4>
      <button
        ref="targetA"
        :class="[
          'flex items-center justify-center size-40 text-white text-sm font-medium',
          states[0]?.isPredicted ? 'bg-amber-500' : 'bg-blue-500 hover:bg-blue-600',
        ]"
      >
        Hover to predict
      </button>
      <ForesightStats
        v-if="states[0]"
        :is-predicted="states[0].isPredicted"
        :hit-count="states[0].hitCount"
        :is-callback-running="states[0].isCallbackRunning"
        :status="states[0].status"
      />
    </article>
    <article class="flex flex-col items-start gap-3 w-56">
      <h4 class="text-sm font-medium">Target B</h4>
      <button
        ref="targetB"
        :class="[
          'flex items-center justify-center size-40 text-white text-sm font-medium',
          states[1]?.isPredicted ? 'bg-amber-500' : 'bg-blue-500 hover:bg-blue-600',
        ]"
      >
        Hover to predict
      </button>
      <ForesightStats
        v-if="states[1]"
        :is-predicted="states[1].isPredicted"
        :hit-count="states[1].hitCount"
        :is-callback-running="states[1].isCallbackRunning"
        :status="states[1].status"
      />
    </article>
  </section>
</template>
