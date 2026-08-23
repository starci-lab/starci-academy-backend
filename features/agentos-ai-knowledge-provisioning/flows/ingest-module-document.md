# Flow · Turn an uploaded module document into scoped workspace knowledge

> ID: `ingest-module-document` · Trigger: The workspace owner attaches a policy-allowed document to one exact module without starting or changing that module's conversational intake

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `workspace-owner` | `module-knowledge-ingestion` | Upload an allowed PDF, DOCX, UTF-8 text or Markdown document of at most 20971520 bytes to quarantine and observe its fail-closed ClamAV result | Only a policy-compliant scan-ready document advances to its supported text extractor |
| 2 | `workspace-owner` | `module-knowledge-ingestion` | Observe extraction, chunking, embedding and scoped indexing | The document becomes indexed for the exact workspace and module or exposes a local retryable refusal |
| 3 | `workspace-owner` | `module-knowledge-status` | Inspect the module's knowledge version, uploaded sources and current binding status | The owner can distinguish Nivo, module-package and uploaded knowledge origins |

## Outcomes

- Successful uploaded content becomes scoped retrieval material instead of only stored attachment metadata
- One failed document does not discard another document or the existing module profile
- Document ingestion remains independent from ask-until-complete module intake and interview orchestration

Evidence: `EV-001`, `EV-003`, `EV-010`, `EV-011`, `EV-017`, `EV-028`, `EV-029`, `EV-030`
