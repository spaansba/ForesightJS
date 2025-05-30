import { ForesightManager } from "js.foresight"
import { Link } from "react-router-dom"
import BaseForesightButton from "../../_components/TestButtons/BaseForesightButton"

function Other() {
  // Convert Map to array for rendering
  const elementsArray = Array.from(ForesightManager.instance.elements.entries())

  return (
    <div>
      <p>This is to test what happens to the registered elements on going to another page</p>
      <Link className="bg-amber-200 size-20" to="/">
        Back to Test Page
      </Link>
      <div className="mt-10">
        <b>Registered Elements:</b>
        {elementsArray.length === 0 ? (
          <p>No elements registered (this is good)</p>
        ) : (
          elementsArray.map(([element, data], index) => (
            <div key={index} className="border p-2 mb-2">
              <p>
                <strong>Element:</strong> {element.constructor.name}
              </p>
              <p>
                <strong>Data:</strong> {JSON.stringify(data, null, 2)}
              </p>
            </div>
          ))
        )}
      </div>
      <div className={`size-20 mt-30 bg-blue-200`}>
        <BaseForesightButton
          registerOptions={{
            callback: () => {
              console.log("other button")
            },
            hitSlop: 30,
            name: "other",
            unregisterOnCallback: true,
          }}
        ></BaseForesightButton>
      </div>
    </div>
  )
}

export default Other
