import BaseForesightButton from "./BaseForesightButton"

function ForesightButtonNoName() {
  return (
    <div className="bg-gradient-to-br from-purple-200 to-purple-300 size-20 rounded-lg shadow-md border border-purple-300">
      <BaseForesightButton
        registerOptions={{
          callback: () => {
            console.log("no name button")
          },
          hitSlop: 20,
          unregisterOnCallback: true,
        }}
      />
    </div>
  )
}

export default ForesightButtonNoName
