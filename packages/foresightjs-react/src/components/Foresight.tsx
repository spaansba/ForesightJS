import { forwardRef, useCallback } from "react"
import type {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  CSSProperties,
  ElementType,
  ForwardedRef,
  ForwardRefRenderFunction,
  ReactNode,
  Ref,
} from "react"
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

type ForesightComponent = {
  <T extends HTMLElement = HTMLElement>(props: ForesightProps<T>): ReactNode
  <E extends ElementType>(
    props: ForesightAsProps<E> & { ref?: ComponentPropsWithRef<E>["ref"] }
  ): ReactNode
}

const renderForesight = (
  props: ForesightProps | ForesightAsProps<ElementType>,
  ref: ForwardedRef<HTMLElement>
): ReactNode =>
  props.as ? <ForesightElement {...props} forwardedRef={ref} /> : <ForesightRenderProp {...props} />

export const Foresight = forwardRef(
  renderForesight as ForwardRefRenderFunction<HTMLElement, never>
) as unknown as ForesightComponent

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

const ForesightElement = ({
  forwardedRef,
  ...props
}: ForesightAsProps<ElementType> & { forwardedRef: ForwardedRef<HTMLElement> }): ReactNode => {
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

  const mergedRef = useMergedRef(elementRef, forwardedRef)

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
      ref={mergedRef}
    >
      {typeof children === "function" ? children(state) : children}
    </Tag>
  )
}

const useMergedRef = <T extends HTMLElement>(
  registrationRef: (node: T | null) => void,
  userRef: Ref<T> | undefined
): ((node: T | null) => void) =>
  useCallback(
    (node: T | null) => {
      registrationRef(node)
      if (typeof userRef === "function") {
        userRef(node)
      } else if (userRef) {
        userRef.current = node
      }
    },
    [registrationRef, userRef]
  )
