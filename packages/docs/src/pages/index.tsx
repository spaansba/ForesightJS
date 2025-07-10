import Layout from "@theme/Layout"
import type { ReactNode } from "react"
import DemoWrapper from "../components/ForesightOverview/Overview/DemoWrapper"
import { Hero } from "../components/Hero/Hero"
import { Features } from "../components/Features/Features"
import { QuickStart } from "../components/QuickStart/QuickStart"

export default function Home(): ReactNode {
  return (
    <Layout
      title=""
      description="ForesightJS is a lightweight JavaScript library that predicts user intent based on mouse movements and keyboard navigation, enabling optimal prefetching timing and improved performance."
    >
      <Hero />

      <main>
        <Features />
        <DemoWrapper />
        <QuickStart />
      </main>
    </Layout>
  )
}
