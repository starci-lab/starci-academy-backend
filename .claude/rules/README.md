# StarCi design/engineering rules — "v2" (STRICT, read before writing any rule)

This tree (`concepts/`, `elements/`, `layouts/`, `responsives/`, `debts/`) is the **ONLY** canonical rule
set for the StarCi Academy FE app's design system + cross-cutting engineering conventions — even though
it documents the FE app, which lives in a **separate repo**: `D:\Repositories\starci-academy`. There is
no `main.md` / `starci-<element>.md` (that was v1 — retired). This IS "v2".

## Rules for writing rules (STRICT)

1. **A ruling worth keeping → write it STRAIGHT into the matching file HERE, in THIS repo
   (`starci-academy-backend`), under `concepts/`, `elements/`, `layouts/`, or `responsives/`.**
   Pick by nature: reusable UI element (button/card/input/list/tabs/chip/…) → `elements/`; spacing/
   radius/responsive/scroll → `layouts/`/`responsives/`; heuristic/business rule/when-to-use-what →
   `concepts/`. Create a new file if the topic doesn't have one yet.
2. **`drafts/*.md` is a DEPRECATED staging workflow (chốt 2026-07-06) — do NOT create new draft files,
   here or anywhere else.** Write directly into canonical. Only `/merge` still touches `drafts/`, to
   clear out whatever legacy backlog is still unmerged from before this cutover.
3. **NEVER create a `.claude/rules/` folder with rule/draft content inside the FE app repo**
   (`D:\Repositories\starci-academy`). That repo runs the app code; it has no `concepts/`/`elements/`/
   `layouts/` of its own to fold into — a rules/drafts folder created there is an isolated dead end with
   no canonical home. If you find one (any `.md` under `starci-academy/.claude/rules/`), that is drift:
   fold its content into the matching file HERE, then delete it there. (Confirmed and cleaned once,
   2026-07-06 — 13 stray files folded + deleted; don't let it recur.)
4. **FE-scoped skills (`starci-fe-ux-apply`, `starci-fe-ux-brainstorm`, `starci-fe-layout-brainstorm`,
   `starci-fe-critique`, `/merge`) are all DEFINED in this repo** (`.claude/skills/`), even though they
   operate on the FE app's code in the other repo. Any of their instructions that say "update rules" /
   "ghi vào rules" means: THIS repo's `.claude/rules/` tree, never the FE app repo.

If you are a session that just opened this repo and are about to touch `.claude/rules/` — the above is
the full picture; there is no other rules system to reconcile with.
