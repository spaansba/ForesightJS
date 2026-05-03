<script setup lang="ts">
import { ref, shallowRef } from "vue"
import { useForesight, type UseForesightOptions } from "@foresightjs/vue"
import ForesightStats from "../components/ForesightStats.vue"

const fakePrefetch = async (label: string) => {
  console.log(`${label} prefetch start`)
  await new Promise(r => setTimeout(r, 1000))
  console.log(`${label} prefetch done`)
}

// All three buttons have reactive STATE output (isPredicted, hitCount, etc. always update).
// The difference is how the INPUT OPTIONS are passed, which controls whether
// the options themselves can be changed reactively after setup.

// 1. Plain object -> options are fixed, cannot be changed after setup
const {
  isPredicted: isPredictedA,
  hitCount: hitCountA,
  isCallbackRunning: isRunningA,
  status: statusA,
} = useForesight({
  templateRefKey: "plainObj",
  callback: () => fakePrefetch("Plain object"),
  name: "plain-object",
})

// 2. Ref -> swap the entire options object at once
const optionsA: UseForesightOptions = {
  templateRefKey: "refBtn",
  callback: () => fakePrefetch("Ref A"),
  name: "ref-a",
  reactivateAfter: Infinity,
}     
const optionsB: UseForesightOptions = {
  templateRefKey: "refBtn",
  callback: () => fakePrefetch("Ref B"),
  name: "ref-b",
  reactivateAfter: 1000,
}
const refOptions = shallowRef(optionsA)
const {
  isPredicted: isPredictedB,
  hitCount: hitCountB,
  isCallbackRunning: isRunningB,
  status: statusB,
} = useForesight(refOptions)

const swapRefOptions = () => {
  refOptions.value = refOptions.value === optionsA ? optionsB : optionsA
}

// 3. Getter -> reactive dependencies tracked automatically
const reactivateAfter = ref(Infinity)
const {
  isPredicted: isPredictedC,
  hitCount: hitCountC,
  isCallbackRunning: isRunningC,
  status: statusC,
} = useForesight(() => ({
  templateRefKey: "getterBtn",
  callback: () => fakePrefetch("Getter"),
  name: "getter",
  reactivateAfter: reactivateAfter.value,
}))

const toggleReactivation = () => {
  reactivateAfter.value = reactivateAfter.value === Infinity ? 2000 : Infinity
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-8">
    <h1 class="text-xl font-semibold mb-1">Composable test page</h1>
    <p class="mb-8 text-sm text-gray-600">
      State output (isPredicted, hitCount, etc.) is always reactive.
      The three input forms control whether the options themselves can change after setup.
    </p>

    <section class="border-t border-gray-300 py-8 flex flex-wrap gap-x-6 gap-y-8">
      <!-- 1. Plain object: options are fixed -->
      <article class="flex flex-col items-start gap-3 w-56">
        <h4 class="text-sm font-medium">Plain object</h4>
        <p class="text-xs text-gray-500">Options are fixed after setup.</p>
        <button
          ref="plainObj"
          :class="[
            'flex items-center justify-center size-40 text-white text-sm font-medium',
            isPredictedA ? 'bg-amber-500' : 'bg-blue-500 hover:bg-blue-600',
          ]"
        >
          Hover to predict
        </button>
        <ForesightStats
          :is-predicted="isPredictedA"
          :hit-count="hitCountA"
          :is-callback-running="isRunningA"
          :status="statusA"
        />
      </article>

      <!-- 2. Ref: swap entire options object -->
      <article class="flex flex-col items-start gap-3 w-56">
        <h4 class="text-sm font-medium">Ref</h4>
        <p class="text-xs text-gray-500">
          Swap entire options object. name: {{ refOptions.name }}
        </p>
        <button
          ref="refBtn"
          :class="[
            'flex items-center justify-center size-40 text-white text-sm font-medium',
            isPredictedB ? 'bg-amber-500' : 'bg-blue-500 hover:bg-blue-600',
          ]"
        >
          Hover to predict
        </button>
        <ForesightStats
          :is-predicted="isPredictedB"
          :hit-count="hitCountB"
          :is-callback-running="isRunningB"
          :status="statusB"
        />
        <button
          class="text-xs px-2 py-1 border border-gray-300 hover:bg-gray-100"
          @click="swapRefOptions"
        >
          Swap options
        </button>
      </article>

      <!-- 3. Getter: reactive deps tracked -->
      <article class="flex flex-col items-start gap-3 w-56">
        <h4 class="text-sm font-medium">Getter</h4>
        <p class="text-xs text-gray-500">
          Deps tracked automatically. reactivateAfter: {{ reactivateAfter === Infinity ? "off" : `${reactivateAfter}ms` }}
        </p>
        <button
          ref="getterBtn"
          :class="[
            'flex items-center justify-center size-40 text-white text-sm font-medium',
            isPredictedC ? 'bg-amber-500' : 'bg-blue-500 hover:bg-blue-600',
          ]"
        >
          Hover to predict
        </button>
        <ForesightStats
          :is-predicted="isPredictedC"
          :hit-count="hitCountC"
          :is-callback-running="isRunningC"
          :status="statusC"
        />
        <button
          class="text-xs px-2 py-1 border border-gray-300 hover:bg-gray-100"
          @click="toggleReactivation"
        >
          Toggle reactivation
        </button>
      </article>
    </section>
  </div>
</template>
