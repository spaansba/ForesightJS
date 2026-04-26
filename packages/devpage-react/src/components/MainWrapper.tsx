import ForesightButtonVisibility from "./test-buttons/ForesightButtonVisibility"
import ForesightButtonResizeable from "./test-buttons/ForesightButtonResizeable"
import ForesightButtonRemoveable from "./test-buttons/ForesightButtonRemoveable"
import ForesightButtonNoName from "./test-buttons/ForesightButtonNoName"
import {
  useButtonActions,
  useIsRemoved,
  useIsResized,
  useIsVisible,
  useResetKey,
} from "../stores/ButtonStateStore"
import ForesightButtonError from "./test-buttons/ForesightButtonError"
import { Navigation } from "./Navigation"

type SectionProps = {
  title: string
  toggleLabel?: string
  toggleOn?: boolean
  onToggle?: () => void
  children: React.ReactNode
}

function Section({ title, toggleLabel, toggleOn, onToggle, children }: SectionProps) {
  return (
    <section className="border-t border-gray-300 pb-8">
      <div className="sticky top-12 z-[5] -mx-6 px-6 py-4 bg-stone-50/95 backdrop-blur flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {toggleLabel && onToggle && (
          <button
            onClick={onToggle}
            className="px-2 py-1 text-xs border border-gray-400 text-gray-800 hover:bg-gray-100"
          >
            {toggleLabel}: {toggleOn ? "on" : "off"}
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

export const Main = () => {
  const resetKey = useResetKey()
  const actions = useButtonActions()
  const isVisible = useIsVisible()
  const isRemoved = useIsRemoved()
  const isResized = useIsResized()

  return (
    <div key={resetKey} className="min-h-screen bg-stone-50 text-gray-900">
      <Navigation />

      <main className="max-w-6xl mx-auto px-6 pb-16">
        <Section
          title="Resizable elements"
          toggleLabel="Resize"
          toggleOn={isResized}
          onToggle={actions.toggleResized}
        >
          <ForesightButtonResizeable name="resizeable" />
        </Section>

        <Section
          title="Removable elements"
          toggleLabel="Remove"
          toggleOn={isRemoved}
          onToggle={actions.toggleRemoved}
        >
          <ForesightButtonRemoveable name="removeable" />
        </Section>

        <Section
          title="Visibility elements"
          toggleLabel="Visible"
          toggleOn={isVisible}
          onToggle={actions.toggleVisibility}
        >
          <ForesightButtonVisibility name="visibility" />
        </Section>

        <Section title="Edge cases">
          <div className="flex flex-wrap gap-x-6 gap-y-8">
            <ForesightButtonError name="callback error" />
            <ForesightButtonNoName />
          </div>
        </Section>
      </main>
    </div>
  )
}
