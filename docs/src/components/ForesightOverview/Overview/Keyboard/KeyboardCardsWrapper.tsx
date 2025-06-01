import React from "react"
import styles from "./styles.module.css"
import SmallButton from "./SmallButton"

function KeyboardCardsWrapper() {
  return (
    <div className={styles.container}>
      <div className={styles.buttonGrid}>
        {Array.from({ length: 25 }, (_, index) => (
          <SmallButton index={index + 1} />
        ))}
      </div>
    </div>
  )
}

export default KeyboardCardsWrapper
