import { ForesightManager } from "js.foresight"
import React, { useEffect, useRef, useState } from "react"
import styles from "../../styles.module.css"
import BaseCard from "./BaseCard"
export const ForesightCard = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const cardRef = useRef<HTMLDivElement | null>(null)

  const callback = () => {
    if (!isLoading && !isLoaded) {
      setIsLoading(true)
      setTimeout(() => {
        setIsLoaded(true)
        setIsLoading(false)
      }, 300)
    }
  }
  useEffect(() => {
    if (cardRef.current) {
      const { unregister } = ForesightManager.instance.register({
        element: cardRef.current,
        callback,
        hitSlop: { left: 80, top: 100, right: 60, bottom: 100 },
        name: "foresight-card",
        unregisterOnCallback: true,
      })

      return () => unregister()
    }
  }, [cardRef])

  return (
    <div ref={cardRef} className={styles.loadingCard}>
      <div className={styles.cardHeader} style={{ backgroundColor: "#3498db" }}>
        <h3>ForesightJS</h3>
        <p>Loads on predicted intent</p>
      </div>

      <div className={styles.cardContent}>
        <BaseCard
          isLoaded={isLoaded}
          isLoading={isLoading}
          text="Move your cursor toward this card"
        />
      </div>
    </div>
  )
}
