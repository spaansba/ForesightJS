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
        <dl
          class="w-40 font-mono text-[11px] border border-gray-300 divide-y divide-gray-200 bg-white"
        >
          <div class="flex justify-between px-2 py-1">
            <dt class="text-gray-500">hits</dt>
            <dd>{{ stateA?.hitCount ?? 0 }}</dd>
          </div>
          <div class="flex justify-between px-2 py-1">
            <dt class="text-gray-500">predicted</dt>
            <dd>{{ stateA?.isPredicted ? "yes" : "no" }}</dd>
          </div>
          <div class="flex justify-between px-2 py-1">
            <dt class="text-gray-500">status</dt>
            <dd>{{ stateA?.status ?? "—" }}</dd>
          </div>
        </dl>
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
        <dl
          class="w-40 font-mono text-[11px] border border-gray-300 divide-y divide-gray-200 bg-white"
        >
          <div class="flex justify-between px-2 py-1">
            <dt class="text-gray-500">hits</dt>
            <dd>{{ stateB?.hitCount ?? 0 }}</dd>
          </div>
          <div class="flex justify-between px-2 py-1">
            <dt class="text-gray-500">predicted</dt>
            <dd>{{ stateB?.isPredicted ? "yes" : "no" }}</dd>
          </div>
          <div class="flex justify-between px-2 py-1">
            <dt class="text-gray-500">status</dt>
            <dd>{{ stateB?.status ?? "—" }}</dd>
          </div>
        </dl>
      </article>
    </section>
  </div>
</template>
