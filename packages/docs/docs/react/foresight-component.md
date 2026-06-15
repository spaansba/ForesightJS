---
sidebar_position: 3
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - React
  - Component
  - Foresight
  - "@foresightjs/react"
  - Multiple elements
description: Register elements with the Foresight component, including dynamic lists
last_updated:
  date: 2026-06-12
  author: Bart Spaans
---

# Foresight component

`Foresight` is the component form of [`useForesight`](./useForesight.md): one instance, one registration. It renders in one of two ways.

## Rendering an element with `as`

With `as`, `Foresight` renders that element itself and registers it. All other props are forwarded to the element:

```tsx
import { Foresight } from "@foresightjs/react"

function CheckoutButton() {
  return (
    <Foresight as="button" callback={() => prefetch("/checkout")} onClick={checkout}>
      Checkout
    </Foresight>
  )
}
```

`as` accepts any element tag (`"button"`, `"a"`, `"div"`, ...) or a component that forwards its ref to a DOM element.

You can pass your own `ref` (object or callback) to the rendered element. It is merged with the internal registration ref, so you keep direct access to the DOM node while `Foresight` still registers it.

### Reading state in `as` form

To use the [reactive state](./useForesight.md#reactive-state) in this form, pass a function as `children`, `className` or `style` — it receives the state. `Foresight` only subscribes to state-driven re-renders when one of them is a function:

```tsx
<Foresight
  as="button"
  callback={() => prefetch("/checkout")}
  className={({ isPredicted }) => (isPredicted ? "predicted" : "")}
  style={({ isCallbackRunning }) => ({ opacity: isCallbackRunning ? 0.5 : 1 })}
>
  {({ hitCount }) => <>Checkout ({hitCount})</>}
</Foresight>
```

For full control over the rendered markup, use the render-prop form below or [`useForesight`](./useForesight.md).

## Render-prop form

With a function as children, `Foresight` renders nothing itself. The function receives the [reactive state](./useForesight.md#reactive-state) plus the `elementRef` to attach, which gives full control over the markup:

```tsx
import { Foresight } from "@foresightjs/react"

function CheckoutButton() {
  return (
    <Foresight foresightName="checkout" callback={() => prefetch("/checkout")}>
      {({ elementRef, isPredicted }) => (
        <button ref={elementRef} className={isPredicted ? "predicted" : ""}>
          Checkout
        </button>
      )}
    </Foresight>
  )
}
```

In this form the data attributes are not set — you own the element, so render them from the state if you want them.

## Options

`Foresight` takes the same options as [`useForesight`](./useForesight.md), passed as props. The only renamed option is `name`, on the component it is `foresightName`, so the HTML `name` attribute (on `input`, `button`, `select`, ...) falls through to the element like any other prop.

## Dynamic lists

`Foresight` can be rendered in a loop, registering one element per item.

```tsx
import { Foresight } from "@foresightjs/react"

function Nav({ links }: { links: { href: string; label: string }[] }) {
  return (
    <nav>
      {links.map(link => (
        <Foresight
          as="a"
          key={link.href}
          href={link.href}
          foresightName={link.label}
          callback={() => prefetch(link.href)}
        >
          {link.label}
        </Foresight>
      ))}
    </nav>
  )
}
```
