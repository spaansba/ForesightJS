<script setup lang="ts">
import { RouterLink } from "vue-router"
import { useForesight, type ForesightRegisterOptionsWithoutElement } from "@foresightjs/vue"

const { to, name, hitSlop, reactivateAfter, onPrefetch } = defineProps<{
  to: string
  name?: string
  hitSlop?: ForesightRegisterOptionsWithoutElement["hitSlop"]
  reactivateAfter?: number
  onPrefetch?: (to: string) => void
}>()

const { elementRef } = useForesight(() => ({
  callback: () => onPrefetch?.(to),
  name,
  hitSlop,
  reactivateAfter,
}))
</script>

<template>
  <RouterLink :ref="elementRef" :to>
    <slot />
  </RouterLink>
</template>
