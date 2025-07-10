import BaseForesightButton from "./BaseForesightButton"

type ForesightButtonRegularProps = {
  name: string
}

function ForesightButtonRegular({ name }: ForesightButtonRegularProps) {
  return (
    <div className="size-40 bg-green-200">
      <BaseForesightButton
        registerOptions={{
          callback: async () => {
            const randomTimeout = Math.floor(Math.random() * 1000)
            await new Promise(resolve => setTimeout(resolve, randomTimeout))
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
