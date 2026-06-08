<script setup lang="ts">
import { onActivated, ref } from "vue"
import FixedOptionsButton from "../../composable/partials/FixedOptionsButton.vue"
import StaticForesightTargets from "../../foresights/partials/StaticForesightTargets.vue"
import DirectiveSimple from "../../directive/partials/DirectiveSimple.vue"

// How many times this cached instance has been reactivated (without re-creating).
const activations = ref(0)
onActivated(() => activations.value++)
</script>

<template>
  <div class="flex flex-col gap-6">
    <p class="text-xs text-gray-500">
      This component has been activated <strong>{{ activations }}</strong> time(s) without being
      re-created. Prediction still works and <code>hits</code> keep counting after each
      reactivation.
    </p>

    <div class="flex flex-wrap gap-x-6 gap-y-8">
      <FixedOptionsButton />
      <StaticForesightTargets />
      <DirectiveSimple />
    </div>
  </div>
</template>
