import { useState } from "react"
import styles from "./packagemanager.module.css"

const packageManagers = [
  { name: "pnpm", command: "pnpm add js.foresight" },
  { name: "npm", command: "npm install js.foresight" },
  { name: "yarn", command: "yarn add js.foresight" },
]

export function PackageManagerTabs() {
  const [activeTab, setActiveTab] = useState(0)

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
        <code className={styles.codeBlock}>
          {packageManagers[activeTab].command}
        </code>
      </div>
    </div>
  )
}