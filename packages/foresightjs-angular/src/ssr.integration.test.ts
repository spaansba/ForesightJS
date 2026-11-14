// @vitest-environment node
import "@angular/compiler"
import { expect, it, vi } from "vitest"
import { Component, provideZonelessChangeDetection } from "@angular/core"
import { bootstrapApplication, type BootstrapContext } from "@angular/platform-browser"
import { renderApplication } from "@angular/platform-server"
import { ForesightComponent, ForesightDirective } from "./index"

@Component({
  selector: "app-root",
  standalone: true,
  imports: [ForesightDirective, ForesightComponent],
  template: `
    <a [fsForesight]="prefetch">directive</a>
    <foresight [callback]="prefetch">component</foresight>
  `,
})
class App {
  prefetch = () => {}
}

it("server-renders foresight directives and components without errors", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

  const html = await renderApplication(
    (context: BootstrapContext) =>
      bootstrapApplication(App, { providers: [provideZonelessChangeDetection()] }, context),
    { document: "<html><body><app-root></app-root></body></html>", url: "/" }
  )

  expect(consoleError).not.toHaveBeenCalled()
  expect(html).toContain("<a>directive</a>")
  expect(html).toContain("<foresight>component</foresight>")
})
