<script setup lang="ts">
defineProps<{
  isPredicted: boolean
  hitCount: number
  isCallbackRunning: boolean
  status: string | undefined
}>()
</script>

<template>
  <div class="w-56 font-mono text-[11px] border border-gray-300 divide-y divide-gray-200 bg-white">
    <div class="flex justify-between px-2 py-1">
      <span class="text-gray-500">predicted</span>
      <span class="text-gray-900">{{ isPredicted ? "yes" : "no" }}</span>
    </div>
    <div class="flex justify-between px-2 py-1">
      <span class="text-gray-500">hits</span>
      <span class="text-gray-900">{{ hitCount }}</span>
    </div>
    <div class="flex justify-between px-2 py-1">
      <span class="text-gray-500">cb running</span>
      <span class="text-gray-900">{{ isCallbackRunning ? "yes" : "no" }}</span>
    </div>
    <div class="flex justify-between px-2 py-1">
      <span class="text-gray-500">status</span>
      <span class="text-gray-900">{{ status ?? "—" }}</span>
    </div>
  </div>
</template>
