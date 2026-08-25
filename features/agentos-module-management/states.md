# States · AgentOS module management

```text
draft -> ready -> active
  ^        |
  |--------|
```

- `draft` — configuration is incomplete or has not passed readiness.
- `ready` — required configuration is valid and activation is allowed.
- `active` — the module is available in the AgentOS user workspace.
