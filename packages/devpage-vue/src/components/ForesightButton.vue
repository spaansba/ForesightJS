<script setup lang="ts">
import { useForesight, type ForesightRegisterOptionsWithoutElement } from "@foresightjs/vue"
import ForesightStats from "./ForesightStats.vue"

const props = defineProps<{
  options: ForesightRegisterOptionsWithoutElement
  templateRefKey: string
  label?: string
}>()

const { isPredicted, hitCount, isCallbackRunning, status } = useForesight(() => ({
  ...props.options,
  templateRefKey: props.templateRefKey,
}))
</script>

<template>
  <div class="flex flex-col items-start gap-3 w-56">
    <h4 class="text-sm font-medium">
      <slot name="title">{{ options.name ?? "Unnamed" }}</slot>
    </h4>
    <button
      :ref="templateRefKey"
      :class="[
        'flex items-center justify-center size-40 text-white text-sm font-medium',
        isPredicted ? 'bg-amber-500' : 'bg-blue-500 hover:bg-blue-600',
      ]"
    >
      <slot>{{ label ?? "Hover to predict" }}</slot>
    </button>
    <ForesightStats
      :is-predicted="isPredicted"
      :hit-count="hitCount"
      :is-callback-running="isCallbackRunning"
      :status="status"
    />
  </div>
</template>
