# StarCi trust router

`D:\Repositories\starci-academy-backend\.claude\` is the single trust tree for both
`starci-academy-backend` and `starci-academy-fe`. This file routes work into that tree; it does not
repeat its laws.

## Read first

1. Read [`.claude/CONTEXT-LOCK.md`](.claude/CONTEXT-LOCK.md), detect the task context and print its
   Context Lock table before running a skill or taking a task action.
2. Read [`.claude/INDEX.md`](.claude/INDEX.md) to identify the governing axis and concept.
3. Read [`.claude/HOW-TO-WRITE.md`](.claude/HOW-TO-WRITE.md) before changing trust itself.
4. Read every governing file completely before proposing, reviewing or editing code.

| Work | Trust source |
|---|---|
| Backend architecture and implementation | [`.claude/be/canon/`](.claude/be/canon/) |
| Frontend architecture and implementation | [`.claude/fe/canon/`](.claude/fe/canon/) |
| Frontend visual judgement | [`.claude/fe/design/`](.claude/fe/design/) |
| Frontend page or flow invention | [`.claude/fe/creativity/INDEX.md`](.claude/fe/creativity/INDEX.md) |
| What one named StarCi screen already promises, when a request says preserve, fork, port or match | [`.claude/fe/baselines/`](.claude/fe/baselines/) |
| Net-new UI or UI that still needs a choice: show 2-4 visibly directional HTML options, prove their StarCi implementation feasibility and stop for selection | [`.claude/skills/starci-fe-design-plan/`](.claude/skills/starci-fe-design-plan/) |
| Rebuild the winner as an executable StarCi candidate, render locked states from that code and hash-seal one approved revision | [`.claude/skills/starci-fe-design-preview/`](.claude/skills/starci-fe-design-preview/) |
| Materialize only the sealed candidate, without screenshot reinterpretation, then prove same-state parity | [`.claude/skills/starci-fe-design-apply/`](.claude/skills/starci-fe-design-apply/) |
| Repair a bounded known-reference FE fidelity, interaction or runtime defect without inventing choices | [`.claude/skills/starci-fe-fidelity-fix/`](.claude/skills/starci-fe-fidelity-fix/) |
| Survey a scope for near-duplicate owners, freeze their call sites and settle each cluster: merge, one variant prop, extract the shared shape, or keep apart | [`.claude/skills/starci-fe-consolidate-plan/`](.claude/skills/starci-fe-consolidate-plan/) |
| Carry out approved consolidation verdicts, one cluster per diff, proving every measured call site still renders the same | [`.claude/skills/starci-fe-consolidate-apply/`](.claude/skills/starci-fe-consolidate-apply/) |
| Enforceable canon artifacts | [`.claude/sources/`](.claude/sources/) |
| Task-specific operating procedures | [`.claude/skills/`](.claude/skills/) |

## Authority

The user's current instruction and named reference decide product intent. Trust decides how that
intent is expressed. Executable source and tests establish current business behavior; a difference
between source and trust is a finding to resolve, not permission to choose whichever is convenient.

For design claims, use
[`.claude/fe/creativity/best-belief-source.md`](.claude/fe/creativity/best-belief-source.md):
backend behavior owns business truth, contract `why` owns UI relationships, component source owns
reuse evidence, and a named legacy render owns migration parity.

## Working boundary

- There is one trust tree: `.claude/` in this repository.
- **The lint rules, front end and back end, are authored here and nowhere else.** A consuming
  repository carries a GENERATED mirror — of `.claude/sources/fe/`, written and re-verified by
  [`.claude/scripts/sync-fe-lint.mjs`](.claude/scripts/sync-fe-lint.mjs), or of
  `.claude/sources/be/`, written by
  [`.claude/scripts/sync-be-lint.mjs`](.claude/scripts/sync-be-lint.mjs). The mirror is never edited
  in place, never hand-merged, and never grows a rule of its own; drift from this tree is a gate
  failure, not a local decision.

  The back-end script will not remove a repository's hand-written plugin while that plugin still
  publishes a rule canon does not. The front-end removal cost seven live rules that are still owed
  back, and an adoption that subtracts enforcement is not adoption.

  A mirror rather than a cross-repository import, because an import that climbs out of the
  repository root is only correct while both checkouts sit side by side — a repository cloned alone,
  a CI job that fetches one repository, a Docker build that copies one directory, and the config
  cannot resolve at all.

  Generated rather than copied by hand, because copied-by-hand is what this replaced. The same rules
  ended up in four places and did not merely age: they drifted in rule NAMES, so a repository passed
  its own gate while failing canon's; and one copy knew only the single-app folder layout, so aimed
  at a monorepo it reported fifty correct files as broken. The obvious reading was that the
  repository owed fifty fixes. It owed none.

  What legitimately differs per repository is the CONFIG, not the rules: which globs a monorepo
  lints against versus a single app. Rules are the law; globs are where it applies.
- Project identity is discovered, shown and inherited according to `.claude/CONTEXT-LOCK.md`; the
  repository containing trust is not automatically the repository being changed.
- Do not create `.claudev2`, `.claude-legacy`, `CLAUDE_V2.md`, a second frontend canon, or a
  `plugins/eslint/` folder in a consuming repository.
- A root `CLAUDE.md` is only an entry router.
- In migration work, reproduce the named reference before proposing redesign.
- In creative work, keep canon fixed while exploring hierarchy, sequencing, disclosure and CTA.
- Net-new or undecided UI always moves through Plan -> Preview revisions -> Apply; a settled bounded
  defect uses Fidelity Fix and returns to Plan if a product decision appears.
- Plan HTML is visibly directional and never an implementation baseline. Preview is the executable
  specification; Apply ports its exact tree, contracts, props, tokens and fixtures. Any target drift
  or desired substitution returns to Preview instead of being improvised during Apply.
- Visual comparison is valid only under the same route, viewport, locale, theme, auth persona,
  fixture/backend seed and owner state.
- A frontend target is not adopted until the canonical effective-config audit proves the complete
  StarCi FE rule set at error with inline config refused.
- Verify with the governing tests or gates and the rendered state matrix appropriate to the claim.
