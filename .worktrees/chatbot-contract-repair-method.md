# Chatbot FE/BE contract repair verification method

## Frozen source heads

- Backend: `b96f347c58208ec539e955e4aff816a9f375cc95`
- Frontend: `f8e4b457e3275aa99c0d7d32cabf297ac228a888`
- Dependency order: backend read-model/schema repair, then frontend document/adapter/action repair.

## Source-grounded schema check

Run from the backend checkout:

```powershell
node 'D:\Repositories\starci-academy-backend\.worktrees\chatbot-contract-schema-check.cjs' 'D:\Repositories\nivo-fe-chatbot-20260905160512'
```

The checker loads the real Nest decorators from the backend checkout, generates a GraphQL schema with
`GraphQLSchemaFactory`, extracts all six Chatbot GraphQL documents from the frontend API module, and
validates their ASTs with `graphql.validate`. It must report all six documents valid after the repair.

The frozen pre-repair run fails on the nonexistent workbench fields, illegal JSON sub-selections,
wrong input types, wrong Zalo mutation name, and wrong mutation payload selections. This is an actual
schema comparison rather than a mocked fetch assertion.

## Required behavioral regressions

- Backend workbench readback includes installation-qualified messages without credential material and
  proves owner/installation isolation in its resolver/service test.
- Frontend maps JSON scalar rows into a narrow validated view model; malformed rows fail closed.
- Lifecycle and approved version come from the existing installation runtime, not invented workbench
  fields.
- Zalo start parses `result.authorizationUrl` and redirects only after an accepted response.
- Resolve handoff carries the selected conversation's `authorityEpoch`.
- Delivery reconciliation emits `outboxId`, `terminalState`, and `evidenceRef` using the real input type.
  The UI must collect or surface an actual provider/operator evidence reference before enabling either
  terminal action; it must not fabricate one from the outbox id or silently mark an ambiguous send.
- Zalo redirect accepts only an HTTPS authorization URL on the expected Zalo OAuth host; malformed or
  foreign URLs fail closed instead of becoming an open redirect.
- No test performs a provider send or contains a provider credential.

## Gates

- Backend focused tests, typecheck, lint, and schema checker.
- Frontend focused tests, typecheck, lint, and schema checker against the corrected backend head.
- Both checkouts clean after separate normal commits; shared ModuleCenter remains untouched.
