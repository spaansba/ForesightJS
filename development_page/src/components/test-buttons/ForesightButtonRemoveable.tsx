import BaseForesightButton from "./BaseForesightButton"

type ForesightButtonRemoveableProps = {
  shouldBeRemoved: boolean
}

function ForesightButtonRemoveable({ shouldBeRemoved }: ForesightButtonRemoveableProps) {
  return (
    <div className="bg-gradient-to-br from-red-200 to-red-300 size-30 rounded-lg shadow-md border border-red-300">
      <BaseForesightButton
        registerOptions={{
          callback: () => {
            console.log("removeable")
          },
          hitSlop: 0,
          name: "removeable",
          unregisterOnCallback: true,
        }}
      />
    </div>
  )
}

export default ForesightButtonRemoveable