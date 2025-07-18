import ForesightButtonVisibility from "./test-buttons/ForesightButtonVisibility"
import ForesightButtonResizeable from "./test-buttons/ForesightButtonResizeable"
import ForesightButtonRemoveable from "./test-buttons/ForesightButtonRemoveable"
import ForesightButtonNoName from "./test-buttons/ForesightButtonNoName"
import { useResetKey, useButtonActions, useIsRemoved, useIsResized, useIsVisible } from "../stores/ButtonStateStore"
import { ForesightManager } from "js.foresight"
import { ForesightDevtools } from "js.foresight-devtools"
import { useEffect } from "react"
import ForesightButtonError from "./test-buttons/ForesightButtonError"
import { Link } from "react-router-dom"

export const Main = () => {
  const resetKey = useResetKey()
  const actions = useButtonActions()
  const isVisible = useIsVisible()
  const isRemoved = useIsRemoved()
  const isResized = useIsResized()

  useEffect(() => {
    const handleCallbackFired = () => {}

    ForesightManager.instance.addEventListener("callbackCompleted", handleCallbackFired)

    return () => {
      ForesightManager.instance.removeEventListener("callbackCompleted", handleCallbackFired)
    }
  }, [])

  const toggleDebug = () => {
    ForesightDevtools.instance.alterDevtoolsSettings({
      showDebugger: !ForesightDevtools.instance.devtoolsSettings.showDebugger,
    })
  }
  return (
    <div key={resetKey} className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                ForesightJS Development Environment
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Interactive testing environment for predictive UI interactions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={actions.toggleVisibility}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  isVisible ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                Visible: {isVisible ? "ON" : "OFF"}
              </button>
              <button
                onClick={actions.toggleResized}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  isResized ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                Resize: {isResized ? "ON" : "OFF"}
              </button>
              <button
                onClick={actions.toggleRemoved}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  isRemoved ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                Remove: {isRemoved ? "ON" : "OFF"}
              </button>
              <button
                onClick={toggleDebug}
                className="px-3 py-1 rounded-md text-xs font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors"
              >
                Debug
              </button>
              <button
                onClick={actions.resetAll}
                className="px-3 py-1 rounded-md text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white transition-colors"
              >
                Reset
              </button>
              <div className="w-px h-6 bg-gray-300 mx-2"></div>
              <Link 
                to="/images" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                🖼️ Images
              </Link>
              <Link 
                to="/mass" 
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                📊 Mass Test
              </Link>
            </div>
          </div>
        </div>
      </div>


      {/* Test Buttons Section */}
      <div className="max-w-full mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Interactive Test Buttons</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Each button demonstrates different ForesightJS behaviors and configurations. 
            Hover over them to trigger predictive callbacks and observe the interactions.
          </p>
        </div>

        <div className="space-y-12">
          {/* Dynamic Behavior Group */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900">Dynamic Behavior</h3>
            </div>
            <p className="text-gray-600 mb-8">
              Test elements with dynamic properties like resizing, removal, and visibility
            </p>
            <div className="mb-8">
              <h4 className="text-lg font-medium text-gray-800 mb-4">Resizable Elements</h4>
              <ForesightButtonResizeable name="resizeable" />
            </div>
            <div className="mb-8">
              <h4 className="text-lg font-medium text-gray-800 mb-4">Removable Elements</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <ForesightButtonRemoveable name="removeable" />
                <ForesightButtonRemoveable name="removeable2" />
                <ForesightButtonRemoveable name="removeable3" />
              </div>
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-800 mb-4">Visibility Elements</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <ForesightButtonVisibility name="visibility" />
              </div>
            </div>
          </div>

          {/* Edge Cases Group */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.863-.833-2.632 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900">Edge Cases</h3>
            </div>
            <p className="text-gray-600 mb-8">
              Test error handling and unusual configurations
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ForesightButtonError name="callback error" />
              <ForesightButtonNoName />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
