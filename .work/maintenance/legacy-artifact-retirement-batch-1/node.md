---
{"schema":"work/node@1","id":"nivo.maintenance.legacy-artifact-retirement-batch-1","kind":"operations","required":false,"state":"done","refs":["import.nivo-console-overview-legacy","import.nivo-module-setup-legacy","import.nivo-signin-dashboard-direction-d-legacy"],"assertions":["legacy-artifacts-sanitized","console-overview-source-retired","signin-direction-source-retired","incomplete-module-setup-protected"],"completion":{"inputDigest":"06022fc2464ff7626b1105047c9fa45cb34fd86131b6740d49f4638721041bc3","evidence":["nivo.maintenance.legacy-artifact-retirement-batch-1.20260908"]}}
---
# Retire legacy Nivo artifact batch 1

## Scope

Preserve sanitized historical context from Console overview, the direction-d sign-in/dashboard decision, and module Setup observations. Remove only the two source directories whose unique durable content is represented by the new imports.

## Safety boundary

The incomplete module Setup source remains in place because older captures, cleanup state, and excluded custody material are not yet replaceable. Account files, database snapshots, seed records, credentials, tokens, and sealed secret bytes never enter `.work`.
