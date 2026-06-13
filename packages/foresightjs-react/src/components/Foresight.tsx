import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactNode } from "react"
import type { ForesightElementState } from "js.foresight"
import { useForesightRegistration } from "../hooks/useForesightRegistration"
import { useForesightState } from "../hooks/useForesightState"
import type { ForesightOptions, ForesightResult } from "../types"

/**
 * Component form of the registration options. The foresight `name` option is
 * exposed as `foresightName` so the HTML `name` attribute (on `input`,
 * `button`, `select`, ...) can be forwarded to the element in the `as` form.
 */
export type ForesightComponentOptions = Omit<ForesightOptions, "name"> & {
  foresightName?: string
}

export type ForesightProps<T extends HTMLElement = HTMLElement> = ForesightComponentOptions & {
  as?: never
  className?: never
  style?: never
  children: (result: ForesightResult<T>) => ReactNode
}

export type ForesightAsProps<E extends ElementType> = ForesightComponentOptions & {
  as: E
  children?: ReactNode | ((state: ForesightElementState) => ReactNode)
  className?: string | ((state: ForesightElementState) => string)
  style?: CSSProperties | ((state: ForesightElementState) => CSSProperties | undefined)
} & Omit<
    ComponentPropsWithoutRef<E>,
    keyof ForesightComponentOptions | "as" | "children" | "className" | "style"
  >

/**
 * Component form of useForesight: one instance, one registration.
 *
 * With `as`, it renders that element itself and forwards the remaining props
 * to it, including the HTML `name` attribute (the foresight name is
 * `foresightName`). It mirrors the element state onto `data-predicted`,
 * `data-active`, `data-callback-running` and `data-status` attributes via
 * direct DOM mutation, so plain CSS can style predictions. `children`,
 * `className` and `style` may also be functions of the reactive state:
 *
 * ```tsx
 * <Foresight
 *   as="button"
 *   callback={() => prefetch("/checkout")}
 *   onClick={checkout}
 *   className="checkout data-predicted:outline-amber-500"
 * >
 *   Checkout
 * </Foresight>
 * ```
 *
 * With a function as children and no `as`, it renders nothing itself and
 * passes the reactive state plus the elementRef to attach, giving full
 * control over the markup:
 *
 * ```tsx
 * <Foresight callback={() => prefetch(item.url)}>
 *   {({ elementRef, isPredicted }) => (
 *     <a ref={elementRef} href={item.url} className={isPredicted ? "predicted" : ""}>
 *       {item.name}
 *     </a>
 *   )}
 * </Foresight>
 * ```
 */
export function Foresight<T extends HTMLElement = HTMLElement>(props: ForesightProps<T>): ReactNode
export function Foresight<E extends ElementType>(props: ForesightAsProps<E>): ReactNode
export function Foresight(props: ForesightProps | ForesightAsProps<ElementType>): ReactNode {
  return props.as ? <ForesightElement {...props} /> : <ForesightRenderProp {...props} />
}

// Change name to foresightName for the component form, so the HTML name attribute can be forwarded to the element in the `as` form.
const toRegistrationOptions = ({
  foresightName,
  ...options
}: ForesightComponentOptions): ForesightOptions => ({
  ...options,
  name: foresightName,
})

const ForesightRenderProp = <T extends HTMLElement>({
  children,
  ...options
}: ForesightProps<T>): ReactNode => {
  const { elementRef, registerResults } = useForesightRegistration<T>(
    toRegistrationOptions(options)
  )
  const state = useForesightState(registerResults)

  return children({ elementRef, ...state })
}

const ForesightElement = (props: ForesightAsProps<ElementType>): ReactNode => {
  const {
    as: Tag,
    children,
    className,
    style,
    callback,
    hitSlop,
    foresightName,
    meta,
    reactivateAfter,
    enabled,
    ...domProps
  } = props

  // The `satisfies` clause keeps the destructuring above exhaustive: when the
  // core options type gains a key this stops compiling until the key is
  // pulled out of the props, so a new option can never silently fall through
  // to the DOM element.
  const options = {
    callback,
    hitSlop,
    name: foresightName,
    meta,
    reactivateAfter,
    enabled,
  } satisfies Record<keyof ForesightOptions, unknown>

  const { elementRef, registerResults } = useForesightRegistration(options)

  // Subscribe only when something actually reads the state, so a fully static
  // element does not re-render on state changes
  const readsState =
    typeof children === "function" || typeof className === "function" || typeof style === "function"

  const state = useForesightState(readsState ? registerResults : null)

  return (
    <Tag
      {...domProps}
      className={typeof className === "function" ? className(state) : className}
      style={typeof style === "function" ? style(state) : style}
      ref={elementRef}
    >
      {typeof children === "function" ? children(state) : children}
    </Tag>
  )
}
