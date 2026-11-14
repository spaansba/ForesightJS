import { describe, expect, it } from "vitest"
import { ElementRef, NgZone } from "@angular/core"
import { ForesightManager } from "js.foresight"
import { ForesightDirective, ForesightService } from "./index"

const { registeredElements } = ForesightManager.instance

const zone = { run: <T>(fn: () => T): T => fn() } as NgZone

describe("against the real ForesightManager", () => {
  it("ForesightDirective registers, mirrors core state, patches options and unregisters", () => {
    const element = document.createElement("a")
    document.body.append(element)
    const directive = new ForesightDirective(new ElementRef(element), new ForesightService(zone))

    directive.fsForesight = () => {}
    directive.fsForesightName = "first"
    directive.ngOnChanges()
    expect(registeredElements.has(element)).toBe(true)
    expect(directive.state().isRegistered).toBe(true)

    directive.fsForesightName = "second"
    directive.ngOnChanges()
    expect(directive.state().name).toBe("second")

    directive.ngOnDestroy()
    expect(registeredElements.has(element)).toBe(false)
    element.remove()
  })
})
