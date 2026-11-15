# @foresightjs/astro

## 1.1.1

### Patch Changes

- [#267](https://github.com/spaansba/ForesightJS/pull/267) [`3badad5`](https://github.com/spaansba/ForesightJS/commit/3badad563ac7715938d5acbf66ca345daee59319) Thanks [@spaansba](https://github.com/spaansba)! - The integration only cleans up the anchors it registered itself. Elements registered by other code are no longer unregistered when they detach.

- [#264](https://github.com/spaansba/ForesightJS/pull/264) [`b28e78a`](https://github.com/spaansba/ForesightJS/commit/b28e78a49ba4902c82085c6e40f7eb17a6a9333b) Thanks [@spaansba](https://github.com/spaansba)! - Links added after a view transition are registered again. The integration observed the body element, which view transitions replace.
- Updated dependencies [[`7dfcb6f`](https://github.com/spaansba/ForesightJS/commit/7dfcb6fde69b0d9d01a1eeb00d92479ea8ed9a5a), [`369e0e5`](https://github.com/spaansba/ForesightJS/commit/369e0e5b7ae259a2c000ba9faed89712fabe814d), [`5397d5f`](https://github.com/spaansba/ForesightJS/commit/5397d5fae215f67c8149becb3b048b6030cbcb6a), [`6d135ff`](https://github.com/spaansba/ForesightJS/commit/6d135ff9780a8164543d890b21df13999bedbdfa), [`369e0e5`](https://github.com/spaansba/ForesightJS/commit/369e0e5b7ae259a2c000ba9faed89712fabe814d), [`677de5f`](https://github.com/spaansba/ForesightJS/commit/677de5fbc87620072da5b17d58d205dd32539b2d)]:
  - js.foresight@5.0.0
  - js.foresight-devtools@3.0.0

## 1.1.0

### Minor Changes

- [#177](https://github.com/spaansba/ForesightJS/pull/177) [`4ed50c9`](https://github.com/spaansba/ForesightJS/commit/4ed50c9a690dea57c160d5ed37c1620a62f9d32c) Thanks [@spaansba](https://github.com/spaansba)! - Add `@foresightjs/astro`, an Astro integration that registers links with ForesightJS and prefetches through `astro:prefetch`. Configured like Astro's built-in prefetch, with `"foresight"` as an extra strategy next to the four native ones.

### Patch Changes

- Updated dependencies [[`4ed50c9`](https://github.com/spaansba/ForesightJS/commit/4ed50c9a690dea57c160d5ed37c1620a62f9d32c), [`13030e3`](https://github.com/spaansba/ForesightJS/commit/13030e325cb69f088ed18acdb2a9a41e9e6c8723), [`c617cc8`](https://github.com/spaansba/ForesightJS/commit/c617cc83e3dbd78eddba065b958b705677158168)]:
  - js.foresight-devtools@2.2.2
  - js.foresight@4.2.2
