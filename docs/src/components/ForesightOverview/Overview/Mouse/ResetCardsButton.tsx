import { useEffect, useRef } from "react"
import styles from "../../styles.module.css"
import { ForesightManager } from "js.foresight"

type ResetCardsButtonProps = {
  onReset: () => void
}
function ResetCardsButton({ onReset }: ResetCardsButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const { unregister } = ForesightManager.instance.register({
      element: buttonRef.current,
      callback: onReset,
      name: "reset-cards-button",
      unregisterOnCallback: false,
    })
    return () => {
      unregister()
    }
  }, [])

  return (
    <button ref={buttonRef} className={styles.resetAllButton} onClick={onReset}>
      Reset All Cards
    </button>
  )
}

export default ResetCardsButton
