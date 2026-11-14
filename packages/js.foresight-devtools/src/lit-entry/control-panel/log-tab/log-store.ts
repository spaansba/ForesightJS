import { ForesightManager } from "js.foresight"
import type { ForesightEvent, ForesightEventMap } from "js.foresight"
import {
  safeSerializeEventData,
  safeSerializeManagerData,
  type SerializedEventData,
  type SerializedEventType,
} from "../../../helpers/safeSerializeEventData"
import type { LogEvents, LoggingLocations } from "../../../types/types"
import { ForesightDevtools } from "../../foresight-devtools"

export const MAX_LOGS = 100

export const EVENT_LOOK: Record<SerializedEventType, { label: string; color: string }> = {
  elementRegistered: { label: "+element", color: "#a8a29e" },
  elementUnregistered: { label: "-element", color: "#78716c" },
  callbackInvoked: { label: "invoke", color: "#2dd4bf" },
  callbackCompleted: { label: "done", color: "#4ade80" },
  mouseTrajectoryUpdate: { label: "mouse", color: "#3b82f6" },
  scrollTrajectoryUpdate: { label: "scroll", color: "#eab308" },
  managerSettingsChanged: { label: "settings", color: "#a8a29e" },
  deviceStrategyChanged: { label: "device", color: "#a8a29e" },
  managerDataPayload: { label: "state", color: "#a8a29e" },
  serializationError: { label: "error", color: "#f87171" },
}

/**
 * Collects manager events into a log buffer outside the Lit tree, so logs
 * keep accumulating while the log tab is unmounted (panel minimized or
 * another tab active) and survive remounts.
 */
export class EventLogStore {
  logs: Array<SerializedEventData> = []
  logLocation: LoggingLocations
  eventsEnabled: LogEvents
  private logIdCounter: number = 0
  private changeListeners: Set<() => void> = new Set()
  private managerListeners: Map<
    ForesightEvent,
    (event: ForesightEventMap[ForesightEvent]) => void
  > = new Map()
  private isAttached: boolean = false

  constructor() {
    const {
      logging: { logLocation, ...eventFlags },
    } = ForesightDevtools.instance.devtoolsSettings
    this.logLocation = logLocation
    this.eventsEnabled = eventFlags
  }

  /** Start listening to manager events. Idempotent; called when the control panel mounts. */
  attach(): void {
    if (this.isAttached) {
      return
    }

    this.isAttached = true
    for (const [eventType, enabled] of Object.entries(this.eventsEnabled)) {
      if (enabled) {
        this.addManagerListener(eventType as ForesightEvent)
      }
    }
  }

  /** Stop listening to manager events; the collected logs are kept. */
  detach(): void {
    this.managerListeners.forEach((handler, eventType) => {
      ForesightManager.instance.removeEventListener(eventType, handler)
    })
    this.managerListeners.clear()
    this.isAttached = false
  }

  subscribe(listener: () => void): () => void {
    this.changeListeners.add(listener)

    return () => this.changeListeners.delete(listener)
  }

  setLogLocation(location: LoggingLocations): void {
    this.logLocation = location
    this.notify()
  }

  setEventEnabled(eventType: ForesightEvent, enabled: boolean): void {
    this.eventsEnabled = {
      ...this.eventsEnabled,
      [eventType]: enabled,
    }
    if (this.isAttached) {
      if (enabled) {
        this.addManagerListener(eventType)
      } else {
        this.removeManagerListener(eventType)
      }
    }

    this.notify()
  }

  clear(): void {
    this.logs = []
    this.notify()
  }

  logManagerData(): void {
    if (this.logLocation === "none") {
      return
    }

    if (this.logLocation === "console" || this.logLocation === "both") {
      console.log(ForesightManager.instance.getManagerData)
    }

    if (this.logLocation === "controlPanel" || this.logLocation === "both") {
      this.addLog(
        safeSerializeManagerData(
          ForesightManager.instance.getManagerData,
          ForesightDevtools.instance.callbackHits,
          (++this.logIdCounter).toString()
        )
      )
    }
  }

  private addManagerListener(eventType: ForesightEvent): void {
    if (this.managerListeners.has(eventType)) {
      return
    }

    const handler = (event: ForesightEventMap[typeof eventType]) => {
      this.handleEvent(eventType, event)
    }
    this.managerListeners.set(eventType, handler)
    ForesightManager.instance.addEventListener(eventType, handler)
  }

  private removeManagerListener(eventType: ForesightEvent): void {
    const handler = this.managerListeners.get(eventType)
    if (handler) {
      ForesightManager.instance.removeEventListener(eventType, handler)
      this.managerListeners.delete(eventType)
    }
  }

  private handleEvent<K extends ForesightEvent>(eventType: K, event: ForesightEventMap[K]): void {
    if (this.logLocation === "none") {
      return
    }

    if (this.logLocation === "console" || this.logLocation === "both") {
      const { color } = EVENT_LOOK[eventType]
      console.log(`%c[ForesightJS] ${eventType}`, `color: ${color}; font-weight: bold;`, event)
    }

    if (this.logLocation === "controlPanel" || this.logLocation === "both") {
      const log = safeSerializeEventData(event, (++this.logIdCounter).toString())
      if (log.type === "serializationError") {
        console.error(log.error, log.errorMessage)

        return
      }

      this.addLog(log)
    }
  }

  private addLog(log: SerializedEventData): void {
    this.logs.unshift(log)
    if (this.logs.length > MAX_LOGS) {
      this.logs.pop()
    }

    this.notify()
  }

  private notify(): void {
    for (const listener of this.changeListeners) {
      listener()
    }
  }
}

let storeInstance: EventLogStore | null = null

/** Lazily created so importing this module doesn't initialize the devtools. */
export const getEventLogStore = (): EventLogStore => {
  return (storeInstance ??= new EventLogStore())
}
