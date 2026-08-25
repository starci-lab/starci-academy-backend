# Specification · AgentOS module management

## Flow

1. AgentOS reaches installed-ready state.
2. The user chooses exactly one registered module kind.
3. The platform creates a draft and opens module management.
4. The user configures Overview, Shared chat and the selected Workbench.
5. The platform validates readiness and reports missing settings.
6. The user activates a ready module.

## Deferred decisions

- Shared-chat conversation or thread cardinality
- Permission and sharing granularity
- Embedded, linked or native workbench integration
- Kind-specific fields and credentials
- Archive, delete, duplicate and import/export lifecycle
