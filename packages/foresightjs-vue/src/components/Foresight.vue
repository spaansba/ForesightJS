<script setup lang="ts">
import { computed, reactive } from "vue"
import { useForesight } from "../composables/useForesight"
import type { ForesightOptions, ForesightProps, ForesightSlotProps } from "../types"

defineSlots<{
  default?: (props: ForesightSlotProps) => unknown
}>()

defineOptions({ name: "Foresight" })

const {
  as,
  callback,
  foresightName,
  hitSlop,
  meta,
  reactivateAfter,
  enabled = undefined,
} = defineProps<ForesightProps>()

// The `satisfies` clause keeps this mapping exhaustive: when the core options
// type gains a key this stops compiling until the key is added here (and as a
// prop), so a new option can never silently fall through to the DOM element.
const options = computed(
  () =>
    ({
      callback,
      hitSlop,
      name: foresightName,
      meta,
      reactivateAfter,
      enabled,
    }) satisfies Record<keyof ForesightOptions, unknown> as ForesightOptions
)

const { elementRef, ...stateRefs } = useForesight(options)

// reactive() unwraps the state refs; reads inside the slot body are tracked
// fine-grained, so a slot that never reads state never re-renders on state
// changes.
const slotProps: ForesightSlotProps = reactive({ ...stateRefs, elementRef })
</script>

<template>
  <component :is="as" v-if="as" :ref="elementRef">
    <slot v-bind="slotProps" />
  </component>
  <slot v-else v-bind="slotProps" />
</template>
