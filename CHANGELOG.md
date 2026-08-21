# Changelog

## 0.1.0 (2026-08-21)


### Features

* add AddWebhookForm component with zod validation ([706fbe0](https://github.com/napolab/twitter-webhook/commit/706fbe08751e57de54ce81de91143372d89c9a0c))
* add Panda CSS with Cannelloni design tokens ([1c7ae43](https://github.com/napolab/twitter-webhook/commit/1c7ae432a89b2e23714053bbf52f83c64cc3c30b))
* add POST /rpc/send route with discord webhook fan-out (TDD) ([ffc69a6](https://github.com/napolab/twitter-webhook/commit/ffc69a69fcc4525c4c0e0bd27e58e54a8e5cce63))
* add webhook schema and storage layer with vitest unit config ([1b59307](https://github.com/napolab/twitter-webhook/commit/1b59307dae02d8ec284e155c4b4e36752113a057))
* add WebhookRow and WebhookList components (TDD) ([d24f19b](https://github.com/napolab/twitter-webhook/commit/d24f19bc03399380227b801a57828eded656a9e4))
* **content:** add debug logging and toast notifications to send flow ([63594ca](https://github.com/napolab/twitter-webhook/commit/63594ca4d229ef6a6334235942dc59c2b0885265))
* **content:** inject send-to-webhook button on x.com tweets ([46aeb0c](https://github.com/napolab/twitter-webhook/commit/46aeb0c633e3db30977f71f28fe1de7a80c2c3cd))
* implement Discord payload builder (TDD) ([7f7ad72](https://github.com/napolab/twitter-webhook/commit/7f7ad7292637f4f64cbaaba1c521f2ae056af888))
* implement extractTweetInfo with TDD (task 13) ([7af0f28](https://github.com/napolab/twitter-webhook/commit/7af0f284d88ccb1f5d01286c5c87e686ef913299))
* **popup:** wire App.tsx to rpc client and add/toggle/delete flow ([edeb760](https://github.com/napolab/twitter-webhook/commit/edeb7602919a5bb014d051aabb1fb96e1f11e2c6))
* replace default extension icons with paper-plane brand icon ([a78b81e](https://github.com/napolab/twitter-webhook/commit/a78b81e0de7c1a44009c635c0f93b807278aac9b))
* **rpc:** add Hono RPC wire format and webhook CRUD routes ([4e6986f](https://github.com/napolab/twitter-webhook/commit/4e6986fcd1392ca9ab4b89170eee6e9ff20266e5))
* **ui:** port button/text-field/icons primitives from Cannelloni ([a84a841](https://github.com/napolab/twitter-webhook/commit/a84a8416b0907e0b60f57a1843f0c5a8d4a14ee5))
* **ui:** port dialog/confirm-dialog primitives from Cannelloni ([3518945](https://github.com/napolab/twitter-webhook/commit/35189457344301b41ced461726feaf402d034146))
* wire background RPC listener and hc client transport ([18cf354](https://github.com/napolab/twitter-webhook/commit/18cf3546628bfb2d0d7c8864adf0875f9d451d03))


### Bug Fixes

* **content:** center the injected button vertically in x.com's action bar ([f17e6ed](https://github.com/napolab/twitter-webhook/commit/f17e6edf5b38d468de421bb2d8aaa68f7a77fd40))
* **content:** enable shadow-DOM press support so real clicks reach onPress ([3c3814a](https://github.com/napolab/twitter-webhook/commit/3c3814a31b9ce3196786888a16ce5740a9daf613))
* **content:** stop autoMount from leaking a permanent MutationObserver ([d037306](https://github.com/napolab/twitter-webhook/commit/d037306bc8df1aab25df437a2adbaf7639c9753c))
* **content:** stop leaking injected UIs and fix re-entrant double-mount ([5e35296](https://github.com/napolab/twitter-webhook/commit/5e352968c12550cec5ecb05971b43ed1b1e8493d))
* harden postedAt validation, cleanup observer, and coercion issues ([b6b82bc](https://github.com/napolab/twitter-webhook/commit/b6b82bc8f3c1937190595ab83c4433a4ec43f54f))
* let Panda globalCss own color-scheme and font-family ([13c556a](https://github.com/napolab/twitter-webhook/commit/13c556af438481a3de58879fc3f231b7ad3810eb))
* model RPC boundary and send-result types precisely ([63ce16c](https://github.com/napolab/twitter-webhook/commit/63ce16c3cc70da5306196bd9d4a27f331c3308bc))
* prevent form resubmission deadlock from native constraint validation ([f58e05c](https://github.com/napolab/twitter-webhook/commit/f58e05c807dc1c9ff0ca808f702a7dfd1996b70c))
* **ui:** wire ConfirmDialog description to aria-describedby ([e682ca9](https://github.com/napolab/twitter-webhook/commit/e682ca94849730ed1eea9d3d2c6edb3893b6fdae))
* use null (not undefined) for the RPC wire's no-body case ([116259c](https://github.com/napolab/twitter-webhook/commit/116259cc42f1934e731d75e100f25a2d792a4f3e))
* use SubmitEvent instead of deprecated FormEvent ([0ed9006](https://github.com/napolab/twitter-webhook/commit/0ed90062b688656a5fcf39f0de0cb68a655adef7))
