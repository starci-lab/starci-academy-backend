# Context Lock — coding-domain-enablers — plan

| Field | Locked value | Evidence |
|---|---|---|
| Phase | `plan` | `starci-be-feature-plan` |
| Trust root | `D:\Repositories\starci-academy-backend\.claude` | `CLAUDE.md` router |
| Skill | `starci-be-feature-plan` | skill discovery |
| Primary target | `starci-academy-backend` · `D:\Repositories\starci-academy-backend` | request + git |
| **App** | **`core`** — `apps/core`, sourceRoot `apps/core/src`, entry `main` | `nest-cli.json`; six projects exist (`playground-docker-agent`, `playground-k8s-agent`, `playground-rag-agent`, `core`, `mock`, `cli`) and the whole `coding` domain lives under `src/features/api/core/graphql/` |
| **Database** | **`postgresql/primary`** — plus Elasticsearch as the catalog read store | `coding_problems` / `coding_submissions` entities live in `modules/databases/postgresql/primary/entities`; the catalog list reads the per-locale ES index |
| Git identity | `mtp` / `b75ba232` / `https://github.com/starci-lab/starci-academy-backend` | `git rev-parse` |
| Reference | `starci-academy-fe` · `.artifacts/design-plan/coding-practice/plan-record.json` — the approved enabler proposals | FE Plan, `ok: true` |
| Artifact root | `starci-academy-backend/.artifacts/be-feature/coding-domain-enablers` | phase convention |
| Write boundary | the artifact root only | this half is read-only over the target |
| Read-only | `src/**`, `apps/**`, the trust tree, the frontend repository | phase policy |
| Runtime | none — the API was not reachable at `localhost:3001`, so operations were enumerated from the folder tree instead of the live schema | `curl` returned nothing |
| Context record | `context-lock.plan.json` | artifact convention |

## Why the app row matters here

Six Nest projects build from this tree. `coding` is served only by `core`, and the two other
API-shaped apps (`mock`, `cli`) have different auth surfaces. An operation added to the wrong one
compiles, starts and is unreachable by the frontend that asked for it.

## Why the database row matters here

The catalog is **not** read from Postgres. `CodingProblemService.list` queries a per-locale
Elasticsearch index, and Postgres holds the source of truth that the synchronizer feeds it. Both
enablers therefore touch Elasticsearch rather than the entity manager, and neither needs a
migration.

## Inheritance

None. This lock is detected, not inherited. It references the frontend Plan as evidence rather than
inheriting its lock, because the target repository is different.
