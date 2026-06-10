<script setup lang="ts">
import { ref } from "vue"
import { useForesight } from "@foresightjs/vue"
import ForesightStats from "../../../components/ForesightStats.vue"

const hitSlop = ref(20)

const { isPredicted, hitCount, isCallbackRunning, status, elementRef } = useForesight(() => ({
  callback: () => console.log("HitSlop-toggle prefetch"),
  name: "hit-slop-toggle",
  hitSlop: hitSlop.value,
}))
</script>

<template>
  <article class="flex flex-col items-start gap-3 w-56">
    <h4 class="text-sm font-medium">Dynamic hitSlop</h4>
    <p class="text-xs text-gray-500">Toggle <code>hitSlop</code> to grow the hitbox in place.</p>
    <button
      type="button"
      :ref="elementRef"
      :class="[
        'flex items-center justify-center size-40 text-sm font-medium text-white',
        isPredicted ? 'bg-amber-500' : 'bg-indigo-400 hover:bg-indigo-500',
      ]"
    >
      hitSlop: {{ hitSlop }}px
    </button>
    <ForesightStats :is-predicted :hit-count :is-callback-running :status />
    <button
      type="button"
      class="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
      @click="hitSlop = hitSlop === 20 ? 100 : 20"
    >
      hitSlop: {{ hitSlop }}px
    </button>
  </article>
</template>
