<script lang="ts">
  import { createForesight } from "@foresightjs/svelte"

  let {
    enabled,
    reactivateAfter,
    name,
  }: {
    enabled: boolean
    reactivateAfter: number
    name: string
  } = $props()
  let message = $state("Awaiting a prediction")
  const target = createForesight(() => ({
    name,
    enabled,
    reactivateAfter,
    hitSlop: 20,
    callback: async () => {
      message = `Loading ${name}…`
      await new Promise(resolve => setTimeout(resolve, 300))
      message = `${name} ready`
    },
  }))
  const { action } = target
</script>

<button type="button" use:action class:predicted={target.state.isPredicted}>
  <span class="eyebrow">{name}</span>
  <strong>{message}</strong>
  <span
    >{target.state.isCallbackRunning ? "Running" : target.state.status || "Idle"} · {target.state
      .hitCount} predictions</span
  >
</button>

<style>
  button {
    display: grid;
    gap: 1rem;
    min-height: 180px;
    width: 100%;
    text-align: left;
    padding: 1.5rem;
    color: #fafaf9;
    background: #292524;
    border: 1px solid #57534e;
    border-radius: 8px;
    transition:
      border-color 150ms,
      background 150ms;
  }
  button.predicted {
    background: #35281f;
    border-color: #ff8a58;
  }
  button:focus-visible {
    outline: 3px solid #ff8a58;
    outline-offset: 4px;
  }
  strong {
    font-size: 1.25rem;
  }
  .eyebrow {
    color: #ff8a58;
    font:
      600 0.8rem ui-monospace,
      monospace;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
</style>
