<script setup lang="ts">
import { defineComponent, h } from "vue"
import { Foresight } from "@foresightjs/vue"
import ForesightStats from "../../../components/ForesightStats.vue"

// TEMP: a component whose root is a DOM element, to test `as={component}`.
const ChildButton = defineComponent({
  name: "ChildButton",
  setup(_, { slots }) {
    return () => h("button", { type: "button" }, slots.default?.())
  },
})
</script>

<template>
  <section class="flex flex-wrap gap-x-6 gap-y-8">
    <article class="flex flex-col items-start gap-3 w-56">
      <h4 class="text-sm font-medium">Target A (as="button")</h4>
      <Foresight
        as="button"
        type="button"
        foresight-name="target-a"
        :callback="() => console.log('Target A prefetch')"
        class="flex items-center justify-center size-40 text-white text-sm font-medium bg-blue-500 hover:bg-blue-600 data-predicted:bg-amber-500"
        #default="{ hitCount }"
      >
        Hover to predict (hits: {{ hitCount }})
      </Foresight>
    </article>
    <article class="flex flex-col items-start gap-3 w-56">
      <h4 class="text-sm font-medium">Target B (render prop)</h4>
      <Foresight
        foresight-name="target-b"
        :callback="() => console.log('Target B prefetch')"
        #default="{ elementRef, isPredicted, hitCount, isCallbackRunning, status }"
      >
        <button
          type="button"
          :ref="elementRef"
          :class="[
            'flex items-center justify-center size-40 text-white text-sm font-medium',
            isPredicted ? 'bg-amber-500' : 'bg-blue-500 hover:bg-blue-600',
          ]"
        >
          Hover to predict
        </button>
        <ForesightStats :is-predicted :hit-count :is-callback-running :status />
      </Foresight>
    </article>
    <article class="flex flex-col items-start gap-3 w-56">
      <h4 class="text-sm font-medium">Target C (as=component)</h4>
      <Foresight
        :as="ChildButton"
        foresight-name="target-c"
        :callback="() => console.log('Target C prefetch')"
        data-testid="target-c"
        class="flex items-center justify-center size-40 text-white text-sm font-medium bg-blue-500 hover:bg-blue-600 data-predicted:bg-amber-500"
        #default="{ hitCount }"
      >
        Hover to predict (hits: {{ hitCount }})
      </Foresight>
    </article>
  </section>
</template>
