# Support Desk diagnostics

- Identity: `support-diagnostics`
- Route: `/[locale]/agentos/workspaces/[workspaceId]/modules/[moduleId]/diagnostics`
- Eyebrow: Advanced evidence
- Purpose: Inspect context, knowledge-index, provider prompt-cache metrics, channel and failure evidence.

## Regions

### Runtime evidence

- Identity: `diagnostic-evidence`
- Kind: `details`
- Summary: Version ordinals, digests, prompt-prefix fingerprint, provider cache hit or miss, cached and uncached input-token counts, credential status and safe failures.
- Items: `context-digest` (Context digest), `cache-freshness` (AI cached input tokens)
- Actions: `reverify` (Reverify)
- States: `support-live`, `support-degraded`
- Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`
