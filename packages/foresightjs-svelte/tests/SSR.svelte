<script lang="ts">
  import { createForesight, foresight, onForesightEvent } from "../src/index.js"
  const result = createForesight(() => ({ callback: () => {} }))
  const { action } = result
  onForesightEvent("elementRegistered", () => {})
</script>

<a href="/about" use:action>{String(result.state.isRegistered)}</a>
<button use:foresight={{ callback: () => {} }}>Plain action</button>
