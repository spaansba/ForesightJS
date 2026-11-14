<script lang="ts">
  import { onMount } from "svelte"
  import { foresight, onForesightEvent } from "@foresightjs/svelte"
  import { getReactivateAfter, subscribeReactivateAfter, onReset } from "../shared/controls"
  import Target from "./Target.svelte"

  let reactivateAfter = $state(getReactivateAfter())
  let enabled = $state(true)
  let visible = $state(true)
  let generation = $state(0)
  let actionHits = $state(0)
  let registrations = $state(0)

  onMount(() => {
    const unsubscribe = subscribeReactivateAfter(() => (reactivateAfter = getReactivateAfter()))
    const reset = onReset(() => {
      actionHits = 0
    })

    return () => {
      unsubscribe()
      reset()
    }
  })
  onForesightEvent("elementRegistered", () => (registrations += 1))
</script>

<main>
  <p class="kicker">Svelte 5 · Actions + runes</p>
  <h1>Predict. Observe. React.</h1>
  <p class="intro">
    Move toward a target or Tab through the page. Toggle options, replace targets, and switch
    frameworks to inspect lifecycle cleanup in the devtools.
  </p>
  <div class="controls">
    <label><input type="checkbox" bind:checked={enabled} /> Enable predictions</label>
    <button type="button" onclick={() => (visible = !visible)}
      >{visible ? "Unmount" : "Mount"} targets</button
    >
    <button type="button" onclick={() => (generation += 1)}>Replace targets</button>
  </div>
  <p class="stats" aria-live="polite">
    New registrations observed: {registrations} · Action callbacks: {actionHits}
  </p>
  {#if visible}
    {#key generation}
      <section aria-label="Prediction targets">
        <Target {enabled} {reactivateAfter} name={`Target ${generation + 1}`} />
        <button
          type="button"
          class="action"
          use:foresight={{
            enabled,
            reactivateAfter,
            callback: () => {
              actionHits += 1
            },
          }}
        >
          Plain action — no state subscription
        </button>
      </section>
    {/key}
  {/if}
</main>

<style>
  main {
    max-width: 960px;
    margin: auto;
    padding: 4rem 1.5rem;
    color: #fafaf9;
    font-family: ui-sans-serif, system-ui, sans-serif;
  }
  .kicker {
    color: #ff8a58;
    font:
      600 0.85rem ui-monospace,
      monospace;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  h1 {
    margin: 1rem 0;
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 650;
    letter-spacing: -0.04em;
  }
  .intro {
    max-width: 650px;
    line-height: 1.7;
    color: #d6d3d1;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    margin: 2rem 0;
  }
  .controls button,
  .action {
    padding: 0.7rem 1rem;
    border: 1px solid #78716c;
    border-radius: 6px;
    background: #292524;
    color: #fafaf9;
  }
  button:focus-visible {
    outline: 3px solid #ff8a58;
    outline-offset: 4px;
  }
  .stats {
    color: #d6d3d1;
    font-family: ui-monospace, monospace;
    font-size: 0.85rem;
  }
  section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
  }
</style>
