<script setup lang="ts">
import { ref } from "vue"
import { Foresight } from "@foresightjs/vue"
import ForesightStats from "../../../components/ForesightStats.vue"
import { useReactivateAfter } from "../../../composables/useReactivateAfter"

const reactivateAfter = useReactivateAfter()

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const items = ref([
  {
    name: "prefetch-route",
    label: "Prefetch route",
    color: "bg-blue-500 hover:bg-blue-600",
    callback: async () => {
      await sleep(100)
      console.log("Prefetched /dashboard route bundle")
    },
  },
  {
    name: "preload-image",
    label: "Preload image",
    color: "bg-emerald-500 hover:bg-emerald-600",
    callback: async () => {
      await sleep(300)
      console.log("Preloaded hero-banner.webp")
    },
  },
  {
    name: "warm-api",
    label: "Warm API cache",
    color: "bg-violet-500 hover:bg-violet-600",
    callback: async () => {
      await sleep(500)
      console.log("Warmed /api/user/profile cache")
    },
  },
])

let nextId = 4
const addItem = () => {
  const id = nextId++
  const delayMs = 200 + Math.round(Math.random() * 800)
  items.value = [
    ...items.value,
    {
      name: `task-${id}`,
      label: `Task ${id} (${delayMs}ms)`,
      color: "bg-gray-500 hover:bg-gray-600",
      callback: async () => {
        await sleep(delayMs)
        console.log(`Task ${id} completed in ${delayMs}ms`)
      },
    },
  ]
}

const removeItem = () => {
  if (items.value.length > 1) {
    items.value = items.value.slice(0, -1)
  }
}
</script>

<template>
  <div>
    <div class="flex gap-2 mb-4">
      <button
        type="button"
        class="px-3 py-1.5 text-xs border border-gray-300 hover:bg-gray-100"
        @click="addItem"
      >
        Add item
      </button>
      <button
        type="button"
        class="px-3 py-1.5 text-xs border border-gray-300 hover:bg-gray-100"
        @click="removeItem"
      >
        Remove item
      </button>
      <span class="self-center text-xs text-gray-500">{{ items.length }} items</span>
    </div>

    <section class="flex flex-wrap gap-x-6 gap-y-8">
      <article v-for="item in items" :key="item.name" class="flex flex-col items-start gap-3 w-56">
        <h4 class="text-sm font-medium">{{ item.label }}</h4>
        <Foresight
          :foresight-name="item.name"
          :callback="item.callback"
          :reactivate-after
          #default="{ elementRef, isPredicted, hitCount, isCallbackRunning, status }"
        >
          <button
            type="button"
            :ref="elementRef"
            :class="[
              'flex items-center justify-center size-40 text-white text-sm font-medium',
              item.color,
            ]"
          >
            Hover to predict
          </button>
          <ForesightStats :is-predicted :hit-count :is-callback-running :status />
        </Foresight>
      </article>
    </section>
  </div>
</template>
