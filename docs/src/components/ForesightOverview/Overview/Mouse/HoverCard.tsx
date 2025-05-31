import React, { useState, useRef } from "react"
import styles from "../../styles.module.css"
import BaseCard from "./BaseCard"

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
      }, 300)
    }
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
        <BaseCard isLoaded={isLoaded} isLoading={isLoading} text="Hover to load data" />
      </div>
    </div>
  )
}
