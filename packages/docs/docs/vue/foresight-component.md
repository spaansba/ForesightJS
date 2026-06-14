---
sidebar_position: 4
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Vue
  - Vue.js
  - Component
  - Foresight
  - "@foresightjs/vue"
  - Multiple elements
description: Register elements with the Foresight Vue component, including dynamic lists
last_updated:
  date: 2026-06-12
  author: Bart Spaans
---

# Foresight component

`Foresight` is the component form of [`useForesight`](./useForesight.md): one instance, one registration. It renders in one of two ways.

## Rendering an element with `as`

With `as`, `Foresight` renders that element itself and registers it.

```html
<script setup lang="ts">
  import { Foresight } from "@foresightjs/vue"
</script>

<template>
  <Foresight as="button" :callback="() => prefetch('/checkout')" @click="checkout">
    Checkout
  </Foresight>
</template>
```

`as` accepts any element tag (`"button"`, `"a"`, `"div"`, ...) or a component whose root is a DOM element.

:::note
In the `as` form there is no way to pass your own `ref` to the rendered element, `Foresight` uses the ref slot for its registration. If you need the DOM node, use the render-prop form below and attach both refs yourself.
:::

### Reading state in `as` form

To use the [reactive state](./useForesight.md#reactive-state) in this form, read it from the scoped default slot:

```html
<Foresight as="button" :callback="() => prefetch('/checkout')" #default="{ isCallbackRunning }">
  {{ isCallbackRunning ? "Prefetching…" : "Checkout" }}
</Foresight>
```

## Render-prop form

Without `as`, `Foresight` renders only its default slot. The scoped slot receives the [reactive state](./useForesight.md#reactive-state) plus the `elementRef` to attach, which gives full control over the markup:

```html
<script setup lang="ts">
  import { Foresight } from "@foresightjs/vue"
</script>

<template>
  <Foresight
    foresight-name="checkout"
    :callback="() => prefetch('/checkout')"
    #default="{ elementRef, isPredicted }"
  >
    <button :ref="elementRef" :class="{ predicted: isPredicted }">Checkout</button>
  </Foresight>
</template>
```

You must bind `elementRef` to an element with `:ref="elementRef"`, without it nothing is registered with `Foresight`.

## Options

`Foresight` takes the same options as [`useForesight`](./useForesight.md), passed as props. The only renamed option is `name`, on the component it is `foresightName`, so the HTML `name` attribute (on `input`, `button`, `select`, ...) falls through to the element like any other attribute.

## Dynamic lists

`Foresight` can be rendered in a `v-for`, registering one element per item:

```html
<script setup lang="ts">
  import { Foresight } from "@foresightjs/vue"

  const links = [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ]
</script>

<template>
  <nav>
    <Foresight
      v-for="link in links"
      :key="link.href"
      as="a"
      :href="link.href"
      :foresight-name="link.label"
      :callback="() => prefetch(link.href)"
    >
      {{ link.label }}
    </Foresight>
  </nav>
</template>
```
