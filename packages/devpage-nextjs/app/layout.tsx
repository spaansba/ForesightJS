"use client"

import "./globals.css"
import { Nav } from "./components/Nav"
import { ForesightManager } from "@foresightjs/react"
import { ForesightDevtools } from "js.foresight-devtools"

ForesightManager.initialize({
  enableMousePrediction: true,
  enableTabPrediction: true,
  enableScrollPrediction: true,
  enableManagerLogging: false,
})

ForesightDevtools.initialize({})

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-gray-900">
        <Nav />
        {children}
      </body>
    </html>
  )
}

export default RootLayout
