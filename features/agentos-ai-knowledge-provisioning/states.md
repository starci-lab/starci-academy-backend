# States · AgentOS AI and knowledge provisioning

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `ai-provision-pending` | initial | AI runtime provisioning has not started | ai-key-configuring | `EV-001` |
| `ai-key-configuring` | pending | The workspace credential and pinned model are being configured | ai-knowledge-recovering, ai-readiness-refused | `EV-001`, `EV-005`, `EV-006`, `EV-007` |
| `ai-knowledge-recovering` | pending | Versioned Nivo and module knowledge is being recovered or imported | ai-readiness-testing, ai-readiness-refused | `EV-001`, `EV-008`, `EV-009`, `EV-010` |
| `ai-readiness-testing` | pending | The exact workspace AI and scoped knowledge path is being tested | ai-ready, ai-readiness-refused | `EV-001`, `EV-014`, `EV-015` |
| `ai-ready` | success | The workspace AI runtime and scoped knowledge path passed | ai-readiness-testing, knowledge-refreshing, document-uploading | `EV-001` |
| `ai-readiness-refused` | error | One required AI readiness component failed or is unavailable | ai-key-configuring, ai-knowledge-recovering, ai-readiness-testing | `EV-001` |
| `knowledge-refreshing` | pending | Common or module knowledge is refreshing | knowledge-current, knowledge-refused | `EV-001`, `EV-008`, `EV-010`, `EV-013` |
| `knowledge-current` | success | All declared common and module knowledge versions are current | knowledge-refreshing, document-uploading | `EV-001` |
| `knowledge-refused` | error | Knowledge refresh was refused while the last verified state remains available | knowledge-refreshing | `EV-001` |
| `document-uploading` | pending | A module document is uploading to quarantine | document-scanning, document-refused | `EV-001`, `EV-011` |
| `document-scanning` | pending | The uploaded module document is being scanned | document-extracting, document-refused | `EV-001` |
| `document-extracting` | pending | Text is being extracted and chunked from a scan-ready document | document-embedding, document-refused | `EV-001`, `EV-011` |
| `document-embedding` | pending | Document chunks are being embedded and indexed into the scoped workspace collection | document-indexed, document-refused | `EV-001`, `EV-011` |
| `document-indexed` | success | The uploaded document is available to its declared module knowledge scope | knowledge-refreshing, document-removing | `EV-001`, `EV-017` |
| `document-removing` | pending | The document's retrieval points and access are being removed | document-removed, document-refused | `EV-017`, `EV-028` |
| `document-removed` | success | Retrieval access is removed and retained-object deletion is complete or due within 24 hours | terminal | `EV-017`, `EV-028` |
| `document-refused` | error | The document could not be scanned, extracted, embedded or indexed | document-uploading | `EV-001`, `EV-011` |
