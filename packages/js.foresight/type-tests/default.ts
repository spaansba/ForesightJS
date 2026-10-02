import { expectTypeOf } from "vitest"
import type {
  ForesightElementState,
  ForesightMeta,
  ForesightRegisterOptionsWithoutElement,
} from "js.foresight"

expectTypeOf<ForesightMeta>().toEqualTypeOf<Record<string, unknown>>()
expectTypeOf<ForesightElementState["meta"]>().toEqualTypeOf<Record<string, unknown>>()
expectTypeOf<ForesightRegisterOptionsWithoutElement["meta"]>().toEqualTypeOf<
  Record<string, unknown> | undefined
>()
