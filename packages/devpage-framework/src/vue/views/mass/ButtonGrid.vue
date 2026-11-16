<script setup lang="ts">
import { Foresight } from "@foresightjs/vue"

defineProps<{ buttonCount: number }>()
const emit = defineEmits<{ hit: [] }>()

const onHit = () => emit("hit")
</script>

<template>
  <div class="flex flex-wrap gap-1">
    <Foresight
      v-for="i in buttonCount"
      :key="i"
      :hit-slop="0"
      :callback="onHit"
      #default="{ elementRef, isPredicted }"
    >
      <button
        type="button"
        :ref="elementRef"
        :class="[
          'flex justify-center items-center size-10 text-xs font-medium border',
          isPredicted
            ? 'bg-emerald-500 text-white border-emerald-600'
            : 'bg-white text-gray-700 border-gray-300',
        ]"
      >
        {{ i - 1 }}
      </button>
    </Foresight>
  </div>
</template>
