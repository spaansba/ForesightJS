<template>
  <article class="flex flex-col items-start gap-3 w-56">
    <h4 class="text-sm font-medium">Simple callback</h4>
    <button
      v-foresight="() => console.log('Simple button hovered')"
      class="flex items-center justify-center size-40 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium"
    >
      Hover to predict
    </button>
    <p class="text-xs text-gray-600">Pass a function as the directive value.</p>
  </article>
</template>
