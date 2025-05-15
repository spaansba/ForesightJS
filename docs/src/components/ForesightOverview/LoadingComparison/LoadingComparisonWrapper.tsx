import React, { useState } from "react"
import styles from "../styles.module.css"
import { RegularCard } from "../Overview/Cards/RegularCard"
import { HoverCard } from "../Overview/Cards/HoverCard"
import { ForesightCard } from "../Overview/Cards/ForesightCard"
import ComparisonInfo from "./ComparisonInfo"
import CardsWrapper from "../Overview/Cards/CardsWrapper"
export const LoadingComparisonWrapper = () => {
  return (
    <div className={styles.comparisonContainer}>
      <ComparisonInfo />
      <CardsWrapper />
    </div>
  )
}
