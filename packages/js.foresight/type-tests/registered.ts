import { expectTypeOf } from "vitest"
import {
  ForesightManager,
  type ForesightElementState,
  type ForesightEventMap,
  type ForesightMeta,
  type ForesightRegisterOptionsWithoutElement,
} from "js.foresight"
import {
  useForesight as useReactForesight,
  type ForesightProps as ReactProps,
} from "../../foresightjs-react"
import {
  useForesight as useVueForesight,
  type ForesightProps as VueProps,
} from "../../foresightjs-vue"
import type {
  ForesightComponent,
  ForesightDirective,
  ForesightService,
} from "../../foresightjs-angular"
import { registerForesight } from "../../foresightjs-astro/src/client/register"
import type { SerializedEventData } from "../../js.foresight-devtools/src/helpers/safeSerializeEventData"

interface AppMeta {
  href: string
}

declare module "js.foresight" {
  interface ForesightRegister {
    meta: AppMeta
  }
}

expectTypeOf<ForesightMeta>().toEqualTypeOf<AppMeta>()
expectTypeOf<ForesightElementState["meta"]>().toEqualTypeOf<AppMeta>()
expectTypeOf<ForesightRegisterOptionsWithoutElement["meta"]>().toEqualTypeOf<AppMeta | undefined>()
expectTypeOf<{ href: number }>().not.toExtend<ForesightMeta>()
expectTypeOf<{ other: string }>().not.toExtend<ForesightMeta>()

declare const element: HTMLAnchorElement

const result = ForesightManager.instance.register({
  element,
  meta: { href: "/about" },
  callback: state => {
    expectTypeOf(state.meta.href).toEqualTypeOf<string>()
  },
})

expectTypeOf(result.getSnapshot().meta).toEqualTypeOf<AppMeta>()

ForesightManager.instance.addEventListener("callbackInvoked", event => {
  expectTypeOf(event.state.meta.href).toEqualTypeOf<string>()
})

type ElementEvents = Extract<ForesightEventMap[keyof ForesightEventMap], { state: unknown }>
expectTypeOf<ElementEvents["state"]["meta"]>().toEqualTypeOf<AppMeta>()

const reactState = useReactForesight({
  meta: { href: "/about" },
  callback: state => {
    expectTypeOf(state.meta.href).toEqualTypeOf<string>()
  },
})
expectTypeOf(reactState.meta).toEqualTypeOf<AppMeta>()
expectTypeOf<ReactProps["meta"]>().toEqualTypeOf<AppMeta | undefined>()

const vueState = useVueForesight({
  meta: { href: "/about" },
  callback: state => {
    expectTypeOf(state.meta.href).toEqualTypeOf<string>()
  },
})
expectTypeOf(vueState.meta.value).toEqualTypeOf<AppMeta>()
expectTypeOf<VueProps["meta"]>().toEqualTypeOf<AppMeta | undefined>()
expectTypeOf<ForesightComponent["meta"]>().toEqualTypeOf<AppMeta | undefined>()
expectTypeOf<ForesightDirective["fsForesightMeta"]>().toEqualTypeOf<AppMeta | undefined>()

declare const service: ForesightService
const angularState = service.register(element, {
  meta: { href: "/about" },
  callback: state => {
    expectTypeOf(state.meta.href).toEqualTypeOf<string>()
  },
})
expectTypeOf(angularState.state().meta).toEqualTypeOf<AppMeta>()

const astroResults = registerForesight(element, {
  meta: { href: "/about" },
  callback: state => {
    expectTypeOf(state.meta.href).toEqualTypeOf<string>()
  },
})
expectTypeOf(astroResults[0].meta).toEqualTypeOf<AppMeta>()

type ElementPayloads = Extract<SerializedEventData, { meta: unknown }>
expectTypeOf<ElementPayloads["meta"]>().toEqualTypeOf<AppMeta>()
