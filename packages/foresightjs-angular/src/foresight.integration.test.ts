import { describe, expect, it } from "vitest"
import "@angular/compiler"
import { ForesightManager } from "js.foresight"
import { ForesightDirective } from "./index"
import { createInContext } from "./tests/helpers"

const { registeredElements } = ForesightManager.instance

describe("against the real ForesightManager", () => {
  it("ForesightDirective registers, mirrors core state, patches options and unregisters", () => {
    const element = document.createElement("a")
    document.body.append(element)
    const directive = createInContext(() => new ForesightDirective(), { element })

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
