import type { ReactNode } from "react"
import styles from "./styles.module.css"
import { useRef, useEffect, useState } from "react"

export default function ForesightPreview(): ReactNode {
  const [debugMode, setDebugMode] = useState(false)

  const toggleDebugMode = () => {
    const newDebugMode = !debugMode
    setDebugMode(newDebugMode)
    ForesightManager.instance.alterGlobalSettings({
      debug: newDebugMode,
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Foresight.js Interactive Demo</h2>
        <button
          className={`${styles.debugButton} ${debugMode ? styles.active : ""}`}
          onClick={toggleDebugMode}
        >
          {debugMode ? "Debug Mode: ON" : "Debug Mode: OFF"}
        </button>
      </div>
      <div className={styles.descriptionText}>
        Hover over or move your cursor toward any button to see how Foresight predicts user intent.
      </div>
      <section className={styles.features}>
        <InteractiveButton color="#3498db" label="Button 1" name="button-name" />
        <InteractiveButton color="#e74c3c" label="Button 2" />
        <InteractiveButton color="#2ecc71" label="Button 3" />
        <InteractiveButton color="#f39c12" label="Button 4" />
        <InteractiveButton color="#9b59b6" label="Button 5" />
        <InteractiveButton color="#1abc9c" label="Button 6" />
      </section>
    </div>
  )
}

interface InteractiveButtonProps {
  color: string
  label: string
  name?: string
}

function InteractiveButton({ color, label, name }: InteractiveButtonProps) {
  const [activated, setActivated] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (buttonRef.current) {
      const unregister = ForesightManager.instance.register(
        buttonRef.current,
        () => {
          setActivated(true)
          unregister()
          setTimeout(() => setActivated(false), 1000)
        },
        40, // Add hit slop of 40px around the button
        name
      )

      return () => {
        unregister()
      }
    }
  }, [buttonRef, name])

  return (
    <button
      ref={buttonRef}
      className={`${styles.previewButton} ${activated ? styles.activated : ""}`}
      style={{
        backgroundColor: color,
        boxShadow: activated ? `0 0 20px ${color}` : "none",
      }}
    >
      {label}
    </button>
  )
}
