---
sidebar_position: 3
---

# TypeScript

ForesightJS is fully written in `TypeScript` to make sure your development experience is as good as possbile.

### Addressing Initially Null Element Refs

In modern frameworks like React you might want to create a seperate hook for using the `ForesightManager.instance.register()` function. The problem you will run in to is that since the `ForesightRegisterOptions` type has an required Element you cant use it like this:

```typscript
function useForesight(registerOptions: ForesightRegisterOptions){}
```

Since now in your function calling useForesight you will have the following:

```typescript
function ForesightButton() {
  const linkRef = React.useRef<HTMLLinkElement>(null)
  const registerOptions: ForesightRegisterOptions = {
    element: linkRef.current, // This will be null on the first render
    callback: () => {},
  }
  useForesight({ ...registerOptions })

  return <link ref={linkRef}></link>
}
```

However with this `linkRef.current` will always be null on first render as React has not yet rendered the link element to the DOM. As you know you cant check for if `linkRef.current` is null since you cant call hooks conditionally in React. The solution would be to create your own type omitting the element on `ForesightRegisterOptions` and setting your own. Well that is exactly what the `ForesightRegisterOptionsWithNullableElement` type does.

Your new hook would look something like this:

```typescript
function useForesight(registerOptions: ForesightRegisterOptionsWithNullableElement) {
  useEffect(() => {
    if (!registerOptions.element) {
      return
    }

    const { unregister } = ForesightManager.instance.register({
      ...(registerOptions as ForesightRegisterOptions),
    })

    return () => {
      unregister()
    }
  }, [registerOptions])
}
```
