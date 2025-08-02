import Layout from "@theme/Layout"
import type { ReactNode } from "react"
import DemoWrapper from "../components/ForesightOverview/Overview/DemoWrapper"
import { Hero } from "../components/Hero/Hero"
import { Features } from "../components/Features/Features"
import { QuickStart } from "../components/QuickStart/QuickStart"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PostHogProvider } from "posthog-js/react"
import useDocusaurusContext from "@docusaurus/useDocusaurusContext"

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext()
  const queryClient = new QueryClient()
  return (
    <PostHogProvider
      apiKey={siteConfig.customFields?.POSTHOG_KEY as string}
      options={{
        api_host: siteConfig.customFields?.POSTHOG_HOST as string,
        defaults: "2025-05-24",
        capture_exceptions: true,
        debug: process.env.NODE_ENV === "development",
      }}
    >
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
    </PostHogProvider>
  )
}
