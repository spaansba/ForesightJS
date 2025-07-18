import Layout from "@theme/Layout"
import type { ReactNode } from "react"
import DemoWrapper from "../components/ForesightOverview/Overview/DemoWrapper"
import { Hero } from "../components/Hero/Hero"
import { Features } from "../components/Features/Features"
import { QuickStart } from "../components/QuickStart/QuickStart"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

export default function Home(): ReactNode {
  const queryClient = new QueryClient()
  return (
    <Layout
      title=""
      description="ForesightJS is a lightweight JavaScript library that predicts user intent based on mouse movements and keyboard navigation, enabling optimal prefetching timing and improved performance."
    >
      <QueryClientProvider client={queryClient}>
        <Hero />

        <main>
          <Features />
          <DemoWrapper />
          <QuickStart />
        </main>
      </QueryClientProvider>
    </Layout>
  )
}
