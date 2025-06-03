import BaseForesightButton from "../../components/test-buttons/BaseForesightButton"

function Other() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans p-8">
      {/* Back Button */}
      <div className="mb-8">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          ← Back to Test Page
        </button>
      </div>

      <div className="flex justify-center">
        <div className="flex flex-col items-center space-y-4 max-w-md">
          <p className="text-sm text-slate-600 text-center mb-4">
            This page tests if elements from the previous page unregistered correctly and if new
            elements register properly on page load.
          </p>
          <div className="flex items-center justify-center mt-30">
            <div className="size-20 bg-gradient-to-br from-blue-200 to-blue-300 rounded-lg shadow-md border border-blue-300">
              <BaseForesightButton
                registerOptions={{
                  callback: () => {
                    console.log("other button")
                  },
                  hitSlop: 30,
                  name: "other",
                  unregisterOnCallback: true,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Other
