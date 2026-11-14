import { ElementRef, Injector, NgZone, PLATFORM_ID, runInInjectionContext } from "@angular/core"
import { ForesightService } from "../services/ForesightService"

const passthroughZone: Pick<NgZone, "run"> = { run: fn => fn() }

type InjectionOptions = {
  element?: Element
  zone?: Pick<NgZone, "run">
  platform?: "browser" | "server"
}

export const createInContext = <T>(
  create: () => T,
  {
    element = document.createElement("button"),
    zone = passthroughZone,
    platform = "browser",
  }: InjectionOptions = {}
): T =>
  runInInjectionContext(
    Injector.create({
      providers: [
        { provide: ElementRef, useValue: new ElementRef(element) },
        { provide: NgZone, useValue: zone },
        { provide: PLATFORM_ID, useValue: platform },
        { provide: ForesightService, useFactory: () => new ForesightService() },
      ],
    }),
    create
  )
