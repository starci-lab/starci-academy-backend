# RC.10 native continuation procedure (pending release proof)

This support note is preparation only. It grants no new scope or approval and does not edit a native ledger.
Use the final published Source runtime, not the isolated candidate's different workflow-owner path.

Read-only snapshot: Chatbot mission v4 retains accepted BE `21/1` (doneWhen 9) and FE `22/1`
(doneWhen 11). FE22's typed backend Input is exactly `step-21/parallel-1/response/response.md`.
Runtime doneWhen 1 explicitly requires both declared frontend and backend commits to be served.

The owning task prepares a new request-side diagnostic method with exact content hash, using a
required criterion of the original source. BE21 includes `multi-instance-chatbot-implemented`;
FE22 includes `chatbot-workbench-contract-connected`. Choose the criterion actually measured by
the diagnostic. Do not reuse an old result or claim a failed command before it runs.

The existing native CLI remains:

```powershell
node D:/Repositories/starci-academy-backend/.claude/scripts/plan-history.mjs preview <session> <flags.json>
node D:/Repositories/starci-academy-backend/.claude/scripts/plan-history.mjs commit <session> <reviewed-plan.json>
```

`reviewed-plan.json` contains the exact returned `previewHash`, unchanged `flags`, and the actual
reason for this same-scope correction. Each new source/quality request still uses ordinary
open/acquire/run/accept gates. Preserve every prior request, receipt, commit and context.

1. Review BE21: flags `edit` has `kind: "review"`, `cell: "21/1"`, the measured original
   `criterionId`, `method: {ref: "request/<method-file>", sha256: "sha256:<actual-content-hash>"}`,
   and the exact real `gates` plan. Include FE22 as a counterpart only when the method measures
   that accepted consumer's exact source. The required gate's `configRef` must name the frozen method.
2. Run the new readonly quality invocation. A genuine accepted required in-boundary red gate
   without debt permits `edit: {kind: "source-repair", cell: "21/1", review: "<accepted-review-cell>",
   gateRef: "response/data/gates/<failed-gate>.json"}`. Produce a new normal BE commit with the
   original goal, criteria, requirements and write authority.
3. Review FE22 with `counterparts: ["<accepted-BE-repair-cell>"]`, its original required criterion,
   and a new frozen method measuring the actual corrected backend contract and frontend source.
   Keep the existing mandatory presentation sweep; unmeasured browser scorecard topics are blocked.
4. After its genuine accepted red review, FE source-repair uses
   `replacements: {"backend-source-application": "<accepted-BE-repair-cell>"}`.
   Only this exact original producer input is replaced. The new FE invocation keeps its original
   goal/requirements/criteria/effect bounds and creates its own normal source commit.
5. Partition the current unopened runtime delivery cell returned by the latest forecast (do not
   assume it is still 23/1):
   `edit: {kind: "partition", cell: "<current-runtime-cell>", env: "dev", routes: ["nivo/be", "nivo/fe"]}`.
   Each branch freezes its own actual target commit and runtime evidence. Both members are required
   for original doneWhen 1; a repaired source or one runtime receipt cannot close that aggregate goal.
6. Expand the current seed/UAT execution fanout only from its exact accepted plan producer with
   existing `kind: "expand"` flags. Every required unit remains owed. Future audit/API/UAT outputs
   remain unverified until their own actual invocations finish.

Fresh peer imports and coordination consumption refuse pending or retired source proof. Historical
accepted imports remain sealed; their existence does not authorize a fresh consumer of retired source.
