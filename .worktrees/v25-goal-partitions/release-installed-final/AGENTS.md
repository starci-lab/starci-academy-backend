# StarCi agent bootstrap

<!-- starci:prompt-entry -->
For every user prompt, enter [StarCi](.claude/INDEX.md) before planning or target work and follow
the entry's user-session and goal protocol. Follow-up prompts reuse that host session.
<!-- /starci:prompt-entry -->

Read [`<Source>/.claude/INDEX.md`](.claude/INDEX.md) completely and follow its load order.

`<Source>` is the single host repository that owns this bootstrap and the `.claude` runtime. A routed
repository checkout or Git worktree follows that Source; do not rebind `<Source>` to it or expect it to
contain another `.claude/INDEX.md`.

This file is only a bootstrap. Do not copy context, brainstorm, compiler, gate or skill rules into it:
the entry routes, and a rule copied here becomes a second home that nobody remembers to update.
