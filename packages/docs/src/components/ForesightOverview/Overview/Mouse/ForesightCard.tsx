import React from "react"
import styles from "../../styles.module.css"
import BaseCard from "./BaseCard"
import { useForesight } from "@foresightjs/react"

export const ForesightCard = () => {
  const { elementRef, isCallbackRunning, isPredicted } = useForesight<HTMLButtonElement>({
    callback: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
    },
    hitSlop: { left: 40, top: 50, right: 30, bottom: 50 },
    name: "foresight-card",
  })

  return (
    <button ref={elementRef} className={styles.cardContent}>
      <BaseCard
        isLoaded={isPredicted && !isCallbackRunning}
        isLoading={isCallbackRunning}
        text={
          <span>
            <b>ForesightJS</b> to prefetch
          </span>
        }
      />
    </button>
  )
}
