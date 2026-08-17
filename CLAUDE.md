# StarCi Claude bootstrap

Before planning, reading target source, or running a skill, read
[`<Source>/.claude/common/config/INDEX.md`](.claude/common/config/INDEX.md) completely and follow its
loading order.

This file is only the Claude bootstrap. Do not copy workspace, frontend, backend, registry, or
workflow configuration into it; keep that configuration under `.claude/common/config/`.

## Coding gate

Before the first code write, load the applicable pattern modules completely:

- FE and FE legacy: `.claude/fe/gates/patterns/`
- BE: `.claude/be/gates/patterns/`

Use `.claude/common/config/INDEX.md` to resolve the project, roles, contract and exact relevant
modules. Do not code from this pointer alone and do not duplicate pattern contents here.
