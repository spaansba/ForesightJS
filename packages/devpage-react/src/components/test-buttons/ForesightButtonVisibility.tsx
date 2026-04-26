import { useIsVisible } from "../../stores/ButtonStateStore"
import BaseForesightButton from "./BaseForesightButton"

type ForesightButtonVisibilityProps = {
  name: string
}

function ForesightButtonVisibility({ name }: ForesightButtonVisibilityProps) {
  const isVisible = useIsVisible()
  return (
    <article className={`flex flex-col items-center gap-3 w-40 ${isVisible ? "" : "invisible"}`}>
      <h4 className="text-sm font-medium text-gray-900 self-start">Visibility</h4>
      <BaseForesightButton
        className="size-40 bg-blue-400 text-white"
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
      <p className="text-xs text-gray-600">
        Toggles via CSS only — MutationObserver should not unregister.
      </p>
    </article>
  )
}

export default ForesightButtonVisibility
