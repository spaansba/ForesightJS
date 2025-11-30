import { Link, useLocation } from "react-router-dom"
import { useDebug } from "../contexts/DebugContext"

interface SimpleNavigationProps {
  onReset?: () => void
  hitCount?: number
  buttonCount?: number
  setButtonCount?: (count: number) => void
}

export const SimpleNavigation = ({ onReset, hitCount, buttonCount, setButtonCount }: SimpleNavigationProps) => {
  const location = useLocation()
  const { isDebugActive, toggleDebug } = useDebug()

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h1 className="text-xl font-bold text-gray-900">
              <Link to="/" className="hover:text-blue-600 transition-colors">
                ForesightJS Dev
              </Link>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {location.pathname === '/mass' && typeof hitCount === 'number' && (
              <>
                <div className="bg-green-500 rounded-lg px-4 py-1 min-w-16">
                  <div className="text-center text-sm font-bold text-white">
                    {hitCount} Hits
                  </div>
                </div>
                <div className="w-px h-6 bg-gray-300"></div>
              </>
            )}
            {location.pathname === '/mass' && typeof buttonCount === 'number' && setButtonCount && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-700 font-medium">Count:</label>
                  <input
                    type="number"
                    value={buttonCount}
                    onChange={(e) => {
                      const value = Math.max(1, Math.min(10000, parseInt(e.target.value) || 1))
                      setButtonCount(value)
                    }}
                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="1"
                    max="10000"
                  />
                </div>
                <div className="w-px h-6 bg-gray-300"></div>
              </>
            )}
            <button
              onClick={toggleDebug}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                isDebugActive
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-600 hover:bg-gray-700 text-white"
              }`}
              title="⚠️ Warning: Debug mode may impact performance with many elements"
            >
              {isDebugActive ? "Debug ON" : "Debug OFF"}
            </button>
            {location.pathname === '/mass' && onReset && (
              <button
                onClick={onReset}
                className="px-3 py-1 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Reset Test
              </button>
            )}
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            <Link 
              to="/" 
              className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              🏠 Home
            </Link>
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
  )
}