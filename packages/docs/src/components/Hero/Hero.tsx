import Link from "@docusaurus/Link"
import { ForesightManager } from "js.foresight"
import { Star, Download } from "lucide-react"
import { useEffect, useState } from "react"
import styles from "./hero.module.css"
import { PackageManagerTabs } from "./PackageManagerTabs"
import { ForesightDevtools } from "js.foresight-devtools"
export function Hero() {
  const [stats, setStats] = useState({
    githubStars: 0,
    npmDownloads: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [githubResponse, npmResponse] = await Promise.all([
          fetch("https://api.github.com/repos/spaansba/foresightjs"),
          fetch("https://api.npmjs.org/downloads/point/last-year/js.foresight"),
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
  })

  ForesightDevtools.initialize({
    showNameTags: false,
    isControlPanelDefaultMinimized: false,
    logging: { callbackCompleted: true, callbackInvoked: true, managerSettingsChanged: true },
  })

  const turnOffDebugMode = () => {
    ForesightDevtools.instance.alterDebuggerSettings({
      showDebugger: false,
    })
  }

  return (
    <>
      <section className={styles.heroSection}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                Your User's Next Move.
                <br />
                <span className={styles.heroTitleGradient}>Already Fetched.</span>
              </h1>
              <p className={styles.heroDescription}>
                ForesightJS predicts user intent from mouse and keyboard cues to deliver instant
                navigation with zero waste.
              </p>

              <div className={styles.heroActions}>
                <Link
                  className={styles.primaryButton}
                  to="/docs/getting_started"
                  onClick={turnOffDebugMode}
                >
                  Get Started
                </Link>
              </div>

              {(stats.githubStars > 0 || stats.npmDownloads > 0) && (
                <div className={styles.heroStats}>
                  {stats.githubStars > 0 && (
                    <a
                      className={styles.stat}
                      href="https://github.com/spaansba/ForesightJS"
                      target="_blank"
                    >
                      <Star size={16} className={styles.statIcon} />
                      <span>{stats.githubStars.toLocaleString()} Stars on GitHub</span>
                    </a>
                  )}
                  {stats.npmDownloads > 0 && (
                    <a
                      className={styles.stat}
                      href="https://www.npmjs.com/package/js.foresight"
                      target="_blank"
                    >
                      <Download size={16} className={styles.statIcon} />
                      <span>{stats.npmDownloads.toLocaleString()} Went Before You</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className={styles.heroDemo}>
              <PackageManagerTabs />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
