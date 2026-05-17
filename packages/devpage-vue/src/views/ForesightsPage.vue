<script setup lang="ts">
import { ref } from "vue"
import { useForesights, type UseForesightsSlot } from "@foresightjs/vue"
import ForesightStats from "../components/ForesightStats.vue"

const fakePrefetch = async (label: string) => {
  console.log(`${label} prefetch start`)
  await new Promise(resolve => setTimeout(resolve, 500))
  console.log(`${label} prefetch done`)
}

const items = ref([
  { name: "about", label: "About" },
  { name: "contact", label: "Contact" },
  { name: "pricing", label: "Pricing" },
])

const slots = useForesights(() =>
  items.value.map(item => ({
    callback: () => fakePrefetch(item.label),
    name: item.name,
    hitSlop: 20 as const,
    reactivateAfter: 2000,
  }))
)

const addItem = () => {
  const id = items.value.length + 1
  items.value = [...items.value, { name: `item-${id}`, label: `Item ${id}` }]
}

const removeItem = () => {
  if (items.value.length > 1) {
    items.value = items.value.slice(0, -1)
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-8">
    <h1 class="text-xl font-semibold mb-1">useForesights test page</h1>
    <p class="mb-4 text-sm text-gray-600">
      Registers multiple elements from a single composable. Supports dynamic array growth/shrinkage.
    </p>

    <div class="flex gap-2 mb-8">
      <button
        class="px-3 py-1.5 text-xs border border-gray-300 hover:bg-gray-100"
        @click="addItem"
      >
        Add item
      </button>
      <button
        class="px-3 py-1.5 text-xs border border-gray-300 hover:bg-gray-100"
        @click="removeItem"
      >
        Remove item
      </button>
      <span class="self-center text-xs text-gray-500">{{ items.length }} items</span>
    </div>

    <section class="border-t border-gray-300 py-8 flex flex-wrap gap-x-6 gap-y-8">
      <article
        v-for="(slot, i) in slots"
        :key="items[i]?.name ?? i"
        class="flex flex-col items-start gap-3 w-56"
      >
        <h4 class="text-sm font-medium">{{ items[i]?.label ?? `Item ${i}` }}</h4>
        <button
          :ref="(slot as UseForesightsSlot).setRef"
          :class="[
            'flex items-center justify-center size-40 text-white text-sm font-medium',
            slot.state.isPredicted ? 'bg-amber-500' : 'bg-blue-500 hover:bg-blue-600',
          ]"
        >
          Hover to predict
        </button>
        <ForesightStats
          :is-predicted="slot.state.isPredicted"
          :hit-count="slot.state.hitCount"
          :is-callback-running="slot.state.isCallbackRunning"
          :status="slot.state.status"
        />
      </article>
    </section>
  </div>
</template>
