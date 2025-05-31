import React, { useState } from "react"
import styles from "../../styles.module.css"
import BaseCard from "./BaseCard"

export const RegularCard = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const handleClick = () => {
    if (!isLoading && !isLoaded) {
      setIsLoading(true)
      setTimeout(() => {
        setIsLoaded(true)
        setIsLoading(false)
      }, 300)
    }
  }

  return (
    <div className={styles.loadingCard}>
      <div className={styles.cardHeader} style={{ backgroundColor: "#333" }}>
        <h3>Regular</h3>
        <p>Loads only when clicked</p>
      </div>

      <div className={styles.cardContent} onClick={handleClick}>
        <BaseCard isLoaded={isLoaded} isLoading={isLoading} text="Click to load data" />
      </div>
    </div>
  )
}
