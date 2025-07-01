import { useState, useEffect } from "react"
import styles from "./packagemanager.module.css"

const packageManagers = [
  { name: "pnpm", command: "pnpm add js.foresight" },
  { name: "npm", command: "npm install js.foresight" },
  { name: "yarn", command: "yarn add js.foresight" },
]

const COPY_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`

export function PackageManagerTabs() {
  const [activeTab, setActiveTab] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCopied(false)
  }, [activeTab])

  const handleCopy = () => {
    const commandToCopy = packageManagers[activeTab].command
    navigator.clipboard.writeText(commandToCopy).then(
      () => {
        setCopied(true)
        // Reset the icon back to the copy icon after 2 seconds
        setTimeout(() => setCopied(false), 2000)
      },
      (err) => {
        // You can add more robust error handling here
        console.error("Failed to copy text: ", err)
      }
    )
  }

  return (
    <div className={styles.installCode}>
      <div className={styles.tabsHeader}>
        {packageManagers.map((pm, index) => (
          <button
            key={pm.name}
            className={`${styles.tab} ${index === activeTab ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(index)}
          >
            {pm.name}
          </button>
        ))}
      </div>
      <div className={styles.codeContent}>
        <code className={styles.codeBlock}>{packageManagers[activeTab].command}</code>
        <button onClick={handleCopy} className={styles.copyButton}>
          {" "}
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
    </div>
  )
}

// SVG icon for the copy button
const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
)

// SVG icon to show after copying is successful
const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
