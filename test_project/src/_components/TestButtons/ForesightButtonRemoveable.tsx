import BaseForesightButton from "./BaseForesightButton"

type ForesightButtonRemoveablePropsProps = {
  shouldBeRemoved: boolean
}

function ForesightButtonRemoveable({ shouldBeRemoved }: ForesightButtonRemoveablePropsProps) {
  return (
    <>
      {!shouldBeRemoved && (
        <div className={`bg-red-200 size-30`}>
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
      )}
    </>
  )
}

export default ForesightButtonRemoveable
