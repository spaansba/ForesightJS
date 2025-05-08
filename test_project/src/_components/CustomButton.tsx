import { useRef } from "react"
import useIntent from "./useIntent"

function CustomButton() {
  const buttonRef = useRef(null)

  useIntent(() => {
    console.log("test")
  }, buttonRef)
  return (
    <div ref={buttonRef} id="100" className="bg-white">
      CustomButton
    </div>
  )
}

export default CustomButton
