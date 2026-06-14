import React from "react"
import styles from "../../styles.module.css"
import BaseCard from "./BaseCard"
import { Foresight } from "@foresightjs/react"

export const ForesightCard = () => {
  return (
    <Foresight
      as="button"
      callback={async () => {
        await new Promise(resolve => setTimeout(resolve, 300))
      }}
      hitSlop={{ left: 40, top: 50, right: 30, bottom: 50 }}
      foresightName="foresight-card"
      className={styles.cardContent}
    >
      {({ isPredicted, isCallbackRunning }) => (
        <BaseCard
          isLoaded={isPredicted && !isCallbackRunning}
          isLoading={isCallbackRunning}
          text={
            <span>
              <b>ForesightJS</b> to prefetch
            </span>
          }
        />
      )}
    </Foresight>
  )
}
