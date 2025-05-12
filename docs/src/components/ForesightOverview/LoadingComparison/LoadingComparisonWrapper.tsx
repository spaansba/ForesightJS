import React, { useState } from "react"
import styles from "../styles.module.css"
import { RegularCard } from "./Cards/RegularCard"
import { HoverCard } from "./Cards/HoverCard"
import { ForesightCard } from "./Cards/ForesightCard"
import ComparisonInfo from "./ComparisonInfo"
import CardsWrapper from "./Cards/CardsWrapper"
export const LoadingComparisonWrapper = () => {
  return (
    <div className={styles.comparisonContainer}>
      <ComparisonInfo />
      <CardsWrapper />
    </div>
  )
}
