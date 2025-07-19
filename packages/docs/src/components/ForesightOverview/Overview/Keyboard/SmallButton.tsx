import { ForesightManager, type ElementReactivatedEvent } from "js.foresight"
import React, { useEffect, useRef, useState } from "react"
import styles from "./styles.module.css"
function SmallButton({ index }: { index: number }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadTime, setLoadTime] = useState<number>(0)
  const cardRef = useRef<HTMLButtonElement | null>(null)
  const stateRef = useRef({ isLoading: false, isLoaded: false })

  stateRef.current = { isLoading, isLoaded }

  const state = () => {
    if (isLoading) {
      return "Fetching..."
    }
    if (isLoaded) {
      return "Fetched"
    }
    return "Element"
  }

  function handleElementReactivated(e: ElementReactivatedEvent) {
    if (e.elementData.element === cardRef.current) {
      setIsLoaded(false)
      setIsLoading(false)
    }
  }
  useEffect(() => {
    ForesightManager.instance.addEventListener("elementReactivated", handleElementReactivated)
    return () => {
      ForesightManager.instance.removeEventListener("elementReactivated", handleElementReactivated)
    }
  }, [])

  useEffect(() => {
    if (cardRef.current) {
      const { unregister } = ForesightManager.instance.register({
        element: cardRef.current,
        callback: async () => {
          if (!stateRef.current.isLoading && !stateRef.current.isLoaded) {
            setIsLoading(true)
            const randomTime = Math.floor(Math.random() * 250) + 50
            setLoadTime(randomTime)
            await new Promise(resolve => setTimeout(resolve, randomTime))
            setIsLoading(false)
            setIsLoaded(true)
          }
        },
        hitSlop: 0,
        reactivateAfter: 8000,
        meta: { buttonNr: index },
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

        {isLoaded && (
          <>
            <div className={styles.timeSmall}>{loadTime}ms</div>
            <div className={styles.checkmark}>✓</div>
          </>
        )}
      </div>
    </button>
  )
}

export default SmallButton
