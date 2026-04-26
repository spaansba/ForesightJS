import { useIsResized } from "../../stores/ButtonStateStore"
import BaseForesightButton from "./BaseForesightButton"

type ForesightButtonResizeableProps = {
  name: string
}

type CardProps = {
  title: string
  description: string
  children: React.ReactNode
}

function Card({ title, description, children }: CardProps) {
  return (
    <article className="flex flex-col items-center gap-3 w-40">
      <h4 className="text-sm font-medium text-gray-900 self-start">{title}</h4>
      {children}
      <p className="text-xs text-gray-600">{description}</p>
    </article>
  )
}

function ForesightButtonResizeable({ name }: ForesightButtonResizeableProps) {
  const isResized = useIsResized()
  const callback = async () => {
    const randomTimeout = Math.floor(Math.random() * 1000)
    await new Promise(resolve => setTimeout(resolve, randomTimeout))
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
      <Card title="Size change" description="Width/height classes change.">
        <BaseForesightButton
          className={`${isResized ? "size-40" : "size-20"} bg-green-600 text-white transition-all duration-500`}
          registerOptions={{ callback, hitSlop: 30, name: `${name}-size-change` }}
        />
      </Card>

      <Card title="Border change" description="Border width affects boundaries.">
        <BaseForesightButton
          className={`${isResized ? "border-8" : "border-2"} box-content size-20 bg-purple-600 border-purple-800 text-white transition-all duration-500`}
          registerOptions={{ callback, hitSlop: 30, name: `${name}-border-change` }}
        />
      </Card>

      <Card title="Content change" description="Inner text grows the box.">
        <BaseForesightButton
          className="min-w-20 min-h-20 max-w-40 bg-red-600 text-white transition-all duration-500 px-3 py-2"
          registerOptions={{ callback, hitSlop: 30, name: `${name}-content-change` }}
        >
          <span className="text-center font-medium text-sm">
            {isResized ? "Much longer button text that causes expansion" : "Click"}
          </span>
        </BaseForesightButton>
      </Card>

      <Card title="Font size change" description="Font size affects element size.">
        <BaseForesightButton
          className="min-w-20 min-h-20 bg-yellow-600 text-white transition-all duration-500"
          registerOptions={{ callback, hitSlop: 30, name: `${name}-font-change` }}
        >
          <span className={`font-bold ${isResized ? "text-4xl" : "text-sm"}`}>Button</span>
        </BaseForesightButton>
      </Card>

      <Card title="Transform scale" description="">
        <BaseForesightButton
          className={`${isResized ? "scale-150" : "scale-100"} size-20 bg-indigo-600 text-white transition-all duration-500`}
          registerOptions={{ callback, hitSlop: 30, name: `${name}-transform-scale` }}
        />
      </Card>

      <Card title="Asymmetric resize" description="Width/height swap.">
        <BaseForesightButton
          className={`${isResized ? "w-32 h-12" : "w-12 h-32"} bg-teal-600 text-white transition-all duration-500`}
          registerOptions={{ callback, hitSlop: 30, name: `${name}-asymmetric` }}
        />
      </Card>

      <Card title="Max width" description="max-width constraint changes.">
        <BaseForesightButton
          className={`${isResized ? "max-w-none w-48" : "max-w-20 w-48"} h-20 bg-orange-600 text-white transition-all duration-500`}
          registerOptions={{ callback, hitSlop: 30, name: `${name}-max-width` }}
        />
      </Card>
    </div>
  )
}

export default ForesightButtonResizeable
