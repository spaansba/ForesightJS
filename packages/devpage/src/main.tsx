import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { ForesightManager } from "js.foresight"
import { ForesightDevtools } from "js.foresight-devtools"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

ForesightManager.initialize({
  enableMousePrediction: true,
  positionHistorySize: 10,
  trajectoryPredictionTime: 100,
  defaultHitSlop: {
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
  },
  enableTabPrediction: false,
  tabOffset: 2,
})

ForesightDevtools.initialize({})

const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
