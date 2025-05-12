import { ForesightManager } from "js.foresight"
import React, { useEffect, useRef, useState } from "react"
import styles from "../../styles.module.css"
export const ForesightCard = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => {
    if (cardRef.current) {
      const unregister = ForesightManager.instance.register(
        cardRef.current,
        () => {
          if (!isLoading && !isLoaded) {
            setIsLoading(true)
            const startTime = performance.now()

            setTimeout(() => {
              setIsLoaded(true)
              setIsLoading(false)
            }, 250)
          }
        },
        { left: 80, top: 100, right: 60, bottom: 100 },
        "foresight-card",
        false
      )

      return () => unregister()
    }
  }, [cardRef, isLoading, isLoaded])

  return (
    <div ref={cardRef} className={styles.loadingCard}>
      <div className={styles.cardHeader} style={{ backgroundColor: "#3498db" }}>
        <h3>ForesightJS</h3>
        <p>Loads on predicted intent</p>
      </div>

      <div className={styles.cardContent}>
        {isLoading ? (
          <div className={styles.cardState}>
            <div className={styles.loadingSpinner} style={{ borderTopColor: "#3498db" }}></div>
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
            <p>Move your cursor toward this card</p>
          </div>
        )}
      </div>
    </div>
  )
}
