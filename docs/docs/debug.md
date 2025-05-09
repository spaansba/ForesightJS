---
sidebar_position: 3
---

# Debugging

ForesightJS includes a visual debugging system that helps you understand and tune how foresight is working in your application. This is particularly helpful when setting up ForesightJS for the first time or when fine-tuning for specific UI components.

## Enabling Debug Mode

Debugmode is turned on in the initialization of ForesightManager (see [configuration](/docs/next/config))

```javascript
import { ForesightManager } from "foresightjs"

ForesightManager.initialize({
  debug: true, // Enable debug mode
})
```

## Debug Mode Features

When debug mode is enabled, ForesightJS adds several visual elements to your application in an shadow-dom:

### Visual Elements

1. **Element Overlays**: Blue outlines showing the actual bounds of registered elements

   - Blue: Normal state
   - Orange: When the mouse is hovering over the element
   - Green: When a trajectory hit is detected

2. **Expanded Area Overlays**: Dashed borders showing the expanded hit areas (hit slop)

3. **Trajectory Visualization**:

   - Orange line showing the predicted mouse path
   - Orange circle showing the predicted future mouse position

4. **Element Names**: Labels above each registered element (if you provided names during registration)

### Interactive Control Panel

A control panel appears in the bottom-right corner of the screen, allowing you to:

1. **Toggle Mouse Prediction**: Turn prediction on/off while testing
2. **Adjust History Size**: Change how many positions are used for calculations
3. **Adjust Prediction Time**: Modify how far ahead the mouse trajectory is predicted
4. **Adjust Throttle Delay**: Change how often element positions are recalculated on resize/scroll

These controls affect the ForesightManager configuration in real-time, allowing you to see how different settings impact the behavior of your UI. They are however only applicable to your current session, to save these values change them in your configuration.

## Debug Mode in Different Environments

### Development

In development, you might want to enable debug mode by default:

```javascript
ForesightManager.initialize({
  debug: process.env.NODE_ENV === "development",
})
```

### Production

For production, you might want to provide a way for testers or developers to enable debug mode when needed:

```javascript
// Example: Enable debug with a special query parameter
if (window.location.search.includes("debug=foresight")) {
  ForesightManager.instance.alterGlobalSettings({ debug: true })
}
```

## Performance Considerations

Debug mode adds additional DOM elements and visual updates, which can impact performance. It's intended for development and testing only and should not be enabled in production environments.
