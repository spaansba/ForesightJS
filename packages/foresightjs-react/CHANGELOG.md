# @foresightjs/react

## 1.1.0

### Minor Changes

- [#258](https://github.com/spaansba/ForesightJS/pull/258) [`7dfcb6f`](https://github.com/spaansba/ForesightJS/commit/7dfcb6fde69b0d9d01a1eeb00d92479ea8ed9a5a) Thanks [@spaansba](https://github.com/spaansba)! - Callbacks receive a second argument with `hitType`, the prediction that fired them.

- [#277](https://github.com/spaansba/ForesightJS/pull/277) [`5397d5f`](https://github.com/spaansba/ForesightJS/commit/5397d5fae215f67c8149becb3b048b6030cbcb6a) Thanks [@spaansba](https://github.com/spaansba)! - Removed bookkeeping that only the devtools used. `getManagerData` no longer returns `globalCallbackHits`, `eventListeners`, `activeElementCount`, `parkedElementCount` or `loadedModules`. `registerCount` is removed from `ForesightElementState`, and the `CallbackHits` and `ForesightModules` types are no longer exported. To count callback hits yourself, listen to `callbackInvoked` and read `hitType`. The devtools now count hits on their own.

### Patch Changes

- [#269](https://github.com/spaansba/ForesightJS/pull/269) [`28e1be2`](https://github.com/spaansba/ForesightJS/commit/28e1be2c062ced8f7100b04dc6fc117b36ab5b83) Thanks [@spaansba](https://github.com/spaansba)! - `meta` and `hitSlop` changes are detected by deep equality instead of JSON, so changes to circular `meta` values are applied.
- Updated dependencies [[`7dfcb6f`](https://github.com/spaansba/ForesightJS/commit/7dfcb6fde69b0d9d01a1eeb00d92479ea8ed9a5a), [`369e0e5`](https://github.com/spaansba/ForesightJS/commit/369e0e5b7ae259a2c000ba9faed89712fabe814d), [`5397d5f`](https://github.com/spaansba/ForesightJS/commit/5397d5fae215f67c8149becb3b048b6030cbcb6a), [`369e0e5`](https://github.com/spaansba/ForesightJS/commit/369e0e5b7ae259a2c000ba9faed89712fabe814d), [`677de5f`](https://github.com/spaansba/ForesightJS/commit/677de5fbc87620072da5b17d58d205dd32539b2d)]:
  - js.foresight@5.0.0

## 1.0.1

### Patch Changes

- [#221](https://github.com/spaansba/ForesightJS/pull/221) [`9dd3681`](https://github.com/spaansba/ForesightJS/commit/9dd3681d4106b04db5cc3bbb586f5970c1a3030b) Thanks [@spaansba](https://github.com/spaansba)! - Add `ForesightManager.replaceElementOptions`, which resets omitted options to their defaults. The framework integrations now use it, so removing a prop (e.g. `enabled={false}` to no `enabled`) resets that option instead of keeping its old value.
- Updated dependencies [[`88bd7db`](https://github.com/spaansba/ForesightJS/commit/88bd7db116ef1064358621157c8ac587f103bd15), [`65993e3`](https://github.com/spaansba/ForesightJS/commit/65993e30a9add8a425905acc307c6d0a1cf36350), [`9dd3681`](https://github.com/spaansba/ForesightJS/commit/9dd3681d4106b04db5cc3bbb586f5970c1a3030b), [`c99854e`](https://github.com/spaansba/ForesightJS/commit/c99854edba4224e49684eb99bcb423bdb0ae7694), [`5b6cc9c`](https://github.com/spaansba/ForesightJS/commit/5b6cc9c593958668e41ad9fb63bf81ada24958be), [`8da4323`](https://github.com/spaansba/ForesightJS/commit/8da43231bc85fda172b1b67686ee5b907cca2df7)]:
  - js.foresight@4.3.0
