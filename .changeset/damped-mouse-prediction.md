---
"js.foresight": minor
---

Improve mouse trajectory prediction. Velocity is now a least-squares fit over the positions of the last 80ms using the pointer event timestamps, which makes it independent of the display refresh rate and stops positions from before a pause from skewing it. The predicted reach now grows with the logarithm of the speed instead of linearly, so fast movements no longer overshoot far past their target. Replayed on recorded mouse sessions this triggers the clicked element about as early with roughly a quarter fewer wrong elements, and the predicted point is about 25% closer to where the cursor ends up.
