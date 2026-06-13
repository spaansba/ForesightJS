import { onScopeDispose, ref } from "vue"
import { getReactivateAfter, subscribeReactivateAfter } from "../../shared/controls"

/** Reactive mirror of the shared top-bar "Reactivate ms" control. */
export const useReactivateAfter = () => {
  const reactivateAfter = ref(getReactivateAfter())
  const unsubscribe = subscribeReactivateAfter(() => {
    reactivateAfter.value = getReactivateAfter()
  })
  onScopeDispose(unsubscribe)

  return reactivateAfter
}
