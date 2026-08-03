# `src/modules/` — the shared library (`@modules/*`)

The modules are grouped into tier subfolders (stage 3 of the optimize, done for
the three movable tiers below). Imports stay `@modules/<name>` — the `@modules/*`
alias is a multi-root array (tsconfig + the jest configs) resolving
`src/modules/*` then each tier folder, so a module's physical tier and its import
path are decoupled and moving a module never churns its importers. The rule a
machine holds is `canon/be/enforce/authoring/naming-and-structure.md` §3; the
target + staged plan are in `.artifacts/states/_modules/structure.md`.

A NEW module is created directly inside its tier folder.

Still flat at the root (a later call — borderline or app-composition, not moved):
`ai`, `crypto`, `filesystem` (borderline integration/platform), and `api`, `init`,
`tests`, `docs`, `membership`, `playground-agent-core` (app composition / tooling).

## integrations/ — an adapter to something OUTSIDE the process
sepay · payos · stripe · paypal · nowpayments · kafka · elasticsearch · s3 ·
cache · keycloak · github · googleapis · langchain · rag · judge0 · mailer ·
transactional-email · sentry · captcha · totp · bullmq · axios · ffmpeg ·
bento4 · execa · code

## platform/ — a framework / cross-cutting concern every feature leans on
cqrs · env · event · exceptions · projection · logger · winston · throttler ·
cors · cookie · csrf · helmet · session · passport · health · routing · locale ·
client-context · socketio

## bussiness/ — the business domains (the `bussiness` typo is DELIBERATE, it stays)
30 domain modules — see each under `bussiness/`. Import a domain at
`@modules/bussiness/<domain>`, not the flat aggregate barrel.

## data
databases (entities + data sources)

## lib/ — a leaf utility with no framework or domain weight
common · mixin · native · stream-async-iterator · validators · assets

## not a library module (belongs to app composition / tooling, not `modules/`)
api · init · tests · docs · membership* · playground-agent-core*
(* membership + playground-agent-core are business-adjacent; their final home is
a stage-3 decision.)
