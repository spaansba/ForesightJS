import BaseForesightButton from "./BaseForesightButton"

type ForesightButtonToggelableProps = {
  isVisible: boolean
}

function ForesightButtonToggelable({ isVisible }: ForesightButtonToggelableProps) {
  return (
    <div className={`${isVisible ? "block" : "hidden"} bg-amber-200 size-40`}>
      <BaseForesightButton
        registerOptions={{
          element: null,
          callback: () => {
            console.log("toggelable")
          },
          hitSlop: 0,
          name: "toggleable",
          unregisterOnCallback: true,
        }}
      />
    </div>
  )
}

export default ForesightButtonToggelable
