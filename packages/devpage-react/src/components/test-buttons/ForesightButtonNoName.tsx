import BaseForesightButton from "./BaseForesightButton"

function ForesightButtonNoName() {
  return (
    <article className="flex flex-col items-center gap-3 w-40">
      <h4 className="text-sm font-medium text-gray-900 self-start">Unnamed</h4>
      <BaseForesightButton
        className="size-40 bg-neutral-700 text-white"
        registerOptions={{
          callback: async () => {
            const randomTimeout = Math.floor(Math.random() * 1000)
            await new Promise(resolve => setTimeout(resolve, randomTimeout))
          },
          hitSlop: 20,
          unregisterOnCallback: true,
        }}
      />
      <p className="text-xs text-gray-600">Element registered without a name.</p>
    </article>
  )
}

export default ForesightButtonNoName
