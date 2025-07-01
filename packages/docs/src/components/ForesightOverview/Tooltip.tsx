import { useState } from "react"
import styles from "./styles.module.css"
import { ReactNode } from "react"

interface TooltipProps {
  children: ReactNode
  content: string
  position?: "top" | "bottom" | "left" | "right"
}

function Tooltip({ children, content, position = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
      {children}
      {isVisible && (
        <div
          className={`${styles.tooltip} ${
            styles[`tooltip${position.charAt(0).toUpperCase() + position.slice(1)}`]
          }`}
        >
          {content}
          <div className={styles.tooltipArrow}></div>
        </div>
      )}
    </div>
  )
}

export default Tooltip
