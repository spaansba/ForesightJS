import React from "react"
import styles from "./styles.module.css"
import SmallButton from "./SmallButton"

function KeyboardCardsWrapper() {
  const buttonIds = Array.from({ length: 25 }, (_, i) => `btn-${i + 1}`)
  return (
    <div className={styles.container}>
      <div className={styles.buttonGrid}>
        {buttonIds.map((id, index) => (
          <SmallButton key={id} index={index + 1} />
        ))}
      </div>
    </div>
  )
}

export default KeyboardCardsWrapper
