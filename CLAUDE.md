# StarCi agent bootstrap

Before planning, reading target source, or running a skill, read
[`<Source>/.claude/SKILL.md`](.claude/SKILL.md) and follow its build and load order.

`<Source>` is the single host repository that owns this bootstrap and the `.claude` runtime. A routed
repository checkout or Git worktree follows that Source; do not rebind `<Source>` to it or expect it to
contain another `.claude/SKILL.md`. The sibling `.workspaces/projects/<project>/work.json`
binds target repositories and the project-owned `.starciwork`; use that mapping for both FE and BE.

This file is only a bootstrap. Do not copy context, brainstorm, compiler, gate or skill rules into it:
the entry routes, and a rule copied here becomes a second home that nobody remembers to update.
