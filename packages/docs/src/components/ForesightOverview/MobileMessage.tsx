import React from "react"

function MobileMessage() {
  return (
    <p>
      <strong>Note:</strong> ForesightJS now offers mobile support as of version 3.3.0 in the form
      of Viewport and onTouchStart predictions! However, to fully see how Foresight actually works
      and experience the complete mouse trajectory prediction system, you need to be on desktop. You
      can read the <a href="/docs/getting-started/what-is-foresightjs">documentation</a> and learn
      more about{" "}
      <a
        href="https://foresightjs.com/docs/getting-started/what-is-foresightjs#touch-devices-v330"
        target="_blank"
        rel="noopener noreferrer"
      >
        mobile support here
      </a>
      .
    </p>
  )
}

export default MobileMessage
