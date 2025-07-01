import { ForesightManager } from "js.foresight"
import React, { useEffect, useRef, useState } from "react"
import styles from "./styles.module.css"
function SmallButton({ index }: { index: number }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const cardRef = useRef<HTMLButtonElement | null>(null)

  const state = () => {
    if (isLoading) {
      return "Fetching..."
    }
    if (isLoaded) {
      return "Fetched"
    }
    return "Element"
  }

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
        hitSlop: 0,
        unregisterOnCallback: true,
      })

      return () => unregister()
    }
  }, [cardRef])

  return (
    <button
      ref={cardRef}
      className={`${styles.smallButton} ${
        isLoading ? styles.loading : isLoaded ? styles.loaded : styles.default
      }`}
      id={`button-${index}`}
    >
      <div className={styles.buttonContent}>
        <div className={styles.buttonText}>{state()}</div>
        {isLoading && (
          <div className={styles.loadingIndicator}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        {isLoaded && <div className={styles.checkmark}>✓</div>}
      </div>
    </button>
  )
}

export default SmallButton
