import BaseForesightButton from "./BaseForesightButton"

type ForesightButtonErrorProps = {
  name: string
}

const ForesightButtonError = ({ name }: ForesightButtonErrorProps) => {
  return (
    <article className="flex flex-col items-center gap-3 w-40">
      <h4 className="text-sm font-medium text-gray-900 self-start">Error in callback</h4>
      <BaseForesightButton
        className="size-40 bg-red-500 text-white"
        registerOptions={{
          callback: async () => {
            const randomTimeout = Math.floor(Math.random() * 1000)
            await new Promise(resolve => setTimeout(resolve, randomTimeout))
            throw new Error("Test error - callback always fails")
          },
          hitSlop: 20,
          name: name,
        }}
      />
      <p className="text-xs text-gray-600">Callback throws after a random delay.</p>
    </article>
  )
}

export default ForesightButtonError
