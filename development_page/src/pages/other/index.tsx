import PageLayout, { type ControlButton } from "../../components/layout/PageLayout"
import BaseForesightButton from "../../components/test-buttons/BaseForesightButton"

function Other() {
  const controlButtons: ControlButton[] = [
    {
      id: "back-to-main",
      label: "Back to Test Page",
      description: "Return to main testing page",
      onClick: null,
      isActive: false,
      type: "link",
      to: "/",
    },
  ]

  return (
    <PageLayout
      title="Foresight Manager - Other Page"
      subtitle="This is to test what happens to the registered elements on going to another page"
      controlButtons={controlButtons}
    >
      <div className="flex justify-center">
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-lg font-semibold text-slate-700">Test Button</h3>
          <div className="flex items-center justify-center">
            <div className="size-20 bg-gradient-to-br from-blue-200 to-blue-300 rounded-lg shadow-md border border-blue-300">
              <BaseForesightButton
                registerOptions={{
                  callback: () => {
                    console.log("other button")
                  },
                  hitSlop: 30,
                  name: "other",
                  unregisterOnCallback: true,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default Other
