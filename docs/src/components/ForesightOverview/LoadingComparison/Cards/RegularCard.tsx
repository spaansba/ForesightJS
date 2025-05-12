import React, { useState } from "react"
import styles from "../../styles.module.css"

export const RegularCard = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadTime, setLoadTime] = useState(null)

  const handleClick = () => {
    if (!isLoading && !isLoaded) {
      setIsLoading(true)
      const startTime = performance.now()

      setTimeout(() => {
        const endTime = performance.now()
        setLoadTime(Math.round(endTime - startTime))
        setIsLoaded(true)
        setIsLoading(false)
      }, 250)
    }
  }

  const reset = () => {
    setIsLoaded(false)
    setLoadTime(null)
  }

  return (
    <div className={styles.loadingCard}>
      <div className={styles.cardHeader} style={{ backgroundColor: "#333" }}>
        <h3>Regular</h3>
        <p>Loads only when clicked</p>
      </div>

      <div className={styles.cardContent} onClick={!isLoading && !isLoaded ? handleClick : null}>
        {isLoading ? (
          <div className={styles.cardState}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.statusText}>Loading...</p>
          </div>
        ) : isLoaded ? (
          <div className={styles.cardState}>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.statusText}>PREFETCHED!</p>
          </div>
        ) : (
          <div className={styles.cardState}>
            <div className={styles.notLoadedIcon}>✗</div>
            <p className={styles.statusText}>NOT LOADED</p>
            <p>Click to load data</p>
          </div>
        )}
      </div>
    </div>
  )
}
