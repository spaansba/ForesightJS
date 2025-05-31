import React from "react"
import styles from "../../styles.module.css"
type BaseCardProps = {
  isLoading: boolean
  isLoaded: boolean
  text: string
}

function BaseCard({ isLoading, isLoaded, text }: BaseCardProps) {
  return (
    <>
      {isLoading ? (
        <div className={styles.cardState}>
          <p className={styles.statusText}>Loading...</p>
        </div>
      ) : isLoaded ? (
        <div className={styles.cardState}>
          <p className={styles.statusText}>PREFETCHED!</p>
        </div>
      ) : (
        <div className={styles.cardState}>
          <p className={styles.statusText}>NOT LOADED</p>
          <p>{text}</p>
        </div>
      )}
    </>
  )
}

export default BaseCard
