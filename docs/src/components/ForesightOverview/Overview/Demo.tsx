import { ForesightManager } from "js.foresight"
import React, { useEffect, useRef, useState } from "react"
import styles from "../styles.module.css"

export const Demo = () => {
  const [activeButtons, setActiveButtons] = useState({})

  const handleActivation = (name) => {
    setActiveButtons((prev) => ({
      ...prev,
      [name]: true,
    }))

    setTimeout(() => {
      setActiveButtons((prev) => ({
        ...prev,
        [name]: false,
      }))
    }, 1000)
  }

  return (
    <>
      {[
        { name: "button-1", color: "#3498db", label: "No Hit Slop" },
        { name: "button-2", color: "#e74c3c", label: "Small (20px)", hitSlop: 30 },
        { name: "button-3", color: "#2ecc71", label: "Medium (40px)", hitSlop: 60 },
        {
          name: "button-4",
          color: "#9b59b6",
          label: "Custom",
          hitSlop: { top: 70, left: 20, right: 20, bottom: 120 },
        },
      ].map((button) => (
        <React.Fragment key={button.name}>
          <ForesightButton
            name={button.name}
            color={button.color}
            label={button.label}
            isActive={activeButtons[button.name] || false}
            onActivation={() => handleActivation(button.name)}
            hitSlop={button.hitSlop}
          />
        </React.Fragment>
      ))}
    </>
  )
}

const ForesightButton = ({ name, color, label, isActive, onActivation, hitSlop }) => {
  const buttonRef = useRef(null)

  useEffect(() => {
    if (buttonRef.current) {
      const unregister = ForesightManager.instance.register(
        buttonRef.current,
        onActivation,
        hitSlop,
        name,
        false
      )

      return () => unregister()
    }
  }, [buttonRef, name, onActivation, hitSlop])

  return (
    <button
      ref={buttonRef}
      className={`${styles.previewButton} ${isActive ? styles.activated : ""}`}
      style={{
        backgroundColor: color,
        boxShadow: isActive ? `0 0 20px ${color}` : "none",
      }}
    >
      {label}
    </button>
  )
}
