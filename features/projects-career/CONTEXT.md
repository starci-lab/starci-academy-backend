# Projects and career

> Business identity: `starci-academy/projects-career@fbdd3a27f504677664c5457af29d396bdd8e7d2de882e0e520a84a2ed02f6429`
>
> Source heads: authority `approved` · base `05229e6d47d376406d216ad7386fa2b4ef68be0fa0fd990473d696046f53fd85` · `fe@16d5692ce07f`, `be@451ac8583742`
>
> Approved owner revision: `2ae6be3fcc3222442c8e2c6b15bf5fbb6e18946e183e6a546ee15e48f3edd2ec`

## Decision capsule

**Purpose.** Carry an enrolled learner from project roadmap through explicit repository and AI-grading intent, asynchronous evidence, revision and next-task handoff.

**Primary actor.** Learner

**Primary outcome.** One traceable project-review loop completes without losing course context.

**Never does.** Challenge grading, academy-wide AI chat, public portfolio publishing or team collaboration.

## Invariants

- `PP-01` — Only an authenticated learner enrolled in the course may submit or inspect private personal-project grading evidence.
- `PP-02` — The roadmap exposes deterministic milestone order, next task, completion, attempt count and score evidence; availability follows course progress rather than UI-local state.
- `PP-03` — The authored task brief remains readable when repository, model-catalog, attempt-history or feedback dependencies fail.
- `PP-04` — Repository URL, branch and private-token settings belong to the course enrollment and are reused across tasks; the token is write-only and only a last-four indicator may return.
- `PP-05` — The learner chooses the grading language and may deliberately choose Auto or any currently eligible concrete model. A concrete choice sends both model and provider; Auto delegates selection to the backend.
- `PP-06` — A submitted attempt binds task, repository URL, branch, language and grading choice as one review intent. A visible model selection that is not submitted is a contract failure.
- `PP-07` — Each submission creates one asynchronous attempt. Queued, processing, failed and completed states remain distinguishable, and retry must not silently duplicate an in-flight attempt.
- `PP-08` — Completed attempts are immutable, newest-first and independently selectable. The result identifies score, verdict, served model or provider, time and structured findings.
- `PP-09` — A failed attempt returns the learner to revision with preserved settings and actionable findings; a passed attempt unlocks the deterministic next task.
- `PP-10` — Unavailable or unentitled models explain their unavailable state and cannot be submitted; a model becoming unavailable during submit yields actionable recovery.
- `PP-11` — Personal Project remains independent from Challenge while their AI-grading behavior may be UAT-tested together after both deliveries.

## Primary flow

```text
project-ready → task-ready → settings-ready → submission-validating
→ grading-queued → grading-processing → result-ready
→ revision-ready | next-task-ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `personal-project-roadmap` | `/[lang]/courses/[displayId]/learn/personal-project` | Resume, progress and milestone navigation | [surface](surfaces/personal-project-roadmap.md) |
| `personal-project-task` | `/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]` | Brief, repository evidence, settings summary, submission and live grading | [surface](surfaces/personal-project-task.md) |
| `personal-project-result` | `/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]/result` | Attempt evidence, findings, revision and next task | [surface](surfaces/personal-project-result.md) |
| `headhunting-directory` | `/[lang]/courses/[displayId]/learn/headhuntings` | Career discovery | [surface](surfaces/headhunting-directory.md) |
| `headhunting-company` | `/[lang]/courses/[displayId]/learn/headhunting-companies/[companyId]` | Company detail | [surface](surfaces/headhunting-company.md) |

## LOADS

| Need | Read |
|---|---|
| Personal Project journey | [flow](flows/personal-project-learning-loop.md) |
| One renderable screen | `surfaces/<surface-id>.md` |
| Business invariants | [rules.md](rules.md) |
| State transitions | [states.md](states.md) |
| Operations and failures | [contracts.md](contracts.md) |
| Completion proof | [acceptance.md](acceptance.md) |
| Machine authority | [model.json](model.json) |
| Exact provenance | [evidence.json](evidence.json) |

`model.json` is authoritative for machines. Legacy is precedent-only.
