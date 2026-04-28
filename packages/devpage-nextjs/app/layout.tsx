import type { Metadata } from "next"
import "./globals.css"
import { Nav } from "./components/Nav"

export const metadata: Metadata = {
  title: "ForesightJS Next.js devpage",
  description: "Next.js development page for @foresightjs/react",
}

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
