import React from "react"
import styles from "../../styles.module.css"
import { ReactNode } from "react"
type BaseCardProps = {
  isLoading: boolean
  isLoaded: boolean
  text: ReactNode
}

function BaseCard({ isLoading, isLoaded, text }: BaseCardProps) {
  return (
    <div className={styles.cardState}>
      {isLoading ? (
        <>
          <p className={styles.statusText}>Fetching...</p>
          <div className={styles.loadingDots}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </>
      ) : isLoaded ? (
        <>
          <p className={styles.statusText}>PREFETCHED!</p>
          <div className={styles.successIndicator}>Ready to go!</div>
        </>
      ) : (
        <>
          <p className={styles.statusText}>{text}</p>
          <div className={styles.actionHint}>Try it!</div>
        </>
      )}
    </div>
  )
}

export default BaseCard
