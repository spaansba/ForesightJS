import BaseForesightButton from "./BaseForesightButton"

type ForesightButtonRegularProps = {
  name: string
}

function ForesightButtonRegular({ name }: ForesightButtonRegularProps) {
  return (
    <article className="flex flex-col items-center gap-3 w-40">
      <h4 className="text-sm font-medium text-gray-900 self-start">{name}</h4>
      <BaseForesightButton
        className="size-40 bg-green-200"
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
    </article>
  )
}

export default ForesightButtonRegular
