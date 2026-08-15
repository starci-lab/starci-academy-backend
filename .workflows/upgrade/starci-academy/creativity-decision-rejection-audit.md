<!-- starci-workflow: v2 -->

# Creativity decision rejection audit

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | Source `D:\Repositories\starci-academy-backend` / `mtp`; Trust `D:\Repositories\starci-academy-backend\.claude` / `main`; Frontend `D:\Repositories\starci-academy-fe` / `main` |
| Purpose | Audit creativity canon against repeated founder rejections, remove inert or duplicate guidance, and add only decision checks that would have prevented those rejections. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\creativity-decision-rejection-audit.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\creativity-decision-rejection-audit.md |

### WINDOW AND METHOD

| Window | Measurement | Qualification rule |
|---|---|---|
| Toàn bộ workflow có path chứa `starci-academy` tại thời điểm 2026-08-16 | 58 Markdown records; 527 non-empty `REJECTED` rows before deduplication | User direction choices and Plan-generated alternatives are context, not automatically missing-law evidence. A proposed trust change needs at least two concrete refusals with the same missing decision law. One witness remains `WATCHED`. |

### CURRENT CONSUMPTION AUDIT

| Finding | Evidence | Consequence |
|---|---|---|
| Không skill FE nào trực tiếp tham chiếu một file trong `fe/creativity/` | Exact-name search across `.claude/skills` returns no consumer for all 11 files | Correct prose is inert; adding more canon text alone cannot reduce rejection. |
| `INDEX.md` duplicates lifecycle owned by `skill-shape.md` and phase skills | `INDEX.md` repeats Plan → Review → Apply, Fidelity routing, state and approval rules | Two owners can drift; index should route, not restate procedures. |
| Authority guidance is split and repeated | `best-belief-source.md` BELIEF-1/4/6 overlaps `research.md` RESEARCH-1/2/4 and `contract-graph.md` GRAPH-2/3 | Agent can read one page and miss the actual gate; one research owner is clearer. |
| Implementation prose duplicates Apply and layer canon | `implementation.md` repeats vertical slice, connected/pure, resting and boundary behavior already owned by Design Apply and FE canon | Creativity should decide; execution procedure should live in the executing skill. |

### QUALIFIED REFUSAL GROUPS

#### G1 — Canon without an executing consumer does not prevent the same mistake

| Refusal | Task | What rules said | Missing law |
|---|---|---|---|
| “Add another generic-composite canon sentence” → add Fidelity reference-owner closure | `.workflows/upgrade/starci-academy/generic-owner-before-duplicate.md`, plan | COMPOSITE-2/7 already described the rule | Every decision canon page must name its consuming phase; that phase must require the corresponding evidence artifact. |
| “Thêm luật mới cho surface/gap/localhost/Fidelity lifecycle” → keep existing laws and record compliance | `.workflows/upgrade/starci-academy/fidelity-closure-canon-audit.md`, plan | Existing canon was already sufficient | Repeated failure with sufficient canon is an operationalization defect, not permission to add synonymous prose. |
| “Repeat composite/block canon definitions” → operationalize in Design Review | `.workflows/upgrade/starci-academy/design-review-owner-challenge.md`, plan | Layer canon already defined composite and block | Shared decision law belongs once in canon; Design Review and Fidelity reference it and print proof. |

Proposed law: **A canon rule without a named consumer and required evidence output is documentation, not a gate. Do not add a synonym; wire the existing owner into the phase that decides it.**

Home: slim `fe/creativity/INDEX.md` consumer map plus direct references in Design Plan, Design Review, Design Apply and Fidelity Start.

#### G2 — Visible controls were designed without proving their complete product consequence

| Refusal | Task | What rules said | Missing law |
|---|---|---|---|
| “Inferring three flows from the current API surface” | `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md`, feedback | BELIEF-2 says inspect executable backend behavior; RESEARCH-5 names states | No required trigger → request/route → pending → success → failure → persisted/shared-effect proof for each action. |
| “Local `isInCart` state and disabled ‘in cart’ label” | same task, feedback | Business truth and state rules exist separately | The decision did not prove reversible action and cross-surface persistence. |
| “Nuốt lỗi Trial rồi luôn điều hướng” | same task, feedback | VERIFICATION-4 asks semantics and interaction | Static visual verification did not bind failure consequence. |
| “Mobile tabs that only update selected underline” | `.workflows/designs/starci-academy/learn-branch.md`, review revision 7 | State completeness exists | Selected paint was mistaken for completed behavior; visible panel transition was absent. |

Proposed law: **Every interactive decision must prove its observable consequence, not just its control and selected paint.** Require an `ACTION CONSEQUENCE` row with trigger, product owner, pending, success, failure, persistence/shared effect and evidence; `N/A` needs evidence.

Home: merge authority and evidence rules into `research.md`; challenge the rows in Design Review and reuse the same transition identity in `verification.md` and Fidelity.

#### G3 — New or private owners were chosen before proving REUSE or ALTER

| Refusal | Task | What rules said | Missing law |
|---|---|---|---|
| “Scope row chrome tự chế” and “Custom scope/list row and duplicate generic row” | `.workflows/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01.md`, feedback/end | BELIEF-4, GRAPH-2/3 and SELECTION-3 already prefer truthful reuse | Existing rules were split and not required as one decision matrix. |
| “R1 tạo `IconLabelFactRow` từ dead `QuickActionRow`” → rename/generalize proven `StatRow` | `.workflows/consolidation/starci-academy/generic-action-row.md`, plan r2 | Existing generic-owner law did not force all candidate consumers to be inventoried | ALTER of a proven owner must be attempted before ADD, with every existing consumer in parity evidence. |
| “Bỏ streak/credit/reward khỏi consolidation matrix” | same task, plan r2 | Reuse inventory wording existed | Partial consumer evidence can make a false generic owner appear safe. |

Proposed law: canonical `OWNER CHALLENGE` in `contract-graph.md`: proposed owner, layer, purpose, closest owners/contracts, REUSE verdict, ALTER verdict, layer proof, decision and evidence. Decisions are `REUSE`, `ALTER`, `KEEP_APART` or `ADD`; `ADD composite/block` carries layer-specific burden and all existing consumers are named.

Home: `contract-graph.md`, consumed by Design Review and Fidelity. This absorbs pending `shared-owner-challenge-review-r2`; do not apply that revision separately.

#### G4 — Static appearance proof missed interaction and visual-job failures

| Refusal | Task | What rules said | Missing law |
|---|---|---|---|
| “Bỏ toàn bộ hover behavior” and “Cho label dùng `text-accent-soft` when selected” | `.workflows/fidel/starci-academy/global-search-selected-row-emphasis-20260816-01.md`, feedback | VERIFICATION-4 names interaction generally | Verification did not compare resting, hover, selected and selected-hover as one state transition. |
| “Ẩn detail cho tới khi một selection event ngầm xảy ra…” | `.workflows/fidel/starci-academy/global-search-modal-spacing-listbox-20260815-01.md`, feedback | RESEARCH-5 lists states | Empty/missing detail was not connected to the row-click transition and request lifecycle. |
| “Scope count bọc rounded badge”, “active có dấu tick” | same task, feedback | CRITIQUE-4 warns against surface/icon without a job | No explicit proof asked what semantic or interaction job each added chrome performed. |
| “Purple icon ở từng preview lesson” and one card per review | `.workflows/fidel/starci-academy/course-detail-review-identity-cards.md`, feedback/end | CRITIQUE-4 already warns against decorative icon/surface | The existing challenge was not consumed by Fidelity before rendering. |

Proposed law: **Verify transitions as paired states and require every added chrome to name its recognition, grouping or interaction job. No job means remove it.** Add a compact `STATE TRANSITION / VISUAL JOB` challenge to the decision and verification canon; Fidelity records it for the touched state family rather than one screenshot.

Home: consolidated decision page plus `verification.md`, consumed by Design Review, Design Apply and Fidelity Start.

### CREATIVITY FILE VERDICTS

| Current file | Verdict | Final owner | Reason |
|---|---|---|---|
| `INDEX.md` | MODIFY / slim | `INDEX.md` | Keep definition, ordered map and consumer matrix; remove duplicated lifecycle/rules already owned by `skill-shape.md` and phase skills. |
| `mode.md` | KEEP / trim | `mode.md` | Repeated parity-versus-redesign refusals prove this decision is practical; remove examples that merely restate rules. |
| `best-belief-source.md` | MERGE then DELETE | `research.md` | Its authority table is valuable, but the file overlaps research and currently has no consumer. |
| `research.md` | MODIFY | `research.md` | Become the single evidence/authority owner and add `ACTION CONSEQUENCE`; keep product-first, fixture and state evidence. |
| `brief.md` | KEEP | `brief.md` | Page thesis, primary action, information order and anti-goals directly prevent hierarchy drift. |
| `divergence.md` | KEEP / trim | `divergence.md` | Keep material decision axes; delete the formulaic conservative/balanced/bold recipe because it can manufacture directions instead of deriving them from evidence. |
| `critique.md` | MERGE then DELETE | `decision.md` | Critique and selection are one Review decision loop; separate pages increase the chance one half is skipped. |
| `selection.md` | MERGE then DELETE | `decision.md` | Preserve hard gates, comparative dimensions and winner/nearest-rival evidence in one consumed page. |
| `contract-graph.md` | MODIFY | `contract-graph.md` | Keep ownership laws and add the shared `OWNER CHALLENGE`. |
| `implementation.md` | DELETE after relocating one unique rule | Design Apply skill | Execution is not a creativity decision owner. Move only “implementation disproves graph → return to Review”; connected/pure/resting remain in their existing canon/Apply owners. |
| `verification.md` | MODIFY | `verification.md` | Keep browser/state/code proof; add paired transition and visual-job proof. |

Final creativity shelf proposed: `INDEX.md`, `mode.md`, `research.md`, `brief.md`, `divergence.md`, `decision.md`, `contract-graph.md`, `verification.md` — 8 files instead of 11.

### PROPOSED CONSUMER MAP

| Phase skill | Mandatory creativity owners | Required decision evidence |
|---|---|---|
| `starci-fe-design-plan` | `mode.md`, `research.md`, `brief.md`, `divergence.md` | Mode, evidence/authority claims, action consequences, brief/anti-goals and materially distinct directions. |
| `starci-fe-design-review` | `decision.md`, `contract-graph.md`, `verification.md` | Counterargument verdict, `OWNER CHALLENGE`, action/state consequences, visual jobs and exact acceptance identity. |
| `starci-fe-design-apply` | `verification.md` | Row-to-diff proof plus rendered transition/state evidence; graph contradiction returns to Review. |
| `starci-fe-fidelity-start` | `mode.md`, `contract-graph.md`, `verification.md` | Binding reference, in-boundary owner challenge when ownership is touched, and paired before/after interaction states. Unapproved `ADD` routes as `new-finding`. |

### WATCHED — NOT YET A SHARED LAW

| Observation | Why not promoted | Promote when |
|---|---|---|
| Exact selected token pair or whether count uses a badge | These are contract/token and screen-state decisions, not universal creativity laws | A second unrelated owner proves the same semantic token rule is missing from its proper canon. |
| “Guide first” versus editor-first CV entry | The user changed product preference between valid directions | Repeated product evidence establishes one StarCi-wide CV entry invariant. |
| Always create exactly three or four preview directions | Current Design Plan permits two to four and some scopes contain only two real choices | Repeated rejection proves two directions systematically hide a needed decision model. |
| One specific card, tab or nested-surface composition | Existing layer/surface canon already owns legality; screen composition remains contextual | Repeated refusal identifies one general semantic law absent from that owner. |

### EXACT REVIEW CANDIDATE BOUNDARY

| Tree | Candidate action |
|---|---|
| `.claude/fe/creativity/INDEX.md` | MODIFY |
| `.claude/fe/creativity/mode.md` | MODIFY |
| `.claude/fe/creativity/best-belief-source.md` | REMOVE after merge |
| `.claude/fe/creativity/research.md` | MODIFY |
| `.claude/fe/creativity/brief.md` | KEEP, no source edit unless Review finds link repair necessary |
| `.claude/fe/creativity/divergence.md` | MODIFY |
| `.claude/fe/creativity/critique.md` | REMOVE after merge |
| `.claude/fe/creativity/selection.md` | REMOVE after merge |
| `.claude/fe/creativity/decision.md` | ADD |
| `.claude/fe/creativity/contract-graph.md` | MODIFY |
| `.claude/fe/creativity/implementation.md` | REMOVE after relocating unique rule |
| `.claude/fe/creativity/verification.md` | MODIFY |
| `.claude/skills/starci-fe-design-plan/SKILL.md` | MODIFY — direct phase references and required evidence |
| `.claude/skills/starci-fe-design-review/SKILL.md` | MODIFY — decision/owner/action challenge |
| `.claude/skills/starci-fe-design-apply/SKILL.md` | MODIFY — verification reference and graph-disproof routing |
| `.claude/skills/starci-fe-fidelity-start/SKILL.md` | MODIFY — shared owner/transition proof and `ADD` routing |
| `.claude/sources/skills.test.mjs` | MODIFY — prove consumer map and single-owner schemas |

### OUTPUTS

| Concept | Result |
|---|---|
| Creativity decision audit | 11 inert/overlapping files classified into an 8-file decision shelf with explicit phase consumers. |
| Rejection-prevention model | Four repeated missing laws qualify: operational consumption, action consequence, owner challenge and paired transition/visual-job proof. |
| Pending owner challenge | Absorbed into this broader audit; do not apply `shared-owner-challenge-review-r2` separately. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/creativity-decision-rejection-audit.md` | added — evidence-backed Upgrade Plan only; no trust or product source changed |

### NEED APPROVALS

| Question | Options |
|---|---|
| Run `starci-fe-upgrade-review` on this exact audit boundary? | Recommended: review the 8-file shelf, four consumer skills and regression test; alternative: retain all 11 files and review only consumer wiring. |

### WARNINGS

| Warning | Impact |
|---|---|
| 527 raw rows include user direction choices and self-rejected alternatives | Treating every row as a missing law would overfit canon; only four deduplicated repeated groups are proposed. |
| Existing `design-review-owner-challenge.md` is already at review r2 but unapproved | Applying it separately would duplicate and potentially conflict with this wider refactor. |
| Source, Trust and Frontend have unrelated concurrent changes | Later Apply must touch only the approved trust boundary and preserve all product worktrees. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Add more standalone creativity prose | Wire each retained decision owner into the phase that must consume it | Existing correct canon already failed when skills did not require its evidence. |
| Turn all 527 rows into rules | Promote only four repeated missing-law groups; keep one-off preferences WATCHED | Prevents an unreadable defect diary and preference overfitting. |
| Keep `best-belief-source.md` beside overlapping research | Merge its authority table and unique rules into `research.md` | One evidence owner is easier to consume and test. |
| Keep implementation procedure in creativity | Let Design Apply own execution and retain only decision/verification canon | Avoids two procedure owners drifting. |
| Apply pending owner-challenge r2 separately | Absorb it into the creativity audit | One shared contract-graph change should be reviewed and applied once. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge deletions, merged wording, exact schemas and source boundary | `$starci-fe-upgrade-review` on this workflow |
| Modify `.claude` | Explicit approval of one Upgrade Review revision, then `$starci-fe-upgrade-apply` |
| Prove no phase references deleted files and schemas have one owner | Focused `.claude/sources/skills.test.mjs` regression plus full trust gates in Apply |

## review r1

Candidate revision: `creativity-decision-guardrails-review-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | Source `D:\Repositories\starci-academy-backend` / `mtp`; Trust `D:\Repositories\starci-academy-backend\.claude` / `main`; Frontend `D:\Repositories\starci-academy-fe` / `main` |
| Purpose | Challenge the Plan's keep/merge/delete verdicts and freeze the smallest evidence-backed creativity consumer and decision-artifact boundary. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\creativity-decision-rejection-audit.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\creativity-decision-rejection-audit.md |

### REVIEW VERDICT — KEEP, TRIM, WIRE; DO NOT DELETE WITHOUT REFUSAL EVIDENCE

| Plan proposal | Review verdict | Evidence and smallest correction |
|---|---|---|
| Delete `best-belief-source.md` after merging | REJECT | `fe/baselines/explore.md` directly cites it, and authority selection is a distinct decision from evidence collection. Keep it and make Design Plan/Fidelity read it. |
| Merge/delete `critique.md` and `selection.md` | REJECT | No repeated refusal says this separation caused failure. Critique disproves; selection chooses. Make Design Review read both in order. |
| Delete `implementation.md` | REJECT | No repeated refusal says the file is harmful. Its vertical-slice and graph-disproof rules are design implementation principles; make Design Apply consume them. |
| Reduce to eight files | REJECT | File count is not a quality measure. Eleven single-purpose owners are acceptable when phase consumption is explicit. |
| Trim formulaic divergence archetypes now | WATCHED | Plausible, but no qualified refusal group proves conservative/balanced/bold itself caused rejection. Do not edit in r1. |
| Slim `INDEX.md` and add consumer map | APPROVE CANDIDATE | G1 has three witnesses that correct canon was not operationalized; remove lifecycle prose duplicated by `skill-shape.md`, retain definition/read order/core rules and add exact phase consumers. |
| Add action/transition consequence | APPROVE CANDIDATE | G2 has repeated controls whose paint existed while request, failure, navigation, persistence or visible-panel consequence was wrong. |
| Add shared owner challenge | APPROVE CANDIDATE | G3 has repeated private/new owners added before REUSE/ALTER and complete consumer parity were proved. |
| Add visual-job challenge | APPROVE CANDIDATE | G4 repeatedly added badges, ticks, icons, cards or selected paint without a recognition/grouping/interaction job. |

### APPROVABLE CHANGE U1 — PHASE CONSUMER MAP

Deduplicated witnesses: `generic-owner-before-duplicate.md` plan, `fidelity-closure-canon-audit.md` plan and `design-review-owner-challenge.md` plan.

Exact law for `fe/creativity/INDEX.md`:

> Every retained creativity decision owner has one or more named consuming phases. A phase reads its named owners before producing the corresponding evidence. When a repeated failure is already forbidden by a consumed owner, repair the phase artifact or regression gate; do not add synonymous canon.

Exact phase references:

| Phase | Must read | Evidence it owns |
|---|---|---|
| Design Plan | `mode.md`, `best-belief-source.md`, `research.md`, `brief.md`, `divergence.md` | Mode, claim authority, evidence packet, brief/anti-goals and materially different directions. |
| Design Review | `critique.md`, `selection.md`, `contract-graph.md`, `verification.md` | Counterargument and verdict, selected trade-off, owner graph, interaction consequence, visual job and acceptance states. |
| Design Apply | `implementation.md`, `verification.md` | Approved vertical slice, graph-disproof routing and rendered/code proof. |
| Fidelity Start | `mode.md`, `best-belief-source.md`, `contract-graph.md`, `verification.md` | Binding authority, reference owner closure and touched interaction/visual proof. |

`INDEX.md` keeps the ordered file list and core creativity rules, but its duplicated operating-procedure paragraphs defer to `skill-shape.md` and the phase skills. No other creativity file is removed or renamed in r1.

Test obligation: `skills.test.mjs` asserts all four skills contain their exact direct references and that `INDEX.md` names all 11 retained files once in the read order.

### APPROVABLE CHANGE U2 — INTERACTION CONSEQUENCE

Deduplicated witnesses: `course-detail-ownership-and-rail.md` feedback (`Inferring three flows`, local `isInCart`, Trial error navigation) and `learn-branch.md` review revision 7 (underline-only mobile tab state).

Exact law for `research.md`:

> A visible interaction is not proved by its control or selected paint. For every interaction in the selected journey, trace the trigger to its product owner, request or route, visual states, pending behavior, success consequence, failure consequence and persistence or shared-surface effect. `N/A` is a claim and requires evidence.

Canonical artifact:

| Interaction | Trigger | Product owner | Request / route | Visual states | Pending | Success | Failure | Persistence / shared effect | Evidence |
|---|---|---|---|---|---|---|---|---|---|

Design Plan researches rows for every user-visible interaction proposed by a direction. Design Review prints the selected direction's exact table under `### INTERACTION CONSEQUENCE` and rejects missing/wildcard rows. Design Apply proves the same rows at the frozen live identity. Fidelity prints only touched interactions; it does not invent unrelated journey scope.

Test obligation: assert the schema has one canonical owner in `research.md`; consuming skills reference the heading rather than duplicating the Markdown schema.

### APPROVABLE CHANGE U3 — OWNER CHALLENGE

Deduplicated witnesses: `global-search-modal-spacing-listbox-20260815-01.md` feedback/end and `generic-action-row.md` plan r2.

Exact law for `contract-graph.md`:

> Before `ADD`, search live contracts, component owners, imports and call sites, then try `REUSE` and `ALTER` before `KEEP_APART` or `ADD`. `None` is valid only with exact searched roots and call-site evidence. `ADD composite` requires at least two real consumers of the same closed named-slot shape; one consumer remains block-internal. `ADD block` requires a distinct domain sentence plus request, copy, state and connected/pure ownership; visual novelty is not block proof.

Canonical artifact:

| Proposed owner | Layer | Purpose | Closest existing owners / contracts | REUSE verdict | ALTER verdict | Layer proof | Decision | Evidence |
|---|---|---|---|---|---|---|---|---|

Decisions: `REUSE`, `ALTER`, `KEEP_APART`, `ADD`.

Design Review prints `### OWNER CHALLENGE` before `COMPONENT DELTA` for every proposed `ADD composite` or `ADD block`; every ADD row must match. Fidelity uses the same canon when a correction touches reusable ownership. `REUSE`/`ALTER` may proceed inside the authorized boundary; unapproved `ADD` is a `new-finding` routed to Design. This supersedes unapproved `shared-owner-challenge-review-r2`.

Test obligation: assert one canonical schema in `contract-graph.md`, both consumer references, order before `COMPONENT DELTA` in Design Review and `new-finding` routing in Fidelity.

### APPROVABLE CHANGE U4 — VISUAL JOB AND PAIRED INTERACTION STATES

Deduplicated witnesses: Global Search selected-row feedback, Global Search scope/detail feedback and `course-detail-review-identity-cards.md` feedback/end.

Exact law for `critique.md`:

> Every added icon, badge, chip, border, surface, wrapper or selected paint must name one observable recognition, grouping or interaction-state job. If removing it preserves meaning and affordance, reject it as noise. Similar decoration elsewhere is not a job.

Canonical artifact:

| Visual element | Owner / state | Recognition, grouping or interaction job | Existing reference | Verdict | Evidence |
|---|---|---|---|---|---|

Exact addition to `verification.md`:

> Verify an interaction as a state family, not one screenshot: resting, hover/focus, selected/expanded, selected-hover/focus and applicable pending/failed states. Record non-applicable members. Confirm what changes and what must remain invariant, including adjacent detail or content panels.

Design Review prints `### VISUAL JOB` for every new chrome class above and binds the state family in acceptance evidence. Design Apply and Fidelity prove the paired states at one frozen identity. An empty table is valid only when no listed visual element is added or changed.

Test obligation: assert one visual-job schema in `critique.md`, one state-family law in `verification.md`, and explicit consumer references in Review, Apply and Fidelity.

### EXACT WRITE BOUNDARY

| Path | Approved candidate action |
|---|---|
| `.claude/fe/creativity/INDEX.md` | MODIFY — retain all 11 owners, slim duplicate procedures, add phase consumer map |
| `.claude/fe/creativity/research.md` | MODIFY — canonical interaction-consequence law/schema |
| `.claude/fe/creativity/critique.md` | MODIFY — canonical visual-job law/schema |
| `.claude/fe/creativity/contract-graph.md` | MODIFY — canonical owner-challenge law/schema |
| `.claude/fe/creativity/verification.md` | MODIFY — paired interaction-state verification |
| `.claude/skills/starci-fe-design-plan/SKILL.md` | MODIFY — direct creativity reads and Plan interaction research obligation |
| `.claude/skills/starci-fe-design-review/SKILL.md` | MODIFY — direct reads and three exact review artifacts |
| `.claude/skills/starci-fe-design-apply/SKILL.md` | MODIFY — direct implementation/verification reads and artifact proof |
| `.claude/skills/starci-fe-fidelity-start/SKILL.md` | MODIFY — direct reads, bounded artifacts and unapproved ADD routing |
| `.claude/sources/skills.test.mjs` | MODIFY — reference, schema-owner, ordering and routing regressions |

No delete, rename, product source, baseline, lint rule, workflow validator or `skill-shape.md` change belongs to r1.

### OUTPUTS

| Concept | Result |
|---|---|
| `creativity-decision-guardrails-review-r1` | Candidate revision keeps all 11 single-purpose creativity owners, operationalizes them in four phase skills and adds only three evidence artifacts plus one shared consumer law. |
| U1 phase consumption | Exact wording, home and regression obligation frozen. |
| U2 interaction consequence | Exact law, schema, consumers and proof obligation frozen. |
| U3 owner challenge | Exact law, layer burden, consumers and routing frozen. |
| U4 visual job/state family | Exact critique and verification laws, consumers and proof obligation frozen. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/creativity-decision-rejection-audit.md` | modified — appended Review r1; no trust or product source changed |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve U1–U4 and the exact ten-path trust boundary? | Recommended: `approve creativity-decision-guardrails-review-r1`; alternative: name any U-group to keep WATCHED or revise. |

### WARNINGS

| Warning | Impact |
|---|---|
| Plan's eight-file deletion shelf is superseded by Review r1 | Apply must preserve all 11 creativity files and follow only the ten-path boundary above. |
| `design-review-owner-challenge.md` remains an unapproved historical proposal | Do not Apply it separately; U3 is its reviewed replacement. |
| Source, Trust and Frontend contain unrelated work | Apply baseline and diff must preserve every path outside the exact trust boundary. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Delete/merge `best-belief-source.md`, `critique.md`, `selection.md`, `implementation.md` | Keep all four and wire them to their consuming phases | No repeated refusal supports deletion; one file has a live baseline reference and each retains a distinct decision. |
| Measure cleanup by reducing 11 files to eight | Measure whether every decision owner has a consumer and test | File count does not prove less rejection. |
| Trim divergence archetypes in r1 | Keep WATCHED | No qualified repeated refusal establishes harm. |
| Duplicate artifact schemas inside skills | Canon owns each schema; skills reference headings and obligations | Prevents drift between Plan, Review, Apply and Fidelity. |
| Apply `shared-owner-challenge-review-r2` independently | Supersede it with U3 | Avoids duplicate edits and conflicting schema ownership. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of U1–U4 and exact boundary | User says `approve creativity-decision-guardrails-review-r1` |
| Trust implementation | `$starci-fe-upgrade-apply` after approval |
| Focused and full trust proof | Apply runs schema/reference regressions, workflow validation, diff-check and full trust tests |

## review r2

Approved revision: `creativity-decision-guardrails-review-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | Source `D:\Repositories\starci-academy-backend` / `mtp`; Trust `D:\Repositories\starci-academy-backend\.claude` / `main`; Frontend `D:\Repositories\starci-academy-fe` / `main` |
| Purpose | Record the user's explicit approval of U1–U4 and the exact ten-path trust boundary. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\creativity-decision-rejection-audit.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\creativity-decision-rejection-audit.md |

User approval: `approve creativity-decision-guardrails-review-r1`.

### OUTPUTS

| Concept | Result |
|---|---|
| U1–U4 | Explicitly approved without wording or boundary revision. |
| Apply identity | `creativity-decision-guardrails-review-r1` |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/creativity-decision-rejection-audit.md` | modified — approval appended |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Approval is complete. |

### WARNINGS

| Warning | Impact |
|---|---|
| None | Exact r1 boundary is ready for Apply. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | Approved r1 | User approved the exact identity. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply U1–U4 | `$starci-fe-upgrade-apply` |

## apply r1

Applied revision: `creativity-decision-guardrails-review-r1`

Baseline commit: `f0fca8d5d1f19a1c507f86f841f83225e7729c31`

Tracked diff: `f0fca8d5d1f19a1c507f86f841f83225e7729c31..worktree`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | Trust `D:\Repositories\starci-academy-backend\.claude` / `main` at baseline `f0fca8d5d1f19a1c507f86f841f83225e7729c31`; `origin/main` matched after fetch |
| Purpose | Apply U1–U4 exactly, prove canonical schema ownership and phase consumption, and report every remaining gate failure without widening scope. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\creativity-decision-rejection-audit.md |
| Language | vi |
| Phase | apply |
| Touching | `.claude/fe/creativity/INDEX.md`; `.claude/fe/creativity/research.md`; `.claude/fe/creativity/critique.md`; `.claude/fe/creativity/contract-graph.md`; `.claude/fe/creativity/verification.md`; `.claude/skills/starci-fe-design-plan/SKILL.md`; `.claude/skills/starci-fe-design-review/SKILL.md`; `.claude/skills/starci-fe-design-apply/SKILL.md`; `.claude/skills/starci-fe-fidelity-start/SKILL.md`; `.claude/sources/skills.test.mjs`; this workflow |

### IMPLEMENTED GROUPS

| Group | Implementation | Diff proof |
|---|---|---|
| U1 phase consumer map | `INDEX.md` now assigns retained creativity owners to Plan, Review, Apply and Fidelity; each skill directly reads its phase owners | Five creativity files and four skills are the only trust prose paths in the diff |
| U2 interaction consequence | `research.md` owns the law/schema; Plan researches it, Review freezes it, Apply proves it and Fidelity bounds it | Schema appears in canon; skill regression rejects schema copies |
| U3 owner challenge | `contract-graph.md` owns REUSE → ALTER → KEEP_APART → ADD and layer burden; Review orders it before component delta; Fidelity routes unapproved ADD | Canon, Review and Fidelity rows match the approved r1 boundary |
| U4 visual job/state family | `critique.md` owns visual-job schema; `verification.md` owns paired states; Review/Apply/Fidelity consume them | Canon and three phase skills changed; no product source changed |

### PROOF

| Gate | Command | Result |
|---|---|---|
| Trust freshness | `git fetch origin`; compare `HEAD...@{u}` | PASS — `main` and `origin/main` both `f0fca8d5`; ahead/behind `0 0`; trust clean before writes |
| Exact diff boundary | `git diff --name-only` | PASS — exactly ten approved trust paths |
| Diff hygiene | `git diff --check` | PASS; only informational LF→CRLF working-copy notices |
| Focused creativity regressions | `node --test --test-name-pattern="FE creativity decisions|Fidelity Start fixes" sources/skills.test.mjs` | PASS — 2/2 |
| Trust links | `node --test sources/links.test.mjs` | PASS — 1/1 |
| Full trust suite | `npm test` | BASELINE-RED — 190/191 pass; sole failure: existing `skills/starci-be-audit-apply/SKILL.md` lacks `## PROCESS` |
| Failure ownership | `git diff --name-only` and baseline source inspection | PASS — failing BE audit skill is unchanged at baseline and outside approved ten-path boundary |

### OUTPUTS

| Concept | Result |
|---|---|
| U1 phase consumption | Applied: creativity canon now has explicit executing consumers. |
| U2 interaction consequence | Applied: visible controls require complete behavior evidence. |
| U3 owner challenge | Applied: reusable ownership must survive REUSE/ALTER challenge before ADD. |
| U4 visual/state challenge | Applied: chrome requires a job and interactions require paired-state proof. |
| Trust gate verdict | Revision-focused and link gates pass; full trust suite remains baseline-red 190/191 for one unrelated skill-shape defect. |

### CHANGES

| Tree | Details |
|---|---|
| `.claude/fe/creativity/INDEX.md` | modified — phase consumer map replaces duplicated operating procedures |
| `.claude/fe/creativity/research.md` | modified — interaction-consequence law/schema and forbidden row |
| `.claude/fe/creativity/critique.md` | modified — visual-job law/schema and forbidden row |
| `.claude/fe/creativity/contract-graph.md` | modified — owner challenge, decisions and layer proof |
| `.claude/fe/creativity/verification.md` | modified — paired interaction-state verification |
| `.claude/skills/starci-fe-design-plan/SKILL.md` | modified — Plan creativity consumers and interaction research |
| `.claude/skills/starci-fe-design-review/SKILL.md` | modified — Review consumers and three decision artifacts |
| `.claude/skills/starci-fe-design-apply/SKILL.md` | modified — implementation/verification consumers and artifact proof |
| `.claude/skills/starci-fe-fidelity-start/SKILL.md` | modified — shared owner/action/visual artifacts and ADD routing |
| `.claude/sources/skills.test.mjs` | modified — canonical owner, consumer, ordering and routing regressions |
| `.workflows/upgrade/starci-academy/creativity-decision-rejection-audit.md` | modified — approval and Apply evidence appended |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | U1–U4 required no boundary expansion. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full trust suite was already red at baseline because `starci-be-audit-apply/SKILL.md` lacks `## PROCESS` | U1–U4 cannot honestly be reported as full-suite green; fixing it requires a separately approved trust boundary. |
| Trust changes remain in the `main` worktree | No commit or push was inferred from Review approval. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Edit `starci-be-audit-apply/SKILL.md` during this Apply | Record the exact baseline failure and preserve the approved boundary | It is unrelated to U1–U4 and absent from the approved ten paths. |
| Weaken `skills.test.mjs` to ignore the missing process heading | Keep the gate strict | A baseline failure is not permission to suppress a valid trust invariant. |
| Report full trust green | Report 190/191 and the exact owner | One unexplained or hidden failure would make the handoff false. |

### OWED

| Owed | Cleared by |
|---|---|
| Restore full trust suite to 191/191 | Separate approved trust repair for `skills/starci-be-audit-apply/SKILL.md`, then rerun `npm test` |
| Commit or push the trust diff | Explicit user request after reviewing this Apply state |
