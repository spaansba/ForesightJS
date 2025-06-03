import BaseForesightButton from "./BaseForesightButton"

function ForesightButtonRegular() {
  return (
    <div className="size-20 bg-green-200">
      <BaseForesightButton
        registerOptions={{
          callback: () => {
            console.log("regular button")
          },
          hitSlop: 20,
          name: "regular",
          unregisterOnCallback: false,
        }}
      />
    </div>
  )
}

export default ForesightButtonRegular