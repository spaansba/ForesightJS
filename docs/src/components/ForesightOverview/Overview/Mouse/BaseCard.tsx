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
          <p className={styles.statusText}>{text}</p>
        </div>
      )}
    </>
  )
}

export default BaseCard
