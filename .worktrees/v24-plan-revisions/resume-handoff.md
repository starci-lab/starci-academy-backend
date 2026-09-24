# Owner commands after the verified release is applied

Runtime: `D:/Repositories/starci-academy-backend/.claude`.
These commands are for the owning native tasks. This candidate has not mutated either product ledger.

## Chatbot

Session: `D:/Repositories/nivo-backend/.worktrees/sessions/20260905160512-nivo-ca563924`.

1. Preserve the frozen step-8/parallel-1 request. Derive the current reading identity:
   `node <Runtime>/scripts/restatement-choice.mjs <Session>/step-8/parallel-1`.
   The owner updates only its still-unaccepted blocked response interaction to this returned id,
   after displaying that exact reading. Run `node <Runtime>/scripts/attempt-gate.mjs accept <Session>/step-8/parallel-1`.
   If any actual source/evidence gate fails, retain the refusal and repair that named defect; do not invent acceptance.
2. Record the actual matching user answer with
   `node <Runtime>/scripts/restatement-choice.mjs answer <Session>/step-8/parallel-1 <actual-answer.json>`.
   The file has `selected`, `selectedBy: "user"`, and the genuine `sourceRef`. It is not a generated default approval.
3. `node <Runtime>/scripts/plan-history.mjs preview <Session>`.
   The declared discovery roles are inferred. Review the complete forecast; pass its exact returned
   `previewHash`, unchanged `flags` and a concrete reason in `<reviewed-plan.json>` to
   `node <Runtime>/scripts/plan-history.mjs commit <Session> <reviewed-plan.json>`.
4. Locate the new current `business.decide` node for the same `doneWhen` as accepted step 8. Preview
   again using a flags file whose `edit` is
   `{ "kind": "resume", "cell": "<new business cell>", "source": "8/1" }`.
   Commit that preview with the same reviewed-plan shape. This reuses the exact current reading and
   answer; it does not reuse old mission product evidence. The new request binds the returned resume,
   decision id and selected option. Execute fresh current preflight/binds required before it.

## Accounting

Session: `D:/Repositories/nivo-backend/.worktrees/sessions/20260905-nivo-accounting-01a07247`.

Run the same `plan-history.mjs preview <Session>` and `commit` commands after the owner confirms that
the recorded current mission contains the actual authorized final destination. The observed current
v4 mission produces 21 planned steps; it does not claim publication authorization absent from scope.
The new forecast retains 13/1, 14/1 and the former chain as immutable historical evidence. Their
original requests and receipts are not rewritten, reaccepted or counted as current v4 completion.
Open the new forecast's first invocation with the ordinary attempt gate.

## Within either current forecast

- An accepted current blocked reading resumes with flags
  `{ "edit": { "kind": "resume", "cell": "N/M" } }`, after its genuine required answer.
- An unopened fanout expands with flags
  `{ "edit": { "kind": "expand", "cell": "N/M", "producer": "P/Q", "goals": { "unit-id": 0 } } }`.
  `goals` is required when that operator owns multiple done-when lines; use the actual accepted unit
  ids and matching confirmed line indices. The planner reads the matched producer's sealed units and
  emits exact unit/input bindings in dependency order. Already dispatched coordinates do not move.
- Always preview, display and commit the returned digest before opening the changed invocation.
  A forecast is planned work, never verified completion. Use `validate-session.mjs <Session>` after
  each accepted transition; required source, account, runtime, seed, audit and UAT evidence remain gates.
