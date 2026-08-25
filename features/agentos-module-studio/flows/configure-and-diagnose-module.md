# Flow · Configure a module without mixing workspace operations or runtime diagnostics

> ID: `configure-and-diagnose-module`

## Trigger

The workspace owner chooses module settings or diagnostics from the exact operating shell.

## Steps

| Step | Actor | Action | Result | Surface | State |
|---|---|---|---|---|---|
| `open-module-settings` | `workspace-owner` | Open module settings | Identity, module-scoped knowledge, integrations and permissions appear in task-oriented sections | `module-settings` | `module-settings-ready` |
| `save-module-configuration` | `workspace-owner` | Save an allowed module-scoped change | The change is validated against the exact module kind and preserves the current conversation and workbench | `module-settings` | `module-settings-saving` |
| `open-module-diagnostics` | `workspace-owner` | Open advanced diagnostics | Package version, digest, embedding, installation lifecycle and failure evidence are available without dominating normal operation | `module-diagnostics` | `module-diagnostics-ready` |

## Outcomes

- Workspace-level AI readiness remains owned by the workspace control center
- Technical evidence remains available through progressive disclosure

Evidence: `EV-011`, `EV-014`
