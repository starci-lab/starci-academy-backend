---
{"schema":"work/node@1","id":"nivo.agentos.migration","kind":"operations","required":true,"state":"done","refs":["repo.nivo-backend","repo.nivo-frontend","import.nivo-active-tasks","import.nivo-historical-uat"],"assertions":["scope-bound","source-grounded","artifacts-preserved","states-reviewed","cleanup-safe"],"completion":{"inputDigest":"5093f3aff2fe37ab7eaeb2a3e009a07f790e3de1178a941ecf5c2fab874c15f9","evidence":["nivo.agentos.migration.v3-20260908"]}}
---
# Migrate the three active Nivo streams into `.work`

## Scope

Inventory the shared lifecycle, Chatbot, Accounting, and their sign-in prerequisite; map source and observed evidence into a V3 completion tree; preserve selected non-secret assets; and validate the result.

## Done when

- The tree includes only the requested streams and sign-in prerequisite.
- Source claims resolve to concrete repositories, commits, paths, or preserved evidence.
- Selected images and machine-readable walk results are copied without secret material.
- Leaf state is reviewed individually; UI is not completed without approved visual direction.
- Active Git worktrees and original evidence remain untouched because cleanup was not requested.

## Exclusions

This operation does not implement product code, rerun UAT, transmit credentials, delete worktrees, or certify historical task summaries as acceptance evidence.
