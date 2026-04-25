import { Link, useLocation } from "react-router-dom"
import { useDebug } from "../contexts/DebugContext"

interface SimpleNavigationProps {
  onReset?: () => void
  hitCount?: number
  buttonCount?: number
  setButtonCount?: (count: number) => void
}

export const SimpleNavigation = ({
  onReset,
  hitCount,
  buttonCount,
  setButtonCount,
}: SimpleNavigationProps) => {
  const location = useLocation()
  const { isDebugActive, toggleDebug } = useDebug()
  const onMass = location.pathname === "/mass"

  return (
    <header className="bg-white border-b border-gray-300 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-base font-semibold text-gray-900">
          ForesightJS Dev
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {onMass && typeof hitCount === "number" && (
            <span className="text-xs text-gray-700 font-mono">{hitCount} hits</span>
          )}
          {onMass && typeof buttonCount === "number" && setButtonCount && (
            <label className="flex items-center gap-2 text-xs text-gray-700">
              Count
              <input
                type="number"
                value={buttonCount}
                onChange={e => {
                  const value = Math.max(1, Math.min(10000, parseInt(e.target.value) || 1))
                  setButtonCount(value)
                }}
                className="w-20 px-2 py-1 text-xs border border-gray-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="1"
                max="10000"
              />
            </label>
          )}
          <Link to="/" className="text-gray-700 hover:text-gray-900">
            Home
          </Link>
          <Link to="/images" className="text-gray-700 hover:text-gray-900">
            Images
          </Link>
          <Link to="/mass" className="text-gray-700 hover:text-gray-900">
            Mass test
          </Link>
          <span className="w-px h-5 bg-gray-300" />
          <button
            onClick={toggleDebug}
            className="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
            title="Toggle ForesightDevtools control panel"
          >
            Debug: {isDebugActive ? "on" : "off"}
          </button>
          {onMass && onReset && (
            <button
              onClick={onReset}
              className="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
            >
              Reset test
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
