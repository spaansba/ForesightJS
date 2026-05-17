<script setup lang="ts">
import { ref } from "vue"
import { useForesights } from "@foresightjs/vue"
import ForesightStats from "../../../components/ForesightStats.vue"

const items = ref([
  { name: "about", label: "About" },
  { name: "contact", label: "Contact" },
  { name: "pricing", label: "Pricing" },
])

const elRefs = ref<(HTMLElement | null)[]>([])

const states = useForesights(
  () => elRefs.value.slice(0, items.value.length),
  () =>
    items.value.map(item => ({
      callback: () => console.log(`${item.label} prefetch`),
      name: item.name,
      hitSlop: 20,
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
  <div>
    <div class="flex gap-2 mb-4">
      <button class="px-3 py-1.5 text-xs border border-gray-300 hover:bg-gray-100" @click="addItem">
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

    <section class="flex flex-wrap gap-x-6 gap-y-8">
      <article
        v-for="(item, i) in items"
        :key="item.name"
        class="flex flex-col items-start gap-3 w-56"
      >
        <h4 class="text-sm font-medium">{{ item.label }}</h4>
        <button
          :ref="
            el => {
              elRefs[i] = el as HTMLElement
            }
          "
          :class="[
            'flex items-center justify-center size-40 text-white text-sm font-medium',
            states[i]?.isPredicted ? 'bg-amber-500' : 'bg-blue-500 hover:bg-blue-600',
          ]"
        >
          Hover to predict
        </button>
        <ForesightStats
          v-if="states[i]"
          :is-predicted="states[i].isPredicted"
          :hit-count="states[i].hitCount"
          :is-callback-running="states[i].isCallbackRunning"
          :status="states[i].status"
        />
      </article>
    </section>
  </div>
</template>
