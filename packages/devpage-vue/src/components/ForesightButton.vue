<script setup lang="ts">
import { useTemplateRef } from "vue"
import { useForesight, type ForesightRegisterOptionsWithoutElement } from "@foresightjs/vue"
import ForesightStats from "./ForesightStats.vue"

const props = defineProps<{
  options: ForesightRegisterOptionsWithoutElement
  label?: string
}>()

const btnRef = useTemplateRef<HTMLButtonElement>("btn")

const { isPredicted, hitCount, isCallbackRunning, status } = useForesight(btnRef, () => props.options)
</script>

<template>
  <div class="flex flex-col items-start gap-3 w-56">
    <h4 class="text-sm font-medium">
      <slot name="title">{{ options.name ?? "Unnamed" }}</slot>
    </h4>
    <button
      ref="btn"
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
