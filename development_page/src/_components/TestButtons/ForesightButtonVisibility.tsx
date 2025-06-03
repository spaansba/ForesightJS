import BaseForesightButton from "./BaseForesightButton"

type ForesightButtonVisibilityProps = {
  isVisible: boolean
}

function ForesightButtonVisibility({ isVisible }: ForesightButtonVisibilityProps) {
  return (
    <div className={`${isVisible ? "block" : "hidden"} bg-amber-200 size-40`}>
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
