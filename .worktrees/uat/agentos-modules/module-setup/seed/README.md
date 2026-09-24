# Setup history seed

Twelve fictional historical rows were inserted for the dedicated flow account by 20260904-042915-nivo-workspace.bind, step40. The database uses its existing schema. Orders, Setup sessions and context versions use direct account ownership; workspaces, installations and messages use the exact declared UUID prefix because those stores have no direct account owner. Message actor is authorship, not ownership.

Representative volume is two revisions, three messages each and one unapplied context version. No Test, Apply, provisioning, payment or live reply outcome is seeded as a performed user action.

The full insertion, replay, savepoint cleanup and shared-data proofs are in .worktrees/sessions/20260904-042915-nivo-workspace.bind/step-40/parallel-1/response/artifacts/seed-result.json; attribution is in seed-witness.json. Cleanup uses only the twelve exact identifiers in records.json, verifies ownership and all guarded dependencies, and preserves the flow account. Never delete by prefix. The retained history is a precondition; a navigation UAT reuses it and owns no seed rows to delete.
