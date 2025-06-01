import { ForesightManager } from "js.foresight"
import React, { useEffect, useRef, useState } from "react"
import styles from "./styles.module.css"
function SmallButton({ index }: { index: number }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const cardRef = useRef<HTMLButtonElement | null>(null)

  const state = () => {
    if (!isLoading && !isLoaded) {
      return ""
    }
    if (!isLoaded) {
      return "Loading"
    }
    return "Prefetched"
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
    <button ref={cardRef} className={styles.smallButton}>
      {state()}
    </button>
  )
}

export default SmallButton
