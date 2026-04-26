<script setup lang="ts">
import { useForesight } from "../composables/useForesight"
import { onMounted, watch } from "vue"
import TestComponent from "../components/TestComponent.vue"

const fakePrefetch = async (label: string) => {
  console.log(`${label} prefetch start`)
  await new Promise(r => setTimeout(r, 1000))
  console.log(`${label} prefetch done`)
}

const { templateRef, state: stateA } = useForesight<InstanceType<typeof TestComponent>>({
  templateRefKey: "customComponent",
  callback: () => fakePrefetch("Simple Composable Button"),
  reactivateAfter: 2000,
})


const { state: stateB } = useForesight({
  templateRefKey: "buttonRef",
  callback: () => fakePrefetch("HTML Element Button"),
})

onMounted(() => {
  templateRef.value?.x()
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-8">
    <h1 class="text-xl font-semibold mb-1">Composable test page</h1>
    <p class="mb-8 text-sm text-gray-600">Testing useForesight composable.</p>

    <section class="border-t border-gray-300 py-8 flex flex-wrap gap-x-6 gap-y-8">
      <article class="flex flex-col items-start gap-3 w-56">
        <h4 class="text-sm font-medium">Custom component ref</h4>
        <TestComponent
          ref="customComponent"
          :class="[
            'flex items-center justify-center size-40 text-white text-sm font-medium',
            stateA?.isPredicted ? 'bg-amber-500' : 'bg-blue-500 hover:bg-blue-600',
          ]"
        >
          Hover to predict
        </TestComponent>
        <div class="w-56 font-mono text-[11px] border border-gray-300 divide-y divide-gray-200 bg-white">
          <div class="flex justify-between px-2 py-1">
            <span class="text-gray-500">hits</span>
            <span class="text-gray-900">{{ stateA?.hitCount ?? 0 }}</span>
          </div>
          <div class="flex justify-between px-2 py-1">
            <span class="text-gray-500">predicted</span>
            <span class="text-gray-900">{{ stateA?.isPredicted ? "yes" : "no" }}</span>
          </div>
          <div class="flex justify-between px-2 py-1">
            <span class="text-gray-500">cb running</span>
            <span class="text-gray-900">{{ stateA?.isCallbackRunning ? "yes" : "no" }}</span>
          </div>
          <div class="flex justify-between px-2 py-1">
            <span class="text-gray-500">status</span>
            <span class="text-gray-900">{{ stateA?.status ?? "—" }}</span>
          </div>
          <details>
            <summary class="px-2 py-1 cursor-pointer text-gray-500 select-none">
              full state
            </summary>
            <pre class="px-2 py-1 overflow-auto max-h-60 text-[10px] text-gray-700 border-t border-gray-200">{{
              stateA ? JSON.stringify(stateA, null, 2) : "null"
            }}</pre>
          </details>
        </div>
      </article>

      <article class="flex flex-col items-start gap-3 w-56">
        <h4 class="text-sm font-medium">HTML element ref</h4>
        <button
          ref="buttonRef"
          :class="[
            'flex items-center justify-center size-40 text-white text-sm font-medium',
            stateB?.isPredicted ? 'bg-amber-500' : 'bg-blue-500 hover:bg-blue-600',
          ]"
        >
          Hover to predict
        </button>
        <div class="w-56 font-mono text-[11px] border border-gray-300 divide-y divide-gray-200 bg-white">
          <div class="flex justify-between px-2 py-1">
            <span class="text-gray-500">hits</span>
            <span class="text-gray-900">{{ stateB?.hitCount ?? 0 }}</span>
          </div>
          <div class="flex justify-between px-2 py-1">
            <span class="text-gray-500">predicted</span>
            <span class="text-gray-900">{{ stateB?.isPredicted ? "yes" : "no" }}</span>
          </div>
          <div class="flex justify-between px-2 py-1">
            <span class="text-gray-500">cb running</span>
            <span class="text-gray-900">{{ stateB?.isCallbackRunning ? "yes" : "no" }}</span>
          </div>
          <div class="flex justify-between px-2 py-1">
            <span class="text-gray-500">status</span>
            <span class="text-gray-900">{{ stateB?.status ?? "—" }}</span>
          </div>
          <details>
            <summary class="px-2 py-1 cursor-pointer text-gray-500 select-none">
              full state
            </summary>
            <pre class="px-2 py-1 overflow-auto max-h-60 text-[10px] text-gray-700 border-t border-gray-200">{{
              stateB ? JSON.stringify(stateB, null, 2) : "null"
            }}</pre>
          </details>
        </div>
      </article>
    </section>
  </div>
</template>
