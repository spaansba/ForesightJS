import React, { useState } from "react"
import styles from "./packagemanager.module.css"
import clsx from "clsx"
import { InstallCodeBlock } from "./InstallCodeBlock"
export function PackageManagerTabs() {
  const [activeTab, setActiveTab] = useState("pnpm")

  const tabs = [
    { id: "pnpm", label: "pnpm", command: "pnpm add js.foresight" },
    { id: "npm", label: "npm", command: "npm install js.foresight" },
    { id: "yarn", label: "Yarn", command: "yarn add js.foresight" },
  ]

  return (
    <div className={styles.packageManagerTabs}>
      <div className={styles.tabsHeader}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={clsx(styles.tabButton, activeTab === tab.id && styles.activeTab)}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.tabContent}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={clsx(styles.tabPanel, activeTab === tab.id && styles.activeTabPanel)}
          >
            {activeTab === tab.id && <InstallCodeBlock code={tab.command} />}
          </div>
        ))}
      </div>
    </div>
  )
}
