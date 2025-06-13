import React, { useEffect, useState } from "react"
import { Download, Users, Star, Package } from "lucide-react"
import styles from "./stats.module.css"

function ForesightStats() {
  const [stats, setStats] = useState({
    npmDownloads: 0,
    githubStars: 0,
    githubForks: 0,
    githubContributors: 0,
    dependents: 0,
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
          githubForks: githubData.forks_count || 0,
          githubContributors: 0, // You'll need to fetch contributors separately if needed
          dependents: 0,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
        // Keep default values on error
      }
    }

    fetchStats()
  }, [])

  return (
    <div className={styles.statsContainer}>
      <button
        className={styles.statItem}
        onClick={() => window.open("https://www.npmjs.com/package/js.foresight", "_blank")}
      >
        <Download className={styles.statIcon} size={24} />
        <div className={styles.statContent}>
          <p className={styles.statValue}>
            {stats.npmDownloads === 0 ? "Not found" : stats.npmDownloads.toLocaleString()}
          </p>
          <p className={styles.statLabel}>Downloads on npm</p>
        </div>
      </button>
      <button
        className={styles.statItem}
        onClick={() => window.open("https://github.com/spaansba/ForesightJS", "_blank")}
      >
        <Star className={styles.statIcon} size={24} />
        <div className={styles.statContent}>
          <p className={styles.statValue}>
            {stats.githubStars === 0 ? "Not found" : stats.githubStars.toLocaleString()}
          </p>
          <p className={styles.statLabel}>Stars on GitHub</p>
        </div>
      </button>
      <button
        className={styles.statItem}
        onClick={() => window.open("https://github.com/spaansba/ForesightJS", "_blank")}
      >
        <Users className={styles.statIcon} size={24} />
        <div className={styles.statContent}>
          <p className={styles.statValue}>
            {stats.githubContributors === 0
              ? "Not found"
              : stats.githubContributors.toLocaleString()}
          </p>
          <p className={styles.statLabel}>Contributors on GitHub</p>
        </div>
      </button>
    </div>
  )
}

export default ForesightStats
