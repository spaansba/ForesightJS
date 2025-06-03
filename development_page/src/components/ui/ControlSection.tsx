import { Link } from "react-router-dom"
import {
  useButtonActions,
  useIsRemoved,
  useIsResized,
  useIsVisible,
} from "../../stores/ButtonStateStore"

type ControlButton = {
  id: string
  label: string
  description: string
  onClick: () => void
  isActive: boolean
  type: "button" | "link"
  to?: string
}

type ControlSectionProps = {
  title: string
  subtitle?: string
}
const ControlSection = ({ title, subtitle }: ControlSectionProps) => {
  const actions = useButtonActions()
  const isVisible = useIsVisible()
  const isRemoved = useIsRemoved()
  const isResized = useIsResized()
  const controlButtons: ControlButton[] = [
    {
      id: "page-switch",
      label: "Switch to other page",
      description: "",
      onClick: () => {},
      isActive: false,
      type: "link",
      to: "/other",
    },
    {
      id: "reset-all",
      label: "Reset All",
      description: "",
      onClick: () => actions.resetAll(),
      isActive: false,
      type: "button",
    },
    {
      id: "visibility-toggle",
      label: `Visibility: ${isVisible.toString()}`,
      description: "Toggle the visibility of the visibility test button",
      onClick: () => actions.toggleVisibility(),
      isActive: isVisible,
      type: "button",
    },
    {
      id: "resize-toggle",
      label: `Resize: ${isResized.toString()}`,
      description: "Toggle the size of the resizable test button",
      onClick: () => actions.toggleResized(),
      isActive: isResized,
      type: "button",
    },
    {
      id: "remove-toggle",
      label: `Remove: ${isRemoved.toString()}`,
      description: "Toggle the removal of the removable test button",
      onClick: () => actions.toggleRemoved(),
      isActive: isRemoved,
      type: "button",
    },
  ]
  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-8 py-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">{title}</h1>

        <div className="flex flex-wrap gap-3">
          {/* Small buttons column */}
          <div className="flex flex-col gap-1 w-48">
            {controlButtons
              .filter((button) => button.id === "page-switch" || button.id === "reset-all")
              .map((button) => (
                <div key={button.id} className="flex-1">
                  {button.type === "link" ? (
                    <Link
                      to={button.to || "/"}
                      className="w-full h-11 p-2 bg-green-50 border border-green-200 rounded-lg transition-colors duration-200 text-center flex flex-col justify-center"
                    >
                      <div className="font-medium text-green-800 text-xs">{button.label}</div>
                      <div className="text-xs text-green-600">{button.description}</div>
                    </Link>
                  ) : (
                    <button
                      onClick={button.onClick}
                      className="w-full h-11 p-2 border rounded-lg transition-all duration-200 text-center flex flex-col justify-center bg-red-50 border-red-200 text-red-800 hover:bg-red-100"
                    >
                      <div className="font-medium text-xs">{button.label}</div>
                      <div className="text-xs text-red-600">{button.description}</div>
                    </button>
                  )}
                </div>
              ))}
          </div>

          {/* Main control buttons */}
          {controlButtons
            .filter((button) => button.id !== "page-switch" && button.id !== "reset-all")
            .map((button) => (
              <div key={button.id} className="flex-1 min-w-64">
                <button
                  onClick={button.onClick}
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

                  <div className="mt-2 flex justify-center">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        button.isActive ? "bg-blue-400" : "bg-slate-300"
                      }`}
                    />
                  </div>
                </button>
              </div>
            ))}
        </div>

        {subtitle && <div className="mt-4 text-sm text-slate-500 text-center">{subtitle}</div>}
      </div>
    </div>
  )
}

export default ControlSection
