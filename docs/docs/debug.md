---
sidebar_position: 3
---

# Debugging

ForesightJS includes a powerful visual debugging system that helps you understand and tune how prediction is working in your application. This is particularly helpful when setting up ForesightJS for the first time or when fine-tuning for specific UI components.

## Enabling Debug Mode

You can enable debugging in two ways:

### 1. During Initialization

```javascript
import { ForesightManager } from 'foresightjs';

ForesightManager.initialize({
  debug: true, // Enable debug mode
  // other options...
});
```

### 2. After Initialization

```javascript
// Get the ForesightManager instance
const manager = ForesightManager.instance;

// Toggle debug mode on
manager.alterGlobalSettings({
  debug: true
});

// Later, toggle it off
manager.alterGlobalSettings({
  debug: false
});
```

## Debug Mode Features

When debug mode is enabled, ForesightJS adds several visual elements to your application:

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

These controls affect the ForesightManager configuration in real-time, allowing you to see how different settings impact the behavior of your UI.

## How to Use Debug Mode Effectively

### 1. Observe Trajectory Accuracy

Watch how the orange prediction line and circle track ahead of your mouse movements. The accuracy of this prediction determines how effective ForesightJS will be. If prediction seems erratic:

- Increase `positionHistorySize` for smoother predictions
- Decrease `trajectoryPredictionTime` for more conservative predictions

### 2. Evaluate Hit Areas

The dashed lines show the expanded hit areas around elements. Make sure they:

- Cover logical approach paths to the element
- Don't overlap too much with other interactive elements
- Extend far enough to give adequate prediction time

### 3. Test Edge Cases

Use debug mode to test different mouse movement patterns:

- Fast movements
- Slow, deliberate movements
- Curved approaches
- Sudden direction changes

### 4. Tune Settings in Real-time

The control panel lets you adjust settings while using your application:

1. Try different settings combinations
2. Note which values work best for your specific UI
3. Apply those values in your production configuration

## Debug Mode in Different Environments

### Development

In development, you might want to enable debug mode by default:

```javascript
ForesightManager.initialize({
  debug: process.env.NODE_ENV === 'development'
});
```

### Production

For production, you might want to provide a way for testers or developers to enable debug mode when needed:

```javascript
// Example: Enable debug with a special query parameter
if (window.location.search.includes('debug=foresight')) {
  ForesightManager.instance.alterGlobalSettings({ debug: true });
}
```

## Performance Considerations

Debug mode adds additional DOM elements and visual updates, which can impact performance. It's intended for development and testing only and should not be enabled in production environments.
