---
sidebar_position: 3
keywords:
  - ForesightJS
  - JS.Foresight
  - Typescript
description: Typescript helpers for the ForesightJS library
last_updated:
  date: 2025-06-04
  author: spaansba
---

# TypeScript

ForesightJS is fully written in `TypeScript` to make sure your development experience is as good as possbile.

## Helper Types

### ForesightRegisterOptionsWithoutElement

Usefull for if you want to create a custom button component in a modern framework (for example React). And you want to have the `ForesightRegisterOptions` used in `ForesightManager.instance.register({})` without the element as the element will be the ref of the component.

```typescript
type ForesightButtonProps = {
  registerOptions: ForesightRegisterOptionsWithoutElement
}

function ForesightButton({ registerOptions }: ForesightButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!buttonRef.current) {
      return
    }

    const { unregister } = ForesightManager.instance.register({
      element: buttonRef.current,
      ...registerOptions,
    })

    return () => {
      unregister()
    }
  }, [buttonRef, registerOptions])

  return (
    <button ref={buttonRef}>
      <span>{registerOptions.name}</span>
    </button>
  )
}
```
