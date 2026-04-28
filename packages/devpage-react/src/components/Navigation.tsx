import { Link } from "react-router-dom"
import { useButtonActions, useReactivateAfter } from "../stores/ButtonStateStore"
import { useDebug } from "../contexts/DebugContext"

export const Navigation = () => {
  const actions = useButtonActions()
  const reactivateAfter = useReactivateAfter()
  const { isDebugActive, toggleDebug } = useDebug()

  return (
    <header className="bg-white border-b border-gray-300 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-base font-semibold text-gray-900">
          ForesightJS Dev
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-gray-700 hover:text-gray-900">
            Home
          </Link>
          <Link to="/images" className="text-gray-700 hover:text-gray-900">
            Images
          </Link>
          <Link to="/mass" className="text-gray-700 hover:text-gray-900">
            Mass test
          </Link>
          <Link to="/react-router" className="text-gray-700 hover:text-gray-900">
            React Router
          </Link>
          <span className="w-px h-5 bg-gray-300" />
          <label className="flex items-center gap-1 text-xs text-gray-700">
            Reactivate
            <input
              type="number"
              min={0}
              step={500}
              value={reactivateAfter}
              onChange={e => actions.setReactivateAfter(Number(e.target.value))}
              className="w-20 px-1 py-0.5 text-xs border border-gray-400"
            />
            ms
          </label>
          <button
            onClick={toggleDebug}
            className="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
            title="Toggle ForesightDevtools control panel"
          >
            Debug: {isDebugActive ? "on" : "off"}
          </button>
          <button
            onClick={actions.resetAll}
            className="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
          >
            Reset
          </button>
        </nav>
      </div>
    </header>
  )
}
