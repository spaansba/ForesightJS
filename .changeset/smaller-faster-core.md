---
"js.foresight": major
"js.foresight-devtools": major
---

Make the core smaller and simpler. The full library including dependencies goes from 45.7 kB to 38.8 kB minified (15.6 kB to 12.9 kB gzipped) and from ten chunks to seven.

Breaking changes:

- **`positionHistorySize` is removed.** Mouse velocity uses the positions of the last 80ms, whatever the display refresh rate.
- **`mouseTrajectoryUpdate` no longer carries `trajectoryPositions.positions`.** `currentPoint` and `predictedPoint` are unchanged.
- **`enableManagerLogging` is removed** together with all internal console logging.
- **Out of range settings are clamped silently.** The console warnings are gone.
- **Only the tab predictor is still lazy loaded on its own.** The mouse and scroll predictors ship in the desktop handler chunk and both touch predictors in the touch handler chunk.

The devtools no longer show the position history slider.
