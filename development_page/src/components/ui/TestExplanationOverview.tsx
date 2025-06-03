function TestExplanationOverview() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-12">
      <h3 className="text-xl font-semibold text-blue-800 mb-4">Button Testing</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-700">
        <div>
          <h4 className="font-semibold mb-2">🔍 Visibility Test (Layout Shift)</h4>
          <p>
            Tests if ForesightManager correctly updates hitboxes when elements are hidden{" "}
            <b>(not removed)</b> from the DOM. The element should still be registered in the
            Debugger while hidden. This also tests the layout shift and if the foresight observers
            correctly recalculate all other registered elements.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">📏 Resize Test (Element Scaling)</h4>
          <p>
            Tests if ForesightManager tracks element boundary changes when the same element changes
            size. This simulates responsive design changes, animations, or user-triggered size
            adjustments.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">❌ Remove Test (DOM Removal)</h4>
          <p>
            Tests if ForesightManager unregisters the element correctly if it is <b>removed</b> from
            the DOM. This also tests the layout shift and if the foresight observers correctly
            recalculate all other registered elements.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">🏷️ No Name Test (Edge Case)</h4>
          <p>Tests ForesightManager behavior with elements that don't have a name property.</p>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-blue-800 mb-4 mt-8">Other Testing</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-700">
        <div>
          <h4 className="font-semibold mb-2">📐 Test Resize/Scroll</h4>
          <p>
            Test if the foresight observers correctly recalculate all registered elements hitboxes
            on scroll/resize.
          </p>
        </div>
      </div>
    </div>
  )
}

export default TestExplanationOverview
