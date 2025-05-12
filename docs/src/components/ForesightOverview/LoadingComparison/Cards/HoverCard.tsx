import React, { useState, useRef } from "react"
import styles from "../../styles.module.css"

export const HoverCard = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadTime, setLoadTime] = useState(null)
  const cardRef = useRef(null)

  const handleHover = () => {
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
    <div
      ref={cardRef}
      className={styles.loadingCard}
      onMouseEnter={!isLoading && !isLoaded ? handleHover : null}
    >
      <div className={styles.cardHeader} style={{ backgroundColor: "#9b59b6" }}>
        <h3>On Hover</h3>
        <p>Loads when hovered</p>
      </div>

      <div className={styles.cardContent}>
        {isLoading ? (
          <div className={styles.cardState}>
            <div className={styles.loadingSpinner} style={{ borderTopColor: "#9b59b6" }}></div>
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
            <p>Hover to load data</p>
          </div>
        )}
      </div>
    </div>
  )
}
