# Flow · Turn an uploaded module document into scoped workspace knowledge

> ID: `ingest-module-document` · Trigger: The workspace owner attaches a document to one exact custom module

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `workspace-owner` | `module-knowledge-ingestion` | Upload the document to quarantine and observe its scan result | Only a scan-ready document advances to content processing |
| 2 | `workspace-owner` | `module-knowledge-ingestion` | Observe extraction, chunking, embedding and scoped indexing | The document becomes indexed for the exact workspace and module or exposes a local retryable refusal |
| 3 | `workspace-owner` | `module-knowledge-status` | Inspect the module's knowledge version, uploaded sources and current binding status | The owner can distinguish Nivo, module-package and uploaded knowledge origins |

## Outcomes

- Successful uploaded content becomes scoped retrieval material instead of only stored attachment metadata
- One failed document does not discard another document or the existing module profile

Evidence: `EV-001`, `EV-003`, `EV-010`, `EV-011`
