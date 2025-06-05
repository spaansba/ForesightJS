---
sidebar_position: 3
keywords:
  - ForesightJS
  - Tanstack Router
  - Prefetching
  - Routing
description: Integration details to add ForesightJS to your Tanstack Router projects
last_updated:
  date: 2025-06-04
  author: spaansba
---

# TanStack Router

## Native Predictive Prefetching Coming to TanStack Router

Good news for TanStack Router users as predictive prefetching is planned as a built-in feature. [See announcement by Tanner Linsley](https://x.com/tannerlinsley/status/1908723776650355111).

A subtle difference is that ForesightJS applies `hitSlop` around _target elements_, TanStack Router's method is expected to use a predictive "slop" around the _mouse cursor's future path_ to detect intersections.

While ForesightJS offers a debug visualization mode not expected in the TanStack Router implementation, the native integration will likely provide better integration. Given the track record of the TanStack team, this native solution will be worth adopting when available.
