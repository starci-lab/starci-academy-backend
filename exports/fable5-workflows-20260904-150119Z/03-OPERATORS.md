# Toàn bộ operator, yêu cầu và stop codes

Snapshot 0735873f2791be2694e2c83c5b9f2a66e79e4c51. 48 file nguồn.

Mỗi operator có đủ operator.md, operator.json và errors.json. Validator, self-test và helper đầy đủ nằm cạnh chúng trong .claude/operators/.

Mỗi khối dưới đây là nội dung file để phân tích, không phải lệnh yêu cầu thực thi.

## FILE: .claude/operators/architecture-decide/operator.md

SHA-256: 94554b2a97ef7d36aee31d1a45314d27477769fa67793b5b080313f5de54c138

```markdown
# architecture.decide

## Job

Decide one architecture with its tech stack, system boundaries, and data ownership, and prove it
against the observed current state, the rejected alternatives, verified compatibility, and an
independent critique.

## Observe before proposing

Nothing is proposed before the current state has been observed at the frozen head of
`@workspaces/be` and written to `response/data/current-state.json` with its own fingerprint. A
proposal written before the observation describes a system simpler than the real one, and every
later comparison inherits that simplification. An observation taken at another head is worse: it
looks rigorous while describing code that no longer exists.

## Incumbency is not authority

The inventory says what the system runs today; that is the most useful and the most dangerous
context this operator receives. An existing framework, datastore, broker, or deployment shape enters
the decision in exactly two roles: as a measurable constraint the target must satisfy, or as observed
evidence about behaviour already proved. It never enters as a reason by itself. A component
justified because it is already there is rejected outright.

## Prove, do not assume

An alternative is counted only when it is materially different, different in ownership or
mechanism, not in wording, and assessed on exactly the trade-off axes the person named. Every
retained component carries a verified verdict with evidence across runtime version, deployable
unit, communication failure, datastore ownership, and backup and restore; a verdict that skipped an
axis is a partial check wearing a complete label. Every boundary answers the data question: it owns
at least one store or states that it owns none; a store names one owning boundary that writes it,
and a second writer exists only with an explicit shared-write justification.

## The decision names every write it commits to

A boundary that owns a store says nothing about who writes it, when, or under which transaction, so
the decision closes that gap itself: `response/data/stack-model.json` carries one `operations` entry
per write this architecture commits to, and `## Operations` of the receipt restates the same rows.
Each entry names its transport, its writer, the stores it touches, its transaction boundary, its
idempotency kind, the migrations it ships, and the coverage-matrix dimensions of the business head it
implements. That list is the frozen contract `backend.source.apply` fills: the implementation restates
those operations unchanged and may add none, so an operation nobody declared here cannot be written
anywhere. Declaring a write is not the same as choosing an implementation, which is why the writer is
the one file path this operator names.

A standalone migration uses the operation shape in
[`stack-model.schema.json#/$defs/migrationOperation`](../../templates/kinds/stack-model.schema.json#/$defs/migrationOperation).
It remains part of the same ownership decision and independent critique. Naming its source operation
does not authorize applying it to an environment.

## The critique is a nested exchange

After the selected alternative is deepened, the branch pauses: it emits `response/response.json`
with status `waiting` and `awaiting { exchange: critique, kind: independent-critique }`. The
orchestrator writes `critique/request/request.json` with only `response/data/stack-model.json` as
input, never the author's rationale, and runs a fresh agent on this operator's own profile with no
inherited turns. That agent writes only `critique/response/`. When its response is done the paused
agent resumes at the confirmation step. Other branches of the same step keep running throughout.

## Boundary

Context is read-only. The operator writes only `response/` of its own branch: `response.md`,
`data/current-state.json`, `data/stack-model.json`, the alternatives page when more than one
alternative was asked for, and `response.json`; the critique agent writes only
`critique/response/`. It does not mutate routed source, publish business authority, start or
reconfigure runtime services, name implementation files in the handoff, or claim that an
implementation, a quality gate, or a UAT run has passed.

When the `model` Input is present it is the authority for this run and the published head is lineage
only, because a decision taken against yesterday's promise is a decision against the wrong promise.
When it is absent the published head is the authority.

## Context

| Alias | Bind | Required |
| --- | --- | --- |
| `@workspaces/be` | the routed backend checkout read at the frozen head; the inventory comes from its manifests and deployment files | yes |
| `@worktrees/businesses/<featureId>` | the published business head, the promise the architecture must keep; evidence when the session carries a `model` Input | yes |
| `@knowledge/patterns` | reusable shapes the scope may bind; a shape, never a selection | no |

## Inputs

| Kind | From | Required |
| --- | --- | --- |
| `architecture-decision` | a prior run of `architecture.decide` on the same or an adjacent boundary; lineage that may be contradicted, never ignored | no |
| `model` | `business.decide`; the head that branch modelled, when it has not been published yet | no |

## Requirements

| Field | Type | Default | Ask |
| --- | --- | --- | --- |
| `objective` | prompt | — | The objective the architecture must achieve, in the person's words |
| `decisionId` | id | slug of `objective` | The name the artifacts carry |
| `alternatives` | number 1–4 | 1 | How many materially different designs to generate; more than one only when a comparison was asked for |
| `tradeoffAxes` | list | cost, complexity, reversibility | The axes every alternative is scored on and the critique attacks along |
| `constraints` | list of `{id, kind, statement}` | — | kind is fixed-intent, measurable, preference, assumption or unknown; at least one fixed-intent |
| `selectionPolicy` | choice | automatic | `automatic`: the operator selects and records why; `approval-required`: the person selects |
| `approval` | id | null | The approved alternative id; required only under `approval-required`, supplied on resume after `CHOICE_REQUIRED` |
| `resume` | token | null | The blocked branch's token when re-entering after a stop |

## Steps

| # | Step | Params | Reads | Writes | Stops with |
| --- | --- | --- | --- | --- | --- |
| 1 | Validate the gate and resume | `resume`, `approval` | `request/request.json`, input `architecture-decision` when present, @workspaces/be at the frozen head | — | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS` |
| 2 | Observe the current state | — | @workspaces/be at the frozen head: manifests, configuration, deployment files, @tools/git | `response/data/current-state.json` | `CURRENT_STATE_UNOBSERVED` |
| 3 | Bind the inventory to the business promise | — | `response/data/current-state.json`, input `model` when present, otherwise @worktrees/businesses/<featureId> at its published head | — | `BUSINESS_AUTHORITY_REQUIRED`, `EVIDENCE_MISSING` |
| 4 | Frame the decision | `objective`, `decisionId`, `constraints`, `tradeoffAxes` | `request/request.json` requirements | — | `CONSTRAINT_CONTRADICTION` |
| 5 | Generate the alternatives | `alternatives` | `response/data/current-state.json`, @knowledge/patterns, @tools/websearch | `response/artifacts/<decisionId>-alternatives.html` only when more than one alternative was asked for, @tools/visualize | `NO_VIABLE_ALTERNATIVE` |
| 6 | Select | `selectionPolicy`, `tradeoffAxes`, `approval` | `response/artifacts/<decisionId>-alternatives.html` when present | — | `CHOICE_REQUIRED` |
| 7 | Deepen the selected alternative and declare the operations it commits to | `constraints` | `response/data/current-state.json`, the bound business head's coverage matrix for the dimensions each operation cites | `response/data/stack-model.json`, including its `operations` | `DATA_OWNERSHIP_UNASSIGNED`, `COMPATIBILITY_UNVERIFIED` |
| 8 | Await the critique: pause, a fresh agent attacks the selection, resume when it answers | — | `critique/response/critique.md` once the exchange is done | `response/response.json` (waiting, awaiting critique) | `CRITIQUE_UNRESOLVED` |
| 9 | Confirm or return the selection | `selectionPolicy` | `critique/response/critique.md`, `response/data/stack-model.json` | — | `CHOICE_REQUIRED`, `NO_VIABLE_ALTERNATIVE` |
| 10 | Write the handoff and emit | — | everything above | `response/response.md`, `response/response.json` | — |

Under the defaults, step 5 produces one design and no comparison page, step 6 has nothing to
choose, and the decision's quality rests on step 8. When the only alternative fails an attack, step 9
stops with `NO_VIABLE_ALTERNATIVE`, not `CHOICE_REQUIRED`. The handoff names contracts, never
implementation files, because choosing the files is the next domain's job; the one exception is the
writer of each declared operation, which this operator does name, because the implementation may not
choose its own writer.

## Outputs

| Kind | File | Type | Required |
| --- | --- | --- | --- |
| `architecture-decision` | `response/response.md` | md | yes |
| `current-state` | `response/data/current-state.json` | data | yes |
| `stack-model` | `response/data/stack-model.json` | data | yes |
| `alternatives` | `response/artifacts/<decisionId>-alternatives.html` | artifact | no |
| `independent-critique` | `critique/response/critique.md` | md | yes |

`response/response.md` carries the `## Operations` table and `response/data/stack-model.json` carries
the matching `operations` array; together they are the mutation contract `backend.source.apply`
consumes, and no other output of this operator crosses into that step.

## Stops

| Code | Disposition |
| --- | --- |
| `INVALID_INPUT` | terminate |
| `SOURCE_DRIFT` | terminate |
| `NO_PROGRESS` | terminate |
| `EVIDENCE_MISSING` | terminate |
| `CURRENT_STATE_UNOBSERVED` | terminate |
| `BUSINESS_AUTHORITY_REQUIRED` | terminate |
| `CONSTRAINT_CONTRADICTION` | terminate |
| `NO_VIABLE_ALTERNATIVE` | terminate |
| `CHOICE_REQUIRED` | fallback |
| `COMPATIBILITY_UNVERIFIED` | fallback |
| `DATA_OWNERSHIP_UNASSIGNED` | terminate |
| `CRITIQUE_UNRESOLVED` | terminate |

## Next

| When | Operator |
| --- | --- |
| the business promise must be modelled again against the decided boundaries | `business.decide` |
| the decision is confirmed and a backend contract changes | `backend.source.apply` |
| the decision is confirmed and a frontend surface changes | `frontend.direction.decide` |
```

## FILE: .claude/operators/architecture-decide/operator.json

SHA-256: 56d74a355a518fa72451d04506c073f3b2f71134becbae1dc94aac4bb4b2541e

```json
{
  "schemaVersion": 9,
  "id": "architecture.decide",
  "domain": "architecture",
  "job": "Decide one architecture with its tech stack, system boundaries, and data ownership, and prove it against the observed current state, the rejected alternatives, verified compatibility, and an independent critique.",
  "package": "operator.md",
  "errors": "errors.json",
  "validator": "validate.mjs",
  "selfTest": "self-test.mjs",
  "resources": {
    "profile": "sol-fresh",
    "grammarBound": false,
    "tools": {
      "@tools/fileread": "context-aliases",
      "@tools/git": "read",
      "@tools/websearch": "bounded",
      "@tools/visualize": "html"
    }
  }
}
```

## FILE: .claude/operators/architecture-decide/errors.json

SHA-256: 009386706b0926942611068edff155d5c34fb070927c56225090814ffdcf8868

```json
{
  "schemaVersion": 9,
  "note": "Stop codes only architecture.decide emits. Same entry shape as operators/errors.json, scope implicit. Shared codes (INVALID_INPUT, SOURCE_DRIFT, NO_PROGRESS, EVIDENCE_MISSING) come from operators/errors.json.",
  "codes": {
    "CURRENT_STATE_UNOBSERVED": {
      "domain": "workspace",
      "disposition": "terminate",
      "meaning": {
        "en": "The system today could not be read at the frozen head.",
        "vi": "Không đọc được hiện trạng hệ thống ở head đã đóng băng."
      },
      "resume": {
        "en": "Fix the route or the checkout.",
        "vi": "Sửa route hoặc checkout."
      }
    },
    "BUSINESS_AUTHORITY_REQUIRED": {
      "domain": "business",
      "disposition": "terminate",
      "meaning": {
        "en": "The published business head the architecture must keep is missing or stale.",
        "vi": "Head nghiệp vụ đã publish mà kiến trúc phải giữ đang thiếu hoặc cũ."
      },
      "resume": {
        "en": "Run business.decide first.",
        "vi": "Chạy business.decide trước."
      }
    },
    "CONSTRAINT_CONTRADICTION": {
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "Two fixed-intent constraints cannot both hold.",
        "vi": "Hai ràng buộc fixed-intent không thể cùng đúng."
      },
      "resume": {
        "en": "A person resolves the constraints.",
        "vi": "Người sửa ràng buộc."
      }
    },
    "NO_VIABLE_ALTERNATIVE": {
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "No alternative survives the frozen constraints, or the only alternative fails an attack.",
        "vi": "Không phương án nào qua được ràng buộc, hoặc phương án duy nhất chết dưới một đòn tấn công."
      },
      "resume": {
        "en": "Relax a constraint or stop.",
        "vi": "Nới ràng buộc hoặc dừng."
      }
    },
    "CHOICE_REQUIRED": {
      "domain": "caller",
      "disposition": "fallback",
      "meaning": {
        "en": "Several alternatives remain material after assessment.",
        "vi": "Nhiều phương án còn material sau khi chấm."
      },
      "fallback": {
        "en": "Select the alternative with the highest score across tradeoffAxes; on a tie, the one that changes the fewest stack components; record the score table under ## Decision.",
        "vi": "Chọn phương án điểm cao nhất theo tradeoffAxes; hòa thì chọn phương án đổi ít component stack nhất; ghi bảng điểm dưới ## Decision."
      },
      "unless": {
        "param": "selectionPolicy",
        "equals": "approval-required",
        "then": "terminate"
      },
      "resume": {
        "en": "The person supplies approval.",
        "vi": "Người nhập approval."
      }
    },
    "COMPATIBILITY_UNVERIFIED": {
      "domain": "self",
      "disposition": "fallback",
      "meaning": {
        "en": "A retained stack component has no compatibility evidence on at least one axis.",
        "vi": "Một component stack giữ lại không có bằng chứng tương thích ở ít nhất một trục."
      },
      "fallback": {
        "en": "Mark the component replaced-candidate in the stack delta and list the unverified axes under Handoff as unknown.",
        "vi": "Đánh dấu component là replaced-candidate trong stack delta và liệt kê các trục chưa kiểm vào Handoff dạng unknown."
      },
      "resume": {
        "en": "Add the compatibility evidence.",
        "vi": "Bổ sung bằng chứng tương thích."
      }
    },
    "DATA_OWNERSHIP_UNASSIGNED": {
      "domain": "self",
      "disposition": "terminate",
      "meaning": {
        "en": "A physical store has no owning boundary.",
        "vi": "Một store vật lý không có boundary sở hữu."
      },
      "resume": {
        "en": "Assign the owner.",
        "vi": "Gán chủ sở hữu."
      }
    },
    "CRITIQUE_UNRESOLVED": {
      "domain": "self",
      "disposition": "terminate",
      "meaning": {
        "en": "An attack on the selected alternative has no resolution.",
        "vi": "Một đòn tấn công vào phương án đã chọn không có lời giải."
      },
      "resume": {
        "en": "Resolve the attack or select differently.",
        "vi": "Giải quyết đòn tấn công hoặc chọn khác."
      }
    }
  }
}
```

## FILE: .claude/operators/backend-source-apply/operator.md

SHA-256: 21c4558eea0022ea52b5402d72960e711c0ca4687ea0ff592f3d7239b197a8cc

```markdown
# backend.source.apply

## Job

Implement one backend outcome inside a frozen mutation contract, following the observed sibling
family, and return the measured conformance and proof receipt that shows the boundary was not widened.

## The contract is frozen before the first write

The contract arrives as the Input `architecture-decision`, fingerprinted and closed. The operations,
writers, stores, transaction boundaries, idempotency kinds, and migrations it lists are the complete
set the implementation may touch, and this operator answers only one question per operation: does the
code that now exists do exactly what the contract says, and what measurement shows it. The operations
are not a Requirement, because a person retyping a contract into a request is how the contract and
the implementation quietly diverge; step 3 reads them from the frozen input's `operations` — one row of the
architecture decision's `## Operations` table, one object of its `stack-model.json`, per write the
decision commits to — and restates them in `response/data/mutations.json`, carrying each operation's
`writerRef`, `transactionBoundary`, `idempotencyKind`, `migrationRefs` and dimension ids across
unchanged. Three prohibitions carry that, and each is enforced rather than
advised. An operation, writer, store, transaction, migration, or event outside the contract is
`CONTRACT_WIDENED`, returned to the contract owner before any product write. A file outside the
mutable ceiling is `OWNER_CONFLICT`, even when the change there would be one line. A convention no
bound sibling pattern publishes is refused and recorded as `NEW_CONVENTION_REFUSED`, while an aspect
with no pattern at all is `PATTERN_UNBOUND`. Discovering mid-implementation that the outcome needs a
wider boundary is the expected way this operator ends, not a failure of nerve: the contract is
reopened by its owner and the same outcome is implemented again against the new fingerprint. Reaching
outside the list is not a smaller change than reopening the contract; it is the same change made
without a record.

Standalone migrations follow
[`stack-model.schema.json#/$defs/migrationOperation`](../../templates/kinds/stack-model.schema.json#/$defs/migrationOperation).
For a contract containing one, the orchestrator sets `contractFingerprint` to the SHA-256 of the exact
producer `stack-model.json` bytes before the request is frozen. The request gate verifies the completed
architecture producer, its critique, the fingerprint and the declared writer and migration file ceiling.
The result gate compares every operation field to that same producer; the output cannot replace its
own authority. An imported contract is checked against its verified original producer, including the
original critique. Migration conformance and replay proof still apply, and implementing source does
not grant authority to apply the migration to a shared environment.

## Nothing is written outside a session

Before a single byte of routed source is read for change or written, the branch this operator runs in
exists: a session folder with `state.json` and this branch's own `step-N/parallel-M/request/request.json`,
green under `validate-request`. That order is the whole point of the session — the request states what
may be touched before anything is touched, and every later receipt hangs off it. An invocation that
finds itself about to edit routed source with no `step-N/parallel-M` under a session stops with
`SESSION_MISSING` and reports it; it does not create the folder retroactively, because a session
written after the work is a record of the work, not a gate on it, and nothing it contains was ever
validated against what was actually done.

## The person's branch is never written

This operator never writes on the branch a person has checked out. The orchestrator prepares a
dedicated git worktree of the routed checkout on the session branch `session/<sessionId>`, cut from
the frozen head, and step 3 writes there and nowhere else, under an exclusive lease on
`@workspaces/be`. The final step commits the whole declared write set once, records that sha in
`response.json.commits`, and names the same sha in `response/data/mutations.json` as `commit` beside
the `base` it started from and the `branch` it lives on; `response/changes.md` states the same move in
its Binding row, `@workspaces/be` at `<base>` → `<sha>` on `session/<sessionId>`. One commit, because
a step whose work arrives as several commits cannot be pinned by the next step's request, and an
uncommitted write cannot be pinned at all. Nothing is pushed and nothing is merged here: `git.publish`
merges the session branch into the target branch, and it is the only operator that talks to a remote.

## Dry mode writes the plan, not the tree

`mode` decides whether this run touches the checkout at all. Under `apply` the operator fills the
contract, commits once, and everything below holds as written. Under `dry` it does the same reading,
the same binding and the same projection, then stops after the plan: `response/data/mutations.json`
carries the operations it would fill and the files it would touch with `commit` null and no after
hash, `response.json` records no commit, and not one byte reaches `@workspaces/be`. The branch still
ends `done`, because a plan honestly produced is a finished answer to a question about a plan; its
`changes.md` lists every planned path as `unchanged`, which is what the working tree actually shows,
and names the change it would have made in `Why`. A dry run measures nothing, so it carries no
conformance record and no proof record: a facet cannot be measured on code that was never written,
and a plan that shipped verdicts would be indistinguishable from an implementation. A dry run is also granted neither `@tools/sourcewrite` nor `@tools/git`, because a
mode that writes nothing needs no tool that can write; the grant and this paragraph say the same
thing so neither can drift. That is also why
a dry run can never be the run that satisfies the contract — it is a way to read the write set before
paying for it, not a cheaper way to apply it.

## The backend never invents business behaviour

Every operation cites the approved decisions it implements. An approved decision is not a number this
operator may coin: it is a coverage-matrix `dimension` of the bound business head, addressed by that
dimension's own kebab identifier, and the matrix fingerprint travels with the citation so a later
reader can tell which matrix approved it. A citation naming anything the bound matrix does not carry
is not an approval, it is a guess with a label. When the code reaches a point where the
answer depends on a business rule nobody approved, the branch stops with `BUSINESS_AUTHORITY_MISSING`
and names the open question. It does not pick the lenient reading, mirror what a neighbouring feature
happens to do, or choose whichever branch makes the test go green. This is the most load-bearing rule
in the operator, because a guessed business rule that passes its own test is indistinguishable from an
approved one once it ships. An implemented receipt therefore cannot carry a `BUSINESS_QUESTION_RAISED`
finding: raising the question and implementing anyway is the exact contradiction the check exists to
catch.

## Sibling patterns are the only source of convention

The bound patterns name one family per aspect, and the implementation mirrors the family the codebase
already publishes rather than the one it remembers: command handlers in the family the mutation layer
already uses, exceptions derived from the published exception identity, entity access through the
injected primary entity manager, migrations under the primary datasource. Two families bound for one
aspect means no family is bound, and guessing the family from memory is how a second house style
enters a codebase unnoticed.

## Conformance is measured, not asserted

A conformance record without evidence is a sentence about the code, and a sentence cannot contradict
the code. Each declared facet of each operation gets its own file,
`response/data/conformance/<operationId>.<facet>.json`, so a facet nobody measured is a missing file
rather than a missing line inside a file that still looks complete. The evidence is what a later
reader uses to disagree with this receipt, so it is required for every facet including the ones that
passed. The same reasoning makes a proof carry its command, its exit code and its output in
`response/data/proofs/<operationId>.<kind>.json`: the command says what was run and the result says
what came back, and either one alone can be written by someone who ran nothing. A proof that could not
run never becomes an assertion that the behaviour is fine, and a failed proof blocks the receipt
rather than being reclassified. Each touched file carries one change record with its kind and its
before and after hashes, because a modified file whose two hashes agree records a mutation that did
not happen.

## Boundary

The operator writes product source only inside the mutable file ceiling, only inside the session
branch worktree of `@workspaces/be`, and writes everything else into `response/` of its own branch:
`response.md`, `response/changes.md`, `response/data/mutations.json`, one conformance record per
declared facet, one proof record per declared proof, and `response.json`. It never adds an operation,
writer, store, transaction, migration, or event the frozen contract does not carry, decides a business
rule the approved authority does not state, introduces a convention no bound sibling pattern
publishes, weakens, skips, suppresses, or substitutes a declared proof to make a run go green, edits
the contract, the business authority, or a file outside the mutable ceiling, commits more than once,
writes on the person's checked-out branch, pushes, merges, or tags anything, claims conformance
without naming the evidence that measured it, or records a quality, visual, or UAT verdict; those are
other jobs with their own gates.

When the `model` Input is present it is the authority for this run and the published head is lineage
only: a chain that has just modelled a head must not decide against an older promise merely because
the publication was withheld. When it is absent the published head is the authority.

## Context

| Alias | Bind | Required |
| --- | --- | --- |
| `@worktrees/businesses/<featureId>` | the published business head, the only source of business behaviour; evidence when the session carries a `model` Input | yes |
| `@knowledge/patterns/be` | the sibling families this change mirrors, one per aspect; the only source of valid conventions | yes |
| `@workspaces/be` | the routed backend checkout at the frozen head, written only on its session branch worktree | yes |

## Inputs

| Kind | From | Required |
| --- | --- | --- |
| `architecture-decision` | `architecture.decide`; the frozen mutation contract the implementation fills and may not widen, and the source of every operation this run restates | yes |
| `model` | `business.decide`; the head that branch modelled, when it has not been published yet | no |
| `backend-source-application` | a prior run of `backend.source.apply` for the same outcome; regression history, absent on the first run | no |

## Requirements

| Field | Type | Default | Ask |
| --- | --- | --- | --- |
| `featureId` | id | — | The feature whose published business head decides this behaviour |
| `outcome` | prompt | — | The one thing being implemented, in the person's words |
| `mutableFileRefs` | list | — | The only files product source may be written into |
| `contractFingerprint` | id | null | SHA-256 of the producer stack-model bytes; the orchestrator binds it for a standalone migration contract |
| `mode` | choice | apply | `apply` fills the contract and commits, `dry` emits the plan and writes nothing |
| `resume` | token | null | The blocked branch's token when re-entering after a stop |

## Steps

| # | Step | Params | Reads | Writes | Stops with |
| --- | --- | --- | --- | --- | --- |
| 1 | Validate the gate and resume, and confirm the session | `resume`, `mode` | `request/request.json`, the session's `state.json` and this branch's `step-N/parallel-M`, input `backend-source-application` when present, @workspaces/be at the frozen head | — | `INVALID_INPUT`, `SESSION_MISSING`, `SOURCE_DRIFT`, `NO_PROGRESS` |
| 2 | Bind authority, contract and patterns | `featureId`, `contractFingerprint` | input `model` when present, otherwise @worktrees/businesses/<featureId> at its published head, input `architecture-decision` as the frozen contract and the source of its `operations`, @knowledge/patterns/be one pattern per aspect | — | `CONTRACT_UNFROZEN`, `BUSINESS_AUTHORITY_MISSING`, `PATTERN_UNBOUND` |
| 3 | Fill one contract operation at a time, on the session branch | `mutableFileRefs` | @knowledge/patterns/be for each aspect, @workspaces/be inside the mutable ceiling | @workspaces/be/branch/session inside the mutable ceiling, under an exclusive lease, @tools/sourcewrite | `CONTRACT_WIDENED`, `OWNER_CONFLICT` |
| 4 | Check every mutation against the frozen contract and record it with its before and after hash | `mode` | @workspaces/be, the touched files and the frozen contract | `response/data/mutations.json` | — |
| 5 | Revalidate persisted snapshots on read | — | @workspaces/be, the persisted snapshot, @knowledge/patterns/be for the rules that drift after it | — | — |
| 6 | Prove each declared facet | — | @workspaces/be, the measurement behind each facet | `response/data/conformance/<operationId>.<facet>.json` | — |
| 7 | Run each declared proof | — | @workspaces/be, the pinned command of each declared proof kind | `response/data/proofs/<operationId>.<proofKind>.json`, @tools/shell | `PROOF_UNAVAILABLE` |
| 8 | Commit the write set once, write the receipt and emit | `outcome` | everything above | @workspaces/be/branch/session as one commit, `response/changes.md`, `response/response.md`, `response/response.json`, @tools/git | — |

Under `mode = dry` step 3 projects the fill onto the declared paths without writing one of them, step
4 records that projection as the plan with a null commit and no after hash, steps 5 to 7 have nothing
to measure and produce nothing, and step 8 emits the receipt and the change record without a commit.
Under `apply` every step runs as written. The routed head is reverified immediately before the first
product write, so drift found there stops the branch before anything is written. Filling an operation writes the transport, the validation, the
authorization check, the data access, and the failure paths into the declared writer and the files the
change genuinely requires; it refuses loudly and early rather than dropping a case silently, raising
the exception the exception-identity pattern publishes before any row or external checkout is created.
When the outcome persists a workflow, session, cart, draft, or other snapshot, usability is enforced
again where it is read, reconciled server side, in stable order, with indexes remapped atomically and
an explicit terminal state when nothing actionable remains, and recorded as `SNAPSHOT_REVALIDATED`. A
resume begins again at step 1, reuses only unchanged fingerprinted observations, and consumes the exact
delta; an approved business decision arrives as a new authority fingerprint, because the same
fingerprint cannot yield a different answer.

## Outputs

| Kind | File | Type | Required |
| --- | --- | --- | --- |
| `backend-source-application` | `response/response.md` | md | yes |
| `changes` | `response/changes.md` | md | yes |
| `mutations` | `response/data/mutations.json` | data | yes |
| `conformance` | `response/data/conformance/<operationId>.<facet>.json` | data | no |
| `proof` | `response/data/proofs/<operationId>.<proofKind>.json` | data | no |

## Stops

| Code | Disposition |
| --- | --- |
| `INVALID_INPUT` | terminate |
| `SESSION_MISSING` | terminate |
| `SOURCE_DRIFT` | terminate |
| `NO_PROGRESS` | terminate |
| `CONTRACT_UNFROZEN` | terminate |
| `CONTRACT_WIDENED` | terminate |
| `BUSINESS_AUTHORITY_MISSING` | terminate |
| `OWNER_CONFLICT` | terminate |
| `PATTERN_UNBOUND` | terminate |
| `PROOF_UNAVAILABLE` | terminate |

## Next

| When | Operator |
| --- | --- |
| the contract is filled and the gates the change record names must run | `quality.verify` |
| the promise must be reconciled against the source that was delivered | `business.decide` |
| the contract is filled and a frontend surface must consume it | `frontend.direction.decide` |
| a file needing mutation lies outside the routed write ceiling | `workspace.bind` |
| a declared proof cannot be executed in this environment | `platform.operate` |
| the plan was produced under mode dry and a person decides whether to pay for it | `user` |
```

## FILE: .claude/operators/backend-source-apply/operator.json

SHA-256: 6701b164eaa9477f4d398132b1d4867b47050a245e89a8a496d2c6976fa02c79

```json
{
  "schemaVersion": 9,
  "id": "backend.source.apply",
  "domain": "backend",
  "job": "Implement one backend outcome inside a frozen mutation contract, following the observed sibling family, and return the measured conformance and proof receipt that shows the boundary was not widened.",
  "package": "operator.md",
  "errors": "errors.json",
  "validator": "validate.mjs",
  "selfTest": "self-test.mjs",
  "resources": {
    "profile": "luna",
    "grammarBound": false,
    "tools": {
      "@tools/fileread": "context-aliases",
      "@tools/sourcewrite": "declared-write-set",
      "@tools/git": "commit-session-branch",
      "@tools/shell": "declared-commands"
    }
  }
}
```

## FILE: .claude/operators/backend-source-apply/errors.json

SHA-256: d550d8e7678d66fe7e242bc1038d0e1e261d918653123683a378352306bd8b84

```json
{
  "schemaVersion": 9,
  "note": "Stop codes only backend.source.apply emits. Same entry shape as operators/errors.json, scope implicit. Shared codes (INVALID_INPUT, SOURCE_DRIFT, NO_PROGRESS) come from operators/errors.json, and OWNER_CONFLICT is not defined here because frontend.presentation.resolve emits it too: a code two operators emit belongs in operators/errors.json with both ids in scope. Every domain below is the one the old package's owningDomain enum published for this operator: backend, business, contract, platform, workspace, caller. `contract` is a routing domain of its own, answered with a person, and it is not spelled caller: the person who reopens a frozen contract is not the person who wrote the request.",
  "codes": {
    "CONTRACT_UNFROZEN": {
      "domain": "contract",
      "disposition": "terminate",
      "meaning": {
        "en": "The mutation contract is not frozen, or its fingerprint is stale.",
        "vi": "Contract mutation chưa đóng băng, hoặc fingerprint của nó đã cũ."
      },
      "resume": {
        "en": "Bring the frozen contract.",
        "vi": "Mang contract đã đóng băng tới."
      }
    },
    "CONTRACT_WIDENED": {
      "domain": "contract",
      "disposition": "terminate",
      "meaning": {
        "en": "The outcome cannot be reached without a boundary the contract does not carry.",
        "vi": "Không đạt được kết quả nếu không có một ranh giới mà contract không mang."
      },
      "resume": {
        "en": "The contract owner reopens and refreezes the contract, then the same outcome is implemented again.",
        "vi": "Chủ contract mở lại và đóng băng lại contract, rồi cài đặt lại cùng kết quả đó."
      }
    },
    "BUSINESS_AUTHORITY_MISSING": {
      "domain": "business",
      "disposition": "terminate",
      "meaning": {
        "en": "A business question is open and no approved decision settles it.",
        "vi": "Một câu hỏi nghiệp vụ còn mở và không quyết định đã duyệt nào giải nó."
      },
      "resume": {
        "en": "Publish the decision and rebind the authority fingerprint.",
        "vi": "Publish quyết định và ràng lại fingerprint thẩm quyền."
      }
    },
    "PATTERN_UNBOUND": {
      "domain": "backend",
      "disposition": "terminate",
      "meaning": {
        "en": "A touched aspect has no sibling family bound for it.",
        "vi": "Một khía cạnh bị chạm không có họ anh em nào được ràng cho nó."
      },
      "resume": {
        "en": "Bind the missing pattern; guessing the family from memory is refused.",
        "vi": "Ràng pattern còn thiếu; đoán họ từ trí nhớ bị từ chối."
      }
    },
    "PROOF_UNAVAILABLE": {
      "domain": "platform",
      "disposition": "terminate",
      "meaning": {
        "en": "A declared proof could not be executed in this environment.",
        "vi": "Một proof đã khai không chạy được trong môi trường này."
      },
      "resume": {
        "en": "Provide a working proof environment; a proof that could not run never becomes a pass.",
        "vi": "Cung cấp môi trường chạy proof; một proof không chạy được không bao giờ thành pass."
      }
    }
  }
}
```

## FILE: .claude/operators/business-decide/operator.md

SHA-256: 2d6ecea559e82701acd52df225d9c7f89ec02347fb3e62d77dec0b9a078552e8

```markdown
# business.decide

## Job

Decide and publish one evidence-backed business promise as durable backend-owned authority, frozen
behind a complete promise-to-enforcement coverage matrix, or reconcile that published head against
the source that was actually delivered.

## Two modes, one head

`mode` decides which half of this operator runs. Under `model` the promise is modelled and the
coverage matrix is frozen: steps 4, 5 and 6 run and the branch writes
`response/data/coverage-matrix.json`. Under `reconcile` nothing is modelled again; step 7 compares the
head that was already published against the source a backend run delivered, and the Input
`backend-source-application` is required in that mode, because a reconciliation with no delivered source
is an opinion about code nobody read. The Inputs table marks it optional because the requirement is
conditional, and `validate.mjs` refuses a `reconcile` branch whose request does not bind it. Both
modes end at the same place: one head under `@worktrees/businesses/<featureId>` and one
`response/data/model.json` that says exactly what that head now holds.

## A first run starts from the person's promise

A feature that no source implements yet has no fact claim by construction. On a first run under mode
model, the promise the person stated in `promise` is recorded as the one intent claim, bound to
`request/request.json#requirements.promise` instead of a source line, and the model is built from it;
`EVIDENCE_MISSING` applies to a fact claim without a file behind it, never to the intent of a promise
that is being decided for the first time. Every enforcing row of the coverage matrix still rests on a
fact claim, so a greenfield head publishes with its enforcing rows open, which is what `pending` means.

## Separate the claim before modelling it

Modelling begins by separating every observation into fact, intent, example, unknown, or
contradiction, and that separation is written to `response/data/claims.json` before anything is
modelled from it. The separation exists to make one substitution impossible: an example, a
screenshot, or an owner's intent illustrates a promise, and only an observed fact in routed source
proves that the promise is enforced. A coverage row that asserts enforcement therefore cites at least
one fact claim, and every fact claim binds the observed source head. A claim that cites a source
nobody bound is invalid input rather than a warning, because an unbound citation cannot be told apart
from an invented one. Two claims that disagree about the same behaviour are never averaged into a
middle reading; the contradiction stops the invocation and returns to its owner.

## No promise without coverage

A promise is publishable only when every dimension the request declared carries exactly one
disposition, and every consumer and lifecycle branch the operator discovered is disposed by name.
`dimensions` defaults to the dimensions of the previous head, which is why it is required on a first
run: the first publication is the one that decides what the promise is even accountable for. That
rule exists because "full access" was modelled, implemented, and published while its course,
community, blog, AI, mock-interview, legacy-sale, quota, settlement, renewal, cancellation, and
recovery consumers had never all been proved. The promise was true in the offer and false at the
guard. Four prohibitions carry the repair, and each is enforced rather than advised. A discovered
consumer with no matrix row is `CONSUMER_UNPROVEN`. A mandatory dimension, meaning actor and
eligibility, offer entry, read entry, purchase side effect, settlement, idempotency, entitlement
consumer, and denial, can never be marked not applicable when it was declared. A dimension whose
branch was observed in source can never be marked not applicable either, because it was found, so it
applies. A preserve or replace disposition without a negative proof is rejected, since positive proof
alone shows the promise is granted and never that it is denied when it should be.

## The dispositions and what each one must carry

`preserve` keeps the existing enforcement and carries owner, source, positive proof, negative proof,
and one fact claim. `replace` changes the enforcement and carries the same substance for the new
path. `retire` closes a path on purpose and carries owner, source, proof the path is closed, and one
fact claim. `defer` postpones a branch to a named owner, carries a deferral reference, and carries no
proof at all, because proof for work that has not happened is the most convincing kind of false pass.
`not-applicable` states the branch cannot occur and carries nothing: no owner, no source, no proof, no
consumer, no claim. `defer` is a disposition, so a deferred branch does not block publication; what
blocks publication is silence.

## One flat authority root

One feature owns exactly one head directory, `<businesses root>/features/<featureId>`, whose
`model.json` is the head, and step 8 takes an exclusive lease on that alias before it writes. Two
branches of the same step may not publish the same feature. `features/` is the only segment between
the root and a feature: a project segment inserted below the root starts a second authority tree that
later readers never find, so any head that is not exactly `features/<featureId>` is refused. The head
is classified absent, fresh, or stale against the frozen evidence and the frozen source head, and
that classification decides which lifecycle transition is legal. Rejection preserves lineage by
naming the previous head rather than erasing it, and `implemented` is never published on the strength
of a plan: delivered source is compared against the frozen matrix first, under `reconcile`.

## Boundary

Context is read-only apart from the one feature head. The operator writes only `response/` of its own
branch, `response.md`, `response/data/claims.json`, `response/data/coverage-matrix.json` under mode
model, `response/data/model.json` and `response.json`, plus the one feature head under
`@worktrees/businesses/<featureId>`. It never publishes a promise while a discovered consumer or
lifecycle branch carries no disposition, promotes an example, a screenshot, or an intent claim into
product truth, invents an actor, entitlement, quota, payment, settlement, or lifecycle behaviour the
evidence does not state, advances a head through a transition the lifecycle does not allow, or writes
a head below a project segment under the businesses root. It does not modify product source,
architecture authority, frontend authority, or backend implementation, and it never claims that an
implementation, a quality gate, or a UAT run has passed.

## Context

| Alias | Bind | Required |
| --- | --- | --- |
| `@worktrees/businesses/<featureId>` | the promise head and its lifecycle state, by content address from the registry; the one place this operator writes outside its branch | yes |
| `@workspaces/be` | the routed backend checkout read at the frozen head; every fact claim cites it by path, line range, and head | yes |

## Inputs

| Kind | From | Required |
| --- | --- | --- |
| `architecture-decision` | `architecture.decide`; architecture evidence, never a source of business behaviour | no |
| `backend-source-application` | `backend.source.apply`; the delivered source a reconciliation reads, required under mode `reconcile` and refused otherwise | no |

## Requirements

| Field | Type | Default | Ask |
| --- | --- | --- | --- |
| `featureId` | id | — | The one feature the promise belongs to |
| `mode` | choice | model | `model` decides and publishes the promise; `reconcile` compares the published head against delivered source |
| `promise` | prompt | the promise the previous head states | The promise in the person's words; required on a first run, when no head exists yet, and recorded as the intent claim bound to `request/request.json#requirements.promise` |
| `targetState` | choice | — | `pending`, `in-progress`, `implemented` or `rejected` for the published head |
| `dimensions` | list | the dimensions of the previous head | The coverage surface this promise is accountable for; required on a first run, because no previous head declares it |
| `approval` | id | null | The owner approval the transition needs, supplied on resume after `APPROVAL_REQUIRED` |
| `resume` | token | null | The blocked branch's token when re-entering after a stop |

## Steps

| # | Step | Params | Reads | Writes | Stops with |
| --- | --- | --- | --- | --- | --- |
| 1 | Validate the gate and resume | `resume`, `mode` | `request/request.json`, @workspaces/be at the frozen head | — | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS` |
| 2 | Normalize the evidence into claims | — | @workspaces/be, every observation with its role, path, line range and head, input `architecture-decision` when present as evidence only, @tools/git | `response/data/claims.json` | `EVIDENCE_MISSING`, `CONTRADICTION_UNRESOLVED` |
| 3 | Check the published head and the transition authority | `featureId`, `targetState`, `approval` | @worktrees/businesses/<featureId>: the current head, its state and its frozen evidence | — | `LIFECYCLE_TRANSITION_INVALID`, `AUTHORITY_CONFLICT`, `APPROVAL_REQUIRED` |
| 4 | Model the promise, its actor and its eligibility, under mode model: fact claims carry every enforcing row, the intent claim carries the promise itself | `promise` | `response/data/claims.json`, @workspaces/be at the frozen head, @tools/websearch | — | `EVIDENCE_MISSING` |
| 5 | Freeze the coverage matrix, under mode model | `dimensions` | `response/data/claims.json`, @workspaces/be and the surface it discovers | `response/data/coverage-matrix.json` | `COVERAGE_INCOMPLETE`, `CONSUMER_UNPROVEN` |
| 6 | Dispose legacy coexistence, under mode model | — | `response/data/coverage-matrix.json`: the legacy create, read and settle rows and their proof | — | `CONTRADICTION_UNRESOLVED` |
| 7 | Reconcile against delivered source, under mode reconcile | — | input `backend-source-application`, @workspaces/be at the frozen head, the coverage matrix frozen at the published head | — | `RECONCILIATION_DISCREPANCY` |
| 8 | Publish one head under an exclusive lease | — | `response/data/claims.json`, @worktrees/businesses/<featureId> at the previous head | @worktrees/businesses/<featureId> as the new model.json head, `response/data/model.json`, @tools/sourcewrite | `SOURCE_DRIFT` |
| 9 | Emit | — | everything above | `response/response.md`, `response/response.json` | — |

Legacy create, read, and settle each take their own row when they are declared: a new sale path may
retire legacy creation only while already-purchased rights stay readable and pending legacy
settlement still completes, and the retirement carries proof that the creation path is closed. The
matrix is content addressed and its fingerprint travels in the binding, so backend implementation,
quality integration, and UAT can prove they consumed the same matrix rather than a paraphrase of it.
A resume begins again at step 1, reuses only unchanged fingerprinted observations, and consumes the
exact delta; republished evidence arrives as a new evidence fingerprint, because the same fingerprint
cannot yield a different answer.

## Outputs

| Kind | File | Type | Required |
| --- | --- | --- | --- |
| `business-promise-authority` | `response/response.md` | md | yes |
| `claims` | `response/data/claims.json` | data | yes |
| `coverage-matrix` | `response/data/coverage-matrix.json` | data | no |
| `model` | `response/data/model.json` | data | yes |

## Stops

| Code | Disposition |
| --- | --- |
| `INVALID_INPUT` | terminate |
| `SOURCE_DRIFT` | terminate |
| `NO_PROGRESS` | terminate |
| `EVIDENCE_MISSING` | terminate |
| `CONTRADICTION_UNRESOLVED` | terminate |
| `LIFECYCLE_TRANSITION_INVALID` | terminate |
| `AUTHORITY_CONFLICT` | terminate |
| `APPROVAL_REQUIRED` | terminate |
| `COVERAGE_INCOMPLETE` | terminate |
| `CONSUMER_UNPROVEN` | terminate |
| `RECONCILIATION_DISCREPANCY` | terminate |

## Next

| When | Operator |
| --- | --- |
| the promise is published and a frontend surface must carry it | `frontend.direction.decide` |
| the promise is published and a backend contract must carry it | `backend.source.apply` |
| the promise needs boundaries and data ownership decided before it can be enforced | `architecture.decide` |
| the head is reconciled against the delivered source and the delivery may be published | `git.publish` |
```

## FILE: .claude/operators/business-decide/operator.json

SHA-256: adeada3eff62c64358babc870bc8ae20e2f5d0e87c9ec06a2527e15f3dfdfa91

```json
{
  "schemaVersion": 9,
  "id": "business.decide",
  "domain": "business",
  "job": "Decide and publish one evidence-backed business promise as durable backend-owned authority, frozen behind a complete promise-to-enforcement coverage matrix.",
  "package": "operator.md",
  "errors": "errors.json",
  "validator": "validate.mjs",
  "selfTest": "self-test.mjs",
  "resources": {
    "profile": "sol-fresh",
    "grammarBound": false,
    "tools": {
      "@tools/fileread": "context-aliases",
      "@tools/sourcewrite": "declared-write-set",
      "@tools/git": "read",
      "@tools/websearch": "bounded"
    }
  }
}
```

## FILE: .claude/operators/business-decide/errors.json

SHA-256: ec14c9ee722002c853d3395c8b0bd21af5314337701e6ba1e4f5a26f470ad970

```json
{
  "schemaVersion": 9,
  "note": "Stop codes only business.decide emits. Same entry shape as operators/errors.json, scope implicit. Shared codes (INVALID_INPUT, SOURCE_DRIFT, NO_PROGRESS, EVIDENCE_MISSING) come from operators/errors.json, and APPROVAL_REQUIRED is not defined here because more than one operator emits it: a code two operators emit belongs in operators/errors.json with both ids in scope. Every domain here is the routing domain the old package's owningDomain enum published for this operator: business, backend, frontend, architecture, workspace, caller.",
  "codes": {
    "CONTRADICTION_UNRESOLVED": {
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "Two claims about the same behaviour disagree and nothing resolves them.",
        "vi": "Hai claim về cùng một hành vi mâu thuẫn và không có gì giải quyết chúng."
      },
      "resume": {
        "en": "The owner resolves the contradiction.",
        "vi": "Người chủ giải quyết mâu thuẫn."
      }
    },
    "COVERAGE_INCOMPLETE": {
      "domain": "business",
      "disposition": "terminate",
      "meaning": {
        "en": "A declared coverage dimension carries no disposition.",
        "vi": "Một chiều phủ đã khai không mang disposition nào."
      },
      "resume": {
        "en": "Add the missing disposition.",
        "vi": "Bổ sung disposition còn thiếu."
      }
    },
    "CONSUMER_UNPROVEN": {
      "domain": "business",
      "disposition": "terminate",
      "meaning": {
        "en": "A discovered enforcement consumer has no disposition or no proof.",
        "vi": "Một consumer thực thi đã phát hiện không có disposition hoặc không có bằng chứng."
      },
      "resume": {
        "en": "Dispose the consumer with positive and negative proof, then publish the promise again.",
        "vi": "Xử lý consumer đó kèm positive và negative proof, rồi publish lại lời hứa."
      }
    },
    "LIFECYCLE_TRANSITION_INVALID": {
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "The requested target state is unreachable from the observed head.",
        "vi": "Trạng thái đích được yêu cầu không tới được từ head đã quan sát."
      },
      "resume": {
        "en": "Ask for a legal transition, or publish the intermediate state first.",
        "vi": "Yêu cầu một chuyển trạng thái hợp lệ, hoặc publish trạng thái trung gian trước."
      }
    },
    "AUTHORITY_CONFLICT": {
      "domain": "workspace",
      "disposition": "terminate",
      "meaning": {
        "en": "The head or the businesses root contradicts published authority.",
        "vi": "Head hoặc gốc businesses mâu thuẫn với thẩm quyền đã publish."
      },
      "resume": {
        "en": "Correct the authority binding.",
        "vi": "Sửa binding thẩm quyền."
      }
    },
    "RECONCILIATION_DISCREPANCY": {
      "domain": "backend",
      "disposition": "terminate",
      "meaning": {
        "en": "Delivered source differs from the frozen coverage matrix.",
        "vi": "Source đã giao khác với ma trận phủ đã đóng băng."
      },
      "resume": {
        "en": "Correct the source, or revise the matrix.",
        "vi": "Sửa source, hoặc sửa lại ma trận."
      }
    }
  }
}
```

## FILE: .claude/operators/content-generate/operator.md

SHA-256: 937e377aeed78c4f1c8aa113df2724e1cf33ed049ddcad51c8435a5d22183503

```markdown
# content.generate

## Job

Generate or refactor one educational content unit in one linear pass: a teacher brief that constrains
everything after it, one written edition per declared language, images made to a stated claim, code
and executable checks that actually run, and an independent review that receives the artifacts
without the producer's rationale.

## The brief comes first and constrains what follows

The teacher brief is written before anything else, from curriculum and source evidence, in one fresh
execution that inherits no turns. It publishes the learner inputs, the observable outcomes, the claims
a visual may encode, the examples, and the explicit add, change, and remove dispositions, and it is
then fingerprinted so nothing downstream may extend it. Everything after it is measured against it: an
edition may only claim coverage of an outcome the brief published, an image may only encode a claim
the brief published, and every declared edition must cover the whole published outcome set before the
unit can ship. An edition that covers part of the brief is a partial lesson in one language and a
complete one in another, which is exactly the silent defect this check exists to catch. A change or
remove disposition names what it acts on, because a disposition with no target is a wish.

## Generated code must actually run

Every implementation track is built with the exact command `commands` names for it, and the exit code
is read and recorded in `response/data/e2e.json`. A non-zero exit code cannot ship, because the lesson
would tell a learner that code works on nobody's evidence. Step 7 runs the declared command per track
inside a bounded run, read and repair loop whose ceiling is `maxE2eIterations`; the loop lives inside
the step, so `E2E_FAILED` is raised once, when the iterations are spent, rather than on the first red
run. The loop may repair the implementation or the harness. It may never move the contract it is
measured by, so the contract fingerprint is taken before the first run and compared after the last
one: a test deleted, skipped, loosened, or special cased to make the run green is the failure that
comparison exists to catch, and it is `CONTRACT_WEAKENED`. A track carries its build command and its
exit code, a run carries its command, its exit code, and its named assertions, and neither carries a
sentence claiming success.

## The image is made to a stated intent

The visual is derived from the brief's claims, the prompt that states that intent is persisted beside
the result, and the result is inspected for legibility, hierarchy, and claim fidelity. Step 5 runs
only when `stageModes` turns the image on; with the image off the step produces nothing at all, no
image and no prompt, and the receipt records `STAGE_DISABLED`, because a decision that leaves no
record reads later as an omission. A claim the brief never published cannot appear, and a visual that
fails its own claim-fidelity inspection cannot ship. An image is not decoration added at the end; it
is one of the claims, drawn.

## The review is a nested exchange, and revision is a fallback with a ceiling

After the executable check, the branch pauses: it emits `response/response.json` with status `waiting`
and `awaiting { exchange: review, kind: content-review }`. The orchestrator writes
`review/request/request.json` with the produced artifacts and the claims they make as inputs, never
the producer's rationale, and runs a fresh agent on this operator's own profile with no inherited
turns; that agent is never the execution that wrote the brief or an edition, and it writes only
`review/response/`. It scores correctness, pedagogy, interview value and language, and, where those
stages ran, visual fidelity, code quality and executable proof. Approval requires every applicable
score at or above 85 and no open error finding. A returned revision is not a stop: it is the fallback
`REVIEW_REVISION_REQUIRED`, and the branch repairs exactly the artifacts the review's findings name,
by owning stage, then reopens the exchange for the next round. The ceiling is `maxReviewRounds`; when
those rounds are spent and the review still returns a revision, `REVIEW_ROUNDS_EXHAUSTED` terminates,
because a unit that has been rewritten to a reviewer's satisfaction after unbounded rounds was
rewritten by the reviewer. A unit that passes its own author's review has not been reviewed, which is
why shared executions, inherited turns, and producer rationale are three separate refusals.

## Boundary

Context is read-only. The operator writes only `response/` of its own branch: the brief, the receipt,
the machine record of the build and the executable check, and the editions, image, prompt and tracks
under `response/artifacts/`; the review agent writes only `review/response/`. It runs only the
declared build and executable-check commands. It never writes an article before the brief is frozen or
beyond what the brief published, claims a learning outcome, example, or visual claim the brief does not
publish, reports a build or executable check that was not run or whose exit code was not read, changes
the executable contract during a repair loop, lets the producer of an artifact perform, steer, or
brief its own review, or approves a unit while any applicable score sits below the published minimum.
It does not edit the curriculum, publish the unit to the served object, or claim any readiness beyond
the checks it actually ran.

## Context

| Alias | Bind | Required |
| --- | --- | --- |
| `@remote/minio/<contentId>/<locale>` | the lesson as served, by the fingerprint of the fetched object; the unit being authored or revised | yes |
| `@worktrees/sessions/central-runtime` | the AI runtime that runs, reads, and repairs generated code, by generation | yes |

## Inputs

| Kind | From | Required |
| --- | --- | --- |
| `content-generation-receipt` | a prior run of `content.generate` on the same unit; regression history, absent on the first pass | no |

## Requirements

| Field | Type | Default | Ask |
| --- | --- | --- | --- |
| `unit` | id | — | The content unit being authored or revised |
| `naturalLanguages` | list | vi | The languages the unit is written in; every one of them covers the whole outcome set |
| `implementationLanguages` | list | empty | The languages the implementation tracks are written in; empty means no code and no executable check |
| `stageModes` | list of `{image}` | image off | Which optional stages run; `image on` turns step 5 on |
| `commands` | list of `{language, buildCommand, checkCommand}` | the commands the unit declares | The exact command each track is built and checked with |
| `maxE2eIterations` | number 1–20 | 2 | How many run, read and repair iterations step 7 may spend before `E2E_FAILED` |
| `maxReviewRounds` | number 1–20 | 2 | How many review rounds the revision fallback may spend before `REVIEW_ROUNDS_EXHAUSTED` |
| `resume` | token | null | The blocked branch's token when re-entering after a stop |

## Steps

| # | Step | Params | Reads | Writes | Stops with |
| --- | --- | --- | --- | --- | --- |
| 1 | Validate the gate and resume | `resume` | `request/request.json`, input `content-generation-receipt` when present, @remote/minio/<contentId>/<locale> at the frozen unit binding | — | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS` |
| 2 | Bind the served unit and the runtime | `unit` | @remote/minio/<contentId>/<locale> for curriculum and style as served, @worktrees/sessions/central-runtime for the runtime configuration, @tools/objectstorage | — | — |
| 3 | Write and freeze the brief | `naturalLanguages`, `implementationLanguages` | @remote/minio/<contentId>/<locale> for curriculum and source evidence, @tools/websearch | `response/brief.md` | `BRIEF_UNBOUND` |
| 4 | Write every declared edition | `naturalLanguages` | `response/brief.md` as the frozen brief | `response/artifacts/article.<language>.md` | `OUTCOME_UNCOVERED` |
| 5 | Generate the image to its claims, only when `stageModes` turns it on | `stageModes` | `response/brief.md` for the claims and the stated image intent | `response/artifacts/image.<name>`, `response/artifacts/prompt.<name>.txt`, @tools/imagegen | `IMAGE_UNAVAILABLE` |
| 6 | Implement every declared track | `implementationLanguages`, `commands` | `response/brief.md`, @worktrees/sessions/central-runtime where each build command runs | `response/artifacts/track.<language>.<extension>`, @tools/shell | `CODE_BUILD_FAILED` |
| 7 | Run the executable check, at most `maxE2eIterations` iterations | `maxE2eIterations` | @worktrees/sessions/central-runtime where each declared command runs | `response/data/e2e.json`, @tools/shell | `E2E_FAILED`, `CONTRACT_WEAKENED` |
| 8 | Await the review: pause, a fresh agent reads the artifacts without the producer's rationale, revise and reopen while rounds remain | `maxReviewRounds` | `review/response/review.md` once the exchange is done | `response/response.json` (waiting, awaiting review) | `REVIEW_REVISION_REQUIRED`, `REVIEW_ROUNDS_EXHAUSTED` |
| 9 | Write the receipt and emit | — | everything above | `response/response.md`, `response/response.json` | — |

Under the defaults the unit is one Vietnamese edition with no image, no track and no executable check,
and its quality rests entirely on step 8. A resume begins again at step 1, reuses only unchanged
fingerprinted observations, and consumes the exact delta; a revised brief arrives as a new
fingerprint, because the same fingerprint cannot yield a different answer. The receipt claims no
publication, no learner outcome in production, and no acceptance beyond the checks actually run.

## Outputs

| Kind | File | Type | Required |
| --- | --- | --- | --- |
| `content-generation-receipt` | `response/response.md` | md | yes |
| `content-brief` | `response/brief.md` | md | yes |
| `e2e` | `response/data/e2e.json` | data | no |
| `content-review` | `review/response/review.md` | md | yes |
| `article` | `response/artifacts/article.<language>.md` | artifact | yes |
| `image` | `response/artifacts/image.<name>` | artifact | no |
| `image-prompt` | `response/artifacts/prompt.<name>.txt` | artifact | no |
| `track` | `response/artifacts/track.<language>.<extension>` | artifact | no |

## Stops

| Code | Disposition |
| --- | --- |
| `INVALID_INPUT` | terminate |
| `SOURCE_DRIFT` | terminate |
| `NO_PROGRESS` | terminate |
| `BRIEF_UNBOUND` | terminate |
| `OUTCOME_UNCOVERED` | terminate |
| `IMAGE_UNAVAILABLE` | terminate |
| `CODE_BUILD_FAILED` | terminate |
| `E2E_FAILED` | terminate |
| `CONTRACT_WEAKENED` | terminate |
| `REVIEW_REVISION_REQUIRED` | fallback |
| `REVIEW_ROUNDS_EXHAUSTED` | terminate |

## Next

| When | Operator |
| --- | --- |
| the routed content object or the shared runtime does not answer at the frozen binding | `workspace.bind` |
```

## FILE: .claude/operators/content-generate/operator.json

SHA-256: 5e536bce522f35913d70b23be890655f74dd73db5b9c24e6f7f8d1f207fa088b

```json
{
  "schemaVersion": 9,
  "id": "content.generate",
  "domain": "content",
  "job": "Generate or refactor one educational content unit in one linear pass: a teacher brief that constrains everything after it, one written edition per declared language, images made to a stated claim, code and executable checks that actually run, and an independent critique that receives the artifact without the producer's rationale.",
  "package": "operator.md",
  "errors": "errors.json",
  "validator": "validate.mjs",
  "selfTest": "self-test.mjs",
  "resources": {
    "profile": "luna",
    "grammarBound": false,
    "tools": {
      "@tools/fileread": "context-aliases",
      "@tools/shell": "declared-commands",
      "@tools/websearch": "bounded",
      "@tools/imagegen": "required",
      "@tools/objectstorage": "read"
    }
  }
}
```

## FILE: .claude/operators/content-generate/errors.json

SHA-256: 4c2e987a083493f2a44b97d614e299fd1188271530cea9d4c9fd7d1268b2248c

```json
{
  "schemaVersion": 9,
  "note": "Stop codes only content.generate emits. Same entry shape as operators/errors.json, scope implicit. Shared codes (INVALID_INPUT, SOURCE_DRIFT, NO_PROGRESS) come from operators/errors.json. Every domain below is the one the old package's owningDomain enum published for this operator: content, curriculum, engineering, workspace, caller. routing.json answers content with a resume of this operator, and curriculum and engineering each with a person, which is not the same person as caller: the curriculum owner and the engineer who owns the generator are named separately on purpose.",
  "codes": {
    "BRIEF_UNBOUND": {
      "domain": "curriculum",
      "disposition": "terminate",
      "meaning": {
        "en": "The teacher brief cannot be frozen from the bound curriculum and source evidence.",
        "vi": "Không đóng băng được brief người dạy từ chương trình học và bằng chứng nguồn đã ràng."
      },
      "resume": {
        "en": "Supply the missing curriculum or source evidence.",
        "vi": "Bổ sung chương trình học hoặc bằng chứng nguồn còn thiếu."
      }
    },
    "OUTCOME_UNCOVERED": {
      "domain": "content",
      "disposition": "terminate",
      "meaning": {
        "en": "A declared language edition leaves a published learning outcome uncovered.",
        "vi": "Một bản viết đã khai bỏ trống một kết quả học tập đã công bố."
      },
      "resume": {
        "en": "Rewrite the edition, or narrow the brief.",
        "vi": "Viết lại bản đó, hoặc thu hẹp brief."
      }
    },
    "IMAGE_UNAVAILABLE": {
      "domain": "engineering",
      "disposition": "terminate",
      "meaning": {
        "en": "A required image cannot be generated to the brief's claims.",
        "vi": "Không sinh được hình ảnh bắt buộc theo các tuyên bố của brief."
      },
      "resume": {
        "en": "Provide a working generator, or turn the image stage off.",
        "vi": "Cấp một bộ sinh chạy được, hoặc tắt giai đoạn hình ảnh."
      }
    },
    "CODE_BUILD_FAILED": {
      "domain": "content",
      "disposition": "terminate",
      "meaning": {
        "en": "A declared implementation track does not build.",
        "vi": "Một track cài đặt đã khai không build được."
      },
      "resume": {
        "en": "Repair the track, then build it again.",
        "vi": "Sửa track đó, rồi build lại."
      }
    },
    "E2E_FAILED": {
      "domain": "content",
      "disposition": "terminate",
      "meaning": {
        "en": "A declared executable check still fails when maxE2eIterations is spent.",
        "vi": "Một phép kiểm chạy được đã khai vẫn hỏng khi đã tiêu hết maxE2eIterations."
      },
      "resume": {
        "en": "Repair the implementation, or approve more iterations.",
        "vi": "Sửa phần cài đặt, hoặc duyệt thêm số vòng."
      }
    },
    "CONTRACT_WEAKENED": {
      "domain": "content",
      "disposition": "terminate",
      "meaning": {
        "en": "The executable contract moved during the repair loop, so the proof measures nothing.",
        "vi": "Contract chạy được bị dời trong vòng lặp sửa, nên bằng chứng không đo được gì."
      },
      "resume": {
        "en": "Restore the contract and rerun without touching it.",
        "vi": "Khôi phục contract và chạy lại mà không đụng vào nó."
      }
    },
    "REVIEW_REVISION_REQUIRED": {
      "domain": "content",
      "disposition": "fallback",
      "meaning": {
        "en": "The independent review returned a revision.",
        "vi": "Phản biện độc lập trả về yêu cầu sửa."
      },
      "fallback": {
        "en": "Repair exactly the artifacts the review's findings name, by owning stage, record the round under ## Fallbacks taken, and reopen the review exchange for the next round.",
        "vi": "Sửa đúng những artifact mà các finding của phản biện nêu tên, theo giai đoạn chủ, ghi vòng đó dưới ## Fallbacks taken, rồi mở lại cuộc trao đổi phản biện cho vòng kế."
      },
      "resume": {
        "en": "Nothing is asked of anyone; the branch revises and reviews again until maxReviewRounds is spent.",
        "vi": "Không hỏi ai cả; nhánh tự sửa và phản biện lại cho tới khi hết maxReviewRounds."
      }
    },
    "REVIEW_ROUNDS_EXHAUSTED": {
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "maxReviewRounds is spent and the review still returns a revision.",
        "vi": "Đã tiêu hết maxReviewRounds mà phản biện vẫn trả về yêu cầu sửa."
      },
      "resume": {
        "en": "Approve more rounds, or narrow the unit.",
        "vi": "Duyệt thêm vòng, hoặc thu hẹp đơn vị."
      }
    }
  }
}
```

## FILE: .claude/operators/dependency-update/operator.md

SHA-256: 2c1c856f4af06533b55f839fb7aca1fe575cd7aed1abcacfd7672c23cf5a383f

```markdown
# dependency.update

## Job

Consume one verified package release by changing only its exact dependency metadata, then prove the
unchanged consumer regression and complete declared delivery gates before one session commit.

## Boundary

The plan pins the consumer base, package versions, exact consumer manifests and npm lockfile, the
published tarball URL and integrity, and a session artifact with the same digest. The selected base
may be a verified descendant of the canonical route head; it must belong to the same Git repository.
Only the named dependency value in existing dependencies may change. Lock changes are limited to
those manifest dependency entries and installed entries of that same package. Existing versions
used by other workspaces stay intact. No transitive dependency, script, option, UI, test, source or
presentation value is edited. Nothing is published, pushed, merged, tagged or served here.

Run install.mjs <branch> baseline before preflight and install.mjs <branch> release after the before proof. Both modes derive the exact consumer session cwd from the validated route and use fixed npm arguments; caller cwd and ad hoc install commands are not accepted. The release helper stops if npm changes unrelated metadata; restore only that unrelated churn before the next proof. test:ci receives COVERAGE_BASE_SHA from the frozen plan base and records it in its proof.

Run the preflight before writing. Run `run-proof.mjs <branch> before` against the original installed
version and existing failing regression. Install the verified release using install.mjs,
changing only the declared metadata. Run `after` and every declared gate with the helper.
The helper checks the installed package against every regular file in the digest-verified tarball;
an installed version label alone is insufficient. It captures raw command logs as artifacts and
records their hashes. The test code stays unchanged. Run all pinned complete test, lint, typecheck
and build gates available in the root manifest. A filtered regression never substitutes for them.
Commit exactly once, then validate the real commit, metadata delta, installation and proof hashes.

## Context

| Alias | Bind | Required |
| --- | --- | --- |
| `@workspaces/fe` | the verified consumer repository and its session worktree at the selected descendant base | yes |

## Inputs

| Kind | From | Required |
| --- | --- | --- |
| `route` | `workspace.bind`; canonical checkout identity, source head and exact write roots | yes |

## Requirements

| Field | Type | Default | Ask |
| --- | --- | --- | --- |
| `plan` | object | — | The closed dependency-plan schema, including release identity, selected consumer base, exact metadata paths, existing regression and complete gates |
| `resume` | token | null | The blocked branch token after a changed release or installation |

## Steps

| # | Step | Params | Reads | Writes | Stops with |
| --- | --- | --- | --- | --- | --- |
| 1 | Validate the request, session, ancestry and verified artifact before writing | `plan`, `resume` | `request/request.json`, input `route`, @workspaces/fe, @tools/git | — | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS`, `DEPENDENCY_BOUNDARY_REJECTED` |
| 2 | Install the baseline with install.mjs, then run the unchanged regression | `plan` | @workspaces/fe, @tools/shell | `dependency-proof`, `dependency-log` | `DEPENDENCY_PROOF_FAILED` |
| 3 | Install the verified package with install.mjs release within the exact metadata boundary | `plan` | @workspaces/fe and the verified release artifact, @tools/shell | @workspaces/fe/branch/session within the metadata ceiling, @tools/sourcewrite | `DEPENDENCY_BOUNDARY_REJECTED` |
| 4 | Verify installed bytes and run the regression and complete gates | `plan` | @workspaces/fe, @tools/shell | `dependency-proof`, `dependency-log` | `DEPENDENCY_PROOF_FAILED` |
| 5 | Commit once and verify the actual metadata delta and proof hashes | `plan` | @workspaces/fe, @tools/git | @workspaces/fe/branch/session, `dependency-update`, `changes`, `response/response.json` | `DEPENDENCY_BOUNDARY_REJECTED`, `DEPENDENCY_PROOF_FAILED` |

## Outputs

| Kind | File | Type | Required |
| --- | --- | --- | --- |
| `dependency-update` | `response/data/dependency.json` | data | yes |
| `dependency-proof` | `response/data/proofs/<phase>.json` | data | yes |
| `dependency-log` | `response/artifacts/proofs/<phase>.log` | artifact | yes |
| `changes` | `response/changes.md` | md | yes |

## Stops

| Code | Disposition |
| --- | --- |
| `INVALID_INPUT` | terminate |
| `SOURCE_DRIFT` | terminate |
| `NO_PROGRESS` | terminate |
| `DEPENDENCY_BOUNDARY_REJECTED` | terminate |
| `DEPENDENCY_PROOF_FAILED` | terminate |

## Next

| When | Operator |
| --- | --- |
| the metadata commit requires independent quality verification | `quality.verify` |
```

## FILE: .claude/operators/dependency-update/operator.json

SHA-256: 23c8969a77b88b6b057e8d65da992f07b7c3c28b4a55dd8fd0e7279728bf7efb

```json
{"schemaVersion":9,"id":"dependency.update","domain":"dependency","job":"Consume one verified package release through exact dependency metadata, proving the existing consumer regression and declared delivery gates.","package":"operator.md","errors":"errors.json","validator":"validate.mjs","selfTest":"self-test.mjs","resources":{"profile":"luna","grammarBound":false,"tools":{"@tools/fileread":"context-aliases","@tools/sourcewrite":"declared-write-set","@tools/git":"commit-session-branch","@tools/shell":"declared-commands"}}}
```

## FILE: .claude/operators/dependency-update/errors.json

SHA-256: 543c20fb88cc678675745d112c8e567a92bc4e65bc6bad92b14736c2f891a13d

```json
{"schemaVersion":9,"codes":{"DEPENDENCY_BOUNDARY_REJECTED":{"domain":"caller","disposition":"terminate","meaning":{"en":"The verified release, package identity or exact metadata boundary cannot be proved.","vi":"Không chứng minh được bản phát hành, danh tính package hoặc ranh giới metadata chính xác."},"resume":{"en":"Supply the verified artifact and a corrected metadata plan; source changes remain with their source owner.","vi":"Cung cấp artifact đã kiểm chứng và plan metadata đã sửa; thay đổi source vẫn thuộc owner source."}},"DEPENDENCY_PROOF_FAILED":{"domain":"self","disposition":"terminate","meaning":{"en":"The unchanged consumer regression or a required delivery gate lacks valid evidence at the installed dependency version.","vi":"Regression consumer không đổi hoặc gate bàn giao bắt buộc thiếu bằng chứng hợp lệ tại phiên bản dependency đã cài."},"resume":{"en":"Repair the owner release or installation, then repeat the unchanged consumer proof.","vi":"Sửa bản phát hành owner hoặc phần cài đặt rồi chạy lại nguyên proof consumer."}}}}
```

## FILE: .claude/operators/frontend-direction-decide/operator.md

SHA-256: ce2afda1262b15cae29782266da4cb4d4e60dd6fb63428a6f7818a677d040834

```markdown
# frontend.direction.decide

## Job

Decide one evidence-backed, implementation-ready frontend direction for one authorized target, and
prove it against the business promise, the published Grammar, the observed implementation and a
falsification pass that no candidate survives by taste.

## The change level decides what must be bound

The change level is the request's own authority and current source never proves it: an audit that
asks for a passing surface is `reconstruct`, not `refine`. `new` requires the business promise, and
it closes the state set and the exits before anything is drawn. `reconstruct` requires the promise
only when the state set changes, and it preserves the business facts, the behaviour authority and
the API semantics it inherits. `refine` requires no input authority at all, because it changes
nothing a promise could contradict. A backend implementation is required when a data contract
changes, an architecture decision when a boundary changes; neither is required otherwise, and
neither is ever invented. `create` occurs with `new` and only with it.

## Evidence contradicts, it does not authorize

The current implementation, a green test, a rendered DOM and a prior UAT pass are all evidence, and
each observation is recorded as a path at the head it was read at. Evidence must be observed before
any proposal is written: the target's direct artifacts without the producer's rationale, or, for a
new target, proof that the target is absent and only the authorized host and product-family context.
None of it authorizes a direction by incumbency. A page that exists is not a reason to build that
page again.

## Bounded research, and only where it is owed

External references are resolved only when the person supplied none and the change level is `new` or
`reconstruct`. A `refine` works from the family idioms alone. Every reference that survives is
recorded with its URL and with the exact limitation it carries; nothing copies a page, a brand, a
palette or a component anatomy. When bounded research cannot close the business or interaction
question the decision rests on, the run stops with the owning gap.

## A reference is named by class, not by adjective

`## References` is where the direction states which standard the surface is aiming at, and it names
it the way a reader would sort it: a class such as `console-grid` or `plan-comparison`, never an
adjective such as modern, clean or premium, because an adjective cannot be compared with a capture.
Each row also records what is borrowed — a composition decision, an ordering, a density — which is
what keeps the borrowing honest, since nothing copies a brand, a palette or a component anatomy. A
`new` or `reconstruct` direction carries at least one such row; a `refine` carries none, because the
structure it moves elements inside was already approved. This is what the later audit reads: the
taste lens sorts the capture beside the named standards, and a direction that named none falsifies
that lens before a single pixel is measured. A run that reaches the decision with no reference row is
not the caller's defect and never becomes `INVALID_INPUT`: it is this operator's own, so it stops
with `REFERENCE_MISSING`, which routes to `self` and is answered by naming the standards and running
the same direction again.

## The Grammar filter refuses invention, not ownership

A candidate that invents a missing shared interface, bypasses the owner ceiling, imitates unpublished
Grammar locally or contradicts a published composition is rejected. `GRAMMAR_REQUIRED` is only for a
missing family component, and it goes to a person who publishes it; the operator never composes a
substitute out of parts. A node the application legitimately owns, a canvas for instance, is not a
Grammar gap and never raises one.

## Candidates are falsified before they are chosen

Falsification attacks business and backend conformance, hierarchy, content density, action feedback,
recovery, responsive reflow, content stress, keyboard and focus behaviour, accessibility, family
coherence, reversibility and owner leakage, and every attack lands in the receipt with its verdict.
A direction is invalid while an applicable business contradiction, owner leak, Grammar invention,
responsive failure, accessibility failure, unresolved adverse state or materially stronger reversible
alternative remains. Under `refine` the candidates are element-level moves inside the approved
structure, never a new structure. When the only candidate fails an attack the run stops with
`NO_VIABLE_DIRECTION`; when several survive they are scored and ranked, and `DIRECTION_CHOICE_REQUIRED`
follows the selection policy and [interaction policy](../../resources/interaction.md).

## Rank evidence and preserve the user's choice

Material tier or direction alternatives use `approval-required`; internal comparisons inside an
already selected direction use `automatic`. Scores support a recommendation and never substitute
for the user's selection between the offered directions. When more than one candidate is
rendered, step 11 scores every rendered candidate at every viewport it was printed at against the
criteria of `@knowledge/ui/proof` that a still render answers — the taste lens whole, scored the way
`TASTE-13` Case 1 scores it, and any experience criterion whose rule names the capture as its
instrument — and records every score under `## Scores`, beside the printed candidates. A score is a
claim about the candidate it is scored for, and a claim that contradicts the candidate is a defect of
the decision, not a matter of judgement: when a candidate's own description declares, under
`## Candidate limits`, that it does not satisfy a criterion, that pairing is refused at the passing
end wherever `## Scores` carries it, and a declared limit that names no matching row in `## Scores`
is refused as well, because a limit nobody scored constrains nothing. A candidate is
dominant when its mean is the highest and it scores no lower than every other candidate, at the same
viewport, on every criterion any candidate failed in that scoring. A dominant candidate is selected
under `automatic`. When no candidate dominates, the automatic fallback breaks the tie and records
it. Under `approval-required`, the run stops with `DIRECTION_CHOICE_REQUIRED` until the user selects,
even when one candidate scores higher. A decision over several rendered candidates still carries
the full scores and declared limits.

## Boundary

Context is read-only. The operator writes only `response/` of its own branch: the decision receipt,
the coverage enumeration, the rendered candidate pages and `response.json`. It does not modify
product or authority source, invent business, backend, architecture, authentication, persistence or
data behaviour, publish shared UI Grammar, start or reconfigure runtime services, or claim that an
implementation, a visual quality gate or a UAT run has passed.

## Images are judged, not requested

An image is a composition decision like any other: when a candidate leaves a region that reads empty
(a hero without a subject, an empty state with only a sentence, a card row whose copy cannot carry the
width), the operator adds an image made to one stated claim of the direction (`@tools/imagegen`) and
records why, in the `## Images` table. It does not wait for a person to ask, and it does not decorate: a region that the
copy and the Grammar objects already carry gets no image, and an image never encodes a claim the
business promise did not make. The asset and its prompt land under `response/artifacts/images/`;
`frontend.source.apply` writes them with the declared write set.

## Context

| Alias | Bind | Required |
| --- | --- | --- |
| `@grammar/core` | the published Grammar as the bound app resolves it; the compositions a direction may bind | yes |
| `@knowledge/ui/composition` | the assertions the emitted receipt has to satisfy, `COVERAGE-1` being the assertion about the receipt as a whole | yes |
| `@workspaces/fe` | the routed frontend checkout read at the frozen head; the current implementation as evidence, never as the requested direction | yes |
| `@knowledge/grammars/<family>` | how the family the bound route names (`context.grammarId`) is meant to realize Common; law about the Grammar, never the Grammar itself | no |
| `@knowledge/ui/proof` | the criteria every rendered candidate is scored against before one is picked; the same rubric the later audit measures, read only when more than one candidate is rendered | no |
| `@worktrees/uat/<flow>/<case>` | prior behaviour, UX and UI observations with their captures; evidence and counterevidence, and a prior pass is not current authority | no |

## Inputs

| Kind | From | Required |
| --- | --- | --- |
| `business-promise-authority` | `business.decide`; required by `new`, and by `reconstruct` when the state set changes | no |
| `backend-source-application` | `backend.source.apply`; required when a data contract changes | no |
| `architecture-decision` | `architecture.decide`; required when a boundary changes | no |
| `frontend-direction-decision` | a prior run of `frontend.direction.decide` on the same target, read when resuming | no |

## Requirements

| Field | Type | Default | Ask |
| --- | --- | --- | --- |
| `target` | id | — | The one route, page, layout, modal, drawer, flow, block or component this direction is for |
| `intent` | choice | modify | create, modify, audit-repair or reconcile; `create` occurs with change level `new` and only with it |
| `changeLevel` | choice | — | new, reconstruct or refine; an audit that must end in a passing surface is reconstruct |
| `ownerCeiling` | choice | surface-and-nested-layouts | surface-only, surface-and-nested-layouts or ancestor-layouts-authorized |
| `candidates` | number 1–3 | 1 | How many directions to form; more than one only when a comparison is wanted |
| `preview` | choice | no | yes renders the single candidate as an inspectable page |
| `references` | list | [] | External references the person supplies; bounded research runs only when this is empty |
| `selectionPolicy` | choice | automatic | `automatic` for internal comparisons within a selected direction; `approval-required` for material tier/direction alternatives under the interaction policy |
| `approval` | id | null | The candidate actually selected by the user; required under `approval-required` and reused on continuation |
| `resume` | token | null | The blocked branch's token when re-entering after a stop |

## Steps

| # | Step | Params | Reads | Writes | Stops with |
| --- | --- | --- | --- | --- | --- |
| 1 | Validate the gate and resume | `resume`, `approval` | `request/request.json`, input `frontend-direction-decision` when resuming, @workspaces/fe at the frozen head | — | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS` |
| 2 | Check the request: route, scope, change level, owner ceiling | `target`, `intent`, `changeLevel`, `ownerCeiling` | @workspaces/fe at the frozen head, @tools/git | — | `ROUTE_UNVERIFIED`, `SCOPE_UNFROZEN`, `CHANGE_LEVEL_AMBIGUOUS`, `OWNER_CEILING_INVALID` |
| 3 | Bind the inputs the change level requires | `changeLevel` | inputs `business-promise-authority`, `backend-source-application` and `architecture-decision` | — | `BUSINESS_REQUIRED`, `BACKEND_REQUIRED`, `ARCHITECTURE_REQUIRED` |
| 4 | Observe the existing context | — | @workspaces/fe (the target's direct artifacts, or the authorized host and product family when the target is absent), @worktrees/uat/<flow>/<case> when present | — | `EVIDENCE_MISSING` |
| 5 | Compile one UI contract and its coverage, and declare the surface class | — | @knowledge/ui/composition (`COVERAGE-1` Case 7 publishes the class vocabulary), input `business-promise-authority` when present, the observed context | `response/data/coverage.json` | `SCOPE_UNFROZEN` |
| 6 | Resolve the reference standards by class, bounded | `references`, `changeLevel` | @knowledge/ui/composition (the gap the research must close), @tools/websearch | — | `REFERENCE_EVIDENCE_EXHAUSTED`, `REFERENCE_MISSING` |
| 7 | Form the candidates | `candidates` | the compiled UI contract | — | `NO_VIABLE_DIRECTION` |
| 8 | Apply the Grammar filter | `ownerCeiling` | @grammar/core (what a component owns and which props exist), @knowledge/grammars/<family> | — | `GRAMMAR_REQUIRED` |
| 9 | Render the decision evidence and the judged images, serve them for a person and print them | `candidates`, `preview` | the surviving candidates, @knowledge/grammars/<family> | `candidates`, `direction-image`, `host` | — |
| 10 | Falsify | — | the candidates, inputs `business-promise-authority` and `backend-source-application`, `response/data/coverage.json` | — | `NO_VIABLE_DIRECTION` |
| 11 | Score the rendered candidates and decide | `selectionPolicy`, `approval` | the falsification table, @knowledge/ui/proof (the criteria a still render answers, per printed viewport) | — | `DIRECTION_CHOICE_REQUIRED` |
| 12 | Emit | — | everything above | `response/response.md`, `response/response.json` | — |

Step 5 also settles which kind of surface this is. `COVERAGE-1` Case 7 publishes the vocabulary, the
coverage carries the name in `surfaceClass`, and the receipt says the same name under
`## Surface class` with what puts the surface in that class. The two must agree, because the name
is what every banded proof rule later reads its threshold from: the audit takes the class from this
decision and never chooses one of its own, so a direction that names none leaves the audit with no
band and stops it. Every change level declares one; a refine inherits nothing and states it again.

Step 6 leaves the receipt with the standards this surface is aiming at, each named by class, each
carrying what is borrowed and what it does not settle. Under `new` and `reconstruct` that table has
at least one row and step 6 stops with `REFERENCE_MISSING` when it cannot produce one; under
`refine` it stays empty. Step 9 renders before step 11 writes the decision, because a structure nobody has seen cannot be
approved and a candidate described in prose is not a candidate anybody can judge. Under `new` and
`reconstruct` every candidate the run forms is rendered as its own page, whatever `preview` says and
however many there are: that is `@tools/visualize`, needs no grant, and every runtime does it.

The candidate pages are not files a person is asked to find. Step 9 serves the artifacts folder over
`@tools/host` (the tool the registry ships, never a server written for the occasion) on the loopback interface, at the first free port of the registry's range, and records
the URL, the port, the folder and the pid in `response/artifacts/host.json`; the server stops when the
branch ends or is resumed. Each candidate is served once per viewport of the coverage — one page per
viewport, or one page taking the viewport as a query string — so the person sees the wide and the
narrow render before deciding, which is the first of the two places responsiveness is looked at.

Serving is not telling. Before step 11 writes the decision, step 9 prints over `@tools/print` every
candidate's URL and one capture per viewport into the conversation the person is reading, and the
receipt lists each printed artifact under `## Printed` with why it was printed. A candidate served at
a port nobody was told about is a candidate nobody saw, and a decision taken over one is taken alone.

The same table carries the rendered tier choice. Under `approval-required`, emit the typed
`interaction` defined by [the interaction policy](../../resources/interaction.md), one served
candidate per option and a capture per viewport. The stop's `reason` names the sheet URL and asks
one selection question. Never add a rejected direction just to fill the option count. A choice the person takes from that sheet
closes what the sheet showed: a criterion `## Scores` showed failing for the candidate the person
approved is settled for this session, and the later audit records it as person-accepted, naming this
branch, instead of routing it back (`TASTE-13` Case 7) — the rubric never overturns a decision the
person took on its own evidence. Operational stop reasons describe the owning limitation and carry
no tier question; they remain subject to existing authority and the interaction policy.

Under
`refine` the page stays optional — the structure was approved before this run began — and is rendered
only when more than one candidate was formed or `preview` is yes; a single refine candidate under the
defaults produces no page and rests on step 10. Under `automatic`, a dominant candidate is selected
and a tie takes the recorded fallback; `approval-required` stops with
`DIRECTION_CHOICE_REQUIRED` until the person returns with `approval`. The receipt
authorizes the next domain to resolve and implement inside the frozen owner ceiling and proves
nothing about how the result renders.

## Outputs

| Kind | File | Type | Required |
| --- | --- | --- | --- |
| `frontend-direction-decision` | `response/response.md` | md | yes |
| `ui-coverage` | `response/data/coverage.json` | data | yes |
| `candidates` | `response/artifacts/<candidateId>.html` | artifact | no |
| `direction-image` | `response/artifacts/images/<slot>.png` | artifact | no |
| `host` | `response/artifacts/host.json` | artifact | no |

## Stops

| Code | Disposition |
| --- | --- |
| `INVALID_INPUT` | terminate |
| `ROUTE_UNVERIFIED` | terminate |
| `SOURCE_DRIFT` | terminate |
| `SCOPE_UNFROZEN` | terminate |
| `CHANGE_LEVEL_AMBIGUOUS` | terminate |
| `OWNER_CEILING_INVALID` | terminate |
| `BUSINESS_REQUIRED` | terminate |
| `BACKEND_REQUIRED` | terminate |
| `ARCHITECTURE_REQUIRED` | terminate |
| `GRAMMAR_REQUIRED` | terminate |
| `EVIDENCE_MISSING` | terminate |
| `REFERENCE_EVIDENCE_EXHAUSTED` | terminate |
| `REFERENCE_MISSING` | terminate |
| `NO_VIABLE_DIRECTION` | terminate |
| `DIRECTION_CHOICE_REQUIRED` | fallback |
| `NO_PROGRESS` | terminate |

## Next

| When | Operator |
| --- | --- |
| the direction is decided; every direction resolves its presentation values before any source is written | `frontend.presentation.resolve` |
| a family component the direction needs is unpublished, so a person publishes it and the same direction runs again | `frontend.direction.decide` |
```

## FILE: .claude/operators/frontend-direction-decide/operator.json

SHA-256: bf2803dfe0749aaa8fbdf7b5860533bac816811c5cc11dc3477d10009684a376

```json
{
  "schemaVersion": 9,
  "id": "frontend.direction.decide",
  "domain": "frontend",
  "job": "Decide one evidence-backed, implementation-ready frontend direction for one authorized target, and prove it against the business promise, the published Grammar, the observed implementation and a falsification pass that no candidate survives by taste.",
  "package": "operator.md",
  "errors": "errors.json",
  "validator": "validate.mjs",
  "selfTest": "self-test.mjs",
  "resources": {
    "profile": "sol-fresh",
    "grammarBound": true,
    "tools": {
      "@tools/fileread": "context-aliases",
      "@tools/git": "read",
      "@tools/websearch": "bounded",
      "@tools/imagegen": "judged",
      "@tools/visualize": "html",
      "@tools/host": "loopback",
      "@tools/print": "decision-points"
    }
  }
}
```

## FILE: .claude/operators/frontend-direction-decide/errors.json

SHA-256: 513b85ef2398664bc0bead7b178f7ca28e60660aa9ac9eb1c0ece7886f791a2f

```json
{
  "schemaVersion": 9,
  "note": "Stop codes frontend.direction.decide emits. Same entry shape as operators/errors.json, scope implicit. Shared codes (INVALID_INPUT, SOURCE_DRIFT, NO_PROGRESS, EVIDENCE_MISSING) come from operators/errors.json.",
  "codes": {
    "SCOPE_UNFROZEN": {
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "The target or the boundary of the surface is incomplete, so the UI contract cannot be closed.",
        "vi": "Target hay ranh giới của bề mặt còn thiếu, nên không đóng được UI contract."
      },
      "resume": {
        "en": "Freeze the scope.",
        "vi": "Đóng băng scope."
      }
    },
    "CHANGE_LEVEL_AMBIGUOUS": {
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "The authority for new, reconstruct or refine is unresolved or contradicts the intent.",
        "vi": "Thẩm quyền cho new, reconstruct hay refine chưa rõ hoặc chỏi với intent."
      },
      "resume": {
        "en": "State the exact change level.",
        "vi": "Nêu đúng change level."
      }
    },
    "OWNER_CEILING_INVALID": {
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "The direction needs an owner the declared ceiling does not authorize.",
        "vi": "Hướng cần một owner mà trần đã khai không uỷ quyền."
      },
      "resume": {
        "en": "Correct the owner ceiling.",
        "vi": "Sửa trần owner."
      }
    },
    "BUSINESS_REQUIRED": {
      "domain": "business",
      "disposition": "terminate",
      "meaning": {
        "en": "An actor, promise, permission, adverse outcome or recovery truth the change level requires is unresolved.",
        "vi": "Một actor, lời hứa, quyền, kết cục bất lợi hay đường phục hồi mà change level đòi vẫn chưa được giải quyết."
      },
      "resume": {
        "en": "Run business.decide first.",
        "vi": "Chạy business.decide trước."
      }
    },
    "BACKEND_REQUIRED": {
      "domain": "backend",
      "disposition": "terminate",
      "meaning": {
        "en": "The direction changes a data contract nobody delivered.",
        "vi": "Hướng làm đổi một contract dữ liệu chưa ai giao."
      },
      "resume": {
        "en": "Run backend.source.apply first.",
        "vi": "Chạy backend.source.apply trước."
      }
    },
    "ARCHITECTURE_REQUIRED": {
      "domain": "architecture",
      "disposition": "terminate",
      "meaning": {
        "en": "The direction changes a system or data boundary nobody decided.",
        "vi": "Hướng làm đổi một ranh giới hệ thống hay dữ liệu chưa ai quyết."
      },
      "resume": {
        "en": "Run architecture.decide first.",
        "vi": "Chạy architecture.decide trước."
      }
    },
    "GRAMMAR_REQUIRED": {
      "domain": "grammar",
      "disposition": "terminate",
      "meaning": {
        "en": "A family component the direction needs is unpublished; a composite is never assembled in its place.",
        "vi": "Một component của họ mà hướng cần chưa được publish; không bao giờ được ghép tạm một cái thay thế."
      },
      "resume": {
        "en": "A person publishes the component, and the same direction runs again.",
        "vi": "Người publish component đó, rồi chính hướng ấy chạy lại."
      }
    },
    "REFERENCE_EVIDENCE_EXHAUSTED": {
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "Bounded research cannot close the business or interaction question the decision rests on.",
        "vi": "Nghiên cứu có giới hạn không lấp được câu hỏi nghiệp vụ hay tương tác mà quyết định dựa vào."
      },
      "resume": {
        "en": "Supply the owning authority or a materially new reference.",
        "vi": "Cấp thẩm quyền có chủ hoặc một tham chiếu mới về bản chất."
      }
    },
    "REFERENCE_MISSING": {
      "domain": "self",
      "disposition": "terminate",
      "meaning": {
        "en": "A new or reconstruct direction named no reference standard, so the class the surface is aiming at is unstated and the taste lens cannot judge whether it landed there.",
        "vi": "Một hướng new hay reconstruct không nêu chuẩn tham chiếu nào, nên lớp mà bề mặt nhắm tới bị bỏ trống và lens thẩm mỹ không phán được nó có tới đó không."
      },
      "resume": {
        "en": "Name at least one standard by class, with what is borrowed from it, and run the same direction again.",
        "vi": "Nêu ít nhất một chuẩn theo lớp, kèm thứ được mượn từ nó, rồi chạy lại chính hướng ấy."
      }
    },
    "NO_VIABLE_DIRECTION": {
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "Every candidate contradicts authority or fails a mandatory attack.",
        "vi": "Mọi phương án đều chỏi thẩm quyền hoặc chết dưới một đòn tấn công bắt buộc."
      },
      "resume": {
        "en": "Change the authority or the constraints; cosmetic variants are not a delta.",
        "vi": "Đổi thẩm quyền hoặc ràng buộc; biến thể bề ngoài không phải delta."
      }
    },
    "DIRECTION_CHOICE_REQUIRED": {
      "domain": "caller",
      "disposition": "fallback",
      "meaning": {
        "en": "Under automatic, several candidates survive and the scores prove none dominant. Under approval-required, material tier or direction alternatives await the user's choice; scores inform the recommendation, not the selection.",
        "vi": "Dưới automatic, nhiều phương án sống sót và bảng điểm không cho thấy phương án trội. Dưới approval-required, các tier hoặc hướng khác nhau về bản chất chờ người dùng chọn; điểm hỗ trợ đề xuất, không thay lựa chọn."
      },
      "fallback": {
        "en": "Among the tied top scorers, select the candidate that introduces the fewest new nodes; the scores stay under ## Scores and the pick under ## Decision.",
        "vi": "Trong các phương án hoà điểm dẫn đầu, chọn phương án thêm ít node mới nhất; bảng điểm giữ dưới ## Scores và lựa chọn ghi dưới ## Decision."
      },
      "unless": {
        "param": "selectionPolicy",
        "equals": "approval-required",
        "then": "terminate"
      },
      "resume": {
        "en": "The person supplies approval naming one candidate.",
        "vi": "Người nhập approval gọi tên một phương án."
      }
    }
  }
}
```

## FILE: .claude/operators/frontend-presentation-resolve/operator.md

SHA-256: 7fa29be07466ed186f3a2c9e36fd1a0934fb8029cae766e466ecbf47beb16fb8

```markdown
# frontend.presentation.resolve

## Job

Resolve every application-owned presentation property on one already-composed tree to exactly one
published rule, emit its class and its verifiable contract claim, and stop at the smallest owning gap
instead of inventing a value.

## Structure arrives decided

Structure, element order, Grammar component selection, copy, data and behaviour arrive decided, and
so does the owner ceiling: it is carried by the direction this branch resolves, never re-declared
here. This operator only answers, for each node the application owns, which value each presentation
property takes and which rule authorizes it. It changes nothing about what the tree renders.

## No fabricated rule

A rule exists only if the bound knowledge topic publishes its identifier, and that inventory is
frozen for the whole run. An emitted identifier absent from the inventory is `UNKNOWN_RULE`. A class
that contradicts its identifier is rejected: the rule number is an ordinal on the value scale, so
`GAP-5` renders `gap-6` and `PADDING-5` renders `p-6`, and writing the ordinal as the step is the
defect this check exists to catch. When no published case matches the observed condition the run
stops with `RULE_MISSING` naming that node; it does not choose a nearby value, round to the closest
step, or copy a neighbouring node. The operator never edits knowledge: a missing case goes back to
the knowledge owner, and the same tree is resolved again once the case is published.

## Grammar is read as published, and consulted first

The owned relationships come from the published package's own data-contract claims, never from
Grammar source. A property a component already owns resolves to that component, emits no application
class, and names the rule the component satisfies; that ordering makes reimplementation impossible
rather than merely discouraged. An application class that reimplements an owned relationship,
overrides Grammar anatomy or sits off the closed scale is removed with its own row, per node and
never silently.

## The scope is every folder the write set touches

The tree the direction names is the surface, not the boundary. A page reaches its final appearance
through the leaves and branches it composes, so a leaf that repaints a control, or a branch that
rebuilds a shell band, changes the same surface the page does and is resolved in the same pass. The
scope is therefore every leaf and branch folder the application owns that the declared write set
touches — `packages/ui/**` and `src/components/{leaves,branches}/**` as much as
`src/components/{pages,blocks}/**` — and not only the target surface's own tree. A folder the write
set does not touch is out of scope, because resolving it would widen a change nobody asked for; a
folder the write set does touch is in scope even when the direction never named it, because the
alternative is a resolved page sitting on an unresolved leaf.

## A Grammar object's className is never a resolution target

There is one thing this operator may not resolve, however the tree presents it: a `className` on a
Grammar object. Presentation may not "add padding, typography or paint inside `Card`, `Input`,
`Button` or another Grammar object", so the class is not a property awaiting a value — it is a reach
through an anatomy the family owns. It is removed at step 7 and recorded under `## Removed`, with
`overrides Grammar anatomy` when it repaints anatomy, or with `refused by <RULE> Case <n>` naming the
case that answered no. When the relationship the class was reaching for is real and the component
publishes no prop for it, the removal is joined by a `## Gaps` row and the family owner gets the
question. What never happens is a rule being selected for it: choosing a value would legitimise the
reach and hand the node two owners for one property.

## A forbidden class is removed, not ruled

When the only case that names an application class states a condition the node does not meet (an
accent foreground that `SURFACE-4` allows solely inside a raised band, written on an unraised row),
the property is not missing a rule: the rule has answered, and the answer is no. The class is removed
in the removal step, the property falls back to what the node inherits, and the removal is recorded
with the case that refused it. `RULE_MISSING` is reserved for a property no published case addresses
at all.

## A missing public path is a gap, not a stop

When Common exposes no public path for a relationship the application legitimately needs, the node
keeps its application class and the branch records a row under `## Gaps` naming the node, the
property and the missing path. The branch does not stop: a recorded workaround is visible to the
family owner and to the next audit, while a stop here would only trade one silent value for a
blocked chain.

## The contract is a claim, not a verdict

Every application-owned node publishes the identifiers it claims. `data-contract` records which
rules a node claims to satisfy and never asserts that the node passes; the claim exists so a later
audit can contradict it, and one rule stays selectable as `[data-contract~="GAP-4"]`. With emission
off the tree carries nothing and the receipt alone holds the claims.

## The loop is counted

An audit that sends its findings back here starts another round, and a round that repeats itself is
not progress. The number of audit receipts this session has fed back is counted at the gate, and a
run beyond `maxRounds` stops with `NO_PROGRESS` rather than resolving the same tree a third time.

## Boundary

Context is read-only. The operator writes only `response/` of its own branch: the resolution receipt,
the inventory and the resolved tree. It does not change DOM structure, element order, Grammar
component selection, copy or behaviour, write a class for a property a Grammar component already
owns, reach into Grammar anatomy with a selector or a passed class, edit knowledge, publish Grammar,
write product source, or record a verdict, score or pass claim on any node.

## Context

| Alias | Bind | Required |
| --- | --- | --- |
| `@knowledge/ui/presentation` | the closed rule inventory read at its fingerprint; the only source of valid identifiers | yes |
| `@grammar/core` | the published package's owned relationships, read as published and never from Grammar source | yes |
| `@workspaces/fe` | the routed checkout the composed tree belongs to, read at the frozen head | yes |

## Inputs

| Kind | From | Required |
| --- | --- | --- |
| `frontend-direction-decision` | `frontend.direction.decide`, the intent and the owner ceiling this resolution works inside; never a source of presentation values | yes |
| `frontend-surface-audit` | `frontend.surface.audit`, the findings that opened this round; present only when this is a loop | no |

## Requirements

| Field | Type | Default | Ask |
| --- | --- | --- | --- |
| `maxRounds` | number | 2 | How many audit-to-resolve rounds this surface may take before the loop is called off |
| `contractEmission` | choice | on | `on` writes the claim token list onto the tree, `off` leaves the receipt as the record |
| `resume` | token | null | The blocked branch's token when re-entering after a stop |

## Steps

| # | Step | Params | Reads | Writes | Stops with |
| --- | --- | --- | --- | --- | --- |
| 1 | Validate the gate and resume, and count the audit rounds | `resume`, `maxRounds` | `request/request.json`, input `frontend-surface-audit` when this is a loop, @workspaces/fe at the frozen head | — | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS` |
| 2 | Bind the authority | — | @knowledge/ui/presentation (every topic with its fingerprint and rule inventory), @grammar/core (the published package's owned relationships), @workspaces/fe (the routed head and the frozen tree), input `frontend-direction-decision`, @tools/git, @tools/registry | — | `KNOWLEDGE_UNBOUND`, `GRAMMAR_UNPUBLISHED` |
| 3 | Walk the tree once under the owner ceiling the direction carries | — | @workspaces/fe (the frozen tree, in document order), input `frontend-direction-decision` | — | `OWNER_CONFLICT` |
| 4 | Determine the owner of every present property | — | @grammar/core (the owned relationships), @workspaces/fe (the properties the node presently carries) | `response/data/inventory.json` | — |
| 5 | Select one presentation rule per remaining application-owned property | — | @knowledge/ui/presentation (the cases the bound topic publishes) | — | `RULE_MISSING` |
| 6 | Classify a missing public path as a Grammar gap | — | @grammar/core (the relationship under question), @knowledge/ui/presentation (the capability-gap marking) | — | — |
| 7 | Remove what the tree should not carry | — | @workspaces/fe (the application classes on the node), @grammar/core (Grammar anatomy and the closed scale) | — | — |
| 8 | Emit the contract claims onto the application-owned nodes | `contractEmission` | @knowledge/ui/presentation (the frozen rule inventory) | — | `UNKNOWN_RULE` |
| 9 | Emit | — | everything above | `response/artifacts/<target>.resolved.tsx`, `response/data/inventory.json`, `response/response.md`, `response/response.json` | — |

Step 8 claims only what a node can carry: a property the application owns on a Grammar component's
`className` carries no attribute, because the component forwards `className` and publishes no prop for
the relationship, so its rule is recorded under `## Gaps` instead of being emitted. Forwarding
`data-contract` from every Common component that accepts `className` is a Grammar change and belongs
to the family owner, not to this operator.

The walk visits every node in document order and records a stable node path; a node outside the
ceiling the direction carries is observed and never mutated. Steps 4 to 8 run per node, so a single
tree yields one decision per node and property. The receipt authorizes a later audit to measure the
rendered result against the claims; it proves nothing about how the tree renders.

## Outputs

| Kind | File | Type | Required |
| --- | --- | --- | --- |
| `frontend-presentation-resolution` | `response/response.md` | md | yes |
| `inventory` | `response/data/inventory.json` | data | yes |
| `resolved-tree` | `response/artifacts/<target>.resolved.tsx` | artifact | yes |

## Stops

| Code | Disposition |
| --- | --- |
| `INVALID_INPUT` | terminate |
| `SOURCE_DRIFT` | terminate |
| `OWNER_CONFLICT` | terminate |
| `KNOWLEDGE_UNBOUND` | terminate |
| `UNKNOWN_RULE` | terminate |
| `RULE_MISSING` | terminate |
| `GRAMMAR_UNPUBLISHED` | terminate |
| `NO_PROGRESS` | terminate |

## Next

| When | Operator |
| --- | --- |
| the tree is resolved and its values must be written into product source | `frontend.source.apply` |
| a gap needs a family component before the next round, so a person publishes it and the same tree is resolved again | `frontend.presentation.resolve` |
```

## FILE: .claude/operators/frontend-presentation-resolve/operator.json

SHA-256: d002646a75c7f14aeef61ccef2a693fc013cd83de3fc17b596585bfc5ec9fd9a

```json
{
  "schemaVersion": 9,
  "id": "frontend.presentation.resolve",
  "domain": "frontend",
  "job": "Resolve every application-owned presentation property on one already-composed tree to exactly one published rule, emit its class and verifiable contract claim, and stop at the smallest owning gap instead of inventing a value.",
  "package": "operator.md",
  "errors": "errors.json",
  "validator": "validate.mjs",
  "selfTest": "self-test.mjs",
  "resources": {
    "profile": "luna",
    "grammarBound": true,
    "tools": {
      "@tools/fileread": "context-aliases",
      "@tools/git": "read",
      "@tools/registry": "read"
    }
  }
}
```

## FILE: .claude/operators/frontend-presentation-resolve/errors.json

SHA-256: e7691fa27de13045abfc7ddbdb287db27d5623cb8771339b636a13dd0c987b89

```json
{
  "schemaVersion": 9,
  "note": "Stop codes frontend.presentation.resolve emits. Same entry shape as operators/errors.json, scope implicit. Shared codes (INVALID_INPUT, SOURCE_DRIFT, NO_PROGRESS) come from operators/errors.json. OWNER_CONFLICT and UNKNOWN_RULE are defined here and also emitted by frontend.source.apply and frontend.surface.audit; they belong in operators/errors.json with a scope list.",
  "codes": {
    "KNOWLEDGE_UNBOUND": {
      "domain": "knowledge",
      "disposition": "terminate",
      "meaning": {
        "en": "A presentation property is present in the tree and no knowledge topic is bound for it.",
        "vi": "Một thuộc tính trình bày có trong cây mà không topic kiến thức nào được bind cho nó."
      },
      "resume": {
        "en": "Bind the missing topic.",
        "vi": "Bind topic còn thiếu."
      }
    },
    "RULE_MISSING": {
      "domain": "knowledge",
      "disposition": "terminate",
      "meaning": {
        "en": "No published case matches the observed condition on a node.",
        "vi": "Không case nào đã publish khớp điều kiện quan sát được trên một node."
      },
      "resume": {
        "en": "The knowledge owner publishes the case, and the tree is resolved again.",
        "vi": "Chủ knowledge publish case, rồi cây được resolve lại."
      }
    },
    "GRAMMAR_UNPUBLISHED": {
      "domain": "grammar",
      "disposition": "terminate",
      "meaning": {
        "en": "The Grammar package is unpublished or the bound fingerprint is stale.",
        "vi": "Gói Grammar chưa publish hoặc fingerprint đã bind là cũ."
      },
      "resume": {
        "en": "A person publishes the exact Grammar package.",
        "vi": "Người publish đúng gói Grammar."
      }
    }
  }
}
```

## FILE: .claude/operators/frontend-source-apply/operator.md

SHA-256: 9d4a2a641bbb2712a86c1200567997d0e266fa739f7df715f5874741645e3110

```markdown
# frontend.source.apply

## Job

Write one already-resolved tree into product source on the session branch, inside a frozen owner
ceiling and a declared file set, emitting only values the bound resolution already contains, and
account for every byte that entered the repository in one commit.

## The single writer

This is the only operator in the frontend pipeline that writes product source. Direction decides what
to build and writes nothing; resolution decides every value and writes only its own artifact; the
audit observes and writes nothing. One writer exists so that one receipt can account for every byte
that entered the repository, which is impossible when three operators each write a little. Because it
is the only writer, it is also the only place a fabricated value could enter source, and it has no way
to produce one.

## Nothing is written outside a session

Before a single byte of routed source is read for change or written, the branch this operator runs in
exists: a session folder with `state.json` and this branch's own `step-N/parallel-M/request/request.json`,
green under `validate-request`. That order is the whole point of the session — the request states what
may be touched before anything is touched, and every later receipt hangs off it. An invocation that
finds itself about to edit routed source with no `step-N/parallel-M` under a session stops with
`SESSION_MISSING` and reports it; it does not create the folder retroactively, because a session
written after the work is a record of the work, not a gate on it, and nothing it contains was ever
validated against what was actually done.

## The session branch

The operator never writes on the person's checked-out branch. It writes only on `session/<sessionId>`
of the routed checkout, in the git worktree the orchestrator prepared from the frozen head, and it
holds an exclusive lease on that worktree while it writes. The declared write set is committed exactly
once; `response.json` carries that one sha under `commits`, the `changes.md` Binding row reads
`@workspaces/fe` at the base head then the new sha on `session/<sessionId>`, and the next requests pin
`@workspaces/fe` at that sha. Nothing is pushed and nothing is merged here: `git.publish` owns both.

## No invented value

Every class the write produces already appears in the bound resolution's class inventory, and every
identifier it carries into a claim already appears in the applied rule inventory. Both lists are
complete and frozen. A class absent from the resolution is `WRITE_REJECTED`: there is no rounding to a
nearby value, no copying from a neighbouring file, and no reformatting that changes a step. A file the
write would touch that the write set does not declare is `WRITE_REJECTED` too, even when it plainly
needs the change; the correct next step is a corrected write set, not a wider write. A declared path
whose owner root does not contain it is `OWNER_CONFLICT`, because owner membership alone is not the
ceiling. The inventory check runs on the projection, before anything is written, so a rejected
application leaves source untouched.

## The conformance check reads the write set, not the plan

The inventory check answers one question: did every value come from the resolution? It cannot answer
the other one: does the source, as it will sit on disk, still contain a class the laws already forbid?
A resolution can publish `flex-col` truthfully and the application can still write it onto a
`SectionHeader` whose CSS owns the collapse, because the inventory records which classes exist and not
which node they landed on. So the conformance step also runs `node scripts/sweep-presentation.mjs`
over the projected write set through `@tools/shell`, and reads its four codes: `APP_OVERRIDE`, a class
reaching into a Grammar object; `APP_REIMPLEMENTATION`, a layout utility on an object that already
owns its geometry; `OFF_SCALE`, a value outside the closed scale its topic publishes; and
`SHELL_GEOMETRY`, a product shell drawing a band it should have composed. Any finding is
`WRITE_REJECTED`, with the sweep output quoted in `response.md` under `## Rejections`, and the
`sweep` record carried in `writes.json`. It is the same code the inventory check emits because it is
the same refusal: a value the write is not authorized to produce. Like the inventory check, the sweep
runs on the projection, before anything is written, so a rejected application leaves source untouched.
The sweep is a gate, not an author: it never edits a class, and the correct next step is a corrected
resolution or a corrected write set.

## An application-owned node becomes an empty leaf

When the direction marks a node as owned by the application, a canvas for instance, the projection
writes an empty leaf file that carries that node's contract, its props and its states, so the tree
compiles and the surface can be rendered and measured. The operator never writes that leaf's logic:
the contract is what the direction decided, and the behaviour behind it belongs to whoever owns the
node.

## Unchanged is a measurement

Every declared path is hashed before the projection and after the commit. A path whose projection
differs from its current content is created or modified; a path whose projection equals it is recorded
`unchanged`. After the commit the tree is read back and compared against the resolved tree, and a
difference is `WRITE_REJECTED` rather than a silent success. Under `mode = dry` nothing is written at
all: the branch emits the plan in `response/data/writes.json` with a null commit and stops there.

## Boundary

The operator writes the declared write-set paths on the session branch of `@workspaces/fe`, each under
a mutable owner root, and its own `response/`. It does not write a class, value or rule identifier
absent from the bound resolution, decide a presentation value, choose a Grammar component, restructure
the tree, write the logic of an application-owned leaf, touch a file outside the declared write set,
commit to any other branch, push, merge, edit knowledge, publish Grammar, change the resolution, start
or reconfigure runtime services, or record a verdict, score or pass claim on the applied source. It
knows what it wrote, never how it renders.

## Context

| Alias | Bind | Required |
| --- | --- | --- |
| `@workspaces/fe` | the routed frontend checkout at the frozen head; the write lands on its session branch and nowhere else | yes |

## Inputs

| Kind | From | Required |
| --- | --- | --- |
| `frontend-presentation-resolution` | `frontend.presentation.resolve`, the resolved tree and, beside it, the frozen class and rule inventory | yes |
| `frontend-direction-decision` | `frontend.direction.decide`, the intent and the owner ceiling; never a source of values | yes |

## Requirements

| Field | Type | Default | Ask |
| --- | --- | --- | --- |
| `mode` | choice | apply | `apply` writes and commits, `dry` emits the plan and writes nothing |
| `resume` | token | null | The blocked branch's token when re-entering after a stop |

## Steps

| # | Step | Params | Reads | Writes | Stops with |
| --- | --- | --- | --- | --- | --- |
| 1 | Validate the gate and resume, confirm the session, and confirm the head | `resume`, `mode` | `request/request.json`, the session's `state.json` and this branch's `step-N/parallel-M`, input `frontend-presentation-resolution`, @workspaces/fe at the frozen head | — | `INVALID_INPUT`, `SESSION_MISSING`, `SOURCE_DRIFT`, `NO_PROGRESS` |
| 2 | Bind the resolution, the direction and the declared write set | — | inputs `frontend-presentation-resolution` (tree fingerprint, class and rule inventory, resolved tree) and `frontend-direction-decision` (intent and owner ceiling), @workspaces/fe (the declared paths and their owner roots) | — | `RESOLUTION_STALE`, `OWNER_CONFLICT` |
| 3 | Project the resolved tree onto the declared paths | — | input `frontend-presentation-resolution` (the resolved tree), @workspaces/fe (the declared write set) | — | — |
| 4 | Check every produced value against the inventory, then sweep the projected write set | `mode` | input `frontend-presentation-resolution` (the inventory beside the receipt), @workspaces/fe (the projected write set), @tools/shell | `response/data/writes.json` | `WRITE_REJECTED` |
| 5 | Write atomically on the session branch and commit once | — | @workspaces/fe (the current content of each declared path, under an exclusive lease) | @workspaces/fe/branch/session, `response/data/writes.json`, @tools/sourcewrite, @tools/git, image assets the direction judged, @tools/imagegen | — |
| 6 | Read the tree back at the commit | — | @workspaces/fe at the commit | — | `WRITE_REJECTED` |
| 7 | Emit | — | everything above | `response/response.md`, `response/changes.md`, `response/response.json` | — |

Under `mode = dry` the branch stops after step 4 with the plan alone: `writes.json` carries a null
commit, `response.json` carries no commit, and the checkout is untouched. A dry run is granted neither
`@tools/sourcewrite` nor `@tools/git`, because a mode that writes nothing needs no tool that can
write; the grant and this paragraph say the same thing so neither can drift. `@tools/shell` is granted
in both modes and pinned to the one command the sweep is, because a dry run that skipped the sweep
would publish a plan nobody had checked. Under `apply`, step 5 writes
and commits exactly once and step 6 proves that the committed tree is the resolved tree. `changes.md`
is the record the next steps read: which paths moved, which claims they carry, which gates the
checkout pins for them, and which surfaces must now be observed.

## Outputs

| Kind | File | Type | Required |
| --- | --- | --- | --- |
| `frontend-source-application` | `response/response.md` | md | yes |
| `changes` | `response/changes.md` | md | yes |
| `writes` | `response/data/writes.json` | data | yes |

## Stops

| Code | Disposition |
| --- | --- |
| `INVALID_INPUT` | terminate |
| `SESSION_MISSING` | terminate |
| `SOURCE_DRIFT` | terminate |
| `OWNER_CONFLICT` | terminate |
| `RESOLUTION_STALE` | terminate |
| `WRITE_REJECTED` | terminate |
| `NO_PROGRESS` | terminate |

## Next

| When | Operator |
| --- | --- |
| the source is committed and a served surface must be bound at the new head before it can be observed | `workspace.bind` |
| the source is committed and the rendered surface must be measured | `frontend.surface.audit` |
| the source is committed and the checkout's own gates must run | `quality.verify` |
```

## FILE: .claude/operators/frontend-source-apply/operator.json

SHA-256: c6c92259638f61c317cc0141b8215739105284edd8bb0e73f73241a002d66717

```json
{
  "schemaVersion": 9,
  "id": "frontend.source.apply",
  "domain": "frontend",
  "job": "Write one already-resolved tree into product source inside a frozen owner ceiling and a declared file set, emitting only values the bound resolution receipt already contains.",
  "package": "operator.md",
  "errors": "errors.json",
  "validator": "validate.mjs",
  "selfTest": "self-test.mjs",
  "resources": {
    "profile": "luna",
    "grammarBound": true,
    "tools": {
      "@tools/fileread": "context-aliases",
      "@tools/sourcewrite": "declared-write-set",
      "@tools/shell": "declared-commands",
      "@tools/git": "commit-session-branch",
      "@tools/imagegen": "judged"
    }
  }
}
```

## FILE: .claude/operators/frontend-source-apply/errors.json

SHA-256: de7ff66fe22403c5e438393b2dbfc58cb57e3a7fa0cb44c029dd6c150747f159

```json
{
  "schemaVersion": 9,
  "note": "Stop codes frontend.source.apply emits. Same entry shape as operators/errors.json, scope implicit. Shared codes (INVALID_INPUT, SOURCE_DRIFT, NO_PROGRESS) come from operators/errors.json. OWNER_CONFLICT is also emitted here but is defined in operators/frontend-presentation-resolve/errors.json; it belongs in operators/errors.json with every emitting operator in scope.",
  "codes": {
    "RESOLUTION_STALE": {
      "domain": "resolution",
      "disposition": "terminate",
      "meaning": {
        "en": "The resolution actually read differs from the resolution the request bound.",
        "vi": "Resolution thực sự đọc được khác resolution mà request đã bind."
      },
      "resume": {
        "en": "Bind the current resolution, or resolve the tree again.",
        "vi": "Bind resolution hiện tại, hoặc resolve lại cây."
      }
    },
    "WRITE_REJECTED": {
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "A file or a value the write would produce lies outside what was authorized, or the committed tree is not the resolved tree.",
        "vi": "Một file hay một giá trị lần ghi sẽ tạo ra nằm ngoài phần đã được uỷ quyền, hoặc cây đã commit không phải cây đã resolve."
      },
      "resume": {
        "en": "Declare a corrected write set, or publish a resolution that carries the value.",
        "vi": "Khai lại write set cho đúng, hoặc publish một resolution có mang giá trị đó."
      }
    }
  }
}
```

## FILE: .claude/operators/frontend-surface-audit/operator.md

SHA-256: 9b807b8e1163dffdc9cd0ed3ec498da15c0ee774b2036fa408c175cc7342e3e0

```markdown
# frontend.surface.audit

## Job

Observe the selected primary surfaces at the served route across their frozen audit matrix,
measure every node that carries a claim, and judge each measurement against the published proof rules
by the owner of the node it stands on.

## Readiness, capture and judgement are one job

Splitting them produced a familiar failure: a capture taken before the surface was ready, judged by a
step that could no longer tell, against evidence it had not itself collected. One operator that
waits, measures and judges under one receipt cannot lose that connection.

## A guarded route is reached, not declared unavailable

A route that answers with a sign-in screen is serving perfectly well; what is missing is an identity,
and an identity is something the runtime has. Readiness therefore includes signing in as the flow's
own account when the route requires one: the credential is resolved by name, it is typed into the form
and nowhere else, and capture begins only once the redirect has landed, so no frame this operator
publishes can hold it. Reporting a guarded route as an unavailable runtime is a false negative that
sends a person to restart a service that was never down. The one honest stop here is that no account
exists for this flow yet, which is `IDENTITY_MISSING`: a hand-off to the operator that provisions one,
never a verdict about the surface, and never a request that a person go and make an account.

## Readiness reads the entry of this route

The runtime registry holds one entry per project route, and this audit reads the entry of the route it
was bound to. A registry consulted as a single block answers for whichever route happens to be
recorded in it, which is how an audit comes to report that nothing is serving while the surface it
needs is on screen.

## The surface must contain the committed surface

The applied receipt names the commit it wrote, and the runtime serves one integration branch per
product carrying the work of every session that asked for it. So the test is not equality — that
would fail the moment a second session existed, and fail on arithmetic rather than on evidence — it
is ancestry: the applied commit must be an ancestor of the served head, and present among the commits
the bound route records as contained. A served head that fails that test is `SOURCE_DRIFT` with
nothing captured, because a measurement of another tree proves nothing about this one. The receipt
states both commits under `## Served surface`, since ancestry a reader cannot see is a claim.

The endpoint is the one the bound route carries, never one this operator derived: the route names the
port its entry serves, and readiness is reached there. When the served head does not contain the
applied commit, or nothing is serving at all, `RUNTIME_UNAVAILABLE` names the commit that must be
served and the operation that would serve it, and the runtime owner is the one that acts.

## A served surface can also drift in the family it renders

Clean ancestry proves the source is right; it proves nothing about the family the served head renders
the source through. The integration branch also merges from the mainline, so a Grammar or other
dependency version the session never resolved against can already be on the served head by the time
this audit runs, and a presentation verdict that flips over that has nothing to do with the source
this session wrote. `## Served surface` therefore always names the family version this served head
actually renders and the version the delivery was resolved against, side by side; when they differ,
the drift is not left implicit in the ancestry check that already passed. Wherever a verdict's own
measured evidence is the one a version drift could have flipped rather than the source, that node's
own measured text names both versions again, so a reader is never left guessing which of the two
possible causes produced the verdict. This is evidence, not a new gate: it names no scope question and
stops at nothing the surface's own proof rules did not already stop at.

## Two sessions on one product

The isolation law is published once, by the operator that owns the runtime, and this audit works
inside it rather than restating it: one product serves one integration branch on one port, and what
keeps two concurrent audits from reading each other's state is that each drives its own browser
profile. That profile is recorded under `## Served surface`, so a receipt whose sign-in state came
from somewhere else is visible instead of merely suspected.

## Measurement beats claim, always

Each node carries the identifiers it claims to satisfy, and the audit measures what the surface
actually renders. A claim is never evidence of passing: a node claiming `GAP-4` while the computed
gap measures `1.5rem` is a failure, and no amount of claiming changes the measurement. That is the
whole mechanic, and it is why the claim exists.

## The owner decides where a failure goes

A failing claim on an application-owned node is a value the resolution has to publish again, so it
routes back to `frontend.presentation.resolve`, which is the operator that caps the rounds. A failing claim
on a Grammar component's existing published behavior is a `grammar-gap`: record the evidence in the
family gap table and route to `workspace.bind` for the library owner. Once bound, an already-authorized
repair continues to `library.source.apply` under its bounded owner plan and regression gates; routine
confirmation is not a prerequisite. A genuinely new presentation direction or tier is `direction`
and goes to `frontend.direction.decide`, which preserves the user's choice. Neither route permits an
application CSS workaround for the component's own behavior. The interior
of an application-owned node carries no claim and is not audited at all; only that node's own measure
rules are.

## The audit changes nothing

No verdict is a repair, a workaround or an instruction. A failure stays a failure in the receipt
until a resolution publishes a new value and the applier writes it, and the same surface is audited
again. That separation is why the receipt is worth anything: an operator that could fix what it found
would always be able to report a clean surface.

## Boundary

Context is read-only, and the runtime is consumed, never owned. The operator writes only `response/`
of its own branch: the audit receipt, its captures, its screenshots and its verdicts. It does not
modify product source, the applied tree, knowledge or Grammar, repair, restyle or work around
anything it observes, start, stop, deploy or reconfigure a runtime service, cite a rule identifier
absent from the bound inventory, judge a node it did not measure, or accept a claim as evidence that
a node passes.

## Context

| Alias | Bind | Required |
| --- | --- | --- |
| `@knowledge/ui/proof` | what only becomes true once rendered; the audit's whole rule inventory | yes |
| `@workspaces/fe` | the routed checkout at the commit the application wrote; the owners and identifiers observed there | yes |
| `@worktrees/sessions/central-runtime` | the shared runtime owner: the preview serving the session worktree at that commit | yes |
| `@knowledge/grammars/<family>` | how the family the bound route names (`context.grammarId`) is meant to realize Common, and where its gaps are recorded | no |

## Inputs

| Kind | From | Required |
| --- | --- | --- |
| `frontend-source-application` | `frontend.source.apply`, the commit under observation and the claims it wrote | yes |
| `frontend-presentation-resolution` | `frontend.presentation.resolve`, the owner of every node | yes |
| `frontend-direction-decision` | `frontend.direction.decide`, the route and the coverage the matrix is derived from | yes |
| `route` | `workspace.bind`, the bound route: the endpoint its entry serves and the commits the served head contains | yes |
| `uat-account` | `platform.operate`, the account the guarded route is reached as; absent on the first pass, which is what `IDENTITY_MISSING` hands over | no |

## Requirements

| Field | Type | Default | Ask |
| --- | --- | --- | --- |
| `auditScope` | object | — | Freeze the surface inventory and selected matrix entries from the mission; mode defaults to primary-surfaces under audit-scope.schema.json |
| `matrix` | list | selected surface entries | Optional narrowing within the frozen audit scope; it cannot omit an entry required by a selected surface |
| `readinessProbe` | choice | route-served | The floor for readiness; a state that needs data rises to `route-and-data-served` on its own |
| `account` | id | null | The account record the route is signed in as when it requires an identity; the value is a reference to a record of names, never a credential |
| `env` | id | dev | The stack whose registry entry and accounts this audit reads; a surface observed in one stack says nothing about another |
| `resume` | token | null | The blocked branch's token when re-entering after a stop |

## Steps

| # | Step | Params | Reads | Writes | Stops with |
| --- | --- | --- | --- | --- | --- |
| 1 | Validate the gate and resume, and confirm the applied commit is inside the head the route is serving | `resume` | `request/request.json`, input `frontend-source-application` (the commit it wrote), input `route` (the served branch, the served head and the commits it contains), @workspaces/fe at the frozen head, @worktrees/sessions/central-runtime, @tools/git | — | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS` |
| 2 | Bind the authority | — | @knowledge/ui/proof (every topic with its fingerprint and inventory), input `frontend-source-application` (the claims), input `frontend-presentation-resolution` (the owner of every node), @worktrees/sessions/central-runtime | — | — |
| 3 | Bind the primary-surface scope, selected matrix entries and declared surface class | `auditScope`, `matrix` | input `frontend-direction-decision` (its `response/data/coverage.json`: state by viewport by colour scheme, and the `surfaceClass` that decision declared) | — | `SURFACE_CLASS_MISSING` |
| 4 | Reach readiness for each entry on the port the bound route carries, in this session's own browser profile, signing in as the flow's account when the route requires an identity | `readinessProbe`, `account`, `env` | input `route` for the endpoint its entry serves, @worktrees/sessions/central-runtime for the entry of this project route, input `uat-account` for the account of names, @tools/http, @tools/secrets, @tools/browsercontrol | — | `RUNTIME_UNAVAILABLE`, `IDENTITY_MISSING` |
| 5 | Capture and measure each entry | — | @worktrees/sessions/central-runtime, @workspaces/fe (the observed owners and the identifiers each node carries), @tools/browsercontrol | `response/artifacts/<matrixId>.png`, `response/data/captures/<matrixId>.json` | `EVIDENCE_MISSING` |
| 6 | Compare against the claims and the proof rules, judge by owner, let each topic close itself, and emit | — | @knowledge/ui/proof, @knowledge/grammars/<family>, the captures | `verdicts`, `frontend-surface-audit`, `response/response.json`, `host` | `UNKNOWN_RULE`, `NO_PROGRESS` |

Step 6 judges every claim and then lets each proof topic close itself. The canon judgement is the one
above: every claim measured, judged against the published rule, routed by the owner of the node it
stands on; bounded search (`@tools/websearch`) resolves a referent a rule names and settles nothing
else. On top of it, each bound topic computes its own verdict by its own closing rule — the
arithmetic lives there and is not repeated here — and the receipt publishes one row per topic under
`## Verdict`: presentation, composition, responsive, motion, accessibility, contrast, render-truth
and taste, each with the verdict that topic's rule produced and the route a failure carries. A topic
whose evidence never arrived is `blocked`, which is never reported as a pass and never as a failure.
The taste row is scored per matrix entry and rolled up across them, lowest score and failing verdict
winning, because a surface is only as good as its worst captured viewport; a `fix-first` there stands
even when every canon rule passed, and the checkout's own gates wait for a `ship`.

The sheet is composed with `@tools/visualize` and served, not filed. `@tools/host` (the tool the registry ships) puts `response/artifacts/` on the loopback interface at
the first free port of the registry's range and records the URL, the port, the folder and the pid in
`response/artifacts/host.json`, stopping when the branch ends or is resumed; a person opens the sheet
and sees every matrix entry beside its verdicts. Nothing binds `0.0.0.0`.

Serving is not telling. Step 6 prints over `@tools/print`, into the conversation the person is
reading, the sheet's URL, the worst-scoring capture of each topic and the `## Verdict` table, and the
receipt lists each printed artifact under `## Printed` with why it was printed. A verdict a person
never saw sends nobody anywhere, and an audit that files its sheet and says nothing has audited only
itself.

A composition or taste verdict is never closed by asking. When such a topic closes as fail or
fix-first, its row routes to `direction` and the chain hands to `frontend.direction.decide`, which
scores the rendered candidates against the criteria this audit failed and applies its selection
policy and [interaction policy](../../resources/interaction.md). This audit composes nothing,
ranks nothing and offers nothing: the validator refuses a `user` route that leaves a composition or
taste topic open; direction owns the candidate comparison and any material choice. The caller stops
and `NO_PROGRESS` are operational here — the same
head measured again with no delta — so their `reason` says so and carries no candidate. A topic
`blocked` because an exhaustive matrix left out a required declared state is neither of those things: it is not the same
head measured again, and it is not a composition or taste finding, so it never counts toward
`NO_PROGRESS` and never closes a composition or taste topic as `fix-first`. A taste mean is
comparable across rounds only within the same frozen scope; a new primary scope can complete on its own evidence but is not compared with an exhaustive round to consume a progress budget.

A criterion that depends on data volume is measured at the flow's representative seeded volume, the
volume `TASTE-9` Case 5 defines, never at whatever the served workspace happened to hold. When the
served workspace is below it, the taste topic is `blocked` and routes to `seed`: the operator that
owns the data brings the workspace to volume and the entry is captured again — not a direction lap,
and not a yes/no for a person, because the tree already answers it by creating the data. Re-measured
at volume and still failing, the criterion is recorded `data-bound` in its Measured cell and
`TASTE-13` Case 6 keeps it out of the verdict, so it blocks neither quality nor UAT.

A choice the person took from a printed sheet closes the criteria that choice was known to fail. When
the direction decision this audit reads was approved by the person and its `## Scores` showed a
criterion failing for the selected candidate at choice time, this audit records that criterion
`person-accepted` in its Measured cell, naming the branch of that decision, instead of failing it back
to direction; `TASTE-13` Case 7 keeps it out of the verdict and the topic closes on the remaining
criteria. The rubric never overturns a decision the person took on its own evidence in the same
session, so a taste lens whose every failing criterion is `data-bound` or `person-accepted` ships, and
`next` names `quality.verify`. The validator refuses a `person-accepted` row that names no decision
branch, names a decision the operator took by itself, or covers a criterion the chosen candidate was
not shown failing.

The surface class is not this operator's to choose or to declare. It is read from the coverage of the
`frontend-direction-decision` this audit was given, where the direction declared it from the
vocabulary `COVERAGE-1` Case 7 publishes; every banded proof rule reads its threshold from that name,
and the audit only carries it into `## Surface class` and into the verdicts, unchanged. An input
decision that carries none — one written before the class was declared — or a name outside the
vocabulary, is `SURFACE_CLASS_MISSING`: no band, no threshold, nothing to judge, and the direction is
decided again before the surface is.

The scope is frozen before capture through `auditScope`, validated by
[the audit scope schema](../../templates/kinds/audit-scope.schema.json). Its default is
`primary-surfaces`: the mission's main screens and important layouts are audited first, while
secondary states and deferred surfaces remain visible as deferred work. The orchestrator derives the
inventory from the mission and existing direction without a routine confirmation. `exhaustive` is
an explicit opt-in to the full declared state matrix.

Each inventory item names its stable id, page/layout/modal/drawer type, route, and exact required
matrix ids. Primary items have entries; deferred items have none.
Every selected entry must have its capture, screenshot and verdict. Every claim measured inside a
selected surface is still judged. Deferring another surface or state does not excuse a failure or
missing assertion inside the chosen matrix. A missing selected entry is `EVIDENCE_MISSING`.

`verdicts.auditScope` copies the inventory and normalized mode, lists every declared secondary state
not captured as `deferredStates`, and states its `coverageClaim`. A primary audit claims only
`selected-surfaces`; its passing topics cannot be presented as full UI state coverage. An exhaustive
audit missing a declared state remains blocked with `## Coverage gaps`. `TASTE-13` Case 8 governs the
state-comparison criterion and comparability across rounds. Unit, integration and regression gates
keep their own coverage contracts unchanged.


## Outputs

| Kind | File | Type | Required |
| --- | --- | --- | --- |
| `frontend-surface-audit` | `response/response.md` | md | yes |
| `capture` | `response/data/captures/<matrixId>.json` | data | yes |
| `screenshot` | `response/artifacts/<matrixId>.png` | artifact | yes |
| `verdicts` | `response/data/verdicts.json` | data | yes |
| `host` | `response/artifacts/host.json` | artifact | no |

## Stops

| Code | Disposition |
| --- | --- |
| `INVALID_INPUT` | terminate |
| `SOURCE_DRIFT` | terminate |
| `RUNTIME_UNAVAILABLE` | terminate |
| `IDENTITY_MISSING` | terminate |
| `EVIDENCE_MISSING` | terminate |
| `UNKNOWN_RULE` | terminate |
| `SURFACE_CLASS_MISSING` | terminate |
| `NO_PROGRESS` | terminate |

## Next

| When | Operator |
| --- | --- |
| a claim fails on an application-owned node, so a value must be published again | `frontend.presentation.resolve` |
| a topic verdict is fix-first, or the direction declared no surface class, so the composition is decided again before any value is | `frontend.direction.decide` |
| every topic ships or passes and the checkout's own gates must run | `quality.verify` |
| a grammar-gap identifies failed existing library behavior, so the authorized repair first binds the library owner's checkout | `workspace.bind` |
| a Grammar-owned finding needs a genuinely new presentation direction or tier, so the user's direction is decided before implementation | `frontend.direction.decide` |
| a state-reading topic is blocked because the exhaustive matrix leaves out a required declared state, so the surface is audited again once the matrix covers it | `frontend.surface.audit` |
| a density criterion was measured below the flow's representative seeded volume, so the data is seeded before the surface is judged again | `platform.operate` |
| the route requires an identity and this flow has no account yet, so one is provisioned before the surface is observed | `platform.operate` |
```

## FILE: .claude/operators/frontend-surface-audit/operator.json

SHA-256: 79726b0dc71cf3e32ad3a0a49fc36be404c53e7db5d15746c447e07e090a2bdf

```json
{
  "schemaVersion": 9,
  "id": "frontend.surface.audit",
  "domain": "frontend",
  "job": "Observe the selected primary surfaces at the served route across their frozen audit matrix, measure every node that carries a claim, and judge each measurement against the published proof rules by the owner of the node it stands on.",
  "package": "operator.md",
  "errors": "errors.json",
  "validator": "validate.mjs",
  "selfTest": "self-test.mjs",
  "resources": {
    "profile": "sol-reviewer",
    "grammarBound": true,
    "tools": {
      "@tools/fileread": "context-aliases",
      "@tools/git": "read",
      "@tools/websearch": "bounded",
      "@tools/visualize": "html",
      "@tools/browsercontrol": "required",
      "@tools/http": "probe",
      "@tools/host": "loopback",
      "@tools/secrets": "resolve-by-name",
      "@tools/print": "decision-points"
    }
  }
}
```

## FILE: .claude/operators/frontend-surface-audit/errors.json

SHA-256: db0551909d82ec522c7a591b60695fb1fb6dad33dfdfd473f5046a1fabd2c9e0

```json
{
  "schemaVersion": 9,
  "note": "Stop codes frontend.surface.audit emits. INVALID_INPUT, SOURCE_DRIFT, EVIDENCE_MISSING and NO_PROGRESS come from operators/errors.json. RUNTIME_UNAVAILABLE is defined here and also emitted by uat.verify; UNKNOWN_RULE is emitted here too and is defined in operators/frontend-presentation-resolve/errors.json. Both belong in operators/errors.json with a scope list naming every operator that emits them.",
  "codes": {
    "SURFACE_CLASS_MISSING": {
      "domain": "direction",
      "disposition": "terminate",
      "meaning": {
        "en": "The direction decision declares no surface class, or one outside the vocabulary COVERAGE-1 Case 7 publishes, so every banded proof rule is left without a threshold and no topic can be judged.",
        "vi": "Quyết định direction không khai lớp bề mặt nào, hoặc khai một tên ngoài bộ từ vựng mà COVERAGE-1 Case 7 publish, nên mọi rule proof có dải đều không có ngưỡng và không topic nào phán quyết được."
      },
      "resume": {
        "en": "Decide the direction again with a declared surface class, then audit at the same commit.",
        "vi": "Quyết lại direction kèm một lớp bề mặt đã khai, rồi audit lại ở đúng commit ấy."
      }
    }
  }
}
```

## FILE: .claude/operators/git-publish/operator.md

SHA-256: cfc89d3b4cbcf24755482bea809adbb44264da670639555f8a48090aa1511247

```markdown
# git.publish

## Job

Publish one approved Git boundary from the exact commit quality verified, with non-force,
fast-forward-only semantics, and stop with a typed failure rather than reaching for a bypass.

## It decides nothing about the change

Whether the work is correct was settled by the gates that produced the `quality-verification` receipt,
and whether it may be published was settled by the approval. This operator only performs the write, or
reports precisely why it did not. The receipt it leaves proves that exactly this commit reached
exactly this ref under exactly these hooks; it carries no verdict, no score, and no claim that
anything passed.

## The route is read, never rediscovered

This operator does not resolve a project to a checkout. `workspace.bind` does that, and its receipt
arrives here already bound. A publish that resolved its own path could publish from a checkout
nobody verified, which is the failure this separation exists to prevent. A route receipt whose
status is not `bound`, or which names another project, is `ROUTE_UNVERIFIED`.

## Approval is a person, always

Publishing pushes work out of the session and into a place other people pull from, so `approval` has
no default: an outward-facing act is always something a person said yes to. Completion proof records
the gates the boundary passed; it is evidence that the work is finished and never evidence that it
may be published. Exactly one approval must name this boundary. An approval issued for a different
boundary is a real approval for somebody else's work, which is exactly how unreviewed change rides
along with reviewed change, and it is `APPROVAL_MISSING`.

## The published commit is the verified commit

The `quality-verification` input measured one commit. That commit, and no other, is what this
publication pushes: a head one commit ahead of the verified one carries a change no gate ever saw.
The receipt records the verified commit beside the published head so the two can be compared later
without rerunning anything.

## Non-force is structural, not advisory

Force push, history rewrite, `reset --hard`, `clean`, `stash`, branch deletion and hook bypass are
not fields with a default; they are absent from this operator's vocabulary, so no request, in any
combination and under any justification, can ask for one. The reason is that each of them is most
tempting exactly when a publish has just failed: a rejected push, a red hook and an unexpected dirty
file each have an obvious one-command answer that destroys someone else's work or someone else's
evidence. `reset --hard` destroys uncommitted work no receipt has recorded, `clean` destroys
untracked files nobody has reviewed, and `stash` hides a dirty boundary instead of resolving it.
Making the request unrepresentable removes the decision from the moment it would be made badly. The
publication mode is always fast-forward only, and every publication records that it was not forced.

## The session branch is merged, never rebased

The producer did not write on the person's checked-out branch. It wrote on the session branch
`session/<sessionId>` of the routed checkout, in a git worktree prepared from the frozen head, and
committed its write set once. This operator merges that session branch into the target branch before
it pushes. When the target has not moved since the session base, the merge is a fast-forward and
nothing new is created. When the target has moved, a merge commit is allowed only under two
conditions together: the merge produced no conflict, and the gates the verification named were re-run
on the merge result and passed. A conflict is `NON_FAST_FORWARD`, it terminates, and a person
resolves it; the operator never rebases, never forces, and never runs with hooks disabled.

## An unreceipted session branch is not publishable

A session branch is only ever the tail of a session, so the session that produced it is on disk when
this operator merges it: the session folder exists, and inside it a `frontend.source.apply` or
`backend.source.apply` branch is `done` with the branch head among its `commits`. That receipt is the
only thing that says which paths were declared, which values were authorized, and which gate passed
them; a session branch with no such receipt carries commits nobody wrote a request for, and merging
it publishes work that never entered the runtime at all. When the chain the session ran includes a
`frontend.surface.audit` or a `uat.verify` step, that branch's response and its `screenshot`
artifacts must exist too, because a surface nobody looked at and a journey nobody walked are exactly
the changes this gate is here to catch. Any of those absences is `SESSION_MISSING`, it terminates,
and the answer is to run the operators that owe
the receipt — never to write the receipt now, after the fact, from what the diff happens to contain.

## A blocked hook is a result

Hooks are enforced, always, and `pre-push` is the last gate before the remote. A failing hook
produces `HOOK_BLOCKED` naming the hook, and the delta that clears it is a fixed boundary and a new
head. It is never a reason to run the push again with the hook disabled, to move the change onto a
branch whose hooks are lighter, or to commit the hook's own configuration out of the way. A
publication that carries a failed hook result, or that lacks the `pre-push` result altogether, is
refused.

## A rejected push is a result

When the remote carries commits the local ref does not, the push is not fast-forward. The operator
returns `NON_FAST_FORWARD` naming the remote head it observed. It does not rebase onto it, amend a
commit to make the push apply, squash the divergence away, force, or lease-force. Reconciling
divergent history changes what other people have already pulled, so it belongs to whoever owns the
branch, and that owner is not this operator.

## The boundary is exact

The boundary is the whole of what this publication owns, and the input `changes` names the paths
inside it. Anything dirty outside it is work this boundary does not own, and a publish that carries
it publishes somebody else's unreviewed change; that is `DIRTY_OUTSIDE_BOUNDARY`. Under a forbidden
worktree policy every published head is on the routed mutation branch, and a head on any other
branch is `BRANCH_POLICY_VIOLATION`. A publication that advances nothing is not a publication: the
published head is ahead of its upstream and the ref actually moved.

## The tag is asked for, or there is none

`tag` defaults to null, so a publication carries a continuation tag only when a person named one,
and that tag is annotated and points at a head this same publication pushed. A tag on a head this
run did not push is a label somebody else's commit now wears.

## Cleanup is part of the publish

After the push succeeds, the session worktree and the session branch are removed together with the
session folder, because the evidence they held has just become a published commit. A blocked session
keeps both: the evidence of what was attempted lives there until a person has read it.

One thing is released rather than removed. While the session ran, the runtime owner served its work
from the product integration branch and holds the lease and the pid that go with it; removing a
worktree under a live server leaves a process serving a tree that is no longer there, and killing that
process here would be this operator taking a lifecycle it does not own. So the release is a hand-off:
the runtime owner is asked to stop what it started, by name, and it is the one that kills the pid it
recorded.

## Boundary

Context is read-only apart from the merge and the push. The operator writes only `response/` of its
own branch, the target branch of the routed checkout, and the push to `@remote/git/<project>/<role>`:
the approved head on the routed ref, and at most one annotated continuation tag pointing at a head
this same publication pushed. It does not force push, lease-force push, or rewrite published history;
does not run reset, clean, or stash; does not delete a branch other than the session branch it is
cleaning up; does not bypass, skip, or disable a Git hook; does not amend, rebase, or squash a commit
to make a rejected push succeed; does not publish a head outside the approved boundary; and does not
publish without a verified route and an approval bound to this exact boundary.

## Context

| Alias | Bind | Required |
| --- | --- | --- |
| `@workspaces/local/routes/<project>/<role>` | the checkout, its session branch and its target branch, read at the frozen head | yes |
| `@workspaces/<project>/<role>/husky` | `pre-commit` and `pre-push`, which always run | yes |
| `@remote/git/<project>/<role>` | the publication target and the remote head observed at invocation time | yes |

## Inputs

| Kind | From | Required |
| --- | --- | --- |
| `workspace-route-binding` | `workspace.bind`; a publish never resolves its own checkout | yes |
| `changes` | `backend.source.apply` or `frontend.source.apply`, the exact file set this publication carries | yes |
| `quality-verification` | `quality.verify`, the receipt whose measured commit is the one this publication pushes | yes |

## Requirements

| Field | Type | Default | Ask |
| --- | --- | --- | --- |
| `boundary` | id | — | The one boundary being published, exactly as the approval names it |
| `approval` | id | — | The approval record that covers this boundary; completion is not approval |
| `tag` | `{name, message}` | null | One annotated continuation tag on the head this publication pushes, or none |
| `resume` | token | null | The blocked branch's token when re-entering after a stop |

## Steps

| # | Step | Params | Reads | Writes | Stops with |
| --- | --- | --- | --- | --- | --- |
| 1 | Validate the gate and resume | `resume` | `request/request.json`, @workspaces/local/routes/<project>/<role> at the frozen head, @remote/git/<project>/<role> as observed | — | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS` |
| 2 | Bind the route | — | input `workspace-route-binding`: the verified checkout, its head and its routed policy, and @workspaces/local/routes/<project>/<role> | — | `ROUTE_UNVERIFIED` |
| 3 | Bind the approval to this exact boundary | `boundary`, `approval` | `request/request.json` requirements, input `changes` as the file set, input `quality-verification` as the measured commit | — | `APPROVAL_MISSING` |
| 4 | Verify the tree: dirty outside the boundary, branch policy | — | @workspaces/local/routes/<project>/<role>, the dirty paths, every branch, the routed policy | — | `DIRTY_OUTSIDE_BOUNDARY`, `BRANCH_POLICY_VIOLATION` |
| 5 | Run the hooks | — | @workspaces/<project>/<role>/husky: the installed hooks, `pre-push` among them | @tools/shell | `HOOK_BLOCKED` |
| 6 | Bind the session's receipts, then merge the session branch into the target branch | — | the session folder: `state.json`, the `frontend.source.apply` or `backend.source.apply` branch whose `commits` carry the session head, and the `frontend.surface.audit` and `uat.verify` branches with their `screenshot` artifacts when the chain has them; @workspaces/local/routes/<project>/<role> for the target head, the session base and the session head | @workspaces/local/routes/<project>/<role>, the target branch of that checkout, @tools/git | `SESSION_MISSING`, `NON_FAST_FORWARD` |
| 7 | Push non-force, fast-forward only | — | @workspaces/local/routes/<project>/<role> for the approved head, @remote/git/<project>/<role> at the observed remote head, @tools/ci | @remote/git/<project>/<role>, @tools/git | `NON_FAST_FORWARD` |
| 8 | Push the continuation tag | `tag` | @workspaces/local/routes/<project>/<role> for the head this publication pushed | @remote/git/<project>/<role>, @tools/git | — |
| 9 | Remove the worktree and the session branch, write the receipt and emit | — | everything above | @workspaces/local/routes/<project>/<role>, `response/response.md`, `response/response.json`, @tools/git | — |

Creating a remote ref and fast-forwarding one are different acts with different reviewers, so the
published head records which of the two it performed. A resume begins again at validation, reuses
only unchanged fingerprinted observations, and consumes the exact delta; a resume that adds no head,
approval, hook or remote change is `NO_PROGRESS`, and a re-observed remote must arrive as a new
remote head because the same observation cannot yield a different result.

## Outputs

| Kind | File | Type | Required |
| --- | --- | --- | --- |
| `git-publication` | `response/response.md` | md | yes |

## Stops

| Code | Disposition |
| --- | --- |
| `INVALID_INPUT` | terminate |
| `SOURCE_DRIFT` | terminate |
| `NO_PROGRESS` | terminate |
| `ROUTE_UNVERIFIED` | terminate |
| `SESSION_MISSING` | terminate |
| `APPROVAL_MISSING` | terminate |
| `BRANCH_POLICY_VIOLATION` | terminate |
| `DIRTY_OUTSIDE_BOUNDARY` | terminate |
| `HOOK_BLOCKED` | terminate |
| `NON_FAST_FORWARD` | terminate |

## Next

| When | Operator |
| --- | --- |
| the boundary is published and the head must reach an environment | `release.deploy` |
| the session is cleaned up and the runtime it was served from must release the lease and the server it started | `platform.operate` |
```

## FILE: .claude/operators/git-publish/operator.json

SHA-256: 390bda549f7d1a23bb610d3cc35c58b0cc4b1d5d65842d41a4050c979b6aeaab

```json
{
  "schemaVersion": 9,
  "id": "git.publish",
  "domain": "git",
  "job": "Publish one approved Git boundary from the exact commit quality verified, with non-force, fast-forward-only semantics, and stop with a typed failure rather than reaching for a bypass.",
  "package": "operator.md",
  "errors": "errors.json",
  "validator": "validate.mjs",
  "selfTest": "self-test.mjs",
  "resources": {
    "profile": "luna",
    "grammarBound": false,
    "tools": {
      "@tools/fileread": "context-aliases",
      "@tools/git": "merge-and-push",
      "@tools/shell": "declared-commands",
      "@tools/ci": "read"
    }
  }
}
```

## FILE: .claude/operators/git-publish/errors.json

SHA-256: 858ff6ec0bddb0921cadc47a3ec1cc07a07e19baaafff7db8e3861ff42cdcc97

```json
{
  "schemaVersion": 9,
  "note": "Stop codes only git.publish emits. Same entry shape as operators/errors.json, scope implicit. Shared codes (INVALID_INPUT, SOURCE_DRIFT, NO_PROGRESS) come from operators/errors.json; ROUTE_UNVERIFIED is defined by frontend.direction.decide and BRANCH_POLICY_VIOLATION is also emitted by workspace.bind; both belong in operators/errors.json with every emitting operator in scope.",
  "codes": {
    "APPROVAL_MISSING": {
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "No approval covers this exact boundary unit; completion proof is not approval.",
        "vi": "Không phê duyệt nào phủ đúng đơn vị ranh giới này; bằng chứng hoàn thành không phải phê duyệt."
      },
      "resume": {
        "en": "Supply an approval issued for this unit.",
        "vi": "Cấp một phê duyệt cấp cho đúng đơn vị này."
      }
    },
    "DIRTY_OUTSIDE_BOUNDARY": {
      "domain": "source",
      "disposition": "terminate",
      "meaning": {
        "en": "Something dirty lies outside the declared write roots, so the publish would carry work this boundary does not own.",
        "vi": "Có thứ bẩn nằm ngoài các write root đã khai, nên lần publish sẽ mang theo công việc ranh giới này không sở hữu."
      },
      "resume": {
        "en": "Clean the tree, or correct the write roots.",
        "vi": "Dọn sạch cây làm việc, hoặc sửa lại các write root."
      }
    },
    "HOOK_BLOCKED": {
      "domain": "source",
      "disposition": "terminate",
      "meaning": {
        "en": "A Git hook rejected the publication, and no bypass is representable.",
        "vi": "Một Git hook từ chối lần publish, và không có đường vòng nào biểu diễn được."
      },
      "resume": {
        "en": "Fix the boundary and bring a new head.",
        "vi": "Sửa ranh giới và mang một head mới."
      }
    },
    "NON_FAST_FORWARD": {
      "domain": "remote",
      "disposition": "terminate",
      "meaning": {
        "en": "The remote carries commits the local ref does not, so the push is not fast-forward.",
        "vi": "Remote mang những commit mà ref cục bộ không có, nên cú push không phải fast-forward."
      },
      "resume": {
        "en": "The branch owner reconciles the divergence and a new head arrives.",
        "vi": "Người sở hữu nhánh hoà giải phần phân kỳ và một head mới tới."
      }
    }
  }
}
```

## FILE: .claude/operators/library-source-apply/operator.md

SHA-256: 6f07ac583ccfaf9061bce57385b0aa2c27cd865344d1aa21e61cd0bcdef7e787

```markdown
# library.source.apply

## Job

Repair existing behavior inside one explicitly authorized owner package, prove its regression and
package gates, and commit exactly one next-patch delivery on the bound session branch.

## Boundary

This operator owns library implementation maintenance. It does not compose or restyle product
surfaces and takes no presentation resolution. The package manifest at the frozen base proves its
identity; a caller-supplied directory name does not. Every declared file is inside that package and
the route's write roots. Symlinks, nested package boundaries, consumer files, new dependencies,
script changes, CSS, assets, markup structure, classes and inline style changes are refused.
Only existing behavior files, their paired regression tests, the existing manifest's next patch
version, the package changelog and package version metadata in a lockfile may change. A workspace
lockfile is allowed only when the plan and route both name it; its parsed content may change only
the bound package entry's version. Presentation changes use the frontend pipeline.

The operator never publishes a package, pushes, merges, tags, touches another checkout, changes a
gate or claims an application audit or UAT pass. A package delivery remains subject to quality and
the independently authorized publication boundary.

## Proof before mutation

Run `validate.mjs <branch> --preflight` before writing. It reads the typed plan, bound route and Git
state, refuses a dirty tree, and proves the package and session boundary. Write the paired tests
first. Run `run-proof.mjs <branch> before`; it requires behavior and manifests to remain at the
base, and records the declared regression's failing assertion. Apply the behavior repair and next
patch version, then run the helper for `after` and every declared gate. Each existing test,
typecheck and build script is required without filters. The helper executes only the existing
package scripts or the regression binary of a declared dependency, with argument arrays and no
shell interpolation, and records output,
exit status, exact file hashes, script body and timestamp. The after regression and package gates
run on identical file contents; the regression tests are identical before and after.

Stage only the declared set and commit once. The final validator verifies the one-parent commit
against the base, the complete Git change set, committed file hashes and the captured proofs. A
bare claim that a test passed, an absent log or proof from different bytes is rejected.

## Context

| Alias | Bind | Required |
| --- | --- | --- |
| `@workspaces/fe` | the owner package's routed checkout at the frozen base; mutation is confined to its session branch | yes |

## Inputs

| Kind | From | Required |
| --- | --- | --- |
| `route` | `workspace.bind`; the verified checkout, session policy and write roots | yes |

## Requirements

| Field | Type | Default | Ask |
| --- | --- | --- | --- |
| `plan` | object | — | The closed library-behavior-plan schema: owner package identity, exact file set, paired regression, existing scripts and next patch |
| `resume` | token | null | The blocked branch token when re-entering with a changed plan or proof |

## Steps

| # | Step | Params | Reads | Writes | Stops with |
| --- | --- | --- | --- | --- | --- |
| 1 | Validate request and preflight before the first write | `plan`, `resume` | `request/request.json`, input `route`, @workspaces/fe at the base, @tools/git | — | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS`, `LIBRARY_BOUNDARY_REJECTED` |
| 2 | Write only the paired regression tests and prove the failure | `plan` | @workspaces/fe at the base, @tools/shell | @workspaces/fe/branch/session within the test ceiling, @tools/sourcewrite, `library-proof` | `LIBRARY_PROOF_FAILED` |
| 3 | Repair the declared behavior and next patch version | `plan` | @workspaces/fe inside the package ceiling | @workspaces/fe/branch/session within the declared file set, @tools/sourcewrite | `LIBRARY_BOUNDARY_REJECTED` |
| 4 | Run the regression and complete test and build scripts | `plan` | @workspaces/fe, @tools/shell | `library-proof` | `LIBRARY_PROOF_FAILED` |
| 5 | Commit once and verify the actual Git change set and all proof hashes | `plan` | @workspaces/fe at the commit, @tools/git | @workspaces/fe/branch/session, `library-source-application`, `changes`, `response/response.json` | `LIBRARY_BOUNDARY_REJECTED`, `LIBRARY_PROOF_FAILED` |

## Outputs

| Kind | File | Type | Required |
| --- | --- | --- | --- |
| `library-source-application` | `response/data/library.json` | data | yes |
| `library-proof` | `response/data/proofs/<phase>.json` | data | yes |
| `changes` | `response/changes.md` | md | yes |

## Stops

| Code | Disposition |
| --- | --- |
| `INVALID_INPUT` | terminate |
| `SOURCE_DRIFT` | terminate |
| `NO_PROGRESS` | terminate |
| `LIBRARY_BOUNDARY_REJECTED` | terminate |
| `LIBRARY_PROOF_FAILED` | terminate |

## Next

| When | Operator |
| --- | --- |
| the owner package commit must pass independent quality verification | `quality.verify` |
```

## FILE: .claude/operators/library-source-apply/operator.json

SHA-256: 160c4d0d39a05b672905ef666db66c7966fe05db24bd43b1d6974872d4facdfb

```json
{
  "schemaVersion": 9,
  "id": "library.source.apply",
  "domain": "library",
  "job": "Repair an existing owner package's behavior within an exact file ceiling, prove the regression and package gates, and commit one next-patch delivery.",
  "package": "operator.md",
  "errors": "errors.json",
  "validator": "validate.mjs",
  "selfTest": "self-test.mjs",
  "resources": {
    "profile": "luna",
    "grammarBound": false,
    "tools": {
      "@tools/fileread": "context-aliases",
      "@tools/sourcewrite": "declared-write-set",
      "@tools/git": "commit-session-branch",
      "@tools/shell": "declared-commands"
    }
  }
}
```

## FILE: .claude/operators/library-source-apply/errors.json

SHA-256: a75b1e37cee0f28e2d35dcc38d111dee68099f124149710388ff3253d8a2d0be

```json
{
  "schemaVersion": 9,
  "codes": {
    "LIBRARY_BOUNDARY_REJECTED": {
      "domain": "caller", "disposition": "terminate",
      "meaning": {"en": "The package identity, exact write set, behavior-only boundary or session binding cannot be proved.", "vi": "Không chứng minh được danh tính package, tập file chính xác, ranh giới chỉ sửa hành vi hoặc binding session."},
      "resume": {"en": "Supply corrected owner authority or a bounded plan; product presentation still uses the frontend pipeline.", "vi": "Cung cấp thẩm quyền owner hoặc kế hoạch có giới hạn đã sửa; presentation sản phẩm vẫn theo pipeline frontend."}
    },
    "LIBRARY_PROOF_FAILED": {
      "domain": "self", "disposition": "terminate",
      "meaning": {"en": "The regression did not fail before and pass after, or a required package gate did not pass on the delivered tree.", "vi": "Regression chưa thất bại trước và đạt sau sửa, hoặc gate package bắt buộc chưa đạt trên cây bàn giao."},
      "resume": {"en": "Repair the declared behavior and rerun the complete proof set on the changed tree.", "vi": "Sửa hành vi đã khai và chạy lại toàn bộ bằng chứng trên cây thay đổi."}
    }
  }
}
```

## FILE: .claude/operators/platform-operate/operator.md

SHA-256: 9cb95a6e148c1aff7f7dfe59c5cb88bfdb8729a988f51a201f5152b49acf1cba

```markdown
# platform.operate

## Job

Operate one bounded shared service from exact evidence — observability, Sonar, tunnel, the runtime
registry, or the identity a bound route authenticates against: inventory it, converge only the
approved delta, prove every check the bound knowledge requires, and stop at the smallest owning gap
instead of taking product deployment ownership.

## Shared infrastructure, not product

This operator serves shared infrastructure and never takes product deployment ownership. That
boundary is not advice: a resource can only be changed if the bound inventory lists it under the same
service kind, and a product deployment target is never an observability, Sonar, or tunnel resource. A
plan that reaches for one is invalid input rather than a judgement call at execution time, and a
request to restart a product service to make room for a shared one leaves through a
`PRODUCT_DEPLOYMENT_DECLINED` finding rather than through a mutation.

## One job, five branches

The service kind the inventory records selects the branch, and the five are branches of one job
rather than five operators.
Each branch publishes three closed sets, and each is enforced. Observability applies `update-config`,
`restart-service`, `upsert-dashboard` and `update-remote-write`, proves `service-health`,
`target-boundary`, `label-boundary`, `remote-write-delivery`, `sample-ordering`, `retry-backoff` and
`sensitive-data-filter`, and needs `metrics:remote-write`. Sonar applies `create-project`,
`assign-profile`, `assign-gate` and `enforce-setting`, proves `service-available`, `project-exists`,
`source-revision`, `profile-assigned`, `gate-assigned` and `enforcement-active`, and needs
`sonar:project-admin`. Tunnel applies `create-tunnel`, `update-tunnel-route` and `upsert-proxied-dns`,
proves `dns-target`, `tunnel-route`, `tls` and `public-https`, and needs `tunnel:write` and
`dns:write`. Runtime applies `register-runtime-entry`, `attest-runtime-entry`,
`bring-up-infra-stack`, `locate-routed-checkouts`, `start-role-runtime`,
`merge-into-integration-branch`, `serve-runtime-head`, `restart-runtime-server`,
`reset-runtime-server`, `stop-runtime-server` and `queue-runtime-lease`, proves `entry-declared`,
`endpoints-served`, `head-observed`, `generation-advanced`, `infra-ports-open`,
`cors-origin-admitted`, `checkout-located`, `integration-merged`, `server-pid-owned` and
`lease-honoured`, and needs
`runtime:registry-write`. Identity applies `provision-identity`, `seed-flow-fixtures` and `rotate-admin-credential`, proves
`provider-reachable`, `credential-resolvable`, `account-exists`, `account-signs-in` and
`no-credential-recorded`, and needs `identity:account-admin`. Keeping those two apart is what keeps
each proof set honest: an attestation cannot be asked to prove an account, and provisioning cannot be
reported by probing a port. An effect or a check filed under the wrong branch is invalid input rather
than a warning, because a cross-filed effect is how an unapproved change acquires the appearance of
authority. The required proof set is the whole set the branch publishes: the caller cannot ask for
less, because a green dashboard alone never proved delivery, ordering, or redaction. The runtime
branch is the one that publishes its set per rung rather than per branch, because a rung below the
server cannot probe an endpoint nothing is serving yet; each rung's set is stated with the ladder
below, and a rung may no more ask for less than its own than a branch may.

## The registry is one entry per project route

One machine runs the routes of several products at once, so the runtime registry holds one entry per
`<project>/<role>` and every reader takes the entry of its own route. A registry with a single
endpoint block can attest exactly one route, and every other bind reads it as not ready while the
service it needs is listening — a false negative indistinguishable from an outage. The previous
single-block shape is still read for one release, as the entry of the route it names, and a registry
that carries both must agree; the release after this one drops it.

## The runtime ladder, climbed one rung at a time

A machine that has just been switched on has no database, no identity provider, no checkout resolved
and nothing serving, and every one of those is a different missing thing with a different owner. The
runtime branch therefore climbs a ladder in one order, each rung a closed operation the caller names
and each rung attested before the next is attempted, so a registry entry always says exactly how far
up it is instead of being either ready or mysteriously not.

| Rung | What it does | Proves |
| --- | --- | --- |
| `stack-up` | Brings up the environment's declared infrastructure with the tooling that environment declares, waits for its readiness probes, and confirms the declared origin rule admits the served origin | `infra-ports-open`, `cors-origin-admitted`, `generation-advanced` |
| `locate` | Resolves the project's roles to routed checkouts through the workspace routes, never by directory name, and records the head observed in each | `checkout-located`, `head-observed`, `generation-advanced` |
| `start-role` | Starts a role's server from its integration worktree, backend before frontend, under the dev command its declaration or its package scripts publish | `entry-declared`, `endpoints-served`, `head-observed`, `generation-advanced`, `integration-merged`, `server-pid-owned`, `lease-honoured` |
| `serve` | Merges one session's work into the integration branch, resolving any conflict by rule and gating the merged head, and has the server run the result, under the build-cache rule | the `start-role` set plus `gates-passed` |
| `restart` | Starts the same head again, same branch, same port, under the build-cache rule | the `start-role` set |
| `reset` | Stops, clears the build cache by name, starts again | the `start-role` set |
| `stop` | Stops the server: the recorded pid's process tree is stopped, the port is proved free, and the lease released | `entry-declared`, `generation-advanced`, `server-pid-owned`, `lease-honoured` |

A rung that cannot be climbed stops with the code that names the owner of the gap and no other: infra
that will not come up, or a backend whose declared origin rule does not admit the served origin, is
`PROVISIONING_UNAVAILABLE` naming what is missing and the declaration line to add; a route with no dev
command to run is `INVALID_INPUT` naming the field it lacks. A merge that conflicts is not one of
these: it belongs to `serve` itself, resolved at integration time rather than escalated to a person,
which is the whole reason the merge happens here.

## A conflict is resolved by the integrator, not escalated to a person

`serve` resolves a merge conflict itself, under a closed rule set, rather than stopping and handing it
to a person: for a hunk only one side touched, that side's version wins; for a hunk both sides
touched, both behaviours are kept where they are additive — separate imports, sibling declarations,
separate table rows; for every other hunk both sides touched, the incoming session's version wins in a
file the session's write set owns, and the branch's version wins everywhere else. Every hunk resolved
this way is recorded on its merge, in `runtimeLadder.integration.merges[].resolutions`, naming the
file, the hunk's range and which of the four rules applied — the record is what lets a later reader
tell a clean merge from one that took a side.

Resolving a conflict is not the same as trusting the result. Before the server restarts on the merged
head, `serve` runs the delivery gates the product declares for it — patch coverage against the base
the integration merged included — reading them from the product's own declared scripts rather than a
list copied into this tree, and only a red gate stops the rung, with `INTEGRATION_FAILED` naming the
failing gate and the resolutions that were made. The audit and UAT that
follow on the integration branch are what catch a broken result the gates cannot see; the gate here
only refuses to serve a head that fails what it can see. `INTEGRATION_FAILED` is resumed by a person or
the owning session repairing the session branch and asking to serve again — never by rebasing, forcing
or abandoning the merge that produced the failing head.

## One branch, one server, one fixed port

The runtime serves a per-product integration branch, and the port that branch is served on never
moves. That is not a convenience: an identity client's redirect URIs, a backend's allowed origins and
every callback registered at any provider are declared against a port, so a runtime that moved the
port to make room for a second session would break the sign-in of the first, and would then have to
mutate a provider's allow-list at runtime to repair what it had just broken. Nothing here registers
an origin, because nothing here moves a port.

Two sessions on one product are therefore not two servers. Each asks for its own commit to be served,
and `serve` merges that session's branch into the integration branch — a merge commit, never a
rebase — and restarts the one server on the result. The served head then carries the work of both,
and the entry records `contains`: the commits that head is known to carry. A conflict surfaces here,
early, where the two changes actually meet, instead of at publication where it would block a finished
piece of work — and it is resolved here too, by rule and under a gate, rather than handed to a person
mid-merge. The integration branch is also merged from the mainline periodically, so it does not drift
into a state that nothing else shares.

## A consumer's own commit inside a shared head

Because one head carries several sessions' work, a consumer that demanded the served head equal the
commit it applied would fail every time a second session was present, and it would be failing on
arithmetic rather than on evidence. The test is ancestry: the applied commit must be an ancestor of
the served head. A surface that satisfies it carries the work under audit, whatever else it also
carries. Both commits are recorded — what was applied and what is served — because a reader who
cannot see the two cannot check the claim. Only a failed ancestry test is drift.

## A server that outlives the branch that started it

The server a rung starts is detached. It has to be: the branch that started it ends, and the audit or
the journey that needs it runs in another branch, sometimes in another session. A process nobody
recorded is then a process nobody can find, so the entry carries the whole of it — the exact command,
the pid, the log file under the session folder and the pid file beside it. The tree ships the helper
that does this (`scripts/serve-runtime.mjs`), and it is named here so that starting a server is one
recorded act rather than a shell line somebody improvised. The recorded pid is usually a wrapper
and the process answering on the port is its child, so the record names both when they differ, and a
stop stops the whole process tree of the recorded pid and no other tree, then proves by connecting
that the port no longer answers before the record is cleared; when something still answers, the
record stays and the result names the surviving listener by the pid the socket table gives, because
a cleared record over a held port is the fixed-port conflict the next start would refuse on.

A restart is not a rebuild. A framework's dev server compiles into a build cache under the worktree
and serves from it, and that cache is only as fresh as the install it was compiled against: when the
served head moves to one whose dependency manifests or lockfiles — the manifests the route declares,
and the lockfiles beside them — differ from those of the previously served record, a restart alone
keeps serving what the old dependencies compiled while the installed packages are already the new
ones, and what the audit then measures is a stylesheet or a chunk nobody ships any more. So every
rung that starts a server decides about the cache before it starts, and the helper makes that
decision rather than the operator remembering to: it digests the declared manifests and lockfiles,
compares the digest with the one the previous record carries, and clears the conventional build
directories of the worktree's packages when the digest differs, when no previous record is known,
or when `--clean` — which `reset` always passes — asks by name. The server record carries the
decision: whether the cache was cleared, for which of those reasons, which directories went and
which previous head it was compared against. A record that says the cache was kept while the
previous head is unknown, or that `reset` kept it, is refused, because a cache nobody can prove was
cleared is the same defect with a politer log line.

`serve` is idempotent by head. When the running server's head already contains the wanted commit and
its endpoint answers, the operation attests it and returns it: nothing is merged, nothing is
restarted, no new pid appears, and the receipt records that the head was reused. Restarting a healthy
server to be allowed to describe it destroys the state the next step was going to measure, which is
the same reason attestation never restarts anything. `restart` and `reset` exist for when a person
actually wants that, and they are asked for by name.

## The lease is the merge order

One session integrates at a time. The session that serves takes the lease while it merges and
restarts, and releases it when the server answers again; a session that asks while another holds it
is recorded in the queue, told its position and the holder, and waits. It is never given a second
server, because a second server is the contention the lease exists to remove. The wait is short by
construction: a lease is held for one merge and one restart, not for the length of an audit.

## A port in use is a coordination finding

A port already bound by another process is a fact about a shared machine, not permission to reclaim
it. The operation records `PORT_COORDINATION_REQUIRED` naming both the port and the process that
holds it, returns `PORT_CONFLICT`, and stops. It does not stop, kill, restart, or reconfigure the
holder, and no mutation may target a process observed holding a claimed port. Moving to another port
is not an answer either: the port is what every provider was configured against. Coordination is the
required next step and it belongs to the two owners, not to this invocation.

## Two sessions, one product

This is the one place the isolation law is written; the audit and the journey operators cite it and
do not restate it. Two sessions may work on one product at the same time when all five of these hold,
and each is a gate rather than an intention.

- One product, one integration branch, one server, one port: heads are merged in turn under the
  lease, and the backend, the identity realm and the database are shared and scoped rather than
  duplicated.
- Each flow's actors are its own account aliases, provisioned for that flow and named in its record.
- Each session drives its own browser profile, recorded in the run's own snapshot, so one session's
  cookies are never the other's session.
- Seeds are scoped by the flow's own prefix and touch no shared row: every seeded identifier carries
  that prefix, and the rollback lists those identifiers and nothing else.
- No operator writes another session's lease, account or run folder: the lease, the account's
  provisioning attribution and the run's snapshot all name the session that asked, and a write whose
  session differs is refused rather than merged.

## Attesting a runtime nobody restarted

A process that is already serving is evidence, not a problem. The runtime branch probes the endpoints
the entry declares, records the head it observes and the probe records behind it, and sets the entry's
status from what answered. Nothing is started, stopped or restarted to make that possible: a person's
own running service is registered exactly as it stands, because the alternative — restarting a
runtime in order to be allowed to describe it — destroys the state the next step was going to verify.
An entry whose endpoints do not answer is `SERVICE_UNAVAILABLE` against the endpoint that failed,
never a status this operator asserts on its own.

## A missing record is created, not reported

Provisioning is the default branch, not the exception. A flow with no folder, no flow document, no
seed and no account is a flow nobody has run yet, and the runtime creates all four: the flow document
and the seed are drafted from the shipped template and marked as drafts in the receipt, the account is
created at the provider the registry entry declares, its password is set from the sealed shared
credential resolved by name, and the seed is applied. Reporting any of that as an error is wrong, and
stopping at "a person must create an account" is the same error with a politer sentence. Two things
are genuinely not this operator's to invent, and they are the only stops on this path: a registry
entry that declares no identity at all is `INVALID_INPUT` naming the field it lacks, and a provider,
sealed file or store that cannot be reached is `PROVISIONING_UNAVAILABLE`.

## A credential is a name, and it reaches a form or a body

Before resolving a value, apply [the identity preflight](../../resources/identity.md) for the selected
operation through its fixed consuming helper.

One password is sealed per environment and every flow's account is set from it, while each flow owns
its own username. It is resolved by name at the moment of the call, and the only two places its value
may arrive are the request body of the provider's administrative call and the field of a sign-up form
in a driven browser. It never enters a file, a fixture, a recorded command, a capture or a receipt.
The account record this operator publishes therefore carries a username, a role, a credential name,
the sealed file's path and the registry entry it belongs to, and has nowhere to put a secret even by
accident.

A diagnostic is not a third place. A command run only to prove that a sealed value resolves reports
the outcome of resolution — that it resolved, the name it resolved by, and a length or a digest when
something more is needed to tell one resolution from another — and never the value. The value still
moves only from its store to the form or the body that consumes it, with nothing in between that
would render it: no intermediate the command echoes, prints or returns for a person or a transcript to
read. A diagnostic that cannot be written that way, because the only proof it knows how to give is the
value itself, is not run; the operator reports what it could not check rather than checking it
unsafely.

## Inventory before change

A shared service is inventoried before it is changed. The inventory is bound by fingerprint, so the
receipt states exactly what the service was when the decision was made, and a concurrent revision
becomes visible as `INVENTORY_DRIFT` rather than being silently overwritten. The recheck happens
before any mutation, so a differing revision stops the invocation while nothing has changed yet.
Anything mutated appears in the inventory echo, so a change to a resource nobody looked at first
cannot be reported as an operation at all. An already-converged service is a proved no-op with no
mutation, not a failure and not a rewrite, and a converged operation that reports no mutation is
refused because one of its two statements is false. Application touches only effects inside the
approved set, one resource at a time, recording the before and after revision of each; a partial
application is reported as `PARTIAL_MUTATION` with exact revisions and is never hidden behind a
generic blocker.

## Credentials are resolved, never recorded

A capability is a handle and its custody evidence. The credential behind it is resolved for use at
the moment of the call and is never logged, echoed into evidence, or persisted. The receipt refuses
the handle as well as the value, because a receipt is durable and a durable record of a capability is
a leaked credential with a delay; a string carrying credential material anywhere in the request or
the response is refused as malformed.

## The desired state is one approved declaration

`desiredState` is the whole of what the caller asks for: the approved plan hash, the service kind the
plan was written against, the resources to converge, the effects to apply, and the two scope sets that
say which resources may change and which may only be observed. Keeping it as one declaration is what
makes the approval mean something: `approval` covers that declaration, hash and all, so a field
edited afterwards no longer matches the hash the approval named.

Where the authority behind `approval` comes from is the environment's to say. Every environment of
the installation declares, per class of platform operation — identity provisioning, seeding, the
shared runtime's rungs, the stack's bring-up, release — whether its own declaration is the approval
(`declared`) or a person's approval id is required (`person`). The declaration's shape, its place in
the environment's folder, the defaults an omitted class takes by whether the environment is
production, and the one loosening a production declaration is refused are all the environment
schema's (`readiness/initialization/stacks/environment.schema.json`), stated there once and read from
there by the gate. `approval` therefore accepts either an approval id or
the declaration's reference — its path and the hash of its content — and the receipt's Approval row
records whichever was bound. The validator derives the operation's class from its branch and effects,
reads the declaration the reference names, and refuses the reference when the declaration is absent,
hashes differently, belongs to another environment, is refused by its schema, or marks that class
`person`; a hash that moved between the request and the run is `AUTHORITY_DRIFT`. `approval` still
has no default: a runtime other sessions and other people share is never changed on silence, and what
the declaration changes is that the environment's standing answer counts as the approval, not that the
question stops being asked. `portClaims` defaults to the empty list, because most operations need no
port at all and a claim nobody made cannot collide with anybody.

## Boundary

Context is read-only apart from the approved delta. The operator applies only the approved effect
delta on the inventoried shared service, under an exclusive lease on
`@worktrees/sessions/central-runtime`, and writes only `response/` of its own branch:
`data/delta.json`, `data/checks.json`, `response.md` and `response.json`. It also writes the flow folder of the flow it
provisions for and the runtime entry of the route it attests, and nothing else outside `response/`.
It is the one owner of a served runtime's lifecycle: it merges into the integration branch and
starts, restarts, resets and stops the server of a route the registry records, under a named rung,
and it stops only the process tree of the pid the entry itself recorded.
It does not deploy,
migrate, or otherwise take ownership of a product's deployed service; does not restart or reconfigure a
running process in order to attest it, and never restarts a healthy server nobody asked it to; does
not act while another session holds the lease; does not rebase, force or abandon a merge to make it
apply; does not mutate a resource the
bound inventory does not list; does not emit an effect or a check the bound service kind does not
publish; does not move a served port, or free one by stopping, killing, or reconfiguring the process that already holds
it; does not edit a running service's allowed origins in place of the declaration that should carry them; does not record a credential value, capability handle, or secret-shaped token anywhere in the
output, in the account record, or in the flow folder; does not ask a person to sign in, to create an
account, or to paste a credential; does not edit knowledge, write an environment's declaration, or otherwise grant its own approval; and does not claim an operated outcome
while any required check is absent or failed, nor any product readiness, release approval, or UAT
proof.

## Context

| Alias | Bind | Required |
| --- | --- | --- |
| `@worktrees/sessions/central-runtime` | the shared runtime owner: inventory, generation and health, bound by fingerprint and generation, written only under an exclusive lease | yes |
| `@workspaces/ports/<project>` | the port projection the runtime binds to | yes |
| `@workspaces/device-state` | capability handles by name and their custody; values never appear | yes |
| `@workspaces/projects/<project>/<role>` | which projects the shared services serve | no |
| `@worktrees/uat/<flow>` | the flow folder the identity branch writes: the account record, the drafted flow document and the seed | no |
| `@worktrees/_templates` | the flow template a missing flow folder is drafted from, consumed and never modified | no |

## Inputs

| Kind | From | Required |
| --- | --- | --- |


Administrator rotation uses the existing identity capability and requires an explicit approval id. The actual provider custody is proved from its credential mounts or captured bootstrap environment before consuming a value. The `identityRotation` binding names the exact provider, realm, credential name, principal fingerprint and protected custody write set; `stagingRefs` separately authorizes protected ciphertext staging. It runs alone, creates no UAT account and needs no flow. The delta repeats that binding and proves the new credential works, the old credential fails, the exact administrator sessions were invalidated and every declared custody projection agrees. The complete identity check set still applies. Stage ciphertext only, journal each provider and file effect separately, and retain encrypted recovery material until consistency is proved; a provider and several files are not one atomic transaction. Every consuming helper validates the frozen request and platform authority internally before effects.

## Requirements

| Field | Type | Default | Ask |
| --- | --- | --- | --- |
| `service` | id | — | The one shared service being operated |
| `desiredState` | `{planSha256, serviceKind, resourceRefs, effects, mutableResourceRefs, observationOnlyResourceRefs}` | — | The approved declaration: which plan, which branch, which resources, which effects, and what may change against what may only be observed |
| `portClaims` | list of `{port, resourceRef}` | [] | Which ports the desired state needs, and for which owned resource |
| `approval` | id | — | The authority that covers this desired state: an approval id, or the environment declaration's reference — its path and content hash — when that declaration marks this operation's class `declared` for `env`; no default, because silence is not consent |
| `routeKey` | id | null | The `<project>/<role>` registry entry this operation attests or provisions against; null when the operation touches no route |
| `operation` | choice | serve | The rung of the runtime ladder this invocation climbs: `stack-up`, `locate`, `start-role`, `serve`, `restart`, `reset` or `stop` |
| `commit` | id | null | The commit this session needs served, merged into the integration branch when the served head does not already contain it |
| `flow` | id | null | The flow whose dedicated identity is provisioned and whose folder receives the account record, the drafted document and the seed |
| `identityRotation` | `{provider, realm, credentialName, principalFingerprint, custodyRefs, stagingRefs}` | null | Required only for administrator rotation; exact bound principal and protected write set |
| `env` | id | dev | The stack the attested entry and the provisioned accounts belong to; an account of one stack is not an account in another |
| `resume` | token | null | The blocked branch's token when re-entering after a stop |

## Steps

| # | Step | Params | Reads | Writes | Stops with |
| --- | --- | --- | --- | --- | --- |
| 1 | Validate the gate and resume | `resume` | `request/request.json`, @worktrees/sessions/central-runtime at the frozen generation | — | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS` |
| 2 | Bind the authority: the runtime, the device state, the projects and the approval — an id, or the environment's declaration re-read and re-hashed | `service`, `approval`, `env` | @worktrees/sessions/central-runtime for the inventory fingerprint and generation, @workspaces/device-state for each capability handle with its custody evidence, @workspaces/projects/<project>/<role>, the environment's declaration when `approval` references it, @tools/secrets | — | `AUTHORITY_DRIFT`, `CAPABILITY_MISSING` |
| 3 | Recheck the inventory once before anything changes | — | @worktrees/sessions/central-runtime, the declared resources re-observed once, @tools/git | — | `INVENTORY_DRIFT` |
| 4 | Resolve the port claims against the projection, and observe who holds each | `portClaims` | @workspaces/ports/<project> for the projected ports, @worktrees/sessions/central-runtime for their observed holders | — | `PORT_CONFLICT` |
| 5 | Derive the delta between what is observed and what is desired | `desiredState` | @worktrees/sessions/central-runtime for the observed state, `request/request.json` for the desired state | `response/data/delta.json` | — |
| 6 | Apply the approved delta, one resource at a time, under an exclusive lease | — | @worktrees/sessions/central-runtime, @workspaces/device-state for the handles by name | @worktrees/sessions/central-runtime, `response/data/delta.json`, @tools/container, @tools/shell | `EFFECT_UNAUTHORIZED`, `SERVICE_UNAVAILABLE` |
| 7 | Climb the named rung for the bound route — bring the environment's infra up, resolve its checkouts, start a role, or merge this session's commit into the integration branch and serve, restart, reset or stop the one detached server, queueing behind a lease another session holds — then attest the entry: probe the endpoints, record the served head, what it contains and the evidence, and set the status | `routeKey`, `operation`, `commit`, `env` | @worktrees/sessions/central-runtime for the entry of that route with its server, lease and queue, @workspaces/projects/<project>/<role> for the role's dev command, the integration worktree and the session branch merged into it, the environment's declared infra, the endpoints re-observed once, @tools/git, @tools/http, @tools/container, @tools/shell | @worktrees/sessions/central-runtime, `response/data/delta.json`, `changes` | `SERVICE_UNAVAILABLE`, `PROVISIONING_UNAVAILABLE`, `INTEGRATION_FAILED`, `INVALID_INPUT` |
| 8 | Provision the flow's identity against that entry: read the account record or create the account, set its password from the sealed name, write the record, draft what is absent and seed; or rotate the explicitly bound administrator custody | `routeKey`, `flow`, `env`, `identityRotation` | @worktrees/uat/<flow> for the account record, the flow document and the seed, @worktrees/_templates for what is absent, @worktrees/sessions/central-runtime for the entry's identity declaration, @workspaces/device-state for the credential by name, @tools/secrets, @tools/http, @tools/browsercontrol, @tools/database | @worktrees/uat/<flow>, `response/data/account.json`, `response/data/delta.json`, @tools/sourcewrite | `INVALID_INPUT`, `PROVISIONING_UNAVAILABLE` |
| 9 | Prove every required check | — | @worktrees/sessions/central-runtime re-read against the branch's complete proof set, @tools/http | `response/data/checks.json` | `PROOF_FAILED` |
| 10 | Write the receipt and emit | — | everything above | `response/response.md`, `response/response.json` | — |

A resume begins again at validation, reuses only unchanged fingerprinted observations, and consumes
the exact delta; a resume that adds no authority, inventory, desired-state or scope change is
`NO_PROGRESS`, and a re-observed inventory must arrive as a new fingerprint because the same
fingerprint cannot yield a different answer.

A completed serve merge may emit changes for independent quality verification. Its Binding retains Operator, Step, Checkout and Predecessor and adds Base (the merge first parent, or the observed predecessor for a fast-forward), Head (the actual served merge) and Branch (the declared integration branch). Files is the exact Git diff from Base to Head. The platform validator reads that worktree and refuses a stale head, branch or file list; a queued, reused or failed serve emits no new integration changes. Raw gate evidence stays bound to this merged head.

## Outputs

| Kind | File | Type | Required |
| --- | --- | --- | --- |
| `platform-operation-receipt` | `response/response.md` | md | yes |
| `delta` | `response/data/delta.json` | data | yes |
| `checks` | `response/data/checks.json` | data | yes |
| `uat-account` | `response/data/account.json` | data | no |
| `changes` | `response/changes.md` | md | no |

## Stops

| Code | Disposition |
| --- | --- |
| `INVALID_INPUT` | terminate |
| `SOURCE_DRIFT` | terminate |
| `NO_PROGRESS` | terminate |
| `AUTHORITY_DRIFT` | terminate |
| `CAPABILITY_MISSING` | terminate |
| `INVENTORY_DRIFT` | terminate |
| `PORT_CONFLICT` | terminate |
| `EFFECT_UNAUTHORIZED` | terminate |
| `SERVICE_UNAVAILABLE` | terminate |
| `PROVISIONING_UNAVAILABLE` | terminate |
| `INTEGRATION_FAILED` | terminate |
| `PROOF_FAILED` | terminate |

## Next

| When | Operator |
| --- | --- |
| the routed checkout or its head no longer matches the frozen binding | `workspace.bind` |
| the runtime a frontend surface must be audited against is now serving | `frontend.surface.audit` |
| the shared service is operated and the release that waited on it may continue | `release.deploy` |
| the flow's identity is provisioned and the run that waited on it may verify the flow | `uat.verify` |
| a completed serve emits merged changes for independent delivery gates | `quality.verify` |
```

## FILE: .claude/operators/platform-operate/operator.json

SHA-256: 7e09cbe84fb7aeb0c126f9993e6b06765904ba933cb190457f7bd01769cbe257

```json
{
  "schemaVersion": 9,
  "id": "platform.operate",
  "domain": "platform",
  "job": "Operate one bounded shared service from exact evidence - observability, Sonar, tunnel, the runtime registry, or the identity a bound route authenticates against: inventory it, converge only the approved delta, prove every check the bound knowledge requires, and stop at the smallest owning gap instead of taking product deployment ownership.",
  "package": "operator.md",
  "errors": "errors.json",
  "validator": "validate.mjs",
  "selfTest": "self-test.mjs",
  "resources": {
    "profile": "luna",
    "grammarBound": false,
    "tools": {
      "@tools/fileread": "context-aliases",
      "@tools/git": "merge-into-integration-branch",
      "@tools/shell": "declared-commands",
      "@tools/http": "probe",
      "@tools/container": "operate",
      "@tools/secrets": "resolve-by-name",
      "@tools/sourcewrite": "declared-write-set",
      "@tools/browsercontrol": "required",
      "@tools/database": "namespaced-write"
    }
  }
}
```

## FILE: .claude/operators/platform-operate/errors.json

SHA-256: 73f801d1cd8b53da57df3871a41dd71db07dec9d56509dd66beef1037628777c

```json
{
  "schemaVersion": 9,
  "note": "Stop codes only platform.operate emits. Same entry shape as operators/errors.json, scope implicit. Shared codes (INVALID_INPUT, SOURCE_DRIFT, NO_PROGRESS, AUTHORITY_DRIFT) come from operators/errors.json.",
  "codes": {
    "CAPABILITY_MISSING": {
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "The capability the service kind requires is absent or names no custody evidence.",
        "vi": "Capability mà service kind đòi hỏi đang thiếu, hoặc không nêu bằng chứng custody nào."
      },
      "resume": {
        "en": "Supply the missing capability handle with its custody.",
        "vi": "Cấp handle capability còn thiếu cùng custody của nó."
      }
    },
    "INVENTORY_DRIFT": {
      "domain": "platform",
      "disposition": "terminate",
      "meaning": {
        "en": "A declared resource moved since the inventory was bound, so the plan describes a service that no longer exists.",
        "vi": "Một tài nguyên đã khai đã đổi kể từ khi inventory được ràng, nên kế hoạch mô tả một dịch vụ không còn tồn tại."
      },
      "resume": {
        "en": "Re-observe the inventory; it must arrive with a new fingerprint.",
        "vi": "Quan sát lại inventory; nó phải tới với một fingerprint mới."
      }
    },
    "PORT_CONFLICT": {
      "domain": "product",
      "disposition": "terminate",
      "meaning": {
        "en": "A claimed port is already held by another declared process, and holding it is not permission to reclaim it.",
        "vi": "Một cổng được claim đang bị một tiến trình đã khai khác giữ, và việc nó bị giữ không phải giấy phép giành lại."
      },
      "resume": {
        "en": "Agree a port, or the holder's owner releases it.",
        "vi": "Thoả thuận một cổng khác, hoặc chủ của kẻ đang giữ nhả nó ra."
      }
    },
    "EFFECT_UNAUTHORIZED": {
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "A required effect lies outside the approved effect set or outside the branch.",
        "vi": "Một effect cần thiết nằm ngoài tập effect đã duyệt hoặc ngoài nhánh."
      },
      "resume": {
        "en": "Approve the effect, or bring a narrower plan.",
        "vi": "Duyệt effect đó, hoặc mang một kế hoạch hẹp hơn."
      }
    },
    "SERVICE_UNAVAILABLE": {
      "domain": "provider",
      "disposition": "terminate",
      "meaning": {
        "en": "The shared service or its provider cannot be reached.",
        "vi": "Dịch vụ dùng chung hoặc provider của nó không tới được."
      },
      "resume": {
        "en": "Restore the provider.",
        "vi": "Khôi phục provider."
      }
    },
    "PROOF_FAILED": {
      "domain": "platform",
      "disposition": "terminate",
      "meaning": {
        "en": "A required check is missing, unreadable, or failed after apply, and an unproved operation is not an operated one.",
        "vi": "Một phép kiểm bắt buộc thiếu, không đọc được, hoặc hỏng sau khi áp, và một lần vận hành chưa chứng minh được thì chưa phải đã vận hành."
      },
      "resume": {
        "en": "Repair the service, then invoke again.",
        "vi": "Sửa dịch vụ, rồi gọi lại."
      }
    },
    "INTEGRATION_FAILED": {
      "domain": "product",
      "disposition": "terminate",
      "meaning": {
        "en": "serve resolved the merge conflict itself and gated the merged head, and a required gate came back red: the merged head does not pass the delivery gates. The receipt names the failing gate and the resolutions that were made.",
        "vi": "serve đã tự giải xung đột merge rồi chấm gate trên head đã gộp, và một gate bắt buộc trả về đỏ: head đã gộp không qua được các gate phát hành. Biên nhận nêu tên gate hỏng và những chỗ đã được giải xung đột."
      },
      "resume": {
        "en": "A person or the owning session repairs the session branch and asks to serve again; the merge that produced the failing head is never rebased, forced or abandoned to make it apply.",
        "vi": "Một người hoặc chính phiên sở hữu sửa nhánh phiên rồi xin serve lại; lần merge đã sinh ra head hỏng không bao giờ bị rebase, force hay bỏ qua để cho nó áp được."
      }
    }
  },
  "retired": {
    "INTEGRATION_CONFLICT": {
      "en": "Retired into INTEGRATION_FAILED. A merge conflict is no longer escalated to a person: serve resolves it itself under the closed rule set recorded in operator.md, records the resolution on the merge, and gates the merged head before restarting the server. INTEGRATION_FAILED is what stops now, and only when that gate comes back red.",
      "vi": "Đã nghỉ hưu, gộp vào INTEGRATION_FAILED. Một xung đột merge không còn bị đẩy lên cho con người: serve tự giải nó theo tập luật đóng ghi trong operator.md, ghi lại cách giải trên đúng lần merge, rồi chấm gate trên head đã gộp trước khi khởi động lại server. INTEGRATION_FAILED mới là thứ dừng lại bây giờ, và chỉ khi gate đó trả về đỏ."
    }
  }
}
```

## FILE: .claude/operators/quality-verify/operator.md

SHA-256: db0f67b66870fef9def22f9ada199968f3c73883a68ee61ce5ea0dbbfd5c5f12

```markdown
# quality.verify

## Job

Verify one bounded delivery by running its declared gates against an unchanged predecessor receipt
at one frozen head, and return the exact measured verdict, repairing nothing.

## One delivery, one head, at least one producer receipt

The three Inputs are the three shapes a delivery arrives in: a backend implementation, a frontend
source application, and the `changes` record that names which paths moved and which gates and
surfaces they touch. Each is optional on its own and at least one must be present, because a
verification with no producer receipt has no head to freeze and no delivery to measure. Every
predecessor receipt must report the same source head, and that head must be the head
`request/request.json` froze; two predecessors on different heads describe two different deliveries,
and gating the union of them measures something nobody built. That is `PREDECESSOR_MIXED`, refused
before a single command runs rather than discovered later as a confusing gate failure. A predecessor
whose fingerprint no longer matches the frozen source is `PREDECESSOR_STALE`. So is a predecessor
produced under `mode: dry`: it carries no commit and describes a plan rather than a delivery, its
change record says `nothing written` and its receipt's `Commit` reads `—`, and it is refused at step 2
before any command runs, because a plan has no head to stand on and gating the base head would
publish a green verdict about code nobody wrote. What a predecessor
decided is consumed unchanged: this operator never re-plans the delivery, re-opens its boundary, or
forms an opinion about whether the change was a good one.

## The head is confirmed inside the gate

There is no separate head-verification step, because a head confirmed anywhere but at the gate is a
head that could drift before the first command. The producer wrote its delivery on the session
branch `session/<sessionId>` of the routed checkout, in a git worktree prepared from the frozen head,
and committed it once. `request/request.json` therefore pins `@workspaces/be` or `@workspaces/fe` at
that exact commit sha in `contexts[].head`, and step 1 confirms the observed head equals it before
anything else happens; a difference is `SOURCE_DRIFT`. The predecessor receipt's own commit must
equal that same head, because a receipt describing a commit the gates are not standing on is
`PREDECESSOR_STALE`. Every gate runs inside that session branch worktree and never on the person's
checked-out branch, so a gate result names one commit somebody can check out again.

## A red gate is a verdict, not a stop

Quality measures. It does not repair, redesign, reclassify, or negotiate. A failing gate produces a
red verdict naming the failure and its classification, and that verdict goes back to the owner who
can fix it; the branch is `done`, not `blocked`, because the operator did exactly what it was asked
to do. Only an inability to reach any verdict at all is a stop. The operator does not touch product
source, does not adjust a gate command or its configuration to change an outcome, and does not
substitute an easier check for a hard one.

## A gate result is measured, never narrated

Every executed gate carries its command reference, its exit code, and its evidence, in its own file
under `response/data/gates/`. One file per gate is what makes a gate result quotable on its own: a
later reader opens `lint.json` and sees one command, one exit code, one classification, without
reading around a bundle. A pass means exit code zero with evidence beside it; a failure means a
non-zero exit code with evidence and a classification. The classification is read from the structured
diagnostics after the command ran, never chosen before it: `in-boundary` when the delivery owner can
fix it, `boundary-drift` when fixing it would change an approved boundary, `flaky` when identical
source and environment produced contradictory outcomes, and `external-blocker` when the environment
or a dependency prevented a verdict at all. A rerun exists to tell those four apart. It never exists
to convert an unexplained failure into a pass. No gate is skipped, suppressed, substituted, or moved
with `passWithNoTests`, and a zero-test run is not a pass. Every gate file records the same source
head, because two gates standing on two heads measured two deliveries.

## Two facts about this codebase

Sonar measures new code only. The pinned gate is scoped to the change, so a green Sonar result is a
statement about the diff and not about the project, and a project may sit red beneath it. Under the
default `sonarScope` of `new-code`, a passing Sonar result is recorded together with a
`SONAR_NEW_CODE_ONLY` finding; without it a later reader takes a green gate for project health, which
is the exact misreading this operator exists to prevent.

End-to-end is never run unless a person asked for it in this invocation, which is why
`explicitE2eRequest` defaults to false. Otherwise the gate is recorded as `skipped-not-requested`
with an `E2E_NOT_REQUESTED` finding: no command, no exit code, no evidence, and no implication that
behaviour was proved. Planning the e2e gate without that request is invalid input.

## A frontend delivery is swept as well as compiled

Format, lint, typecheck and build measure whether the source is well formed. None of them measures
which node a class landed on, so a page that layers `flex-col items-start sm:flex-row` onto a Grammar
object whose CSS already owns the collapse compiles clean, lints clean, and ships. The
`presentation-sweep` gate closes that hole: `node scripts/sweep-presentation.mjs` runs over the
delivered write set and returns `APP_OVERRIDE`, `APP_REIMPLEMENTATION`, `OFF_SCALE` and
`SHELL_GEOMETRY` findings with their file, line and offending token. It is planned whenever the
delivery carries a `frontend-source-application`, and a request that names a frontend delivery without
it is invalid input. `frontend.source.apply` runs the same sweep on the projection before it writes;
this gate runs it on what was actually delivered, because the two are only the same tree when nothing
went wrong between them. A finding here is a red gate and therefore a verdict, not a stop: it goes
back to the frontend owner exactly like a failing test.

## Coverage carries four thresholds, not one

Statements, lines, functions and branches are each compared against their own threshold, and
branches carry an independent one because a branch threshold folded into the statement figure is how
an untested error path passes. The thresholds default to the four percentages the routed gate
configuration already pins, so a person who names none is measured against the project's own bar. A
metric under its threshold makes the unit gate a failure and records `COVERAGE_BELOW_THRESHOLD`; it
is never a note beside a green result.

## Debt is explicit and owned

A gate stays red only when an owner-approved debt record covers it, naming the debt, the gate, the
approval, the owner and the expiry, and only when that approval is still live at the instant the
gate was measured. An expired approval is not a debt and a debt against a gate that passed is a
record of nothing; both are refused as `DEBT_UNAPPROVED`. A debt covers only an `in-boundary`
failure, the kind the delivery owner can fix; a `boundary-drift` failure belongs to whoever owns the
boundary and cannot be owed away here. `declaredDebts` defaults to the empty list, so carrying a red
gate is always something a person did on purpose.

## The scorecard is copied, never rescored

The gates say whether the delivery is well formed. They say nothing about whether the surface is good,
reachable, truthful or usable, and those questions were already answered by the operators that
observed the running product: `frontend.surface.audit` closed eight proof topics on its captures, and
`uat.verify` closed the experience topic on its run. This operator reads both receipts and writes one
`## Verdict` table: one row per topic, each verdict and route copied from the receipt that computed
it. It may not rescore a topic, may not average across rows, and may not substitute its own judgement
for a measurement it did not take.

The line under that table is the whole answer. Any row missing, or `blocked`, makes it `blocked`,
because a topic nobody observed has earned neither a pass nor a failure. Any row `fail` or
`fix-first` makes it `fix-first`, and the receipt names that row and the route it carries. Only when
every row ships or passes is it `ship`. Two failing rows are both reported with their own routes;
collapsing them into one composite, or reporting only the first, hides the second owner.

## The verdict

`pass` requires every required gate to have passed, or to have failed `in-boundary` under a declared
debt. Every other shape is `fail`, including a required gate the environment blocked: an unmeasurable
gate is not a passed one. A non-required gate that fails is recorded and does not by itself turn the
verdict red, which is the whole reason `required` exists, and it is the gate plan's declaration and
never this operator's judgement.

## Boundary

Context is read-only. The operator writes only `response/` of its own branch: one `gate-result` file
per gate under `response/data/gates/`, `data/coverage.json`, `response.md` and `response.json`. It
does not modify product source, configuration, or a gate command; it does not redesign, repair, or
reclassify a measured failure into a pass; it does not run the end-to-end suite unasked; it does not
add, weaken, skip, suppress, or substitute a declared gate; it does not read a project-level Sonar
verdict out of a new-code quality gate; and it does not carry a debt no owner approved or whose
approval expired.

Gate results retain their actual measured branch in sessionBranch. A non-session value requires the changes input emitted by a completed platform.operate serve at that integration branch and merged head; the producer delta and actual Git diff are checked. Do not relabel integration evidence with a session branch.

## Context

| Alias | Bind | Required |
| --- | --- | --- |
| `@workspaces/<project>/<role>/gates` | the pinned gate commands, their configuration and the thresholds they carry; what "the same gate" means across runs | yes |
| `@workspaces/be` | the routed backend checkout at the pinned commit, the subject every gate measures when the delivery is a backend | no |
| `@workspaces/fe` | the routed frontend checkout at the pinned commit, the subject every gate measures when the delivery is a frontend | no |
| `@worktrees/debts` | owner-approved debt records and their expiry; a red gate is carried only from here | no |

## Inputs

| Kind | From | Required |
| --- | --- | --- |
| `backend-source-application` | `backend.source.apply`, the backend delivery to verify | no |
| `frontend-source-application` | `frontend.source.apply`, the frontend delivery to verify | no |
| `changes` | `backend.source.apply`, `frontend.source.apply`, `library.source.apply`, `dependency.update` or a completed `platform.operate` serve, the paths that moved and the gates and surfaces they name | no |
| `frontend-surface-audit` | `frontend.surface.audit`, the eight proof topics it closed at the same head | no |
| `uat-flow-verification` | `uat.verify`, the experience topic it closed at the same head | no |

## Requirements

| Field | Type | Default | Ask |
| --- | --- | --- | --- |
| `gates` | list of `{gate, commandRef, configRef, required}` | the routed gate plan | Which pinned gates to run, once each, from format, lint, typecheck, build, unit-coverage, integration, e2e, sonar and presentation-sweep |
| `thresholds` | list of `{statements, lines, functions, branches}` | the four percentages the routed gate configuration pins | The percentage each coverage metric must meet, branches on its own |
| `explicitE2eRequest` | choice | false | false unless a person asked for the end-to-end suite in this invocation; true only then |
| `sonarScope` | choice | new-code | new-code or overall; it must agree with whether sonar is in the gate plan |
| `declaredDebts` | list of `{debtId, gate, approvalRef, ownerRef, expiresAt}` | [] | Owner-approved debts that let a named gate stay red |
| `resume` | token | null | The blocked branch's token when re-entering after a stop |

## Steps

| # | Step | Params | Reads | Writes | Stops with |
| --- | --- | --- | --- | --- | --- |
| 1 | Validate the gate, confirm the frozen head and the resume | `resume` | `request/request.json`, @workspaces/be or @workspaces/fe at the commit the request pinned, @tools/git | — | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS` |
| 2 | Consume the predecessors unchanged | — | inputs `backend-source-application`, `frontend-source-application` and `changes` at their fingerprints, and the commit each one recorded | — | `PREDECESSOR_MIXED`, `PREDECESSOR_STALE` |
| 3 | Run the gates in declared order | `gates`, `explicitE2eRequest`, `sonarScope` | @workspaces/<project>/<role>/gates, @workspaces/be or @workspaces/fe as the subject each gate measures, @tools/http | `response/data/gates/<gate>.json`, @tools/shell | `GATE_UNAVAILABLE` |
| 4 | Apply the coverage policy | `thresholds` | `response/data/gates/<gate>.json` of the unit gate | `response/data/coverage.json` | — |
| 5 | Classify each failure from its diagnostics | — | `response/data/gates/<gate>.json` of every red gate | — | — |
| 6 | Apply approved debt | `declaredDebts` | @worktrees/debts, `response/data/gates/<gate>.json` | — | `DEBT_UNAPPROVED` |
| 7 | Copy each topic verdict from the receipt that computed it | — | inputs `frontend-surface-audit` and `uat-flow-verification` at the same pinned head | — | `PREDECESSOR_MIXED` |
| 8 | Compute the gate verdict and the scorecard, write the receipt and emit | — | everything above | `response/response.md`, `response/response.json`, `audit-scope` | — |

A gate that could not be executed at all in this environment is `GATE_UNAVAILABLE` when it was
required; a non-required gate the environment blocked is recorded as `external-blocker` and the
verdict absorbs it. There is no repair code, because repair is not this operator's job: an
`in-boundary` failure returns as a red verdict to the owner who can fix it, and the fixed delivery
comes back as a new head with a new predecessor fingerprint. A resume reuses only unchanged
fingerprinted observations and consumes the exact delta; a resume that adds no predecessor, gate,
debt or source change is `NO_PROGRESS`, because the same fingerprint cannot yield a different answer.


When the admitted audit carries scope, run `node scripts/audit-scope.mjs <branch>` to copy
`verdicts.auditScope` unchanged into `response/data/audit-scope.json` and list the `audit-scope`
output kind. The receipt includes `## Audit scope`, a `Field | Value` table preserving Mode,
Coverage claim and Deferred states. The verdict has only that scope; deferred states do not become
passed because quality gates or UAT pass. Quality thresholds and frozen UAT cases remain unchanged.

## Outputs

| Kind | File | Type | Required |
| --- | --- | --- | --- |
| `quality-verification` | `response/response.md` | md | yes |
| `gate-result` | `response/data/gates/<gate>.json` | data | yes |
| `coverage` | `response/data/coverage.json` | data | no |
| `audit-scope` | `response/data/audit-scope.json` | data | no |

## Stops

| Code | Disposition |
| --- | --- |
| `INVALID_INPUT` | terminate |
| `SOURCE_DRIFT` | terminate |
| `NO_PROGRESS` | terminate |
| `PREDECESSOR_MIXED` | terminate |
| `PREDECESSOR_STALE` | terminate |
| `GATE_UNAVAILABLE` | terminate |
| `DEBT_UNAPPROVED` | terminate |

## Next

| When | Operator |
| --- | --- |
| a backend gate failed in boundary and the backend owner must fix it | `backend.source.apply` |
| a frontend gate failed in boundary and the frontend owner must apply the fix | `frontend.source.apply` |
| the verdict is green and the delivery is ready to publish | `git.publish` |
| the verdict is green and the published head must reach an environment | `release.deploy` |
| the gates are green and the promise must be reconciled against the delivered source | `business.decide` |
| the gates are green and a person asked for the journey to be walked | `uat.verify` |
```

## FILE: .claude/operators/quality-verify/operator.json

SHA-256: d2f1d5aa866794b976d12a19c890369acfe5b8488c5dc6770329f6d5c081b3ef

```json
{
  "schemaVersion": 9,
  "id": "quality.verify",
  "domain": "quality",
  "job": "Verify one bounded delivery by running its declared gates against an unchanged predecessor receipt at one frozen head, and return the exact measured verdict, repairing nothing.",
  "package": "operator.md",
  "errors": "errors.json",
  "validator": "validate.mjs",
  "selfTest": "self-test.mjs",
  "resources": {
    "profile": "luna",
    "grammarBound": false,
    "tools": {
      "@tools/fileread": "context-aliases",
      "@tools/git": "read",
      "@tools/shell": "declared-commands",
      "@tools/http": "probe"
    }
  }
}
```

## FILE: .claude/operators/quality-verify/errors.json

SHA-256: 78f37c3fe945f776c531d4d31d4c8c628b5a56660e4ef3b60ef399bb9523a917

```json
{
  "schemaVersion": 9,
  "note": "Stop codes only quality.verify emits. Same entry shape as operators/errors.json, scope implicit. Shared codes (INVALID_INPUT, SOURCE_DRIFT, NO_PROGRESS) come from operators/errors.json.",
  "codes": {
    "PREDECESSOR_MIXED": {
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "Two predecessor receipts describe different source heads, so their union is a delivery nobody built.",
        "vi": "Hai biên bản tiền nhiệm mô tả hai source head khác nhau, nên hợp của chúng là một delivery chẳng ai xây."
      },
      "resume": {
        "en": "Supply one coherent predecessor set on one head.",
        "vi": "Cấp một bộ tiền nhiệm nhất quán trên cùng một head."
      }
    },
    "PREDECESSOR_STALE": {
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "A predecessor fingerprint no longer matches the frozen source.",
        "vi": "Fingerprint của một tiền nhiệm không còn khớp source đã đóng băng."
      },
      "resume": {
        "en": "Bring a refreshed upstream receipt.",
        "vi": "Mang biên bản thượng nguồn đã làm mới."
      }
    },
    "GATE_UNAVAILABLE": {
      "domain": "platform",
      "disposition": "terminate",
      "meaning": {
        "en": "A required gate cannot be executed at all in this environment, and an unmeasurable gate is not a passed one.",
        "vi": "Một cổng bắt buộc hoàn toàn không chạy được ở môi trường này, và cổng không đo được không phải cổng đã qua."
      },
      "resume": {
        "en": "Provide a working gate environment.",
        "vi": "Cấp một môi trường chạy cổng hoạt động được."
      }
    },
    "DEBT_UNAPPROVED": {
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "A declared debt has no live owner approval, or it covers a gate that passed or a boundary-drift failure.",
        "vi": "Một khoản nợ đã khai không có phê duyệt còn sống của chủ, hoặc phủ lên một cổng đã pass hay một lỗi boundary-drift."
      },
      "resume": {
        "en": "Supply the unexpired owner approval, or drop the debt.",
        "vi": "Cấp phê duyệt của chủ còn hạn, hoặc bỏ khoản nợ."
      }
    }
  }
}
```

## FILE: .claude/operators/release-deploy/operator.md

SHA-256: 517c8139db93b6ce0d70734fdbc9eaec35cf1d46ad662ccbe5fe820a829d043f

```markdown
# release.deploy

## Job

Deploy one immutable release to one declared target under its declared authorization and prove the
steady state it reached, taking the recovery or rollback branch inside the same pass rather than
assuming the rollout succeeded.

## Source migration releases

A non-null `migration` requirement selects a source migration release. Its `planRef` is
`request/migration-release.json`; its `sha256` freezes the exact bytes shaped by
`templates/kinds/migration-release-plan.schema.json`. The route input supplies the checkout, and the
backend source application and passing quality input prove the same source commit. The plan names
the exact migration files, a source-owned runner, its configuration, the connection custody reference,
and the migration journal boundary. The runner is written and proved by the backend owner before
this operator consumes it. A missing runner returns to that owner; this operator creates no runner.

This branch is limited to an existing non-production environment and uses that environment's
`release` authorization class. The plan freezes the environment declaration bytes with
`environmentSha256` and matches exactly one `migrationTargets` entry by project, target and
connection reference. Its connection fingerprint and journal schema must match that authority.
A sealed `usernameRef` uses the environment owner's privately prepared full connection commitment;
the executor never resolves or records the username. A seed or runtime grant does not authorize it. The request gate
validates the producer receipts, immutable files and actual checkout head before effects. Run
`scripts/migration-release-run.mjs <runtime-root> <branch>` through the declared shell grant; its
internal gate repeats the authorization and source checks immediately before each apply. The fixed
runner receives only `migration-release-input.schema.json` JSON and returns the closed
`migration-release-runner` kind. It independently compares the expected connection, complete pending
set, journal existence and full-row journal fingerprint immediately before effects. Inspect reads
without creating the journal. Journal initialization requires the plan's explicit permission.

The first apply fills exactly the declared migration set; readback preserves every prior journal row.
A second invocation proves no pending migration and no journal change. Successful stdout is preserved
verbatim inside hashed transcripts only after its closed schema passes; a failed or malformed process
returns output hashes and a failure category. Resolved values and arbitrary process output are never
persisted. Failure or uncertainty blocks without retrying a partial effect or running a down migration.
This branch emits `migration-release` and `migration-release-proof`, with outcome `migrated` and an
observed no-op replay. It uses no image rollout, public readiness series or image rollback identity.
The image deployment branch below retains its own required outputs and recovery sequence.

## Recovery and rollback are branches of this job

A rollout that does not stabilize is still this operator's problem. The run ends on one of three
terminals and never in the middle: the release is deployed, the previous release is restored, or the
work is blocked with an exact reason. A restored release is its own terminal outcome; it must never
be read as successful delivery of the release it rejected.

## The release is immutable and exact

A release is identified by its `sha256:` digest, not by a tag, a branch, or a build number. The
artifact is never rebuilt, retagged, or substituted inside this pass; if the digest cannot be
resolved the run blocks rather than building a replacement and calling it the same release. The
manifest must have been validated against exactly this release, because a manifest pinned to another
release is how an unreviewed image reaches a reviewed target.

## Authorization is declared, never implied

Deployment requires its own declared grant covering this project, this environment, this target and
the `deploy` action, still valid at the moment the target was observed. No ordinary task, no
precedent from a sibling project and no urgency implies it, and an unauthorized deployment does not
become authorized by being useful. Destructive loss, a credential rotation, or a new host, domain,
tenant or project leaves this operator's authority entirely and returns `APPROVAL_REQUIRED`.

## Credentials are names, never values

Handles are resolved through existing custody at the moment they are needed. A resolved value never
enters the plan, the manifest, the receipt, a log line, a command argument, or a message. The receipt
records which handles were resolved and nothing more, and no field in the contract can hold a value
even if someone tried: a token written where a `secret-ref://` handle belongs is rejected as
malformed rather than quietly carried into an argument list. Step 3's resolution check is a diagnostic
under the same law `platform.operate` states for its own identity branch: proving `CREDENTIAL_UNAVAILABLE`
does not apply reports that a handle failed to resolve, never what it resolved to.

## Every effect is a compare-and-set

A step either mutates a boundary or it does not. The mutating steps are `host-prepare`,
`artifact-publish`, `migrate`, `domain-reconcile`, `rollout`, `recover` and `rollback`, and each
records the observed revision of its own boundary before and after. A desired state that already
matches is a proved idempotent no-op and is recorded as one; claiming an application without moving
a revision is refused, and a reading step that reports a revision has invented a fact about a
boundary it never touched. The execution root is ignored and rebuildable.

## Monitoring distinguishes progressing from failing

On this project a push to `main` triggers the workflow and boot takes roughly eight to nine minutes,
so `progressing` is the expected condition for most of the window and is never treated as a failure,
and a monitoring deadline shorter than the window it must contain produces a guaranteed false
failure. One transient probe never becomes recovery: a failing condition has to persist across at
least two observations. A release that is neither this release nor the one it replaces stops the run
as `CONCURRENT_DRIFT` and forces a replan; it is never recovered or rolled back as though it
belonged here. Recovery repeats only approved reversible actions, numbers its attempts contiguously
from one, preserves the same release identity, and cannot end in a deployment once exhausted.
Rollback is valid only when the exact safe release still exists, the current data and schema state
remain compatible with it, and the revision actually moved.

## Steady state is proved, not assumed

A rollout that returned without an error is not a deployment. Steady means the immutable digest is
active, every declared target is available, no superseded target remains active unless the strategy
permits it, the window elapsed in full, and every declared probe passed across the whole of it. That
is what turns three silent failures into detectable ones: the workflow finished while the old digest
is still serving traffic; one of two targets never came back and the other absorbed the load; the
readiness probe passed once, at the one moment it happened to be asked. At least one declared probe
is public, because a run observing only container health proves nothing a user could see; here the
GraphQL typename probe returning `200` is the readiness signal.

## The two fallbacks are ordered, and the rest terminate

A failed rollout is not the end of the run, it is the entry to the first fallback: `ROLLOUT_FAILED`
takes the recovery branch, which repeats only approved reversible actions against the same release
identity. When those run out, `RECOVERY_EXHAUSTED` takes the second fallback: rollback to
`rollbackIdentity` by its exact digest. Both are recorded under `## Fallbacks taken`, because a
branch taken silently is a branch nobody can audit. After that there is nothing left to try, so
`ROLLBACK_IDENTITY_MISSING`, `STEADY_STATE_UNPROVEN` and `CONCURRENT_DRIFT` terminate: a rollback
without its safe release, a window that never closed, and a foreign release that appeared mid-run are
each a state this operator must not act further on.

## Deadlines and probes have defaults, approval does not

`steadyDeadline` defaults to 600 seconds because that is the boot time this project actually shows,
and `probes` default to the set the validated manifest declares, so a person who names neither is
still measured against something real. `approval` has no default at all: changing what production
serves is always something a person said yes to.

## Boundary

Context is read-only apart from the declared mutations. The operator applies only the declared host,
migration, domain and rollout mutations against the frozen release identity, restores the exact
declared rollback release when that branch is taken, and writes only `response/` of its own branch:
`response.json` and the selected branch's pair: `data/probes.json` with `response.md`, or
`migration-release.md` with `data/migration-release.json` and its hashed `artifacts/migration-1.log`
and `artifacts/migration-2.log` transcripts. It does not log, persist, echo, or return a
resolved credential value; does not deploy a release the declared authorization does not cover; does
not rebuild, retag, or otherwise alter the immutable artifact identified by the frozen digest; does
not edit the intent or revalidate the manifest into something else; does not recover or roll back a
release that appeared during execution and does not belong to this run; does not report a rolled-back
run as successful delivery of the rejected release; and does not declare steady state from a single
probe observation or from an assumed rollout.

## Context

| Alias | Bind | Required |
| --- | --- | --- |
| `@remote/ghcr/<image>` | the immutable image by digest, required for the image branch | no |
| `@workspaces/be` | the route input's backend checkout at the frozen source commit, required for a migration release | no |
| `@workspaces/device-state` | credential handles by name and their custody; values never appear | yes |
| `@remote/github-actions/<runId>` | CI evidence of the build and the rollout, read only | no |

## Inputs

| Kind | From | Required |
| --- | --- | --- |
| `quality-verification` | `quality.verify`; passing verification at the release source commit | yes |
| `backend-source-application` | `backend.source.apply`; the applied migration contract and source-owned runner | no |
| `route` | `workspace.bind`; the source checkout and route authority for a migration release | no |

## Requirements

| Field | Type | Default | Ask |
| --- | --- | --- | --- |
| `release` | id | — | The immutable release identity being deployed, with the `sha256:` digest that identifies it |
| `target` | id | — | The one target this deployment may change, and the environment it sits in |
| `approval` | id | — | The declared deploy grant covering this project, environment and target; changing what production serves always needs a person |
| `probes` | list of `{probeId, kind, endpointRef, expectStatus}` | the probes the validated manifest declares | What steady state is measured by; at least one probe is public |
| `steadyDeadline` | number | 600 | The bounded monitoring deadline in seconds, measured against the boot time this project shows |
| `migration` | `{planRef, sha256}` | null | The exact source migration plan; selects the migration branch |
| `rollbackIdentity` | `{releaseId, artifactRef, digest, dataCompatible}` | null | The exact safe release the rollback fallback restores, by digest |
| `resume` | token | null | The blocked branch's token when re-entering after a stop |

## Steps

| # | Step | Params | Reads | Writes | Stops with |
| --- | --- | --- | --- | --- | --- |
| 1 | Validate the gate, the authorization the input carries, and the resume | `resume` | `request/request.json`, input `quality-verification` as the authorization this run stands on | — | `INVALID_INPUT`, `AUTHORIZATION_MISSING`, `NO_PROGRESS` |
| 2 | Bind the release and compile the plan | `release`, `target`, `approval`, `migration` | @remote/ghcr/<image> at the frozen digest, @remote/github-actions/<runId> for the observed state, or the migration plan and inputs `route`, `backend-source-application`, `quality-verification` at the frozen source head; @tools/git, @tools/ci | — | `MANIFEST_INVALID`, `APPROVAL_REQUIRED` |
| 3 | Initialize the execution root and resolve the credentials by name | — | @workspaces/device-state for the declared handles and their custody, @tools/secrets | — | `CREDENTIAL_UNAVAILABLE` |
| 4 | Prepare the host, publish the artifact by digest, migrate and reconcile the domain | — | @remote/ghcr/<image> for the artifact by digest, @remote/github-actions/<runId> for each boundary's revision before and after | @tools/shell | `HOST_UNAVAILABLE`, `ARTIFACT_MISSING`, `MIGRATION_BLOCKED`, `DOMAIN_UNRECONCILED` |
| 5 | Roll out | — | @remote/ghcr/<image> for the target revision before and after | @tools/container | `ROLLOUT_FAILED` |
| 6 | Monitor within the deadline, with backoff | `steadyDeadline`, `probes` | @remote/github-actions/<runId> for the probe observations across the window, @tools/http | `response/data/probes.json` | — |
| 7 | Detect concurrent drift before acting | — | `response/data/probes.json`, @remote/ghcr/<image> for the active release by digest | — | `CONCURRENT_DRIFT` |
| 8 | Take the recovery branch when the failure persists | — | `response/data/probes.json`, @remote/ghcr/<image> at the same release identity | @tools/container | `RECOVERY_EXHAUSTED` |
| 9 | Take the rollback branch when recovery cannot hold | `rollbackIdentity` | @remote/ghcr/<image> at the exact safe digest | @tools/container | `ROLLBACK_IDENTITY_MISSING` |
| 10 | Prove the selected branch's outcome, write the receipt and emit | — | everything above | `response/response.md`, `response/migration-release.md`, `response/data/migration-release.json`, `response/response.json` | `STEADY_STATE_UNPROVEN` |

For a migration release, steps 1–4 bind the route, backend and quality inputs and run the fixed migration helper; step 10 emits its migration receipt and proof. The image rollout, monitoring and fallback steps do not run. The validator requires exactly the output pair of the selected branch. For an image release, the GHCR context and rollback identity remain required.

Steps 8 and 9 are the two fallbacks in order, not a sequence every run walks: a run enters step 8
only under `ROLLOUT_FAILED` and step 9 only under `RECOVERY_EXHAUSTED`, and a run that took neither
records the branch as `none`. A resume begins again at validation, reuses only unchanged fingerprinted
observations, and keeps the same release identity, because a different release is a different
deployment; a resume that adds no authorization, manifest, credential or observation change is
`NO_PROGRESS`.

## Outputs

| Kind | File | Type | Required |
| --- | --- | --- | --- |
| `release-deployment` | `response/response.md` | md | no |
| `probes` | `response/data/probes.json` | data | no |
| `migration-release` | `response/migration-release.md` | md | no |
| `migration-release-proof` | `response/data/migration-release.json` | data | no |

## Stops

| Code | Disposition |
| --- | --- |
| `INVALID_INPUT` | terminate |
| `NO_PROGRESS` | terminate |
| `AUTHORIZATION_MISSING` | terminate |
| `MANIFEST_INVALID` | terminate |
| `APPROVAL_REQUIRED` | terminate |
| `CREDENTIAL_UNAVAILABLE` | terminate |
| `HOST_UNAVAILABLE` | terminate |
| `ARTIFACT_MISSING` | terminate |
| `MIGRATION_BLOCKED` | terminate |
| `DOMAIN_UNRECONCILED` | terminate |
| `ROLLOUT_FAILED` | fallback |
| `RECOVERY_EXHAUSTED` | fallback |
| `CONCURRENT_DRIFT` | terminate |
| `ROLLBACK_IDENTITY_MISSING` | terminate |
| `STEADY_STATE_UNPROVEN` | terminate |

## Next

| When | Operator |
| --- | --- |
| the host, the artifact registry, the credential custody or the safe release needs a shared runtime change | `platform.operate` |
```

## FILE: .claude/operators/release-deploy/operator.json

SHA-256: 76a0635a15d5213f6ddfe4d818d28b711f0d8cb386ed5725cca3c1e13d1322cb

```json
{
  "schemaVersion": 9,
  "id": "release.deploy",
  "domain": "deployment",
  "job": "Deploy one immutable release to one declared target under its declared authorization and prove the steady state it reached, taking the recovery or rollback branch inside the same pass rather than assuming the rollout succeeded.",
  "package": "operator.md",
  "errors": "errors.json",
  "validator": "validate.mjs",
  "selfTest": "self-test.mjs",
  "resources": {
    "profile": "luna",
    "grammarBound": false,
    "tools": {
      "@tools/fileread": "context-aliases",
      "@tools/git": "read",
      "@tools/shell": "declared-commands",
      "@tools/http": "probe",
      "@tools/container": "operate",
      "@tools/ci": "read",
      "@tools/secrets": "resolve-by-name"
    }
  }
}
```

## FILE: .claude/operators/release-deploy/errors.json

SHA-256: 6f5e55f64a4059603562d7a9fb28dbe47b430259e8cf25001907a0593cd5569b

```json
{
  "schemaVersion": 9,
  "note": "Stop codes only release.deploy emits. Same entry shape as operators/errors.json, scope implicit. Shared codes (INVALID_INPUT, NO_PROGRESS) come from operators/errors.json; APPROVAL_REQUIRED is defined by business.decide and belongs in operators/errors.json with both operators in scope. ROLLOUT_FAILED and RECOVERY_EXHAUSTED are the two ordered fallbacks: a failed rollout takes the recovery branch, and exhausted recovery takes the rollback branch; everything after that terminates.",
  "codes": {
    "AUTHORIZATION_MISSING": {
      "domain": "approval",
      "disposition": "terminate",
      "meaning": {
        "en": "No declared grant covers this project, environment, target, or the deploy action, or it had expired when the target was observed.",
        "vi": "Không grant nào đã khai phủ project, môi trường, target hay hành động deploy này, hoặc nó đã hết hạn lúc target được quan sát."
      },
      "resume": {
        "en": "Supply the declared authorization, still valid.",
        "vi": "Cấp thẩm quyền đã khai và còn hiệu lực."
      }
    },
    "MANIFEST_INVALID": {
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "The validated manifest is pinned to another release, and that substitution is how an unreviewed image reaches a reviewed target.",
        "vi": "Manifest đã kiểm được ghim vào một release khác, và phép thay thế đó chính là cách một image chưa duyệt tới được target đã duyệt."
      },
      "resume": {
        "en": "Bring a manifest validated against this release.",
        "vi": "Mang một manifest đã kiểm đúng với release này."
      }
    },
    "ARTIFACT_MISSING": {
      "domain": "provider",
      "disposition": "terminate",
      "meaning": {
        "en": "The immutable digest cannot be resolved, and no replacement may be built and called the same release.",
        "vi": "Digest bất biến không phân giải được, và không được build một cái thay thế rồi gọi nó là cùng release."
      },
      "resume": {
        "en": "Publish the artifact at that digest.",
        "vi": "Publish artifact ở đúng digest đó."
      }
    },
    "CREDENTIAL_UNAVAILABLE": {
      "domain": "platform",
      "disposition": "terminate",
      "meaning": {
        "en": "A declared handle cannot be resolved through existing custody.",
        "vi": "Một handle đã khai không phân giải được qua custody đang có."
      },
      "resume": {
        "en": "Restore the custody; never an inline value.",
        "vi": "Khôi phục custody; không bao giờ nhập giá trị trực tiếp."
      }
    },
    "HOST_UNAVAILABLE": {
      "domain": "provider",
      "disposition": "terminate",
      "meaning": {
        "en": "The declared host cannot be prepared.",
        "vi": "Host đã khai không chuẩn bị được."
      },
      "resume": {
        "en": "Provide a reachable, prepared host.",
        "vi": "Cấp một host tới được và đã chuẩn bị."
      }
    },
    "MIGRATION_BLOCKED": {
      "domain": "backend",
      "disposition": "terminate",
      "meaning": {
        "en": "The declared migration cannot be applied safely.",
        "vi": "Migration đã khai không thể áp một cách an toàn."
      },
      "resume": {
        "en": "Approve a migration boundary the backend owner can apply.",
        "vi": "Duyệt một ranh giới migration mà chủ backend áp được."
      }
    },
    "DOMAIN_UNRECONCILED": {
      "domain": "provider",
      "disposition": "terminate",
      "meaning": {
        "en": "Domain or TLS state cannot be brought to the declaration.",
        "vi": "Trạng thái domain hay TLS không đưa về đúng khai báo được."
      },
      "resume": {
        "en": "Fix the provider state, or the provider authority.",
        "vi": "Sửa trạng thái phía provider, hoặc thẩm quyền với provider."
      }
    },
    "ROLLOUT_FAILED": {
      "domain": "deployment",
      "disposition": "fallback",
      "meaning": {
        "en": "The rollout could not place the release on the target.",
        "vi": "Rollout không đặt được release lên target."
      },
      "resume": {
        "en": "Correct the target or the plan and roll out again.",
        "vi": "Sửa target hoặc plan rồi roll out lại."
      },
      "fallback": {
        "en": "Take the recovery branch: apply only the approved reversible actions against the same release identity, one at a time, and record each attempt with its outcome under ## Fallbacks taken.",
        "vi": "Đi nhánh phục hồi: chỉ áp những hành động đảo ngược được đã duyệt trên cùng release identity, từng cái một, và ghi mỗi lần thử cùng kết quả dưới ## Fallbacks taken."
      }
    },
    "STEADY_STATE_UNPROVEN": {
      "domain": "deployment",
      "disposition": "terminate",
      "meaning": {
        "en": "The steady window never closed before the bounded deadline, and an assumed rollout is not a deployment.",
        "vi": "Cửa sổ ổn định không khép lại trước deadline có chặn trên, và một rollout được giả định không phải một lần deploy."
      },
      "resume": {
        "en": "Observe a fresh series after the target recovers.",
        "vi": "Quan sát một chuỗi mới sau khi target hồi phục."
      }
    },
    "CONCURRENT_DRIFT": {
      "domain": "deployment",
      "disposition": "terminate",
      "meaning": {
        "en": "A release that is neither this one nor its predecessor became active during execution.",
        "vi": "Một release không phải release này và cũng không phải release trước nó đã trở nên active giữa lượt chạy."
      },
      "resume": {
        "en": "Replan against the new observed state.",
        "vi": "Lập kế hoạch lại theo trạng thái quan sát mới."
      }
    },
    "RECOVERY_EXHAUSTED": {
      "domain": "approval",
      "disposition": "fallback",
      "meaning": {
        "en": "The approved reversible actions ran out.",
        "vi": "Các hành động đảo ngược được đã duyệt đã cạn."
      },
      "resume": {
        "en": "Grant rollback authority, or approve an unsafe action.",
        "vi": "Cấp thẩm quyền rollback, hoặc duyệt một hành động không an toàn."
      },
      "fallback": {
        "en": "Take the rollback branch: restore rollbackIdentity by its exact digest, never by tag, and record the restored release under ## Fallbacks taken.",
        "vi": "Đi nhánh rollback: khôi phục rollbackIdentity theo đúng digest của nó, không bao giờ theo tag, và ghi release đã khôi phục dưới ## Fallbacks taken."
      }
    },
    "ROLLBACK_IDENTITY_MISSING": {
      "domain": "provider",
      "disposition": "terminate",
      "meaning": {
        "en": "Rollback is required and its exact safe release no longer exists.",
        "vi": "Cần rollback nhưng đúng release an toàn của nó không còn tồn tại."
      },
      "resume": {
        "en": "Restore the safe release at its exact digest.",
        "vi": "Khôi phục release an toàn ở đúng digest của nó."
      }
    }
  }
}
```

## FILE: .claude/operators/uat-verify/operator.md

SHA-256: 16010b1a7d13812b0a4af53e34cbcfd26324757b801404732598720e147e3a65

```markdown
# uat.verify

## Job

Verify one product flow end to end on the running product at the pinned commit, and publish one
append-only run record with three independently judged lanes, or stop at the exact unavailability
instead of manufacturing a verdict.

## A run is triggered by need; its authority is the environment's

Reaching this operator is the need: a chain that walks straight into it once a surface is built and
proved, or a session deciding a flow must be walked before anything is trusted, is the routine case
this operator exists to serve, not an exception to police. What keeps a run honest is not a name in a
requirements field but the trace it cannot avoid leaving: the append-only run directory
(`runs/<runId>/`), the `latest.json` pointer, the `history.md` line and the printed step-capture
summary. `runId` and `lease` are not questions for a person: the orchestrator generates the run
identifier and grants the exclusive lease on the flow directory before the branch starts, and an
invocation that arrives without them is `INVALID_INPUT` at step 1 rather than a prompt. Their Default
is therefore `—`: a Default that reads "the orchestrator's run id" is prose, not a value the gate can
use, and a gate that accepts prose accepts an empty field. `LEASE_INVALID` is a different failure and
keeps its own place: it is the lease that exists and is expired, foreign, or bound to another run,
noticed at step 6 against the flow directory this run holds.

What this run touches beyond its own reading — seeding the frozen records into the environment's
data, and signing in as the flow's dedicated account — is authorised the way every platform operation
in this installation is: by the environment's own declaration, and by a person only where that
declaration says a person is needed. `.stacks/<env>/environment.json` marks the `seed` and
`identity-provisioning` classes `declared` or `person` for `env`, and
`readiness/initialization/stacks/environment.schema.json` states the shape, the reference format and
the production default once, read from there and never copied here. A non-production environment
that has not tightened either class needs nothing further: `approval` carries that declaration's
reference — its path and the hash of its bytes — and the run proceeds with no person in the loop. An
environment that marks either class `person`, which production always does, needs an approval id
instead, and `approval` has no default: silence is not consent, whatever reached this operator.

## The endpoint is the bound one, never a re-derived one

The flow is driven against the endpoint the `route` Input carries, the one the `workspace.bind` branch
of this chain observed and closed. This operator does not re-derive readiness from the runtime
registry: a registry that advertises `ready` while nothing listens is exactly the source that sends a
browser at a dead port, and the bind step already refused a merely listening port on this chain's
behalf. When the bound endpoint does not answer, the stop is `RUNTIME_UNAVAILABLE` against a named
endpoint rather than a guess about which origin was meant.

That endpoint serves one integration branch carrying the work of every session that asked for it, so
the head it runs is almost never the commit this run verifies. The snapshot therefore freezes both:
the commit pinned and the head served, with the record of the ancestry test between them. A served
head that does not contain the pinned commit is drift, and drift is a stop with nothing driven — but
a served head that contains it and other work besides is exactly what a shared integration branch
looks like, and is no finding at all.

## Two sessions on one product

The isolation law is published once, by the operator that owns the runtime, and this operator works
inside it rather than restating it. Three of its clauses are things only this receipt can carry, so
the snapshot states them and they are checked: this run belongs to the session the request names and
writes no other session's folder; it drives its own browser profile, because two runs sharing one
profile share a sign-in and then each proves the other's; and it seeds only identifiers under its own
run namespace and rolls back only what it seeded, because a fixture that reaches a shared row is how
one run's cleanup becomes another run's failure.

## A missing record is created, not reported

A flow nobody has run yet has no folder, no flow document, no seed, no account and no approved
reference, and none of that is a stop. The flow document and the seed are drafted from the shipped
template and named in the receipt as drafts; the account is provisioned by the operator that owns
identity and this branch is re-entered with it; and the first run becomes the candidate baseline that
only a person promotes. `IDENTITY_MISSING` is that hand-off and not a verdict — it names the flow
whose account does not exist yet, and the identity operator answers it. The honest stops on this path
are the two dependencies nobody here can conjure: a provider, a sealed file or a store that cannot be
reached at all is `PROVISIONING_UNAVAILABLE`, and a request that names no flow to run is
`INVALID_INPUT`. Stopping at "a person must create an account" is neither of them.

## The flow folder has one shape

`flow.md` states the goal, the role, the preconditions, the budget in steps and seconds, and the
steps with their expected result, evidence and scored criteria, each naming the alias it acts as.
`accounts.<env>.json` carries names only, one account per alias, per environment.
`seed/` holds what must exist before the run, said once and idempotently. `snapshots/` is the golden
reference and changes only when a person approves it. `runs/<runId>/` is the append-only history,
`runId` being the run's timestamp and the short commit it verified, so two runs of the same flow at
the same commit are still distinguishable and neither can overwrite the other. `latest.json` names the
newest run — a file holding a run id, never a symlink — and `history.md` gains one line per run. The
shape is enforced rather than described, because a run record whose folder nobody can predict is a
record nobody reads.

## The password is a name, never a value

Every UAT account shares one password, sealed at `.stacks/<env>/secrets/uat.enc` with the shared
master identity, and each flow owns its own dedicated username. The operator resolves the credential
by name through `@workspaces/device-state` at the moment of login and at no other moment; it never
copies the value into a variable it writes, a fixture, a command it records, or a sentence it
publishes. The password is never plaintext anywhere this operator writes: not in `response/`, not in
the run record under `runs/<runId>/`, not in a log. The login field is masked in every screenshot,
including the ones taken before submission and the ones taken after a failed attempt, because a
capture is published evidence and a password that reached a picture has already left custody. Capture
begins only after the sign-in redirect has landed, and every capture record says so: the frames before
that moment are the frames a credential can be standing in. An
account record therefore carries a username, a role, a credential name and the sealed file's path,
and nothing that could hold a secret. The preflight check that the credential resolves (step 3) is a
diagnostic under the same law `platform.operate` states for its own identity branch: it reports that
the store answered, never what it answered with, so proving readiness never becomes the second way a
value leaves custody.

## Freeze precedes execution

The snapshot is written before any product action and never edited afterwards. It states the commit,
the cases in their frozen order with their named assertions, the account record, the seed
fingerprint and the fixture namespace. That ordering turns three invisible failures into detectable
ones: a case that was never frozen cannot appear in a result, a run cannot be re-explained after the
fact by editing what it claimed to test, and an admission cannot be back-dated onto a commit it
never saw. Both admissions — the `frontend-surface-audit` receipt and the `quality-verification` receipt —
must name the same commit as the pinned head; either one absent, or either one taken at another
commit, is `ADMISSION_MISSING`, because a clean surface and a green gate at some other commit say
nothing about the product this run drives.

When frontend and backend are separate deliveries, bind both @workspaces/fe and @workspaces/be. snapshot.provenance and verdicts.provenance freeze {fe, be} from those exact contexts; commit and the run-id suffix identify the frontend. Both admission entries carry role fe and the frontend commit. Their actual owning requests must pin that frontend head, and their emitted receipts must identify it; a quality request may also pin backend context without turning its frontend admission into a backend one. The Snapshot table prints Frontend commit and Backend commit, and the appended result retains both. A frontend route or admission with a head distinct from the backend requires this explicit form even if a caller omits frontend context. Backend-only legacy records remain valid when no split-role evidence exists. No frontend SHA is relabeled as a backend SHA.

## The experience lane is scored, not asserted

The `ux` lane is not a sentence about how the run felt. `UX-1` to `UX-11` are each carried in the run
receipt with the run step or the capture that measured them, a score from 1 to 5 and a verdict, and
`UX-12` computes the lane from them; the arithmetic lives in that rule and is not repeated here. The
result is the one row this operator publishes under `## Verdict`, as `experience`, and nothing
downstream rescores it — `quality.verify` copies the row and combines it with the audit's topics. A
criterion whose only evidence is a screenshot, for a rule that this file assigns to a run, is
`EVIDENCE_UNAVAILABLE` rather than a pass or a fail, and the lane is incomplete until the attempt
exists.

## Three lanes, judged apart

Behaviour, UX and UI are judged on their own evidence and never borrow each other's conclusions.
Exactly three lanes are published, each with its own pass or fail and its own evidence references; a
lane with no evidence is not a fail but `EVIDENCE_UNAVAILABLE`, because charging unavailability as a
failure blames a product nobody observed. A UI defect on an application-owned node routes to
presentation, a behaviour defect routes to the backend, and a UX defect routes to a person: nobody
resolves a question of intent by re-running the flow harder.

## The namespace owns everything this run wrote

Every record this run writes carries `is_uat=true` and the `runId` namespace, so what the run created
is separable from what the product already had. Cleanup deletes exactly that namespace and nothing
else: not another run's namespace, not a record that merely carries the UAT flag, and never a run
record. Verification itself reads and does not write, and a seed may never create the outcome under
test.

## Runs are append-only

`runs/<runId>/` is written once, at the end, under the exclusive lease; `latest.json` is pointed at it
and `history.md` gains its line. A run folder that already exists is never rewritten, never trimmed and never corrected: a
second attempt is a new `runId`, and the old record stays as the evidence of what was observed then.
History that can be edited is not history.

## Boundary

Context is read-only apart from the flow directory. The operator writes the snapshot and the run
record under `@worktrees/uat/<flow>/<case>` while it holds the exclusive lease, and writes only
`response/` of its own branch: `data/snapshot.json`, `data/captures/<case>.json`,
`data/verdicts.json`, the screenshots and the sheet under `response/artifacts/`, `response.md` and
`response.json`. It does not read or write the password as a value, does not ask a person to sign in
or paste a credential, does not repair the product to make a case pass, does not edit the frozen
snapshot after execution begins, does not rewrite or delete a run record, does not delete anything
outside its own fixture namespace, and does not make anything happen other than through the control
each capture names: a walk is evidence only for what it pressed, so a step that reaches the product by
any other means — an endpoint, a mutation, a console command in place of the rendered control (`UX-1`
Case 2) — is not a step of the walk, and a criterion scored from it is `EVIDENCE_UNAVAILABLE`, never a
pass.

## Context

| Alias | Bind | Required |
| --- | --- | --- |
| `@worktrees/uat/<flow>/<case>` | the flow directory in its one shape: `flow.md`, `accounts.<env>.json`, `seed/`, the approved `snapshots/`, the append-only `runs/<runId>/` history, the `latest.json` pointer and `history.md`, bound by fingerprint per file and written only under the exclusive lease | yes |
| `@worktrees/_templates` | the UAT flow template a missing flow folder is drafted from, which the tree ships at `templates/uat/` with `README.md` as the contract for the whole folder: `flow.md` with the cases, the aliases they act as and their named assertions, `accounts.json.example` with names only and no field that could hold a secret, and `seed/` with the records a run namespaces; consumed, never modified | yes |
| `@worktrees/sessions/central-runtime` | the runtime owner's generation behind the bound endpoint; readiness is proved by the `route` Input, never re-derived from this registry | yes |
| `@workspaces/device-state` | the sealed credential roster; the shared UAT password is resolved by name here at login and read nowhere else | yes |
| `@workspaces/be` | the routed backend checkout at the pinned commit, whose behaviour the flow verifies and whose store holds the namespaced records | yes |
| `@workspaces/fe` | the frontend delivery head when the browser surface and backend are distinct; required whenever route or admission evidence identifies a different frontend head | no |
| `@knowledge/ui/proof` | the UX topic: the criteria the experience lane scores and the rule that turns them into its verdict | yes |

## Inputs

| Kind | From | Required |
| --- | --- | --- |
| `frontend-surface-audit` | the surface audit that found the frontend clean, taken at the pinned commit | yes |
| `quality-verification` | the quality gate that passed, taken at the same pinned commit | yes |
| `route` | `workspace.bind` on the fe role; the bound route whose endpoint this run drives | yes |
| `uat-account` | `platform.operate`, the dedicated account it provisioned for this flow; absent on the first pass, which is what `IDENTITY_MISSING` hands over | no |

## Requirements

| Field | Type | Default | Ask |
| --- | --- | --- | --- |
| `approval` | id | — | The authority covering this run's own writes — seeding the frozen records and signing in as the flow's account: an approval id, or the environment declaration's reference — its path and content hash — when that declaration marks `seed` and `identity-provisioning` `declared` for `env`; no default, because silence is not consent |
| `feature` | id | — | The feature key that addresses the flow directory |
| `flow` | id | — | The one product flow this invocation verifies |
| `env` | id | dev | The stack this run drives: it selects the accounts file, the sealed secret, the runtime registry entry, the seed target and the approved reference |
| `cases` | list of `caseId` | every case of the flow | Which frozen cases to run; the default is every case `flow.md` declares, in its order |
| `runId` | id | — | Not asked of a person: the orchestrator fills it, and it namespaces every record this run writes |
| `lease` | token | — | Not asked of a person: the orchestrator fills it, granting the exclusive lease on the flow directory before the branch starts |
| `resume` | token | null | The blocked branch's token when re-entering after a stop |

## Steps

| # | Step | Params | Reads | Writes | Stops with |
| --- | --- | --- | --- | --- | --- |
| 1 | Validate the gate, the resume, the exclusive lease and the run's authority | `approval`, `lease`, `resume` | `request/request.json`, @worktrees/uat/<flow>/<case> for `latest` and the prior run record, @workspaces/be at the pinned commit, the environment's declaration when `approval` references it, @tools/git | — | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS`, `AUTHORITY_DRIFT` |
| 2 | Confirm the clean surface and green quality admissions at the frontend head, preserving the backend head separately | — | input `frontend-surface-audit`, input `quality-verification` | — | `ADMISSION_MISSING` |
| 3 | Preflight the runtime and the flow's identity: the sealed credential resolves by name, the store answers, and a flow with no account hands over instead of stopping | `env` | @workspaces/device-state for the credential named by `accounts.<env>.json`, @worktrees/sessions/central-runtime for the entry of the bound route, its generation and origins, input `uat-account` when the identity was provisioned, @tools/secrets, @tools/http | — | `PROVISIONING_UNAVAILABLE`, `IDENTITY_MISSING` |
| 4 | Draft from the template whatever the flow folder lacks, then freeze the snapshot from `flow.md`, `accounts.<env>.json` and `seed/` | `feature`, `flow`, `env`, `cases` | @worktrees/uat/<flow>/<case>, @worktrees/_templates for the flow template | @worktrees/uat/<flow>/<case> (snapshot), `response/data/snapshot.json`, @tools/sourcewrite | `CANONICAL_WRITE_DENIED` |
| 5 | Seed the frozen records into the run namespace | `runId` | `response/data/snapshot.json`, @workspaces/be | @tools/database | `FIXTURE_VIOLATION` |
| 6 | Execute the frozen cases in order against the endpoint the bound route carries, at the pinned commit | — | `response/data/snapshot.json`, input `route` for the endpoint this run drives, @worktrees/sessions/central-runtime for the generation behind that endpoint, @workspaces/device-state for the credential at login only, @tools/browsercontrol, @tools/websearch | — | `LEASE_INVALID`, `RUNTIME_UNAVAILABLE` |
| 7 | Capture at each named assertion with the login field masked, and stitch the sheet | — | `response/data/snapshot.json`, @worktrees/sessions/central-runtime for the most direct runtime evidence | `response/data/captures/<case>.json`, `response/artifacts/<case>.png`, `response/artifacts/sheet.png`, @tools/visualize, @tools/print | `EVIDENCE_UNAVAILABLE` |
| 8 | Judge the three lanes apart, and score the experience lane criterion by criterion | — | @knowledge/ui/proof (the UX topic and its closing rule), `response/data/captures/<case>.json` | `response/data/verdicts.json` | — |
| 9 | Verify read-only, then delete the run namespace and nothing else | `runId` | @workspaces/be for the records carrying `is_uat=true` and this namespace, `response/data/verdicts.json` | @tools/database | — |
| 10 | Append `runs/<runId>/`, point `latest.json` at it, add the history line, and emit | `runId` | everything above | @worktrees/uat/<flow>/<case> (runs/<runId>/, latest.json and history.md), `response/response.md`, `response/response.json`, `audit-scope`, @tools/sourcewrite, @tools/print | — |

A verdict nobody was shown is a verdict nobody read. Step 7 prints the run's step-capture summary and
step 10 prints the `## Verdict` table over `@tools/print`, into the conversation the person is
reading, and the receipt lists both under `## Printed` with why each was printed; the
login field stays masked in every frame that is printed, exactly as in every frame that is written.

A blocked run publishes no run record at all, because a half-written record is the artifact a later
reader would mistake for a decision. A resume begins again at validation, reuses only observations
whose fingerprints are unchanged, and writes under the same lease; a resume that adds no admission,
lease, evidence or case change is `NO_PROGRESS`. A second attempt after a published run is a new
`runId`, never an edit of the old one.


When the admitted audit carries scope, run `node scripts/audit-scope.mjs <branch>` to copy
`verdicts.auditScope` unchanged into `response/data/audit-scope.json` and list the `audit-scope`
output kind. The receipt includes `## Audit scope`, a `Field | Value` table preserving Mode,
Coverage claim and Deferred states. The verdict has only that scope; deferred states do not become
passed because quality gates or UAT pass. Quality thresholds and frozen UAT cases remain unchanged.
The frozen snapshot also retains the unchanged scope in `auditScope` before execution.

## Outputs

| Kind | File | Type | Required |
| --- | --- | --- | --- |
| `uat-flow-verification` | `response/response.md` | md | yes |
| `uat-snapshot` | `response/data/snapshot.json` | data | yes |
| `uat-capture` | `response/data/captures/<case>.json` | data | yes |
| `uat-verdicts` | `response/data/verdicts.json` | data | yes |
| `audit-scope` | `response/data/audit-scope.json` | data | no |
| `screenshot` | `response/artifacts/<case>.png` | artifact | yes |
| `sheet` | `response/artifacts/sheet.png` | artifact | yes |

## Stops

| Code | Disposition |
| --- | --- |
| `INVALID_INPUT` | terminate |
| `SOURCE_DRIFT` | terminate |
| `NO_PROGRESS` | terminate |
| `AUTHORITY_DRIFT` | terminate |
| `ADMISSION_MISSING` | terminate |
| `PROVISIONING_UNAVAILABLE` | terminate |
| `IDENTITY_MISSING` | terminate |
| `LEASE_INVALID` | terminate |
| `RUNTIME_UNAVAILABLE` | terminate |
| `EVIDENCE_UNAVAILABLE` | terminate |
| `FIXTURE_VIOLATION` | terminate |
| `CANONICAL_WRITE_DENIED` | terminate |

## Next

| When | Operator |
| --- | --- |
| all three lanes pass | `git.publish` |
| all three lanes pass and the promise must be reconciled against the journey that was actually walked | `business.decide` |
| the UI lane fails on an application-owned node | `frontend.presentation.resolve` |
| the behaviour lane fails | `backend.source.apply` |
| the flow has no dedicated account yet, so the identity is provisioned before the run continues | `platform.operate` |
| the UX lane fails: a person decides what the experience should be, and the flow is verified again only after that decision | `user` |
| the run produced the first baseline of this flow, so a person promotes the candidate before it is a reference | `user` |
```

## FILE: .claude/operators/uat-verify/operator.json

SHA-256: f870a762aa858dfbeed7aa943d6e3775d27b7001961cc075438bd09fe42a0198

```json
{
  "schemaVersion": 9,
  "id": "uat.verify",
  "domain": "test",
  "job": "Verify one product flow end to end on the running product at the pinned commit, and publish one append-only run record with three independently judged lanes, or stop at the exact unavailability instead of manufacturing a verdict.",
  "package": "operator.md",
  "errors": "errors.json",
  "validator": "validate.mjs",
  "selfTest": "self-test.mjs",
  "resources": {
    "profile": "sol-fresh",
    "grammarBound": false,
    "tools": {
      "@tools/fileread": "context-aliases",
      "@tools/sourcewrite": "declared-write-set",
      "@tools/git": "read",
      "@tools/websearch": "bounded",
      "@tools/visualize": "html",
      "@tools/browsercontrol": "required",
      "@tools/http": "probe",
      "@tools/secrets": "resolve-by-name",
      "@tools/database": "namespaced-write",
      "@tools/print": "decision-points"
    }
  }
}
```

## FILE: .claude/operators/uat-verify/errors.json

SHA-256: de30b23dd77107c1a556dcb8c40f2226ef505b3e6169f018658e09d9428e9fdc

```json
{
  "schemaVersion": 9,
  "note": "Stop codes only uat.verify emits. Same entry shape as operators/errors.json, scope implicit. Shared codes (INVALID_INPUT, SOURCE_DRIFT, NO_PROGRESS, RUNTIME_UNAVAILABLE, PROVISIONING_UNAVAILABLE, IDENTITY_MISSING, AUTHORITY_DRIFT) come from operators/errors.json. No code asks a person for a credential, and no code reports a record as merely missing: a flow document, a seed or an account that does not exist yet is created, IDENTITY_MISSING hands the account to the operator that owns provisioning, and only a dependency that cannot be reached at all blocks.",
  "codes": {
    "ADMISSION_MISSING": {
      "domain": "quality",
      "disposition": "terminate",
      "meaning": {
        "en": "The surface audit or the quality verification that admits product UAT is absent, or one of them was taken at another commit than the pinned head.",
        "vi": "Lượt soi bề mặt hoặc lượt kiểm chất lượng cho phép UAT sản phẩm đang thiếu, hoặc một trong hai được lấy ở commit khác commit đã ghim."
      },
      "resume": {
        "en": "Re-run the missing admission at the pinned commit.",
        "vi": "Chạy lại admission còn thiếu tại đúng commit đã ghim."
      }
    },
    "LEASE_INVALID": {
      "domain": "control-panel",
      "disposition": "terminate",
      "meaning": {
        "en": "The exclusive lease on the flow directory is expired, foreign, or bound to another run, generation or origin.",
        "vi": "Lease độc quyền trên thư mục luồng đã hết hạn, thuộc chỗ khác, hoặc gắn vào lượt chạy, generation hay origin khác."
      },
      "resume": {
        "en": "The orchestrator grants the lease again for this run.",
        "vi": "Orchestrator cấp lại lease cho đúng lượt chạy này."
      }
    },
    "EVIDENCE_UNAVAILABLE": {
      "domain": "runtime",
      "disposition": "terminate",
      "meaning": {
        "en": "A case produced no capture, no screenshot, or no screenshot whose login field could be masked, so a lane has nothing to be judged on.",
        "vi": "Một case không sinh ra capture, không sinh ra ảnh chụp, hoặc không ảnh nào che được ô mật khẩu, nên một làn không có gì để xét."
      },
      "resume": {
        "en": "Restore the dependency and run the frozen case again under a new runId.",
        "vi": "Khôi phục phụ thuộc rồi chạy lại case đã đóng băng dưới một runId mới."
      }
    },
    "FIXTURE_VIOLATION": {
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "The seed, the run namespace or the cleanup scope could not be satisfied: a seed would have created the outcome under test, or cleanup would have reached outside the namespace.",
        "vi": "Seed, namespace lượt chạy hay phạm vi dọn dẹp không thoả được: seed sẽ tạo ra chính kết quả cần kiểm, hoặc dọn dẹp sẽ với ra ngoài namespace."
      },
      "resume": {
        "en": "Correct the fixture boundary in seed/records.json.",
        "vi": "Sửa ranh giới fixture trong seed/records.json."
      }
    },
    "CANONICAL_WRITE_DENIED": {
      "domain": "backend",
      "disposition": "terminate",
      "meaning": {
        "en": "The flow directory cannot be written and read back under the exclusive lease, or the write would have rewritten an existing run record.",
        "vi": "Không ghi rồi đọc lại được thư mục luồng dưới lease độc quyền, hoặc lần ghi sẽ đè lên một hồ sơ lượt chạy đã có."
      },
      "resume": {
        "en": "Restore write authority on the flow directory, or publish under a new runId.",
        "vi": "Khôi phục quyền ghi trên thư mục luồng, hoặc phát hành dưới một runId mới."
      }
    }
  }
}
```

## FILE: .claude/operators/workspace-bind/operator.md

SHA-256: eea794002a1f109b3cb96b8217beecad001e80fe5982782867c6ebfafe01ceed

```markdown
# workspace.bind

## Job

Resolve one project and role into a verified checkout identity, its exact source head, and the closed
runtime binding it may consume, and return that as one typed route receipt.

## Declaration is the only authority

A route exists because a portable declaration in `@workspaces/projects/<project>/<role>` says so and a
hydrated local route projects it onto this machine's disk. Four things routinely resemble a route and
are none of it: a directory whose name matches the project, a sibling checkout that sits next to the
Source, the current working directory, and the origin open in a browser. Those are hints, they carry
no authority at all, and this operator has nowhere to put them: Requirements declares no hint field,
so a request that carries one fails the gate with `INVALID_INPUT` at step 1 rather than being
weighed. Refusing them at the gate is the point, because a hint that survives into the body of a run
is a hint that gets followed the moment the declared route looks inconvenient. The two route halves
must agree on project, role, Git repository, and branch; a `source` repository kind carries no
directory and resolves to the Source root itself, a `sibling` kind carries a safe relative directory
and resolves beside it, and a hydrated route that names another Source belongs to another machine and
is refused.

`checkout` selects the declared checkout by default. With `session`, the same declarations are
verified first, then `scripts/workspace-checkout.mjs` selects the unique Git-registered worktree whose
branch is exactly `session/<request.sessionId>` in the canonical checkout's Git common directory.
Only `session-only` policy permits that selection. Neither a path nor another session can be supplied;
the helper creates, switches and repairs nothing. The route's checkout and source head describe the
selected worktree, while `sessionCheckout` preserves the observed canonical path, branch and head,
the common directory and the current session identity. The canonical head is an observation, not the
session's original base; source-writing receipts own that base. A missing, foreign, ambiguous or
unavailable registration is refused. Existing route receipts are never silently rebound.

## Endpoint binding is a closed projection

An endpoint is never a URL somebody chose. It is the `workspace-route-port-projection`: the verified
frontend and backend routes, the project offset and slot step from `@workspaces/ports/<project>`, the
application slot, and the routed backend's declared port services, folded into one fingerprint. The
binding carries that fingerprint, and a stale one is refused rather than recomputed into agreement.
Only origin-only `http://localhost:<canonical-port>` values are endpoints; a free URL, `127.0.0.1`, a
remote host, an alternate application, an undeclared service, or a port that merely happens to be
listening establishes nothing. Step 5 runs only when `runtimeNeed` is not `none`: a caller that binds
no runtime binds no endpoints either, and a route that carries endpoints nobody asked for has
consumed a shared resource on its own initiative.

## One registry entry per project route

The runtime registry holds one entry for each `<project>/<role>`, and a binding consumes the entry of
its own route: its endpoints, its head, its generation, its status, the evidence behind that status
and the identity provider an account for it would be created at. One machine serves several products
at once, so a registry read as a single block answers for whichever route happens to be recorded in
it, and every other route binds as not ready while the service it needs is listening. The binding
records the entry key it read, which is what makes that mistake visible instead of merely likely.

## The runtime is bound by ancestry, not by equality

One machine serves one integration branch per product, and that branch carries the work of every
session that asked for it, so the head a binding pinned is almost never the head that is serving. A
binding therefore does not compare the two for equality — that would fail on arithmetic the moment a
second session existed — it establishes that its own head is inside the served one: present among the
commits the entry records as contained, and an ancestor of the served head. Both are recorded, because
a reader who cannot see the pinned head beside the served one cannot check the claim.

A served head that does not contain this route's head is not a runtime this binding may consume.
`RUNTIME_NOT_READY` then names the commit that must be served and the operation that would serve it,
so the coordination request that follows is a specific request rather than a report that something is
wrong; and while another session holds the lease and is merging, the answer is `RUNTIME_BUSY` with the
holder and the queue position, which is a wait rather than a failure. Neither is permission to serve
it here: this operator still starts nothing.

## The caller is a consumer, never an owner

The shared local frontend, api, and identity processes belong to exactly one delegated owner task.
This operator binds the caller to that owner's endpoints as a consumer. It does not start, stop,
restart, replace, or kill a process, and it claims no port, no PID, and no runtime lifecycle. A
registry that is missing, stale, or not ready yields a typed stop so the caller can raise one
coordination request; it never authorises a replacement. An address already in use, an unexpected
authenticated session, and a failing probe are all evidence to report, and none of them is permission.

## Nothing is repaired here

No credential is read, copied, or recorded; only the sealed roster reference is bound, and
`IDENTITY_ROSTER_SEALED` states that. A declaration that does not exist is repaired by the workspace
owner, never by this operator, so `ROUTE_UNDECLARED` and `ROUTE_UNHYDRATED` are expected outcomes of
an unprepared workspace rather than defects in the request. `CHECKOUT_DIRTY` never falls back to
anything: this operator does not stash, clean, or reset a working tree to make a binding possible.
The businesses authority root is derived as `<git root>/.worktrees/businesses` when that worktree
exists on a source checkout and is absent otherwise; it is never accepted from the person, because a
typed authority root is how a second business tree is born. Provenance and freshness are not a step
of their own: they are written inside the emit, next to the binding they describe. The head a hydrated
route recorded is a record of the hydration and never route authority: the observed head wins, and a
hydration head two commits behind the checkout is not a stop.

A blocked branch emits no receipt and no route: `response.json` is the whole record, and `reason`
carries the observation that justified the stop, including the registry generation, the endpoints
probed and what each answered.

## Boundary

Context is read-only apart from the machine-local hydrated route state, which Git ignores. The
operator writes only `response/` of its own branch: `response.md`, `response/data/route.json` and
`response.json`. It never accepts a similar name, a sibling directory, the working directory, or a
browser URL as route authority, never accepts a chosen URL, a loopback alias, or a merely listening
port as an endpoint, never starts, stops, restarts, replaces, or kills a shared runtime process, never
claims a port, a PID, or a runtime lifecycle for a feature task, never creates or switches to a task,
feature, or worktree branch under a forbidden worktree policy, never writes a credential, token,
cookie, or password into the receipt or any evidence, and never repairs a missing route, initializes a
workspace, or provisions an account. It makes no product decision and carries no verdict.

## Context

| Alias | Bind | Required |
| --- | --- | --- |
| `@workspaces/projects/<project>/<role>` | the portable route declaration, read by fingerprint; the only route authority | yes |
| `@workspaces/local/routes/<project>/<role>` | the hydrated route this machine projects the declaration onto, and the checkout it resolves to | yes |
| `@workspaces/device-state` | machine identity and the sealed credential roster, bound by name and never read | yes |
| `@workspaces/ports/<project>` | the port projection, read only when the caller consumes the runtime | no |
| `@worktrees/sessions/central-runtime` | the runtime owner registry: the entry of this route, the head it serves, what that head contains, its lease, generation and health evidence, bound only when the caller consumes | no |

## Inputs

| Kind | From | Required |
| --- | --- | --- |
| — | this operator opens the chain, so it consumes no earlier branch | no |

## Requirements

| Field | Type | Default | Ask |
| --- | --- | --- | --- |
| `project` | id | — | The project to bind |
| `role` | choice | — | `fe` or `be`: the role of that project to bind |
| `checkout` | choice | routed | `routed` selects the canonical checkout; `session` selects only this request session's registered worktree under the declared policy |
| `gitPolicy` | list of `{worktreeBranches, mutationBranch}` | the policy the route declaration carries; a declaration that carries none is `INVALID_INPUT` at step 1, never a guessed policy | The branch law this binding is verified against; `forbidden` keeps every write on the mutation branch |
| `declaredWriteRoots` | list | empty | The only paths later work may write; anything dirty outside them is `CHECKOUT_DIRTY`, and so is anything dirty at all when the checkout sits on the mutation branch rather than a `session/<sessionId>` branch |
| `runtimeNeed` | choice | none | `none` binds no runtime and skips step 5; `consume` binds the owner's endpoints as a consumer |
| `resume` | token | null | The blocked branch's token when re-entering after a stop |

## Steps

| # | Step | Params | Reads | Writes | Stops with |
| --- | --- | --- | --- | --- | --- |
| 1 | Validate the gate and resume, and refuse every hint it carries | `resume` | `request/request.json`, its requirements and its frozen head | — | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS` |
| 2 | Bind bootstrap and identity | — | @workspaces/device-state, the machine identity and the sealed credential roster, @tools/secrets | — | `IDENTITY_UNVERIFIED` |
| 3 | Resolve the route | `project`, `role`, `checkout` | @workspaces/projects/<project>/<role> for exactly this project and role, @workspaces/local/routes/<project>/<role>, @tools/git | — | `ROUTE_UNDECLARED`, `ROUTE_UNHYDRATED`, `ROUTE_MISMATCH` |
| 4 | Verify the checkout: branch policy, a clean tree, and the write roots | `gitPolicy`, `declaredWriteRoots` | @workspaces/local/routes/<project>/<role>, the resolved checkout, its branch, its head and its working tree, @tools/git, @tools/shell | — | `BRANCH_POLICY_VIOLATION`, `CHECKOUT_DIRTY` |
| 5 | Bind the runtime the caller consumes from the registry entry of this project route, only when `runtimeNeed` is not none | `runtimeNeed` | @worktrees/sessions/central-runtime, the entry of this `<project>/<role>` with its served head, what that head contains, its lease, its generation, health evidence and identity declaration, @workspaces/ports/<project>, @tools/http | — | `ENDPOINT_AUTHORITY_STALE`, `RUNTIME_NOT_READY`, `RUNTIME_BUSY` |
| 6 | Bind provenance and freshness, then emit | — | everything above, @workspaces/device-state | `response/response.md`, `response/data/route.json`, `response/response.json` | — |

Step 5 recomputes nothing: the endpoint fingerprint either matches the closed projection or the
branch stops. Under `worktreeBranches` set to forbidden, a route binds only on the mutation branch and
records `WORKTREE_BRANCH_FORBIDDEN`; under `session-only` it binds on the mutation branch or on a
`session/<sessionId>` worktree branch, the only shape a source-writing operator may commit to, and
records `WORKTREE_BRANCH_SESSION_ONLY`, because a policy that opens a write path is exactly the
finding a later reader looks for; a redacted conversation head records `PROVENANCE_HEAD_BOUND`, and
a cached receipt matching the same identity tuple and fingerprints records `CACHED_ROUTE_REUSED`. `mutationReadiness` is
`ready` when the observed branch is one the routed policy permits a write on — the mutation branch, or
a `session/<sessionId>` branch under `session-only` — and the working tree carries nothing this step
must refuse; it is `read-only` in every other case, including a route bound with no declared write
roots. The declared write roots exempt dirt only on a `session/<sessionId>` branch, where it is a
session's expected work in progress; the mutation branch has no in-progress state of its own to
exempt, so any dirt observed there — inside a declared write root or outside it — is source that was
written with no session to account for it, and step 4 stops with `CHECKOUT_DIRTY` rather than
reporting a readiness that would carry the violation forward unrecorded. It is derived here and never
accepted from the request, because a readiness a caller can
assert is a readiness nobody measured. A
resume begins again at step 1, reuses only unchanged fingerprinted observations, and consumes the
exact delta. Changed declaration bytes produce a new route fingerprint; reuse also requires the
same selection mode, selected checkout identity and observed source head.

The read-only selection command is `node scripts/workspace-checkout.mjs <project> <role> <sessionId>
<routed|session> [declaredWriteRoot ...]`. It accepts repository-relative write ceilings, never a
checkout path. Its JSON is a checkout observation; the operator still binds identity, authority roots
and any requested runtime to produce the complete route receipt. Step 4 checks the selected tree, and a session selection also requires the canonical
mutation checkout to be clean. The response validator independently repeats the selection and
compares the route fields; request validation checks session selection before dispatch and binds the
session id to its containing coordinate, session state and frozen request hash.

## Outputs

| Kind | File | Type | Required |
| --- | --- | --- | --- |
| `workspace-route-binding` | `response/response.md` | md | yes |
| `route` | `response/data/route.json` | data | yes |

## Stops

| Code | Disposition |
| --- | --- |
| `INVALID_INPUT` | terminate |
| `SOURCE_DRIFT` | terminate |
| `NO_PROGRESS` | terminate |
| `IDENTITY_UNVERIFIED` | terminate |
| `ROUTE_UNDECLARED` | terminate |
| `ROUTE_UNHYDRATED` | terminate |
| `ROUTE_MISMATCH` | terminate |
| `BRANCH_POLICY_VIOLATION` | terminate |
| `CHECKOUT_DIRTY` | terminate |
| `ENDPOINT_AUTHORITY_STALE` | terminate |
| `RUNTIME_NOT_READY` | terminate |
| `RUNTIME_BUSY` | terminate |

## Next

| When | Operator |
| --- | --- |
| the route is bound and the checkout carries a publication to push | `git.publish` |
| the route is bound and a promise must be decided against its source | `business.decide` |
| the route is bound and a backend contract must be filled inside it | `backend.source.apply` |
| the route is bound and a frontend surface must be written inside it | `frontend.source.apply` |
| the route binds an explicitly authorized owner package whose existing behavior must be repaired | `library.source.apply` |
| a verified package release must be consumed in exact frontend dependency metadata | `dependency.update` |
| the runtime owner is missing or not ready and one coordination request must be raised | `platform.operate` |
| the route is bound and a frontend surface must be decided inside it | `frontend.direction.decide` |
| the route is bound and a published head must be verified before it ships | `quality.verify` |
| the route is bound and a served surface must be observed | `frontend.surface.audit` |
```

## FILE: .claude/operators/workspace-bind/operator.json

SHA-256: 44768374bd1ff38d60b0383b756f7442a5068414ce1816a5519f1bd314ad6911

```json
{
  "schemaVersion": 9,
  "id": "workspace.bind",
  "domain": "workspace",
  "job": "Resolve one project and role into a verified checkout identity, its exact source head, and the closed runtime binding it may consume, and return that as one typed route receipt.",
  "package": "operator.md",
  "errors": "errors.json",
  "validator": "validate.mjs",
  "selfTest": "self-test.mjs",
  "resources": {
    "profile": "luna",
    "grammarBound": false,
    "tools": {
      "@tools/fileread": "context-aliases",
      "@tools/git": "read",
      "@tools/shell": "declared-commands",
      "@tools/http": "probe",
      "@tools/secrets": "resolve-by-name"
    }
  }
}
```

## FILE: .claude/operators/workspace-bind/errors.json

SHA-256: 7d48ee79636b3708c165eb43a515474bdc380bfc9248f3ca638d84bc12bd0654

```json
{
  "schemaVersion": 9,
  "note": "Stop codes only workspace.bind emits. Same entry shape as operators/errors.json, scope implicit. Shared codes (INVALID_INPUT, SOURCE_DRIFT, NO_PROGRESS) come from operators/errors.json, and BRANCH_POLICY_VIOLATION is not defined here because git.publish emits it too: a code two operators emit belongs in operators/errors.json with both ids in scope. Every domain below is the one the old package's OWNING_DOMAIN table published, and routing.json answers each of them for this operator: workspace resumes, source resumes, identity and runtime are external, caller is a person.",
  "codes": {
    "IDENTITY_UNVERIFIED": {
      "domain": "identity",
      "disposition": "terminate",
      "meaning": {
        "en": "The machine identity or its encrypted credential roster is missing or stale.",
        "vi": "Định danh máy hoặc roster credential đã mã hoá của nó thiếu hoặc cũ."
      },
      "resume": {
        "en": "Verify the machine identity and seal its roster.",
        "vi": "Xác minh định danh máy và niêm phong roster của nó."
      }
    },
    "ROUTE_UNDECLARED": {
      "domain": "workspace",
      "disposition": "terminate",
      "meaning": {
        "en": "No portable declaration names this project and role.",
        "vi": "Không khai báo portable nào gọi tên project và role này."
      },
      "resume": {
        "en": "Declare the route; this operator never repairs one.",
        "vi": "Khai báo route; operator này không bao giờ tự sửa."
      }
    },
    "ROUTE_UNHYDRATED": {
      "domain": "workspace",
      "disposition": "terminate",
      "meaning": {
        "en": "The declaration exists but no local route projects it onto this machine.",
        "vi": "Khai báo có tồn tại nhưng không route local nào chiếu nó xuống máy này."
      },
      "resume": {
        "en": "Hydrate the route on this machine.",
        "vi": "Hydrate route trên máy này."
      }
    },
    "ROUTE_MISMATCH": {
      "domain": "workspace",
      "disposition": "terminate",
      "meaning": {
        "en": "The hydrated route disagrees with the closed portable route, or belongs to another Source.",
        "vi": "Route đã hydrate mâu thuẫn với route portable đóng, hoặc thuộc về một Source khác."
      },
      "resume": {
        "en": "Correct the hydration.",
        "vi": "Sửa lại phần hydrate."
      }
    },
    "CHECKOUT_DIRTY": {
      "domain": "source",
      "disposition": "terminate",
      "meaning": {
        "en": "Something is dirty outside the declared write roots, or the checkout carries any dirt at all while sitting on the mutation branch rather than a session/<sessionId> branch: the mutation branch has no in-progress state of its own, so dirt found there is source written with no session to account for it, session-only policy or not.",
        "vi": "Có thứ đang bẩn ngoài các write root đã khai báo, hoặc checkout mang bất kỳ vết bẩn nào trong khi đang ở nhánh mutation thay vì nhánh session/<sessionId>: nhánh mutation không có trạng thái dở dang của riêng nó, nên vết bẩn thấy ở đó là source được ghi mà không có phiên nào chịu trách nhiệm, dù chính sách có là session-only hay không."
      },
      "resume": {
        "en": "Clean the boundary, or declare the write roots that cover it when the checkout is already on a session/<sessionId> branch; on the mutation branch the repair is to open the session and move the change onto its branch, not to declare a write root over it — this operator never stashes.",
        "vi": "Dọn sạch ranh giới, hoặc khai báo write root bao được nó khi checkout đã ở nhánh session/<sessionId>; trên nhánh mutation, cách sửa là mở phiên và chuyển thay đổi sang nhánh của phiên đó, không phải khai báo write root đè lên nó — operator này không bao giờ stash."
      }
    },
    "ENDPOINT_AUTHORITY_STALE": {
      "domain": "runtime",
      "disposition": "terminate",
      "meaning": {
        "en": "The endpoint binding is not the closed port projection, or its fingerprint is stale.",
        "vi": "Ràng buộc endpoint không phải phép chiếu port đóng, hoặc fingerprint của nó đã cũ."
      },
      "resume": {
        "en": "Recompute the authority fingerprint at its owner.",
        "vi": "Tính lại fingerprint thẩm quyền ở phía chủ của nó."
      }
    },
    "RUNTIME_NOT_READY": {
      "domain": "runtime",
      "disposition": "terminate",
      "meaning": {
        "en": "The runtime owner registry is missing, stale, or not ready while the caller must consume it.",
        "vi": "Registry chủ runtime thiếu, cũ hoặc chưa sẵn sàng trong khi người gọi phải tiêu thụ nó."
      },
      "resume": {
        "en": "Raise one coordination request to the registered owner and wait for a ready generation.",
        "vi": "Nêu một yêu cầu phối hợp tới chủ đã đăng ký và chờ một generation sẵn sàng."
      }
    },
    "RUNTIME_BUSY": {
      "domain": "runtime",
      "disposition": "terminate",
      "meaning": {
        "en": "The integration branch of this route is leased by another session while it merges and restarts, so the head this binding needs is not served yet.",
        "vi": "Nhánh tích hợp của route này đang bị một phiên khác giữ lease trong lúc merge và khởi động lại, nên head mà lần bind này cần chưa được phục vụ."
      },
      "resume": {
        "en": "Wait for the holder to release the lease, then bind again: the same endpoint serves the merged head next. The reason names the holding session, the operation it is in and the queue position.",
        "vi": "Chờ bên đang giữ nhả lease, rồi bind lại: chính endpoint đó sẽ phục vụ head đã merge kế tiếp. Phần reason nêu tên phiên đang giữ, thao tác nó đang chạy và vị trí xếp hàng."
      }
    }
  }
}
```

