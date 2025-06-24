import Link from "@docusaurus/Link"
import useDocusaurusContext from "@docusaurus/useDocusaurusContext"
import Heading from "@theme/Heading"
import clsx from "clsx"
import { ForesightManager } from "js.foresight"
import { Star, Download } from "lucide-react"
import { useEffect, useState } from "react"
import styles from "./hero.module.css"
import { PackageManagerTabs } from "./PackageManagerTabs"

export function Hero() {
  const { siteConfig } = useDocusaurusContext()
  const [stats, setStats] = useState({
    githubStars: 0,
    npmDownloads: 0,
  })
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [githubResponse, npmResponse] = await Promise.all([
          fetch("https://api.github.com/repos/spaansba/foresightjs"),
          fetch("https://api.npmjs.org/downloads/point/last-year/js.foresight")
        ])
        
        const githubData = await githubResponse.json()
        const npmData = await npmResponse.json()
        
        setStats({
          githubStars: githubData.stargazers_count || 0,
          npmDownloads: npmData.downloads || 0,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      }
    }
    fetchStats()
  }, [])
  
  ForesightManager.initialize({
    enableMousePrediction: true,
    trajectoryPredictionTime: 110,
    positionHistorySize: 14,
    defaultHitSlop: 0,
    tabOffset: 3,
    debuggerSettings: {
      isControlPanelDefaultMinimized: true,
      showNameTags: false,
    },
  })

  const turnOffDebugMode = () => {
    ForesightManager.instance.alterGlobalSettings({ debug: false })
  }

  return (
    <>
      <section className={styles.heroSection}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                Predict User Intent
                <br />
                <span className={styles.heroTitleGradient}>Before They Click</span>
              </h1>
              <p className={styles.heroDescription}>
                ForesightJS gives you the best developer experience with all the features you need for production: mouse movement prediction, keyboard navigation, and intelligent prefetching out of the box.
              </p>
              
              <div className={styles.heroActions}>
                <Link
                  className={styles.primaryButton}
                  to="/docs/getting_started"
                  onClick={turnOffDebugMode}
                >
                  Get Started
                </Link>
                <Link
                  className={styles.secondaryButton}
                  to="https://github.com/spaansba/ForesightJS"
                >
                  Learn ForesightJS
                </Link>
              </div>
              
              {(stats.githubStars > 0 || stats.npmDownloads > 0) && (
                <div className={styles.heroStats}>
                  {stats.githubStars > 0 && (
                    <div className={styles.stat}>
                      <Star size={16} className={styles.statIcon} />
                      <span>{stats.githubStars.toLocaleString()} stars on GitHub</span>
                    </div>
                  )}
                  {stats.npmDownloads > 0 && (
                    <div className={styles.stat}>
                      <Download size={16} className={styles.statIcon} />
                      <span>{stats.npmDownloads.toLocaleString()} npm downloads</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className={styles.heroDemo}>
              <div className={styles.installWrapper}>
                <PackageManagerTabs />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}