// react-scan must load before React does. React is imported lazily in
// mountReact(), so importing react-scan here keeps it first.
import { scan, setOptions } from "react-scan"
import "./index.css"
import { ForesightManager } from "js.foresight"
import { ForesightDevtools } from "js.foresight-devtools"
import { getReactivateAfter, setReactivateAfter, triggerReset } from "./shared/controls"

// Initialise react-scan disabled and hidden; its toolbar is only shown while
// the React demo is mounted (see activate()), never on the Vue page.
scan({ enabled: false, showToolbar: false })

// The whole point of this page: ONE ForesightManager singleton, shared by both
// frameworks. Initialise it (and the devtools) once, before anything mounts.
ForesightManager.initialize({
  enableMousePrediction: true,
  positionHistorySize: 10,
  trajectoryPredictionTime: 100,
  defaultHitSlop: { top: 10, left: 10, right: 10, bottom: 10 },
  enableTabPrediction: true,
  enableManagerLogging: false,
  tabOffset: 2,
  touchDeviceStrategy: "onTouchStart",
  minimumConnectionType: "3g",
})
ForesightDevtools.initialize({})

type Framework = "react" | "vue" | "angular"

const reactRoot = document.getElementById("react-root") as HTMLDivElement
const vueRoot = document.getElementById("vue-root") as HTMLDivElement
const angularRoot = document.getElementById("angular-root") as HTMLDivElement
const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("#toolbar .switch button"))

let active: Framework | null = null
let mounted: { unmount: () => void } | null = null

const mountReact = async () => {
  const [
    { createRoot },
    { createElement, StrictMode },
    { QueryClient, QueryClientProvider },
    { default: App },
  ] = await Promise.all([
    import("react-dom/client"),
    import("react"),
    import("@tanstack/react-query"),
    import("./react/App"),
  ])
  const queryClient = new QueryClient()
  const root = createRoot(reactRoot)
  root.render(
    createElement(
      StrictMode,
      null,
      createElement(QueryClientProvider, { client: queryClient }, createElement(App))
    )
  )
  mounted = { unmount: () => root.unmount() }
}

const mountVue = async () => {
  const [{ createApp }, { default: App }, { default: router }, { vForesight }] = await Promise.all([
    import("vue"),
    import("./vue/App.vue"),
    import("./vue/router"),
    import("@foresightjs/vue"),
  ])
  const app = createApp(App)
  app.use(router)
  app.directive("foresight", vForesight)
  app.mount(vueRoot)
  mounted = { unmount: () => app.unmount() }
}

const mountAngular = async () => {
  // Zoneless: the Angular adapter drives every template through signals, so we
  // skip zone.js entirely and avoid it monkey-patching the globals the React
  // and Vue demos share. bootstrapApplication into a fresh <app-root> gives a
  // clean mount/unmount pair (appRef.destroy) that matches the other two
  // frameworks, and its bootstrap lifecycle runs the router's initial
  // navigation once the outlet exists. A brand-new host element each mount
  // avoids stale Angular context lingering on a reused node across re-mounts.
  const [
    { bootstrapApplication },
    { provideZonelessChangeDetection },
    { provideRouter },
    { AppComponent },
    { routes },
  ] = await Promise.all([
    import("@angular/platform-browser"),
    import("@angular/core"),
    import("@angular/router"),
    import("./angular/app.component"),
    import("./angular/routes"),
  ])

  const host = document.createElement("app-root")
  angularRoot.appendChild(host)

  const appRef = await bootstrapApplication(AppComponent, {
    providers: [provideZonelessChangeDetection(), provideRouter(routes)],
  })
  mounted = {
    unmount: () => {
      appRef.destroy()
      host.remove()
    },
  }
}

const activate = async (fw: Framework) => {
  if (active === fw) {
    return
  }

  // Tear the current app down so its foresight elements unregister cleanly.
  mounted?.unmount()
  mounted = null

  reactRoot.style.display = fw === "react" ? "" : "none"
  vueRoot.style.display = fw === "vue" ? "" : "none"
  angularRoot.style.display = fw === "angular" ? "" : "none"

  // Both demos use a browser-history router; reset to "/" (a route both share)
  // so the incoming framework always boots on a valid path.
  window.history.replaceState(null, "", "/")

  active = fw
  for (const b of buttons) {
    b.classList.toggle("active", b.dataset.fw === fw)
  }
  localStorage.setItem("combined-fw", fw)

  // react-scan's toolbar belongs to the React page only.
  setOptions({ showToolbar: fw === "react" })

  if (fw === "react") {
    await mountReact()
  } else if (fw === "vue") {
    await mountVue()
  } else {
    await mountAngular()
  }
}

for (const b of buttons) {
  b.addEventListener("click", () => activate(b.dataset.fw as Framework))
}

// --- Shared controls (work on whichever framework is mounted) ---

const reactivateInput = document.getElementById("reactivate-input") as HTMLInputElement
reactivateInput.value = String(getReactivateAfter())
reactivateInput.addEventListener("input", () => {
  setReactivateAfter(Number(reactivateInput.value))
})

const resetButton = document.getElementById("btn-reset") as HTMLButtonElement
resetButton.addEventListener("click", () => triggerReset())

const debugButton = document.getElementById("btn-debug") as HTMLButtonElement
const syncDebugButton = (on: boolean) => {
  debugButton.textContent = `Debug: ${on ? "on" : "off"}`
  debugButton.classList.toggle("active", on)
}
syncDebugButton(ForesightDevtools.instance.devtoolsSettings.show.controlPanel)
debugButton.addEventListener("click", () => {
  const on = !ForesightDevtools.instance.devtoolsSettings.show.controlPanel
  ForesightDevtools.instance.alterDevtoolsSettings({
    show: {
      controlPanel: on,
      mouseTrajectory: on,
      elementOverlays: on,
      scrollTrajectory: on,
    },
  })
  syncDebugButton(on)
})

const initial = (localStorage.getItem("combined-fw") as Framework | null) ?? "react"
activate(initial)
