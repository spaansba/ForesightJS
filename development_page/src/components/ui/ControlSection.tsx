import { Link } from "react-router-dom"
import type { ControlButton } from "../layout/PageLayout"

type ControlSectionProps = {
  title: string
  subtitle?: string
  buttons: ControlButton[]
}

const ControlSection = ({ title, subtitle, buttons }: ControlSectionProps) => {
  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-8 py-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">{title}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {buttons.map((button) => (
            <div key={button.id} className="group">
              {button.type === "link" ? (
                <Link
                  to={button.to || "/"}
                  className="block w-full h-24 p-4 bg-green-50 border border-green-200 rounded-lg transition-colors duration-200 text-center flex flex-col justify-center"
                >
                  <div className="font-medium text-green-800 mb-1">{button.label}</div>
                  <div className="text-sm text-green-600">{button.description}</div>
                </Link>
              ) : (
                <button
                  onClick={button.onClick || undefined}
                  className={`w-full h-24 p-4 border rounded-lg transition-all duration-200 text-center flex flex-col justify-center ${
                    button.isActive
                      ? "bg-blue-50 border-blue-200 text-blue-800 shadow-md"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="font-medium mb-1">{button.label}</div>
                  <div
                    className={`text-sm ${button.isActive ? "text-blue-600" : "text-slate-500"}`}
                  >
                    {button.description}
                  </div>

                  {/* Status indicator */}
                  <div className="mt-2 flex justify-center">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        button.isActive ? "bg-blue-400" : "bg-slate-300"
                      }`}
                    />
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>

        {subtitle && <div className="mt-4 text-sm text-slate-500 text-center">{subtitle}</div>}
      </div>
    </div>
  )
}

export default ControlSection
