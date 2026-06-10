import { useForesight } from "@foresightjs/react"
import React from "react"
import styles from "./styles.module.css"

const SmallButton = ({ index }: { index: number }) => {
  const { elementRef, isCallbackRunning, isPredicted, durationMs } =
    useForesight<HTMLButtonElement>({
      callback: async () => {
        const randomTime = Math.floor(Math.random() * 250) + 50
        await new Promise(resolve => setTimeout(resolve, randomTime))
      },
      hitSlop: 0,
      reactivateAfter: 8000,
      meta: { buttonNr: index },
    })

  const isLoading = isCallbackRunning
  const isLoaded = isPredicted && !isCallbackRunning

  const state = () => {
    if (isLoading) {
      return "Fetching..."
    }

    if (isLoaded) {
      return "Fetched"
    }

    return "Element"
  }

  return (
    <button
      ref={elementRef}
      className={`${styles.smallButton} ${
        isLoading ? styles.loading : isLoaded ? styles.loaded : styles.default
      }`}
      id={`button-${index}`}
    >
      <div className={styles.buttonContent}>
        <div className={styles.buttonText}>{state()}</div>

        {isLoaded && (
          <>
            <div className={styles.timeSmall}>{Math.round(durationMs ?? 0)}ms</div>
            <div className={styles.checkmark}>✓</div>
          </>
        )}
      </div>
    </button>
  )
}

export default SmallButton
