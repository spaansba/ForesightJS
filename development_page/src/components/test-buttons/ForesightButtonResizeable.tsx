import BaseForesightButton from "./BaseForesightButton"

type ForesightButtonResizeableProps = {
  isResized: boolean
}

function ForesightButtonResizeable({ isResized }: ForesightButtonResizeableProps) {
  return (
    <div 
      className={`${
        isResized ? "size-40" : "size-20"
      } bg-gradient-to-br from-blue-200 to-blue-300 rounded-lg shadow-md border border-blue-300 transition-all duration-500`}
    >
      <BaseForesightButton
        registerOptions={{
          callback: () => {
            console.log("resizeable")
          },
          hitSlop: 30,
          name: "resizeable",
          unregisterOnCallback: true,
        }}
      />
    </div>
  )
}

export default ForesightButtonResizeable