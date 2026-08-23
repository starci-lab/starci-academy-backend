# Flow · Remove uploaded module knowledge and its retained object

> ID: `remove-module-document` · Trigger: The workspace owner removes one active uploaded module document

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `workspace-owner` | `module-knowledge-ingestion` | Remove the document from the exact workspace and module scope | Its retrieval points and access are removed immediately |
| 2 | `workspace-owner` | `module-knowledge-ingestion` | Observe the retained original object's deletion status | The object is deleted within 24 hours while a safe owner-visible status is retained |

## Outcomes

- Removed content cannot be retrieved after the owner action succeeds
- Malware and policy-refused objects are deleted immediately after their safe failure code is persisted

Evidence: `EV-017`, `EV-028`, `EV-030`
