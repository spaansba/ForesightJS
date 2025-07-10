import React, { useState } from "react"
import styles from "../../styles.module.css"
import BaseCard from "./BaseCard"

export const HoverCard = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
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
      onMouseEnter={!isLoading && !isLoaded ? handleHover : null}
      className={styles.cardContent}
    >
      <BaseCard
        isLoaded={isLoaded}
        isLoading={isLoading}
        text={
          <span>
            <b>Hover</b> to prefetch
          </span>
        }
      />
    </button>
  )
}
