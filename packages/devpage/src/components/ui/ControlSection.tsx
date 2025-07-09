import { Link } from "react-router-dom"
import {
  useButtonActions,
  useIsRemoved,
  useIsResized,
  useIsVisible,
} from "../../stores/ButtonStateStore"
import { ForesightManager } from "js.foresight"
import { ForesightDevtools } from "js.foresight-devtools"
type ControlButton = {
  id: string
  label: string
  description: string
  onClick: () => void
  isActive: boolean
  type: "button" | "link" | "small-button"
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
      id: "log-static-properties",
      label: "Log Static Properties",
      description: "Log static properties of manager",
      onClick: () => {
        console.log(ForesightManager.instance.getManagerData)
      },
      isActive: true,
      type: "small-button",
    },
    {
      id: "change-global-settings",
      label: "Change Global Settings",
      description: "Change global settings of the Foresight Manager",
      onClick: () => {
        ForesightManager.instance.alterGlobalSettings({
          scrollMargin: Math.floor(Math.random() * 501),
        })
      },
      isActive: true,
      type: "small-button",
    },
    {
      id: "toggle-debug",
      label: "Toggle Debug Mode",
      description: "Toggle Debug Mode",
      onClick: () => {
        ForesightDevtools.instance.alterDebuggerSettings({
          showDebugger: !ForesightDevtools.instance.devtoolsSettings.showDebugger,
        })
      },
      isActive: true,
      type: "small-button",
    },
    {
      id: "page-switch",
      label: "Switch to test 1",
      description: "",
      onClick: () => {},
      isActive: false,
      type: "link",
      to: "/other",
    },
    {
      id: "page-mass",
      label: "Switch to mass",
      description: "",
      onClick: () => {},
      isActive: false,
      type: "link",
      to: "/mass",
    },
    {
      id: "reset-all",
      label: "Reset All",
      description: "",
      onClick: () => {
        actions.resetAll()
      },
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

  // Filter buttons by type
  const smallButtons = controlButtons.filter(button => button.type === "small-button")
  const linkAndResetButtons = controlButtons.filter(
    button => button.id === "page-switch" || button.id === "page-mass"
  )
  const mainButtons = controlButtons.filter(
    button =>
      button.type === "button" &&
      !["visibility-toggle", "resize-toggle", "remove-toggle", "reset-all"].includes(button.id)
  )

  // Fixed toggle buttons including reset
  const fixedButtons = controlButtons.filter(button =>
    ["visibility-toggle", "resize-toggle", "remove-toggle", "reset-all"].includes(button.id)
  )

  return (
    <div className="shadow-sm">
      {/* Fixed toggle buttons in top right */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {fixedButtons.map(button => (
          <button
            key={button.id}
            onClick={button.onClick}
            className={`w-32 h-10 px-2 py-1 rounded-md transition-all duration-200 text-center flex items-center justify-center shadow-lg ${
              button.id === "reset-all"
                ? "bg-orange-500 hover:bg-red-400 text-white"
                : button.isActive
                ? "bg-green-500 hover:bg-green-400 text-white"
                : "bg-red-500 hover:bg-red-400 text-white"
            }`}
          >
            <div className="font-medium text-xs truncate">
              {button.id === "visibility-toggle"
                ? `Visible: ${isVisible ? "ON" : "OFF"}`
                : button.id === "resize-toggle"
                ? `Resize: ${isResized ? "ON" : "OFF"}`
                : button.id === "remove-toggle"
                ? `Remove: ${isRemoved ? "ON" : "OFF"}`
                : "RESET"}
            </div>
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-8 py-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">{title}</h1>

        <div className="flex flex-wrap gap-3">
          {/* Small buttons section */}
          <div className="flex flex-col gap-1 w-48">
            {/* Small utility buttons */}
            {smallButtons.map(button => (
              <div key={button.id} className="flex-1">
                <button
                  onClick={button.onClick}
                  className={`w-full h-8 px-3 py-1 rounded-md transition-all duration-200 text-center flex items-center justify-center ${
                    button.isActive
                      ? "bg-blue-500 hover:bg-blue-400 text-white"
                      : "bg-gray-300 hover:bg-gray-400 text-gray-700"
                  }`}
                >
                  <div className="font-medium text-xs truncate">{button.label}</div>
                </button>
              </div>
            ))}

            {/* Link and reset buttons */}
            {linkAndResetButtons.map(button => (
              <div key={button.id} className="flex-1">
                {button.type === "link" ? (
                  <Link
                    to={button.to || "/"}
                    className="w-full h-11 p-2 bg-green-500 hover:bg-green-400 rounded-lg text-center flex flex-col justify-center text-white"
                  >
                    <div className="font-medium text-xs">{button.label}</div>
                    <div className="text-xs">{button.description}</div>
                  </Link>
                ) : (
                  <button
                    onClick={button.onClick}
                    className="w-full h-11 p-2 rounded-lg transition-all duration-200 text-center flex flex-col justify-center bg-orange-500 hover:bg-red-400 text-white"
                  >
                    <div className="font-medium text-xs">{button.label}</div>
                    <div className="text-xs">{button.description}</div>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Main control buttons (excluding toggle buttons) */}
          {mainButtons.map(button => (
            <div key={button.id} className="flex-1 min-w-64">
              <button
                onClick={button.onClick}
                className={`w-full h-24 p-4 rounded-lg transition-all duration-200 text-center flex flex-col justify-center ${
                  button.isActive ? "bg-slate-400 text-white" : "bg-slate-700 text-white"
                }`}
              >
                <div className="font-medium mb-1">{button.label}</div>
                <div className="text-sm text-gray-200">{button.description}</div>
              </button>
            </div>
          ))}
        </div>

        {subtitle && <div className="mt-4 text-sm text-center">{subtitle}</div>}
      </div>
    </div>
  )
}

export default ControlSection
