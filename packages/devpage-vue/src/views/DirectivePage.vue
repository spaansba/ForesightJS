<script setup lang="ts">
const handlePrefetch = () => {
  console.log("Button with options hovered")
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-8">
    <h1 class="text-xl font-semibold mb-1">Directive test page</h1>
    <p class="mb-8 text-sm text-gray-600">Testing v-foresight directive.</p>

    <section class="border-t border-gray-300 py-8 flex flex-wrap gap-x-6 gap-y-8">
      <article class="flex flex-col items-start gap-3 w-56">
        <h4 class="text-sm font-medium">Simple callback</h4>
        <button
          v-foresight="() => console.log('Simple Button')"
          class="flex items-center justify-center size-40 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium"
        >
          Hover to predict
        </button>
        <p class="text-xs text-gray-600">Pass a function as the directive value.</p>
      </article>

      <article class="flex flex-col items-start gap-3 w-56">
        <h4 class="text-sm font-medium">With options</h4>
        <button
          v-foresight="{
            callback: handlePrefetch,
            hitSlop: { top: 20, bottom: 20, left: 20, right: 20 },
            name: 'button-with-options',
            reactivateAfter: 3000,
          }"
          class="flex items-center justify-center size-40 bg-green-500 hover:bg-green-600 text-white text-sm font-medium"
        >
          Large hit area
        </button>
        <p class="text-xs text-gray-600">
          hitSlop, name and reactivateAfter set via options object.
        </p>
      </article>
    </section>
  </div>
</template>
