# coding-practice

Migrated from the previous shape mid-run. Plan and Preview ran against the record-and-seal skills,
so their evidence lives in `starci-academy-fe/.artifacts/design-plan/coding-practice/`
(`plan-record.md/json`, `preview-status.md`, `direction-lab/`, `candidate/`, `screenshots/`) and the
backend half in `starci-academy-backend/.artifacts/be-feature/coding-domain-enablers/`
(`architecture-record.md/json`). This file is that evidence in the shape `starci-workflow-drift`
reads.

## plan

| | |
|---|---|
| Doing | The whole coding-practice feature — hub and problem page — down to one direction |
| App | `starci-academy` |
| Repo / branch | `starci-academy-fe` @ `main` |
| Touching | artifacts only |
| Not touching | all production source |
| Produces | three directions, two scenes each, at `localhost:8081` |

**Chose** `direction-path-first`, in the user's word: *"path first"*. The twenty interview topics are
a curriculum rather than a filter. The hub opens on a field of topics carrying the learner's own
standing; choosing one opens its problems; solving keeps the thread, because the verdict offers the
next problem IN THAT DOMAIN.

| Took | Because |
|---|---|
| The direction is not invented | `CodingProblemEntity.domain` documents itself as the "Primary interview topic domain (used to group the problem list)" |
| Reference is `starci-academy@9a19342`, `PracticeHubPage` + `PracticeProblemPage`, read as source | Its resizable rail spends a whole column on a two-way switch; that is the divergence the chosen direction makes on purpose |
| Scope is three pages, not two | The per-domain route is what grouping costs, and it is stated rather than folded in |
| Editor is CodeMirror 6 | Chosen by the user over Monaco |

| Found | What it constrains |
|---|---|
| Judging is ASYNCHRONOUS | `submitCodingSolution` returns a `jobId` and the verdict arrives over Socket.IO |
| There are NINE verdicts plus a tenth situation nobody declares | The socket dropping while judging continues |
| Anti-cheat telemetry is part of the submit contract | Which rules out a `textarea` |
| Revealing the reference solution is a RECORDED act | It writes into the viewer's `revealedProblemIds` |

## backend

| | |
|---|---|
| Doing | The two enablers the chosen direction needs |
| App | `starci-academy` — Nest project `core` |
| Repo / branch | `starci-academy-backend` @ `mtp` |
| Touching | `queries/coding/`, `queries/users/user-coding-progress/`, `modules/bussiness/coding/` |
| Not touching | the user-coding projection and its listener; the other seven coding operations |
| Produces | `codingDomainSummary`, a `domain` filter, and `byDomain` on progress |

| Found | What it means |
|---|---|
| Reading the operation list UNFILTERED changed both proposals | `userCodingSkills` — under `queries/users/`, which a grep for `coding-problem` never reaches — already returns `byDomain`, so the solved half of the proposed `myCodingDomainProgress` was already shipped |
| The catalog is Elasticsearch, not Postgres, and `domain` is already mapped `keyword` ("exact-match facet") | Both enablers are ES changes; neither needs a migration |
| Catalog totals must NOT enter the user projection | Its listener watches `coding_submissions` only, so a per-domain total would be silently stale on every problem added |
| Sign-in does not register the session the token carries | `signInInit` writes one sid to Redis and `signInVerifyOtp` returns a token carrying another, so every authenticated call is refused. Reported, not chased — NOT this feature's bug |

| Took | Because |
|---|---|
| `codingDomainSummary` is full CQRS — message, handler, dispatch service, door, wiring, twin spec | On the user's instruction *"tuân thủ CQRS"*. The count backs it: 62 query folders carry a `.query.ts` and 64 carry a handler; the `coding` family is the outlier, not the law. The divergence stays a finding; the seven existing coding reads were NOT converted |
| `byDomain` on `myCodingProgress` is composed IN THE RESOLVER from the existing projection | A fourth SELECT in `CodingProgressService.compute` would duplicate the GROUP BY already in `buildUpsertSql` and stack two staleness policies over one number |
| Totals always count the `en` index | A domain's size is a fact about the catalog, not about which translations exist |
| `attempted` per domain dropped | The resume card names one problem and already knows its domain |

| Green | Result |
|---|---|
| files | 9 changed, 8 created |
| `tsc` | 0 |
| `eslint` | 0 |
| unit | 35 tests across 4 suites |
| e2e | 4/4 |
| four LIVE calls against the running API | `codingDomainSummary` returned 9 real domains; the `domain` filter narrowed to 2 with a matching total; the unfiltered call returned 12, proving the filter additive; the buckets summed to 12 |

| Fixed | Why it was in the way |
|---|---|
| `course-review.entity.ts` gained `@ObjectType` and four `@Field`s | Another session's in-flight work had made the API unbootable, and the user authorised the repair |

## review

| | |
|---|---|
| Doing | Build all three pages from the real components, contracts and tokens |
| App | `starci-academy` |
| Repo / branch | `starci-academy-fe` @ `main` |
| Touching | `.artifacts/design-plan/coding-practice/candidate/` |
| Not touching | all production source |
| Produces | twenty-two rendered states at `localhost:8085` |

| Owner | State | Rendered |
|---|---|---|
| `CodingPracticeHubPage` | ready · fresh · guest | yes — `screenshots/hub-ready.png`, `hub-guest.png` |
| `DomainMasteryGrid` | pending · ready · guest · progress-failed | yes |
| `CodingDomainPage` | ready | yes — `screenshots/domain-ready.png` |
| `CodingProblemList` | pending · ready · empty · all-solved | yes |
| `CodingProblemPage` | route entry | yes |
| `ProblemReadingColumn` | pending · ready · hint tab | yes |
| `JudgeStatusStrip` | idle · pending · judging · accepted · wrongAnswer · timeLimitExceeded · memoryLimitExceeded · runtimeError · compileError · internalError · socket-lost | all eleven — `screenshots/problem-accepted.png`, `problem-judging.png`, `problem-compile-error.png`, `problem-socket-lost.png` |
| `SolutionEditor` | ready · submitting · judged | covered by the verdict scenarios; it changes only which controls are disabled |

| Backend | Covered by |
|---|---|
| both enablers | DONE and live-verified — see `## backend`. Nothing further is missing |
| `socket.io-client` is not installed | One dependency still owed. It blocks Apply rather than this review: every verdict renders from a fixture and nothing subscribes yet |

| Took | Because |
|---|---|
| `MarkdownProse` written and WITHDRAWN | `leaves/Article` already renders authored Markdown, and its own comment records that canon refused `react-markdown` there twice. This also made the user's shiki choice unnecessary — no markdown dependency was installed |
| `VerdictChip` never written | `StatusDot` carries four tones and `Badge` five; the verdict-to-tone map lives in `JudgeStatusStrip` and nowhere else |
| `marked-row-list` EXTENDED rather than a second list entry | A new one would have carried an identical class list, which `no-duplicate-entry-shape` refuses |
| `catalog-card-action-row` reused for the two attempt actions | Its NAME still says `catalog`, now false for one of two callers; renaming a shipped entry belongs to a consolidation run |
| The problem row's mark is binary | Three situations exist and the glyph vocabulary holds two that mean progress, so the tick says solved-or-not and the fact carries "đã nộp 3 lần" |
| A topic with no problems still gets a card reading "Chưa có bài" | Hiding it would make the field's size depend on the catalog rather than on the curriculum |
| CodeMirror 6 installed at the user's instruction: six packages | The three npm audit warnings are pre-existing in `next`, `postcss` and `sharp` |

| Fixed | What was wrong |
|---|---|
| `md:shrink-0` on the reading column | The entry asked for `md:w-2/5` and the running page gave 273px inside 934 — 29% where two fifths is 373 — because the work column's `grow` squeezed it. A proportional width is a request until shrinking is refused. Now 368/919 = 40% |

**Approved** revision 1.1, in the user's word: "ok", against the revision named in the question.

| Revision | What changed |
|---|---|
| 1.0 | three pages, six owners, twenty-two scenarios; typecheck, lint and build clean |
| 1.1 | the reading column holds the measure it declared |

## apply

| | |
|---|---|
| Doing | Materialize the approved candidate into `src/` and open the real routes |
| App | `starci-academy` |
| Repo / branch | `starci-academy-fe` @ `main` (`afd894d` at confirmation) |
| Touching | `components/{leaves,blocks/coding,pages}`, `contracts/index.ts`, `modules/api/graphql/**`, `hooks/**`, `app/[lang]/practice/**`, `messages/*.json` |
| Not touching | everything else in `src/`, both other repositories |
| Produces | `/vi/practice`, `/vi/practice/[domain]`, `/vi/practice/problem/[slug]` |

| Wrote | Note |
|---|---|
| `leaves/CodeEditor/index.tsx` | CodeMirror 6, telemetry counters |
| `leaves/Select/index.tsx` | also owed by the contact case |
| `leaves/Textarea/index.tsx` | also owed by the contact case |
| `blocks/coding/DomainMasteryGrid/component.tsx` | |
| `blocks/coding/CodingProblemList/component.tsx` | |
| `blocks/coding/JudgeStatusStrip/component.tsx` | |
| `blocks/coding/SolutionEditor/component.tsx` | |
| `blocks/coding/ProblemReadingColumn/component.tsx` | |
| `pages/CodingPracticeHubPage/{component,index}.tsx` | |
| `pages/CodingDomainPage/{component,index}.tsx` | |
| `pages/CodingProblemPage/{component,index}.tsx` | |
| `modules/api/graphql/queries/types/coding.ts` | |
| `modules/api/graphql/queries/query-coding-domain-summary.ts` | |
| `modules/api/graphql/queries/query-coding-problems.ts` | |
| `modules/api/graphql/queries/query-coding-problem.ts` | |
| `modules/api/graphql/queries/query-my-coding-progress.ts` | |
| `modules/api/graphql/mutations/mutation-submit-coding-solution.ts` | |
| `hooks/swr/useQueryCodingDomainSummarySwr.ts` | |
| `hooks/swr/useQueryCodingProblemsSwr.ts` | |
| `hooks/swr/useQueryCodingProblemSwr.ts` | |
| `hooks/swr/useQueryMyCodingProgressSwr.ts` | |
| `hooks/socketio/useJobVerdictSocketIo.ts` | |
| `app/[lang]/practice/{layout,page}.tsx` | |
| `app/[lang]/practice/[domain]/page.tsx` | |
| `app/[lang]/practice/problem/[slug]/page.tsx` | |
| `components/contracts/index.ts` | changed: 13 entries, 1 widened slot, 4 class tokens — merged into the other session's live version rather than overwriting it |
| `messages/{vi,en}.json` | changed: the `practice` namespace |
| `package.json` | changed: `socket.io-client`, and six CodeMirror packages earlier |

| Green | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors, whole tree |
| `npx eslint <every file>` | clean |
| `npm run build` | exit 0, and the three routes appear in the route table |
| `GET /vi/practice` | 200, server-rendered with `coding-practice-page`, `domain-mastery-grid`, the navbar and the title |

| Found | What it means |
|---|---|
| **THE REVIEWED GUEST STATE IS NOT SERVABLE** | `hub-guest` was recorded as "the topics without personal figures", and `codingDomainSummary` sits behind `KeycloakAuthGraphQLGuard` — a signed-out reader gets 401 and an EMPTY hub with no explanation. Measured in the browser. Either the route redirects a guest to sign-in the way the dashboard does, or the query becomes optional-auth on the server. That is a product decision and it is open |

| Owed | Cleared by |
|---|---|
| The authenticated render is NOT proven in a browser | The dev server belongs to another session and carries no login; `useSessionToken` keeps the token in module memory on purpose, so it cannot be injected from outside. The three operations ARE proven against the live API — see `## backend` — but nobody has yet watched the hub draw a topic card |
| The run button is wired to nothing | `Chạy thử` has no operation behind it: the server judges on submit only, and a dry run against sample cases is a capability nobody has asked for yet |
| The Solution and Submissions tabs render a placeholder | `codingProblemHint`, `revealCodingSolution` and `myCodingSubmissions` all exist and are not wired |

| Rejected | Instead | Why |
|---|---|---|
| not recorded | — | This task ran before the refusal table existed. `$starci-fe-upgrade-plan` counts these rows as witnesses, so filling it from memory of somebody else's run would manufacture a rule |
