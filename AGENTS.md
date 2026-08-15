# StarCi skill source

The repository containing this file is `Source`: the Codex project context that owns shared trust,
skills and workflow records.

Resolve shared roots from `Source`:

| Field | Resolution |
|---|---|
| Source | repository containing this `AGENTS.md` |
| Trust | `<Source>/.claude` |
| Skills | `<Trust>/skills` |
| Workflow root | `<Source>/.workflows` |

`Source` is not an inferred target frontend or backend. Before a StarCi skill continues, the user
must provide either:

- a `Project` identity from which the skill can resolve the target repositories; or
- explicit `Frontend` and `Backend` target repositories.

Do not infer `Project`, `Frontend` or `Backend` from the Source folder name. Print the resolved values
in the canonical `CONTEXT` table. If neither project context nor explicit target repositories were
provided, put one batched question in `NEED APPROVALS` and do not begin target-specific work.

All Plan, Review and Apply records live under Source's single workflow root:

```text
<Source>/.workflows/<kind>/<app>/<name>.md
```

Never create another `.workflows` root. Preserve unrelated working-tree changes and follow the
selected skill's Plan -> Review -> Apply lifecycle.
