# `src/modules/` — the shared library (`@modules/*`)

62 modules live here flat today. Until stage 3 of the optimize physically groups
them into tier subfolders, THIS file is the tier map: it says what KIND each
module is, so the flat list reads as grouped. The tiers, the barrel-hygiene rule,
and the staged plan are in `.artifacts/states/_modules/structure.md`; the rule a
machine holds is `canon/be/enforce/authoring/naming-and-structure.md` §3.

A NEW module declares its tier here on the day it is created.

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
