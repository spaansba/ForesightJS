import { useEffect } from "react"
import { ForesightManager } from "../../../src/ForesightManager/Manager/ForesightManager"
import type {
  ForesightRegisterOptions,
  ForesightRegisterOptionsWithNullableElement,
} from "../../../src/types/types"

function useForesight(registerOptions: ForesightRegisterOptionsWithNullableElement) {
  useEffect(() => {
    if (!registerOptions.element) {
      return
    }

    const { unregister } = ForesightManager.instance.register({
      ...(registerOptions as ForesightRegisterOptions),
    })

    return () => {
      unregister()
    }
  }, [registerOptions])
}

export default useForesight
