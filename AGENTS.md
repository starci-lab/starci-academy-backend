# StarCi agent bootstrap

<!-- starci:prompt-entry -->
Before planning, reading target source, or running a skill, read
[`<Source>/.claude/SKILL.md`](.claude/SKILL.md) and follow its build and load order.

`<Source>` is the single host repository that owns this bootstrap and the `.claude` runtime. A routed
repository checkout or Git worktree follows that Source; do not rebind `<Source>` to it or expect it to
contain another `.claude/SKILL.md`. The sibling `.workspaces/projects/<project>/work.json`
binds target repositories and the project-owned `.starciwork`; use that mapping for both FE and BE.

Carry the resolved host, project binding and project skill path when delegating work or changing
directories. A task opened outside the host must receive that context explicitly.
This file locates the runtime; workflow selection, goal confirmation and evidence rules live there.
<!-- /starci:prompt-entry -->

## Environment gotchas

- `ACP_BACKEND=windsurf` leaks into shells spawned from Devin Desktop and makes `devin` CLI take the
  Windsurf auth branch, rejecting valid Devin credentials (`auth status` → "Not logged in").
  Before spawning `devin` in a terminal: `Remove-Item Env:ACP_BACKEND` (PowerShell) or
  `env -u ACP_BACKEND` (POSIX). Devin auth state lives in `%APPDATA%/devin/credentials.toml`;
  `devin auth status` must be run without that env var to report correctly.
