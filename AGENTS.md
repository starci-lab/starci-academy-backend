# StarCi agent bootstrap

Before planning, reading target source, or running a skill, read
[`<Source>/.claude/INDEX.md`](.claude/INDEX.md) completely and follow its load order.

`<Source>` is the single host repository that owns this bootstrap and the `.claude` runtime. A routed
repository checkout or Git worktree follows that Source; do not rebind `<Source>` to it or expect it to
contain another `.claude/INDEX.md`.

Nothing is designed, written or committed outside a session: the first act of a mission is the session
folder and a validated request.json.

This file is only a bootstrap. Do not copy context, brainstorm, compiler, gate or skill rules into it:
the entry routes, and a rule copied here becomes a second home that nobody remembers to update.
