import React, { useEffect, useState } from "react"
import { Download, Star } from "lucide-react"
import styles from "./stats.module.css"

function ForesightStats() {
  const [stats, setStats] = useState({
    npmDownloads: 0,
    githubStars: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const npmResponse = await fetch(
          "https://api.npmjs.org/downloads/point/last-year/js.foresight"
        )
        const npmData = await npmResponse.json()

        const githubResponse = await fetch("https://api.github.com/repos/spaansba/foresightjs")
        const githubData = await githubResponse.json()

        setStats({
          npmDownloads: npmData.downloads || 0,
          githubStars: githubData.stargazers_count || 0,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
        // Keep default values on error
      }
    }

    fetchStats()
  }, [])

  return (
    <section className={styles.statsSection}>
      <div className="container">
        <div className={styles.statsContainer}>
          <div
            className={styles.statItem}
            onClick={() => window.open("https://www.npmjs.com/package/js.foresight", "_blank")}
          >
            <Download className={styles.statIcon} size={20} />
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {stats.npmDownloads === 0 ? "..." : stats.npmDownloads.toLocaleString()}
              </div>
              <div className={styles.statLabel}>npm downloads</div>
            </div>
          </div>
          
          <div
            className={styles.statItem}
            onClick={() => window.open("https://github.com/spaansba/ForesightJS", "_blank")}
          >
            <Star className={styles.statIcon} size={20} />
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {stats.githubStars === 0 ? "..." : stats.githubStars.toLocaleString()}
              </div>
              <div className={styles.statLabel}>GitHub stars</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ForesightStats
