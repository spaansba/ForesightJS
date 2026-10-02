# @foresightjs/vue

## 1.0.1

### Patch Changes

- [#221](https://github.com/spaansba/ForesightJS/pull/221) [`9dd3681`](https://github.com/spaansba/ForesightJS/commit/9dd3681d4106b04db5cc3bbb586f5970c1a3030b) Thanks [@spaansba](https://github.com/spaansba)! - Add `ForesightManager.replaceElementOptions`, which resets omitted options to their defaults. The framework integrations now use it, so removing a prop (e.g. `enabled={false}` to no `enabled`) resets that option instead of keeping its old value.

- [#226](https://github.com/spaansba/ForesightJS/pull/226) [`5b6cc9c`](https://github.com/spaansba/ForesightJS/commit/5b6cc9c593958668e41ad9fb63bf81ada24958be) Thanks [@spaansba](https://github.com/spaansba)! - Add `ForesightRegister` module augmentation to type metadata across registration options, callbacks, events, devtools, and framework bindings without generics. Export `ForesightMeta`, which preserves `Record<string, unknown>` when no metadata type is registered.
- Updated dependencies [[`88bd7db`](https://github.com/spaansba/ForesightJS/commit/88bd7db116ef1064358621157c8ac587f103bd15), [`65993e3`](https://github.com/spaansba/ForesightJS/commit/65993e30a9add8a425905acc307c6d0a1cf36350), [`9dd3681`](https://github.com/spaansba/ForesightJS/commit/9dd3681d4106b04db5cc3bbb586f5970c1a3030b), [`c99854e`](https://github.com/spaansba/ForesightJS/commit/c99854edba4224e49684eb99bcb423bdb0ae7694), [`5b6cc9c`](https://github.com/spaansba/ForesightJS/commit/5b6cc9c593958668e41ad9fb63bf81ada24958be), [`8da4323`](https://github.com/spaansba/ForesightJS/commit/8da43231bc85fda172b1b67686ee5b907cca2df7)]:
  - js.foresight@4.3.0
