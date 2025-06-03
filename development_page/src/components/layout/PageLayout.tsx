import type { ReactNode } from "react"
import ControlSection from "../ui/ControlSection"

export type ControlButton = {
  id: string
  label: string
  description: string
  onClick: (() => void) | null
  isActive: boolean
  type: "button" | "link"
  to?: string
}

type PageLayoutProps = {
  title: string
  subtitle?: string
  controlButtons: ControlButton[]
  children: ReactNode
}

const PageLayout = ({ title, subtitle, controlButtons, children }: PageLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
      {/* Control Section */}
      <ControlSection title={title} subtitle={subtitle} buttons={controlButtons} />

      {/* Main Content */}
      <div className="px-8 py-12">
        <div className="max-w-6xl mx-auto">{children}</div>
      </div>
    </div>
  )
}

export default PageLayout
