import { useIsRemoved } from "../../stores/ButtonStateStore"
import BaseForesightButton from "./BaseForesightButton"

type ForesightButtonRemoveableProps = {
  name: string
}

const ForesightButtonRemoveable = ({ name }: ForesightButtonRemoveableProps) => {
  const shouldBeRemoved = useIsRemoved()
  if (shouldBeRemoved) {
    return null
  }

  return (
    <article className="flex flex-col items-center gap-3 w-40">
      <h4 className="text-sm font-medium text-gray-900 self-start">{name}</h4>
      <BaseForesightButton
        className="size-40 bg-teal-600 text-white"
        registerOptions={{
          callback: async () => {
            const randomTimeout = Math.floor(Math.random() * 1000)
            await new Promise(resolve => setTimeout(resolve, randomTimeout))
          },
          hitSlop: 0,
          name: name,
          unregisterOnCallback: true,
        }}
      />
    </article>
  )
}

export default ForesightButtonRemoveable
