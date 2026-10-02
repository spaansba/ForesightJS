# js.foresight

## 4.3.0

### Minor Changes

- [#226](https://github.com/spaansba/ForesightJS/pull/226) [`5b6cc9c`](https://github.com/spaansba/ForesightJS/commit/5b6cc9c593958668e41ad9fb63bf81ada24958be) Thanks [@spaansba](https://github.com/spaansba)! - Add `ForesightRegister` module augmentation to type metadata across registration options, callbacks, events, devtools, and framework bindings without generics. Export `ForesightMeta`, which preserves `Record<string, unknown>` when no metadata type is registered.

### Patch Changes

- [#222](https://github.com/spaansba/ForesightJS/pull/222) [`88bd7db`](https://github.com/spaansba/ForesightJS/commit/88bd7db116ef1064358621157c8ac587f103bd15) Thanks [@spaansba](https://github.com/spaansba)! - Fix handlers and predictors connecting after a lazy load that was superseded: a device switch (touch to mouse) or touch strategy change mid-load, a teardown mid-load, or a tab/scroll prediction setting turned off mid-load.

- [#220](https://github.com/spaansba/ForesightJS/pull/220) [`65993e3`](https://github.com/spaansba/ForesightJS/commit/65993e30a9add8a425905acc307c6d0a1cf36350) Thanks [@spaansba](https://github.com/spaansba)! - Fix `reactivate()` activating elements on a limited connection or while detached from the DOM, and a double reactivation timer when an element reconnects mid-cooldown.

- [#221](https://github.com/spaansba/ForesightJS/pull/221) [`9dd3681`](https://github.com/spaansba/ForesightJS/commit/9dd3681d4106b04db5cc3bbb586f5970c1a3030b) Thanks [@spaansba](https://github.com/spaansba)! - Add `ForesightManager.replaceElementOptions`, which resets omitted options to their defaults. The framework integrations now use it, so removing a prop (e.g. `enabled={false}` to no `enabled`) resets that option instead of keeping its old value.

- [#210](https://github.com/spaansba/ForesightJS/pull/210) [`c99854e`](https://github.com/spaansba/ForesightJS/commit/c99854edba4224e49684eb99bcb423bdb0ae7694) Thanks [@spaansba](https://github.com/spaansba)! - Fix tab prediction not reconnecting after the manager goes idle (e.g. after all elements unregister on client-side navigation).

- [#224](https://github.com/spaansba/ForesightJS/pull/224) [`8da4323`](https://github.com/spaansba/ForesightJS/commit/8da43231bc85fda172b1b67686ee5b907cca2df7) Thanks [@spaansba](https://github.com/spaansba)! - Fix an element unregistered while its callback runs getting its `data-*` attributes back, and the late completion unobserving or reactivating a later re-registration of the same element.

## 4.2.2

### Patch Changes

- [#175](https://github.com/spaansba/ForesightJS/pull/175) [`13030e3`](https://github.com/spaansba/ForesightJS/commit/13030e325cb69f088ed18acdb2a9a41e9e6c8723) Thanks [@spaansba](https://github.com/spaansba)! - Refactor settings dispatch so each handler reacts to its own setting changes via `onSettingsChanged`, instead of the manager reaching into handler internals.

- [#179](https://github.com/spaansba/ForesightJS/pull/179) [`c617cc8`](https://github.com/spaansba/ForesightJS/commit/c617cc83e3dbd78eddba065b958b705677158168) Thanks [@spaansba](https://github.com/spaansba)! - Treat unknown `navigator.connection.effectiveType` values as unlimited instead of limited, so browsers reporting a new connection type (e.g. a future "5g") no longer silently disable all registered elements. Data saver still counts as limited.

## 4.2.1

### Patch Changes

- [#168](https://github.com/spaansba/ForesightJS/pull/168) [`dfb88f3`](https://github.com/spaansba/ForesightJS/commit/dfb88f34994ffc551cdb639ede59b77bb3a6bb98) Thanks [@spaansba](https://github.com/spaansba)! - Fix lazy predictor connects leaking global listeners when a handler disconnects mid-import. `DesktopHandler.connectTabPredictor`/`connectScrollPredictor` and `TouchDeviceHandler.setTouchPredictor` now re-check `isConnected` after the dynamic `import()` resolves, so a predictor whose handler disconnected during loading no longer attaches `keydown`/`focusin`/`pointerdown` listeners that never get aborted.

- [#158](https://github.com/spaansba/ForesightJS/pull/158) [`8250ad8`](https://github.com/spaansba/ForesightJS/commit/8250ad8cbf269a1e4f5f5d1cdc0303faef729b8c) Thanks [@spaansba](https://github.com/spaansba)! - `CircularBuffer` now exposes `peekWriteSlot()` for zero-allocation slot reuse and drops the unused `getFirstLast()` tuple accessor in favor of `getFirst()`/`getLast()`.

- [#163](https://github.com/spaansba/ForesightJS/pull/163) [`53ef414`](https://github.com/spaansba/ForesightJS/commit/53ef414c857fba10e6e2582ed7521a97befb364b) Thanks [@spaansba](https://github.com/spaansba)! - Drop 4 redundant `if (!this.isSetup)` guards around `initializeGlobalListeners()`. The method already self-guards on `isSetup`, so the outer checks were dead weight.

- [#167](https://github.com/spaansba/ForesightJS/pull/167) [`21f066a`](https://github.com/spaansba/ForesightJS/commit/21f066a7be24bb111dd8e2d87208598c6e358edd) Thanks [@spaansba](https://github.com/spaansba)! - Store event listeners in a `Set` instead of an array. Iterating a `Set` during `emit` means a listener that unsubscribes another mid-dispatch no longer causes the next listener to be skipped, and registration now dedupes like the DOM `addEventListener`.

- [#171](https://github.com/spaansba/ForesightJS/pull/171) [`31d9222`](https://github.com/spaansba/ForesightJS/commit/31d9222dd0f34187400696837e50446242603645) Thanks [@spaansba](https://github.com/spaansba)! - Derive `ForesightEvent` from `keyof ForesightEventMap` instead of hand-duplicating the event names, so adding an event to the map no longer requires updating the union in lockstep.

- [#159](https://github.com/spaansba/ForesightJS/pull/159) [`1de7d1c`](https://github.com/spaansba/ForesightJS/commit/1de7d1cbe9594c95690fc9f2e5d08a303b0f6deb) Thanks [@spaansba](https://github.com/spaansba)! - Skip building the `callbackInvoked` and `callbackCompleted` event payloads when no one is subscribed. Both emits now sit behind a `hasListeners` guard, avoiding a per-callback object allocation and, for `callbackCompleted`, the `activeElementCount` scan that fed its `wasLastActiveElement` field.

- [#174](https://github.com/spaansba/ForesightJS/pull/174) [`f1e06e6`](https://github.com/spaansba/ForesightJS/commit/f1e06e654df59dbc122604cdc6c977fa8348501d) Thanks [@spaansba](https://github.com/spaansba)! - Element state and bounds subscriber `Set`s are now created on first subscribe instead of eagerly at registration. Headless and plain-JS usage that registers elements but never subscribes to reactive state (the common case outside the framework wrappers) no longer allocates two empty `Set`s per element.

- [#166](https://github.com/spaansba/ForesightJS/pull/166) [`ef09598`](https://github.com/spaansba/ForesightJS/commit/ef095981f78e22d64d5d218a9ca4d020fe062c7b) Thanks [@spaansba](https://github.com/spaansba)! - Simplify `loadedPredictors.mouse` to a constant since `mousePredictor` is never null.

- [#157](https://github.com/spaansba/ForesightJS/pull/157) [`502cb8d`](https://github.com/spaansba/ForesightJS/commit/502cb8dae1ceb806345d42342574c1dc7c2e156b) Thanks [@spaansba](https://github.com/spaansba)! - Register the global `pointermove` listener as passive, letting the browser dispatch high-frequency pointer events without treating them as cancelable. Reduces main-thread scheduling pressure during fast mouse movement and scrolling.

- [#162](https://github.com/spaansba/ForesightJS/pull/162) [`b6c50f1`](https://github.com/spaansba/ForesightJS/commit/b6c50f1cade92e337cd6a29a30f809330d70dc65) Thanks [@spaansba](https://github.com/spaansba)! - Remove unused `CircularBuffer` members (`clear`, `size`, `isFull`, `isEmpty`) that were only referenced by tests.

- [#170](https://github.com/spaansba/ForesightJS/pull/170) [`8dc9f8e`](https://github.com/spaansba/ForesightJS/commit/8dc9f8e143ae0afb864ea4df9b56e4eb90dd59b5) Thanks [@spaansba](https://github.com/spaansba)! - The mouse trajectory scan now iterates a precomputed set of scannable elements (on-screen, active, not yet predicted) instead of walking the full registry and re-checking those flags every pointer move. Membership is kept in sync on registration, state changes, and unregistration. Cost now scales with the number of visible elements rather than the total registered, so pages with many registered but few on-screen elements run the per-frame scan dramatically faster with no change at small element counts.

- [#164](https://github.com/spaansba/ForesightJS/pull/164) [`4dd5947`](https://github.com/spaansba/ForesightJS/commit/4dd5947b0dc72aa469b8e68b32e6c589307c2358) Thanks [@spaansba](https://github.com/spaansba)! - Extract `scheduleReactivateTimeout` to remove three copy-pasted reactivation-timeout `setTimeout` blocks, mirroring the existing `clearReactivateTimeout`.

- [#169](https://github.com/spaansba/ForesightJS/pull/169) [`b46a3fd`](https://github.com/spaansba/ForesightJS/commit/b46a3fd824989ee8d156815d89e1e01a4dba6f8c) Thanks [@spaansba](https://github.com/spaansba)! - `ScrollPredictor` no longer caches a `"none"` scroll direction for the whole `handlePositionChange` batch. A non-moving element (e.g. `position:fixed`) returning `"none"` used to poison the cached direction and silently disable scroll prefetch for every later element that actually moved. The direction is now only locked in once a real direction is found.

- [#161](https://github.com/spaansba/ForesightJS/pull/161) [`ab0798f`](https://github.com/spaansba/ForesightJS/commit/ab0798fa528ac89b947c654e4ea554a72dfad406) Thanks [@spaansba](https://github.com/spaansba)! - `predictNextScrollPosition` now writes into a caller-owned `out` point instead of allocating a new one per call, matching `predictNextMousePosition`. `ScrollPredictor` reuses a single predicted-point object across the batch, removing the per-scroll-batch allocation.

- [#174](https://github.com/spaansba/ForesightJS/pull/174) [`5cbefa6`](https://github.com/spaansba/ForesightJS/commit/5cbefa6ef2761aaf6af7e9cf3193d3adf02079fe) Thanks [@spaansba](https://github.com/spaansba)! - `applySettingsChanges` now returns just the changed-settings array instead of that array plus six hand-wired side-effect booleans. `alterGlobalSettings` derives a `Set` of changed keys and checks `changed.has(...)`, so adding a setting no longer means keeping a parallel flag struct in sync in three places.

- [#173](https://github.com/spaansba/ForesightJS/pull/173) [`51cd5fd`](https://github.com/spaansba/ForesightJS/commit/51cd5fd979f76b96363324213bd5a2fc5b623957) Thanks [@spaansba](https://github.com/spaansba)! - Share a base factory between `createElementInternal` and `createUnregisteredSnapshot` so the full `ForesightElementState` field list is only written once, preventing the snapshot from silently drifting when a field is added.

- [#174](https://github.com/spaansba/ForesightJS/pull/174) [`f1e06e6`](https://github.com/spaansba/ForesightJS/commit/f1e06e654df59dbc122604cdc6c977fa8348501d) Thanks [@spaansba](https://github.com/spaansba)! - Share a single frozen empty `meta` object across element states instead of allocating a fresh `{}` per element. The state snapshot is immutable and `meta` is never mutated in place, so registered elements without a `meta` and unregistered snapshots now reuse one object.
