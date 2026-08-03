# @modules structure — findings (2026-08-04)

`src/modules/` is the shared library the whole monorepo imports as `@modules/*`
(alias in tsconfig.json:29). It has grown to **62 top-level modules in one flat
list** with no grouping, mixing five unrelated concerns, and its barrels
`export *` in a way that already produces real `tsc` errors. Ranked by cost.

## 1. [build] Giant `export *` barrels collide on the generic module-definition tokens — 4 of the 23 baseline tsc errors
Every `*.module-definition.ts` (ConfigurableModuleBuilder) exports the same
three generic names — `ConfigurableModuleClass`, `MODULE_OPTIONS_TOKEN`,
`OPTIONS_TYPE`. A barrel that `export *`s from more than one sub-module that
each re-export those names collides (TS2308 "already exported a member").
- `src/modules/ai/index.ts:10` — `./balancer` re-collides all three tokens (3 errors)
- `src/modules/bussiness/index.ts:24` — `./projections` re-collides `LeaderboardRow` (1 error)
These are not cosmetic — they are 4 of the "23 baseline" errors every refactor
round has been measuring against. A barrel must re-export the module + service +
domain types EXPLICITLY, never blanket `export *` the definition tokens.

## 2. [structure] 62 modules, one flat list, five concerns mixed with no tier
No reader can tell an external adapter from a framework concern from a leaf
utility — they sit alphabetically side by side:
- **External integrations / adapters**: sepay, payos, stripe, paypal, nowpayments,
  kafka, elasticsearch, s3, cache(redis), keycloak, github, googleapis, langchain,
  rag, judge0, mailer, transactional-email, sentry, captcha, totp, bullmq, axios,
  ffmpeg, bento4, execa, code, api
- **Platform / framework cross-cutting**: cqrs, env, event, exceptions, projection,
  logger, winston, throttler, cors, cookie, csrf, helmet, session, passport,
  health, routing, locale, client-context, socketio
- **Utility / lib**: common, mixin, native, stream-async-iterator, vaildators,
  assets, docs, tests
- **Business**: bussiness (30 domains), membership, playground-agent-core
- **Data**: databases
An import of `@modules/mixin` reads the same weight as `@modules/stripe`; there
is no boundary telling a newcomer which modules are safe to depend on freely
(util/platform) and which are heavy adapters (infra).

## 3. [naming] `vaildators` is a typo (should be `validators`)
`src/modules/vaildators/` — unlike the DELIBERATE `bussiness` typo (a house
convention, see memory), this one is an accidental transposition. It ships in
the public `@modules/vaildators` path.
- `src/modules/vaildators/`

## 4. [structure] `@modules/bussiness` is one flat 30-`export *` barrel
`bussiness/index.ts` blanket-re-exports all 30 domains, so every consumer pulls
the whole business surface through one name and any two domains exporting the
same type name collide (finding #1's LeaderboardRow). A per-domain import path
(`@modules/bussiness/<domain>`) or explicit re-exports would scope it.
- `src/modules/bussiness/index.ts` (30 `export *`)

## Target
See `structure.md` in this folder — the agreed target tiering + barrel-hygiene
rules. The optimize pass brings the tree to it, clearing findings #1 (the 4 tsc
errors) as a side effect.
