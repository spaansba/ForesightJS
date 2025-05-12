import { ForesightManager } from "../../../src/ForesightManager/Manager/ForesightManager"
import { useEffect } from "react"

function useIntent<T extends Element>(onCallback: () => void, linkRef: React.RefObject<T | null>) {
  useEffect(() => {
    if (!linkRef.current) return
    const unregister = ForesightManager.getInstance().register(linkRef.current, onCallback)
    return unregister
  }, [linkRef, onCallback])
}

export default useIntent
