import { Link } from "react-router-dom"
import { ForesightDevtools } from "js.foresight-devtools"

export const SimpleNavigation = () => {
  const toggleDebug = () => {
    ForesightDevtools.instance.alterDevtoolsSettings({
      showDebugger: !ForesightDevtools.instance.devtoolsSettings.showDebugger,
    })
  }

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
            <button
              onClick={toggleDebug}
              className="px-3 py-1 rounded-md text-xs font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors"
            >
              Debug
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
  )
}