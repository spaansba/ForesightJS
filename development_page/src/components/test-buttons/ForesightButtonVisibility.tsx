import BaseForesightButton from "./BaseForesightButton"

type ForesightButtonVisibilityProps = {
  isVisible: boolean
}

function ForesightButtonVisibility({ isVisible }: ForesightButtonVisibilityProps) {
  return (
    <div className="bg-gradient-to-br from-amber-200 to-amber-300 size-40 rounded-lg shadow-md border border-amber-300">
      <BaseForesightButton
        registerOptions={{
          callback: () => {
            console.log("visibility")
          },
          hitSlop: 0,
          name: "visibility",
          unregisterOnCallback: true,
        }}
      />
    </div>
  )
}

export default ForesightButtonVisibility