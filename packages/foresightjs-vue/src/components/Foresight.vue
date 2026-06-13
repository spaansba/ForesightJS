<script setup lang="ts">
import { computed, reactive, shallowRef, watchEffect } from "vue"
import { useForesight } from "../composables/useForesight"
import { resolveElement } from "../utils/resolveElement"
import { applyDataAttributes, removeDataAttributes } from "../utils/dataAttributes"
import type { ForesightOptions, ForesightProps, ForesightSlotProps, MaybeElement } from "../types"

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

// Track the resolved element for the data-attribute mirror.
const element = shallowRef<Element | null>(null)
const setRef = (el: MaybeElement) => {
  const resolved = resolveElement(el) ?? null
  if (resolved === element.value) {
    return
  }

  if (element.value) {
    removeDataAttributes(element.value)
  }

  element.value = resolved
  elementRef(el)
}

// reactive() unwraps the state refs; reads inside the slot body or the
// watchEffect are tracked fine-grained, so a slot that never reads state never
// re-renders on state changes.
const slotProps: ForesightSlotProps = reactive({ ...stateRefs, elementRef: setRef })

// `as` form only: mirror state onto data-* attributes via direct DOM mutation,
// so [data-predicted] CSS works without any re-render.
watchEffect(() => {
  if (!as || !element.value) {
    return
  }

  applyDataAttributes(element.value, slotProps)
})
</script>

<template>
  <component :is="as" v-if="as" :ref="setRef">
    <slot v-bind="slotProps" />
  </component>
  <slot v-else v-bind="slotProps" />
</template>
