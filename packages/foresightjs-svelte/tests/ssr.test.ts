import { expect, it } from "vitest"
import { render } from "svelte/server"
import { ForesightManager } from "js.foresight"
import SSR from "./SSR.svelte"

it("renders actions and reactive state without browser globals or initializing the manager", () => {
  expect(typeof window).toBe("undefined")
  expect(ForesightManager.isInitiated).toBe(false)
  const { body } = render(SSR)
  expect(body).toContain('href="/about"')
  expect(body).toContain("false")
  expect(ForesightManager.isInitiated).toBe(false)
})
