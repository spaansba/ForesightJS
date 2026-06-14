import { Foresight } from "@foresightjs/react"
import React from "react"
import styles from "./styles.module.css"

const SmallButton = ({ index }: { index: number }) => {
  return (
    <Foresight
      as="button"
      callback={async () => {
        const randomTime = Math.floor(Math.random() * 250) + 50
        await new Promise(resolve => setTimeout(resolve, randomTime))
      }}
      hitSlop={0}
      reactivateAfter={8000}
      meta={{ buttonNr: index }}
      className={styles.smallButton}
      id={`button-${index}`}
    >
      {({ isCallbackRunning, isPredicted, durationMs }) => {
        const isLoading = isCallbackRunning
        const isLoaded = isPredicted && !isCallbackRunning

        const state = isLoading ? "Fetching..." : isLoaded ? "Fetched" : "Element"

        return (
          <div className={styles.buttonContent}>
            <div className={styles.buttonText}>{state}</div>

            {isLoaded && (
              <>
                <div className={styles.timeSmall}>{Math.round(durationMs ?? 0)}ms</div>
                <div className={styles.checkmark}>✓</div>
              </>
            )}
          </div>
        )
      }}
    </Foresight>
  )
}

export default SmallButton
