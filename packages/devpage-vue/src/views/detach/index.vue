<script setup lang="ts">
import { ref } from "vue"
import KeepAliveTarget from "./partials/KeepAliveTarget.vue"
import TeleportTarget from "./partials/TeleportTarget.vue"

const tab = ref<"foresight" | "other">("foresight")
const teleported = ref(false)

const tabClass = (value: typeof tab.value) => [
  "px-3 py-1.5 text-sm border",
  tab.value === value
    ? "bg-gray-900 text-white border-gray-900"
    : "border-gray-400 text-gray-800 hover:bg-gray-100",
]
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-8">
    <h1 class="text-xl font-semibold mb-1">Detach &amp; Reattach</h1>
    <p class="mb-8 text-sm text-gray-600">
      ForesightJS keeps tracking an element across DOM detach/reattach. When an element leaves the
      DOM it is <strong>parked</strong> (kept registered but inactive) and
      <strong>resumed</strong> when it reconnects, so prediction keeps working without
      re-registering. Two common cases that do this are <code>&lt;KeepAlive&gt;</code> and
      <code>&lt;Teleport&gt;</code>.
    </p>

    <!-- KeepAlive -->
    <section class="mb-12">
      <h2 class="text-lg font-semibold mb-1">KeepAlive</h2>
      <p class="mb-4 text-sm text-gray-600">
        The foresight targets (1 <code>useForesight</code>, 2 <code>useForesights</code>, 1
        <code>v-foresight</code> directive) live inside <code>&lt;KeepAlive&gt;</code>. Switching to
        the other tab <strong>deactivates</strong> the component and detaches its DOM; the manager
        parks the elements. Switching back <strong>reactivates</strong> the cached instance and
        resumes them, so prediction keeps working after every switch.
      </p>
      <p class="mb-4 text-xs text-gray-500">
        To verify: hover a target (watch <code>predicted</code>), switch to "Other tab", switch
        back, then hover again. It should still predict and keep counting hits.
      </p>

      <div class="flex gap-2 mb-2">
        <button type="button" :class="tabClass('foresight')" @click="tab = 'foresight'">
          Foresight tab
        </button>
        <button type="button" :class="tabClass('other')" @click="tab = 'other'">Other tab</button>
      </div>

      <div class="border-t border-gray-300 py-6">
        <KeepAlive>
          <KeepAliveTarget v-if="tab === 'foresight'" />
          <p v-else class="text-sm text-gray-500">
            Other tab, the foresight target is deactivated (cached, DOM detached) (see devtools).
          </p>
        </KeepAlive>
      </div>
    </section>

    <!-- Teleport -->
    <section>
      <h2 class="text-lg font-semibold mb-1">Teleport</h2>
      <p class="mb-4 text-sm text-gray-600">
        The same registered element is <code>&lt;Teleport&gt;</code>ed between its inline slot and a
        separate container. Teleporting <strong>reparents</strong> the DOM node without re-creating
        the component, so the registration follows it to its new location and prediction keeps
        working wherever it lives.
      </p>
      <p class="mb-4 text-xs text-gray-500">
        To verify: hover the target, toggle the teleport, then hover again at its new spot. It
        should still predict and keep counting hits.
      </p>

      <div class="flex gap-2 mb-4">
        <button
          type="button"
          class="px-3 py-1.5 text-sm border border-gray-400 text-gray-800 hover:bg-gray-100"
          @click="teleported = !teleported"
        >
          {{ teleported ? "Teleport back inline" : "Teleport to container" }}
        </button>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div id="teleport-dest" class="border border-dashed border-gray-300 p-4 min-h-44">
          <p class="mb-3 text-xs font-medium text-gray-500">
            Teleport container {{ teleported ? "(holds the target)" : "(empty)" }}
          </p>
        </div>
        <div class="border border-dashed border-gray-300 p-4 min-h-44">
          <p class="mb-3 text-xs font-medium text-gray-500">
            Inline slot {{ teleported ? "(empty)" : "(holds the target)" }}
          </p>
          <!-- `defer` lets the #teleport-dest sibling (rendered by this same
               component) resolve as a target. Without it Vue can't find the target
               at mount time and the node never moves. Requires Vue 3.5+. -->
          <Teleport defer to="#teleport-dest" :disabled="!teleported">
            <TeleportTarget />
          </Teleport>
        </div>
      </div>
    </section>
  </div>
</template>
