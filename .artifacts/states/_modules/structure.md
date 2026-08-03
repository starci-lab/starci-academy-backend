# @modules structure — target (2026-08-04)

The goal is a `src/modules/` tree where a reader can tell, from the path alone,
what KIND of module they are importing, and where a barrel can never collide.
See `findings.md` for the as-built mess. This is the target the optimize pass
brings the tree to; it is staged so nothing has to change all its imports at once.

## The five tiers (what each module IS)

| Tier | What it is | Members (as-built names) |
|---|---|---|
| **integrations/** | an adapter to something OUTSIDE the process — a paid API, a broker, a store, an engine | sepay, payos, stripe, paypal, nowpayments, kafka, elasticsearch, s3, cache, keycloak, github, googleapis, langchain, rag, judge0, mailer, transactional-email, sentry, captcha, totp, bullmq, axios, ffmpeg, bento4, execa, code |
| **platform/** | a framework / cross-cutting concern every feature leans on | cqrs, env, event, exceptions, projection, logger, winston, throttler, cors, cookie, csrf, helmet, session, passport, health, routing, locale, client-context, socketio |
| **bussiness/** | a business domain (KEEP the deliberate `bussiness` typo) | the 30 domains |
| **databases/** | entities + data sources | databases |
| **lib/** | a leaf utility with no framework/domain weight | common, mixin, native, stream-async-iterator, validators, assets |

`api`, `init`, `tests`, `docs` are not library modules — they belong to the app
composition / tooling, not the shared lib; the optimize decides case by case
(likely `apps/core` or a top-level `tooling/`), not under `modules/`.

## Barrel hygiene — the rule that clears the 4 tsc errors

**A module's `index.ts` re-exports the Module class, its public Service(s), and
its domain types — EXPLICITLY. It never `export *`s the generic
ConfigurableModuleBuilder tokens** (`ConfigurableModuleClass`,
`MODULE_OPTIONS_TOKEN`, `OPTIONS_TYPE`): those are wired INSIDE the module and no
importer consumes them, so blanket-exporting them from two sub-modules is what
collides (findings #1). Prefer:
```ts
export { XModule } from "./x.module"
export { XService } from "./x.service"
export * from "./types"          // domain types only — never the .module-definition
```
not `export * from "./x.module-definition"`.

**`@modules/bussiness` stops being a flat 30-`export *`.** Consumers import a
domain at `@modules/bussiness/<domain>`, or the aggregate barrel re-exports each
domain explicitly with non-colliding names. Two domains must never both leak a
bare `LeaderboardRow`.

## Staging (so the optimize is safe, not a big-bang)

1. **Barrel + typo fixes** — CHEAP, no import-path churn, clears the 4 baseline
   tsc errors: make `ai/index.ts` and `bussiness/index.ts` (and any other
   `export *`-of-definition barrel) explicit; rename `vaildators` → `validators`
   and update its importers. Do this first — it lowers the "23 baseline" and
   proves the direction.
2. **Tier map, no move** — add a `src/modules/README.md` (or keep this doc as the
   SSOT) listing each module under its tier, so the flat list reads as grouped
   before any file moves. Establish the rule that a NEW module declares its tier.
3. **Physical move** — move each module into its tier subfolder, update the
   `@modules/*` path alias to resolve tiers, and rewrite imports. BIG churn
   (touches nearly every file) — only on the teacher's word, and one tier at a
   time (start with `lib/`, the fewest consumers), each move its own verified
   commit. Not required for the value in stages 1–2.

## Guardrail
Every stage keeps `tsc -p apps/core/tsconfig.app.json` at or below its baseline
(23 today; stage 1 lowers it by 4). No stage lands with a new error, and the
physical move never mixes a rename with a behavior change.
