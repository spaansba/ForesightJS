import type { ReactNode } from "react"
import clsx from "clsx"
import Link from "@docusaurus/Link"
import useDocusaurusContext from "@docusaurus/useDocusaurusContext"
import Layout from "@theme/Layout"
import Heading from "@theme/Heading"
import styles from "./index.module.css"
import { ForesightManager } from "js.foresight"
import { ForesightDemo } from "../components/ForesightOverview"

ForesightManager.initialize({
  enableMousePrediction: true,
  trajectoryPredictionTime: 80,
  resizeScrollThrottleDelay: 0,
  defaultHitSlop: 0,
  debuggerSettings: {
    isControlPanelDefaultMinimized: true,
  },
})

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext()
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/intro">
            Documentation
          </Link>
        </div>
      </div>
    </header>
  )
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext()
  return (
    <Layout
      title={`${siteConfig.title} - Predictive Mouse Intent Library`}
      description="ForesightJs is a library for predictive mouse intent detection, enabling optimized prefetching and improved user experience."
    >
      <HomepageHeader />
      <main>
        <ForesightDemo />
      </main>
    </Layout>
  )
}
