import { useEffect, useRef } from "react"
import styles from "../../styles.module.css"
import { ForesightManager } from "js.foresight"

type ResetCardsButtonProps = {
  onReset: () => void
}
function ResetCardsButton({ onReset }: ResetCardsButtonProps) {
  return (
    <button className={styles.resetAllButton} onClick={onReset}>
      Reset All Cards
    </button>
  )
}

export default ResetCardsButton
