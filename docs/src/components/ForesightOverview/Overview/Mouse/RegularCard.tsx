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
    <button className={styles.cardContent} onClick={handleClick}>
      <BaseCard
        isLoaded={isLoaded}
        isLoading={isLoading}
        text={
          <span>
            <b>Click</b> to prefetch
          </span>
        }
      />
    </button>
  )
}
