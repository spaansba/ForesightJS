import React, { useState, useEffect, useRef } from "react"
import styles from "./styles.module.css"
import { Overview } from "./Overview/Overview"
import { LoadingComparisonWrapper } from "./LoadingComparison/LoadingComparisonWrapper"

export const ForesightDemo = () => {
  const [selectedTab, setSelectedTab] = useState("overview")

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${selectedTab === "overview" ? styles.activeTab : ""}`}
            onClick={() => setSelectedTab("overview")}
          >
            Overview
          </button>
          <button
            className={`${styles.tabButton} ${
              selectedTab === "comparison" ? styles.activeTab : ""
            }`}
            onClick={() => setSelectedTab("comparison")}
          >
            Loading Comparison
          </button>
        </div>
      </div>

      {selectedTab === "overview" && <Overview />}

      {selectedTab === "comparison" && <LoadingComparisonWrapper />}
    </div>
  )
}
