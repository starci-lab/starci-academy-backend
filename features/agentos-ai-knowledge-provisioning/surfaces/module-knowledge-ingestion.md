# Surface · Module knowledge ingestion

> ID: `module-knowledge-ingestion` · Route: `/[locale]/agentos/workspaces/[workspaceId]/modules/studio/[moduleId]`

## Job

Show whether each uploaded module document has progressed from a scan-ready object into scoped retrievable knowledge.

## Navigation

- workspace-modules / Module studio — active
- workspace / AI and Knowledge — available

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `uploaded-knowledge-documents` | collection | Document; Scan; Extraction; Index; Scope | document-uploading, document-scanning, document-extracting, document-embedding, document-indexed, document-refused | Upload document, Retry, Remove | `EV-001`, `EV-011` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
