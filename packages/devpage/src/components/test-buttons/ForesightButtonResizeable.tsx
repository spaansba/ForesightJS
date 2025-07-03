import { useIsResized } from "../../stores/ButtonStateStore"
import BaseForesightButton from "./BaseForesightButton"
import ForesightButtonParagraph from "./ForesightButtonParagraph"

type ForesightButtonResizeableProps = {
  name: string
}

function ForesightButtonResizeable({ name }: ForesightButtonResizeableProps) {
  const isResized = useIsResized()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
      {/* Original Size Change */}
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-lg font-semibold">Size Change</h3>
        <div
          className={`${
            isResized ? "size-40" : "size-20"
          } rounded-lg shadow-md transition-all duration-500 bg-green-600`}
        >
          <BaseForesightButton
            registerOptions={{
              callback: () => console.log(`${name}-size-change`),
              hitSlop: 30,
              name: `${name}-size-change`,
            }}
          />
        </div>
        <ForesightButtonParagraph paragraph="Tests direct size changes using width/height classes" />
      </div>

      {/* Padding Change */}
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-lg font-semibold">Padding Change</h3>
        <div
          className={`${
            isResized ? "p-16" : "p-4"
          } size-20 rounded-lg shadow-md transition-all duration-500 bg-blue-600`}
        >
          <BaseForesightButton
            registerOptions={{
              callback: () => console.log(`${name}-padding-change`),
              hitSlop: 30,
              name: `${name}-padding-change`,
            }}
          />
        </div>
        <ForesightButtonParagraph paragraph="Tests padding changes that affect element boundaries" />
      </div>

      {/* Border Change */}
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-lg font-semibold">Border Change</h3>
        <div
          className={`${
            isResized ? "border-8" : "border-2"
          } size-20 rounded-lg shadow-md transition-all duration-500 bg-purple-600 border-purple-800`}
        >
          <BaseForesightButton
            registerOptions={{
              callback: () => console.log(`${name}-border-change`),
              hitSlop: 30,
              name: `${name}-border-change`,
            }}
          />
        </div>
        <ForesightButtonParagraph paragraph="Tests border width changes affecting element boundaries" />
      </div>

      {/* Content Text Change */}
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-lg font-semibold">Content Change</h3>
        <div className="min-w-20 min-h-20 rounded-lg shadow-md transition-all duration-500 bg-red-600 flex items-center justify-center p-4">
          <span className="text-white font-bold text-center">
            {isResized ? "Much longer button text that causes expansion" : "Click"}
          </span>
          <BaseForesightButton
            registerOptions={{
              callback: () => console.log(`${name}-content-change`),
              hitSlop: 30,
              name: `${name}-content-change`,
            }}
          />
        </div>
        <ForesightButtonParagraph paragraph="Tests content changes that affect element size" />
      </div>

      {/* Font Size Change */}
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-lg font-semibold">Font Size Change</h3>
        <div className="min-w-20 min-h-20 rounded-lg shadow-md transition-all duration-500 bg-yellow-600 flex items-center justify-center p-4">
          <span className={`text-white font-bold ${isResized ? "text-2xl" : "text-sm"}`}>
            Button
          </span>
          <BaseForesightButton
            registerOptions={{
              callback: () => console.log(`${name}-font-change`),
              hitSlop: 30,
              name: `${name}-font-change`,
            }}
          />
        </div>
        <ForesightButtonParagraph paragraph="Tests font size changes affecting element boundaries" />
      </div>

      {/* Transform Scale (Visual Only) */}
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-lg font-semibold">Transform Scale</h3>
        <div
          className={`${
            isResized ? "scale-150" : "scale-100"
          } size-20 rounded-lg shadow-md transition-all duration-500 bg-indigo-600`}
        >
          <BaseForesightButton
            registerOptions={{
              callback: () => console.log(`${name}-transform-scale`),
              hitSlop: 30,
              name: `${name}-transform-scale`,
            }}
          />
        </div>
        <ForesightButtonParagraph paragraph="Tests transform scale (visual only - ResizeObserver should NOT fire)" />
      </div>

      {/* Width/Height Asymmetric */}
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-lg font-semibold">Asymmetric Resize</h3>
        <div
          className={`${
            isResized ? "w-32 h-12" : "w-12 h-32"
          } rounded-lg shadow-md transition-all duration-500 bg-teal-600`}
        >
          <BaseForesightButton
            registerOptions={{
              callback: () => console.log(`${name}-asymmetric`),
              hitSlop: 30,
              name: `${name}-asymmetric`,
            }}
          />
        </div>
        <ForesightButtonParagraph paragraph="Tests asymmetric width/height changes" />
      </div>

      {/* Flex Grow Change */}
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-lg font-semibold">Flex Grow</h3>
        <div className="w-40 h-20 flex rounded-lg shadow-md transition-all duration-500 bg-gray-600">
          <div
            className={`${
              isResized ? "flex-grow" : "flex-shrink-0 w-12"
            } transition-all duration-500 bg-pink-600 rounded-lg`}
          >
            <BaseForesightButton
              registerOptions={{
                callback: () => console.log(`${name}-flex-grow`),
                hitSlop: 30,
                name: `${name}-flex-grow`,
              }}
            />
          </div>
          <div className="flex-1 bg-gray-400 rounded-lg ml-1"></div>
        </div>
        <ForesightButtonParagraph paragraph="Tests flex-grow changes within container" />
      </div>

      {/* Max Width Change */}
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-lg font-semibold">Max Width</h3>
        <div
          className={`${
            isResized ? "max-w-none w-48" : "max-w-20 w-48"
          } h-20 rounded-lg shadow-md transition-all duration-500 bg-orange-600`}
        >
          <BaseForesightButton
            registerOptions={{
              callback: () => console.log(`${name}-max-width`),
              hitSlop: 30,
              name: `${name}-max-width`,
            }}
          />
        </div>
        <ForesightButtonParagraph paragraph="Tests max-width constraint changes" />
      </div>
    </div>
  )
}

export default ForesightButtonResizeable
