import { Foresight } from "@foresightjs/react"
import ButtonStats from "../ui/ButtonStats"
import { useReactivateAfter } from "../../stores/ButtonStateStore"

const callback = async () => {
  const randomTimeout = Math.floor(Math.random() * 1000)
  await new Promise(resolve => setTimeout(resolve, randomTimeout))
}

const buttonClassName =
  "size-40 bg-sky-200 flex items-center justify-center text-slate-900 font-medium text-sm focus:outline-none"

export const ForesightButtonAs = () => {
  const reactivateAfter = useReactivateAfter()

  return (
    <article className="flex flex-col items-center gap-3 w-40">
      <h4 className="text-sm font-medium text-gray-900 self-start">as=&quot;button&quot;</h4>
      <Foresight
        as="button"
        foresightName="as-button"
        hitSlop={20}
        reactivateAfter={reactivateAfter}
        callback={callback}
        className={buttonClassName}
      >
        {({ hitCount }) => (
          <span className="text-center leading-tight">as-button (hits: {hitCount})</span>
        )}
      </Foresight>
    </article>
  )
}

export const ForesightButtonRenderProp = () => {
  const reactivateAfter = useReactivateAfter()

  return (
    <article className="flex flex-col items-center gap-3 w-40">
      <h4 className="text-sm font-medium text-gray-900 self-start">Render prop</h4>
      <Foresight<HTMLButtonElement>
        foresightName="render-prop"
        hitSlop={20}
        reactivateAfter={reactivateAfter}
        callback={callback}
      >
        {({ elementRef, isPredicted, hitCount, isCallbackRunning, status }) => (
          <>
            <button ref={elementRef} className={buttonClassName}>
              <span className="text-center leading-tight">render-prop</span>
            </button>
            <ButtonStats
              hitCount={hitCount}
              isPredicted={isPredicted}
              isCallbackRunning={isCallbackRunning}
              status={status}
            />
          </>
        )}
      </Foresight>
    </article>
  )
}
