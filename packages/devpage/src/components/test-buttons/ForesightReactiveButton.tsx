import BaseForesightButton from "./BaseForesightButton"
import ForesightButtonParagraph from "./ForesightButtonParagraph"

type ForesightReactiveButtonProps = {
  name: string
}

function ForesightReactiveButton({ name }: ForesightReactiveButtonProps) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <h3 className="text-lg font-semibold ">Test reactivate after 3 seconds</h3>
      <div className="size-40 rounded-lg shadow-md bg-fuchsia-500">
        <BaseForesightButton
          registerOptions={{
            callback: async () => {
              const randomTimeout = Math.floor(Math.random() * 1000)
              await new Promise(resolve => setTimeout(resolve, randomTimeout))
            },
            hitSlop: 20,
            reactivateAfter: 3000,
            name: name,
          }}
        />
        <ForesightButtonParagraph paragraph="Tests error in callback" />
      </div>
    </div>
  )
}

export default ForesightReactiveButton
