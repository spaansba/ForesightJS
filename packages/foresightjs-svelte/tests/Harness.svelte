<script lang="ts">
  import { createForesight, foresight, onForesightEvent } from "../src/index.js"
  import type { ForesightCallback, ElementRegisteredEvent } from "js.foresight"
  import type { ForesightOptions } from "../src/index.js"

  let {
    callback,
    options = {},
    mode = "reactive",
    onRegistered = () => {},
  }: {
    callback: ForesightCallback
    options?: Partial<ForesightOptions>
    mode?: "reactive" | "action"
    onRegistered?: (event: ElementRegisteredEvent) => void
  } = $props()
  const result = createForesight(() => ({ callback, ...options }))
  const { action } = result
  let visible = $state(true)
  let key = $state(0)
  onForesightEvent("elementRegistered", event => onRegistered(event))
</script>

<button onclick={() => (visible = !visible)}>toggle</button>
<button onclick={() => (key += 1)}>replace</button>
{#if visible}
  {#key key}
    {#if mode === "reactive"}
      <a href="/about" use:action>About</a>
    {:else}
      <a href="/about" use:foresight={{ callback, ...options }}>About</a>
    {/if}
  {/key}
{/if}
<output>{JSON.stringify(result.state)}</output>
