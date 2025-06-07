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
    <div className="shadow-sm">
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
                      className="w-full h-11 p-2 bg-green-500 hover:bg-green-400 rounded-lg text-center flex flex-col justify-center"
                    >
                      <div className="font-medium  text-xs">{button.label}</div>
                      <div className="text-xs ">{button.description}</div>
                    </Link>
                  ) : (
                    <button
                      onClick={button.onClick}
                      className="w-full h-11 p-2 rounded-lg transition-all duration-200 text-center flex flex-col justify-center bg-orange-500  hover:bg-red-400"
                    >
                      <div className="font-medium text-xs">{button.label}</div>
                      <div className="text-xs ">{button.description}</div>
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
                  className={`w-full h-24 p-4 rounded-lg transition-all duration-200 text-center flex flex-col justify-center ${
                    button.isActive ? "bg-slate-400" : "bg-slate-700  "
                  }`}
                >
                  <div className="font-medium mb-1">{button.label}</div>
                  <div className={`text-sm  "text-black"`}>{button.description}</div>
                </button>
              </div>
            ))}
        </div>

        {subtitle && <div className="mt-4 text-sm  text-center">{subtitle}</div>}
      </div>
    </div>
  )
}

export default ControlSection
