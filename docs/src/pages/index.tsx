import Link from "@docusaurus/Link"
import useDocusaurusContext from "@docusaurus/useDocusaurusContext"
import Heading from "@theme/Heading"
import Layout from "@theme/Layout"
import clsx from "clsx"
import { ForesightManager } from "js.foresight"
import type { ReactNode } from "react"
import DemoWrapper from "../components/ForesightOverview/Overview/DemoWrapper"
import { Overview } from "../components/ForesightOverview/Overview/Overview"
import ForesightStats from "../components/ForesightStats/ForesightStats"
import { PackageManagerTabs } from "../components/PackageManagerTabs"
import styles from "./index.module.css"

ForesightManager.initialize({
  enableMousePrediction: true,
  trajectoryPredictionTime: 80,
  resizeScrollThrottleDelay: 0,
  positionHistorySize: 20,
  defaultHitSlop: 0,
  debuggerSettings: {
    isControlPanelDefaultMinimized: true,
  },
})

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext()

  const turnOffDebugMode = () => {
    ForesightManager.instance.alterGlobalSettings({ debug: false })
  }
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">The most modern way to prefetch your data</p>

        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro"
            onClick={turnOffDebugMode}
          >
            Documentation
          </Link>
        </div>

        <div className={styles.installSection}>
          <PackageManagerTabs />
        </div>
      </div>
    </header>
  )
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext()
  return (
    <Layout
      title={``}
      description="ForesightJS is a lightweight JavaScript library that predicts user intent based on mouse movements and keyboard navigation, enabling optimal prefetching timing and improved performance."
    >
      <HomepageHeader />

      <main>
        <div className={styles.container}>
          <Overview />
          <DemoWrapper />
          <ForesightStats />
        </div>
      </main>
    </Layout>
  )
}
