import BaseForesightButton from "./BaseForesightButton"

type ForesightButtonRegularProps = {
  name: string
}

function ForesightButtonRegular({ name }: ForesightButtonRegularProps) {
  return (
    <div className="size-40 bg-green-200">
      <BaseForesightButton
        registerOptions={{
          callback: () => {
            // console.log(name)
          },
          hitSlop: 20,
          name: name,
          unregisterOnCallback: false,
        }}
      />
    </div>
  )
}

export default ForesightButtonRegular
