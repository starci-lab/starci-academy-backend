# Local development seeds

The reusable local seed has two layers:

1. `catalog-full.yaml` hydrates authored GitMount data into PostgreSQL and rebuilds the declared read stores. Apply it for one backend boot, then restore `runtime/config/seed.yaml` to `enable: false`.
2. `learning-demo.sql` adds idempotent, production-shaped learner activity after the catalog exists. It never creates the real login account; that account must have signed in once so its Keycloak identity remains authoritative.

Run the learner seed from the repository root:

```powershell
& .\.stacks\dev\seeds\run-learning-demo.ps1
```

Override the defaults when needed:

```powershell
& .\.stacks\dev\seeds\run-learning-demo.ps1 `
    -TargetEmail "learner@example.com" `
    -PrimaryCourse "fullstack-mastery"
```

The SQL is transactional, deterministic and safe to rerun. Its final query reports the resulting user, enrollment, learning, challenge, coding, project, activity and XP counts. The runner then invalidates only that learner's Keycloak identity and enrollment caches so a database rebuild cannot leave GraphQL or Socket.IO bound to an obsolete internal user UUID.
