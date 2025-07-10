import styles from "../../styles.module.css"
import Tooltip from "../../Tooltip"

type ResetCardsButtonProps = {
  onReset: () => void
}
function ResetCardsButton({ onReset }: ResetCardsButtonProps) {
  return (
    <Tooltip content="Reset all cards and buttons to their initial state" position="top">
      <button className={styles.resetAllButton} onClick={onReset}>
        Reset Cards
      </button>
    </Tooltip>
  )
}

export default ResetCardsButton
