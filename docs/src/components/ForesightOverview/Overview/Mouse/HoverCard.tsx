import React, { useState, useRef } from "react"
import styles from "../../styles.module.css"
import BaseCard from "./BaseCard"

export const HoverCard = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const cardRef = useRef(null)

  const handleHover = () => {
    if (!isLoading && !isLoaded) {
      setIsLoading(true)
      setTimeout(() => {
        setIsLoaded(true)
        setIsLoading(false)
      }, 300)
    }
  }

  return (
    <button
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
    </button>
  )
}
