# StarCi agent bootstrap

<!-- starci:prompt-entry -->
Before planning, reading target source, or running a skill, read
[`<Source>/.claude/SKILL.md`](.claude/SKILL.md) and follow its load order — the runtime tree is canonical source, there is no build step.

`<Source>` is the single host repository that owns this bootstrap and the `.claude` runtime. A routed
repository checkout or Git worktree follows that Source; do not rebind `<Source>` to it or expect it to
contain another `.claude/SKILL.md`. The sibling `.workspaces/projects/<project>/work.json`
binds target repositories and the project-owned `.starciwork`; use that mapping for both FE and BE.

Carry the resolved host, project binding and project skill path when delegating work or changing
directories. A task opened outside the host must receive that context explicitly.
This file locates the runtime; workflow selection, goal confirmation and evidence rules live there.
<!-- /starci:prompt-entry -->

## Work correction policy

- Do not create or use `debt.md`; technical-debt ledgers are not part of the Work model.
- Fix small defects and missing flow details directly in the owning Work or product source, then verify the affected checks.
- When business behavior or a code flow is wrong, return to the owning workflow, re-run it from the affected Business/SRS or Architecture/SDS boundary, and produce fresh evidence. Never relabel an incorrect flow as debt or refresh stale evidence by assertion.
