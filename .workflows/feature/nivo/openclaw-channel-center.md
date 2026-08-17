<!-- starci-workflow: v2 -->

## plan — nivo-openclaw-channel-center-r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Charts | D:\Repositories\nivo-charts |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo — Core GraphQL owns viewer authorization and configuration; the AgentOS pod consumes the resulting Secret; OpenClaw owns channel runtime |
| Repo / branch | Backend `main` at `bbee1cec6d6466585e99dc0cc7bddb857006c93e`; frontend `main` at `7bc2ff4ca8a756d866ead66486dd2781ba3fa933`; charts `main` at `4a3aabb9d4db60f0f9e7332195b46276368b5295`; Source `mtp` at `5a5a544434171eb176af0c6d09e33c4d77731753` |
| Database | Primary PostgreSQL `POSTGRESQL_PRIMARY`: existing `agent_workspaces`, `channel_connections` and `pod_credentials`; no new table is proposed |
| Purpose | Let an owner configure OpenClaw messaging channels from the exact AgentOS workspace page, with write-only secrets, honest delivery state and one Kubernetes rollout per atomic provider update. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\openclaw-channel-center.md |
| Language | vi |
| Phase | plan |
| Touching | This phase writes only this workflow. No backend, frontend or chart source is changed. |

### OBJECTIVE

Thêm một **Trung tâm kênh** vào workspace AgentOS để chủ workspace tự cấu hình Telegram, Zalo, Messenger, WhatsApp, Slack và Discord cho OpenClaw. Nivo FE chỉ gọi Nivo Core GraphQL. Core xác thực quyền sở hữu theo đúng `agentWorkspaceId`, nhận secret theo provider recipe đóng, mã hóa trong PostgreSQL, đồng bộ một lần vào `nivo-<podId>/app-secrets`, rollout OpenClaw một lần và chỉ trả trạng thái/hint về browser. Không thêm sidecar cấu hình mới, không trả secret đã lưu, không suy đoán “connected” trước khi running pod nhận cấu hình.

### LIVE SCHEMA AND SOURCE EVIDENCE

| Evidence | Finding |
|---|---|
| Unfiltered live schema at `http://localhost:3067/graphql` | Existing surface has `myChannels`, `connectChannel`, `reconnectChannel`, `saveChannelCredential` and `connectInstanceChannel`; it has no workspace-scoped atomic provider configuration contract. |
| `my-channels` query | Correctly scopes `agentWorkspaceId` to the viewer, but returns only persisted connection rows; absent providers and per-key delivery state cannot be rendered. |
| `connect-channel` / `reconnect-channel` | Both can set `ChannelConnectionEntity.status = connected` without proving a credential reached OpenClaw. They cannot back the new UI. |
| `save-channel-credential` | Secrets are write-only and rolled correctly, but `ViewerPodService.findPodIdForViewer` selects the viewer's newest pod. A user with multiple AgentOS workspaces can configure the wrong workspace. Multi-key providers are also saved/rolled one key at a time. |
| `connect-instance-channel` | Encrypts one central credential and checks instance ownership, but does not write the pod Secret or roll OpenClaw. Its `connected` state can disagree with runtime. |
| `PodCredentialService` | Already encrypts values, returns only safe status, syncs `app-secrets` and rolls StatefulSet `openclaw` plus Deployment `nivo-sidecar`. It needs an atomic provider-set seam and exact key removal from the live Secret. |
| `channel-credential-keys.ts` | Existing closed allowlist already names Telegram, Zalo, Messenger, WhatsApp, Slack and Discord keys. Arbitrary environment-variable names are explicitly forbidden. |
| AgentOS chart `charts/agentos/templates/deployment.yaml` | OpenClaw and the existing sidecar already consume `app-secrets` through `envFrom`; no chart or new sidecar is needed for this capability. |
| Existing AgentOS workspace page | The page already has contract-owned tabs and reusable `StatusActionCard`; a later FE Apply can add a `channels` section without creating a mega-page. |

### ARCHITECTURE

1. `myAgentWorkspaceChannelSettings(agentWorkspaceId)` ownership-checks the exact workspace and resolves its linked instance and pod id. It returns all six supported providers even when none has a row, plus safe per-key `{ configured, hint, syncedAt }` state and aggregate `DISCONNECTED | PENDING | CONNECTED | ERROR` status.
2. `configureAgentWorkspaceChannel(input)` accepts `agentWorkspaceId`, a closed provider enum, display name and a bounded list of `{ key, value }`. A provider recipe validates exact allowed keys, required keys, alternative Zalo modes, duplicates and maximum lengths before any write.
3. The handler resolves workspace → instance → pod under the authenticated owner. The browser never supplies `podId`, namespace, Secret name or workload name.
4. One PostgreSQL transaction replaces the complete credential set for that provider and marks the matching `ChannelConnectionEntity` pending/disconnected-safe. Plaintext never enters the connection row, response, log or exception metadata.
5. After commit, Core reconciles the exact provider keys into `nivo-<podId>/app-secrets`: new values are written and retired keys are explicitly removed. It then rolls `openclaw` StatefulSet and `nivo-sidecar` Deployment once, not once per key.
6. Only after Secret reconciliation and rollout succeed are credential `syncedAt` values and connection status marked connected. If Kubernetes fails, encrypted rows remain recoverable with `syncedAt = null`, connection status becomes error, and the UI honestly renders “đã lưu, chưa áp dụng”; retrying the same input is idempotent.
7. `disconnectAgentWorkspaceChannel` removes every key owned by the selected provider from PostgreSQL and the live Secret, rolls once, and marks the connection disconnected. It is idempotent and never touches another provider's keys.
8. Successful configure/disconnect emits the existing AgentOS workspace event so the workspace page refetches over the current Kafka/Socket.IO runtime path. No new sidecar, public webhook ingress or second secret owner is introduced.

### PROVIDER RECIPES

| Provider | Accepted keys | Completion rule |
|---|---|---|
| `TELEGRAM` | `TELEGRAM_BOT_TOKEN` | Token required. |
| `ZALO` | `ZALO_BOT_TOKEN`, `ZALO_OA_ACCESS_TOKEN`, `ZALO_OA_SECRET` | Either bot token, or both OA access token and OA secret; partial OA pair is rejected. |
| `MESSENGER` | `MESSENGER_PAGE_ACCESS_TOKEN`, `MESSENGER_VERIFY_TOKEN`, `MESSENGER_APP_SECRET` | All three required. |
| `WHATSAPP` | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Both required. |
| `SLACK` | `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET` | Both required. |
| `DISCORD` | `DISCORD_BOT_TOKEN` | Token required. |

### PUBLIC CONTRACT

| Surface | Contract |
|---|---|
| `myAgentWorkspaceChannelSettings(agentWorkspaceId)` | Owner-only query returning the six provider cards, required field descriptors and safe status metadata. Never returns ciphertext or plaintext. |
| `configureAgentWorkspaceChannel(input)` | Owner-only mutation. Input is exact workspace UUID, provider enum, optional display name and validated credential entries. Output is the refreshed provider status envelope. |
| `disconnectAgentWorkspaceChannel(input)` | Owner-only idempotent mutation for one workspace/provider. Removes DB and Kubernetes values, rolls workloads once and returns disconnected status. |
| Realtime | Reuses the existing workspace event path; payload identifies workspace/provider/status only and contains no key hint or credential material. |

### PROPOSED FILE TREE

#### Query

| Path | Responsibility / shape evidence |
|---|---|
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-channel-settings/{index.ts,my-agent-workspace-channel-settings.module-definition.ts,my-agent-workspace-channel-settings.module.ts,my-agent-workspace-channel-settings.query.ts,my-agent-workspace-channel-settings.handler.ts,my-agent-workspace-channel-settings.service.ts,my-agent-workspace-channel-settings.resolver.ts,my-agent-workspace-channel-settings.handler.spec.ts}` | Full CQRS query family mirroring `my-channels`; ownership is decided in the handler and the twin spec covers absent/configured/pending/error states. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-channel-settings/graphql-types/{index.ts,response.ts}` | Provider enum/status/key descriptors and credential-free response envelope. |
| `src/features/core/api/core/graphql/queries/index.ts` | Imports and registers the query module in `QUERY_MODULES`; schema presence is proved. |

#### Configure mutation

| Path | Responsibility / shape evidence |
|---|---|
| `src/features/core/api/core/graphql/mutations/agent-workspace/configure-agent-workspace-channel/{index.ts,configure-agent-workspace-channel.module-definition.ts,configure-agent-workspace-channel.module.ts,configure-agent-workspace-channel.command.ts,configure-agent-workspace-channel.handler.ts,configure-agent-workspace-channel.service.ts,configure-agent-workspace-channel.resolver.ts,configure-agent-workspace-channel.handler.spec.ts}` | Complete CQRS mutation vertical; resolves exact workspace/pod, validates the recipe, persists once, delivers once and emits one event. |
| `src/features/core/api/core/graphql/mutations/agent-workspace/configure-agent-workspace-channel/graphql-types/{index.ts,input.ts,response.ts}` | Decorated UUID/provider/credential-entry input and safe provider-status response. |

#### Disconnect mutation

| Path | Responsibility / shape evidence |
|---|---|
| `src/features/core/api/core/graphql/mutations/agent-workspace/disconnect-agent-workspace-channel/{index.ts,disconnect-agent-workspace-channel.module-definition.ts,disconnect-agent-workspace-channel.module.ts,disconnect-agent-workspace-channel.command.ts,disconnect-agent-workspace-channel.handler.ts,disconnect-agent-workspace-channel.service.ts,disconnect-agent-workspace-channel.resolver.ts,disconnect-agent-workspace-channel.handler.spec.ts}` | Complete idempotent CQRS mutation vertical; removes only recipe-owned keys and emits one event. |
| `src/features/core/api/core/graphql/mutations/agent-workspace/disconnect-agent-workspace-channel/graphql-types/{index.ts,input.ts,response.ts}` | Decorated workspace/provider input and safe disconnected response. |
| `src/features/core/api/core/graphql/mutations/index.ts` | Imports and registers both mutation modules in `MUTATION_MODULES`. |

#### Shared channel delivery capability

| Path | Responsibility / shape evidence |
|---|---|
| `src/modules/bussiness/pod-credential/channel-provider.ts` | Closed provider enum and provider-to-key recipes; no arbitrary key namespace. |
| `src/modules/bussiness/pod-credential/channel-credential-keys.ts` | Re-exports the canonical union derived from recipes so old callers and the new operations cannot drift. |
| `src/modules/bussiness/pod-credential/pod-credential.service.ts` | Adds transaction-backed replace/remove provider-set methods, exact Kubernetes Secret key deletion, one sync and one rollout seam. Existing single-key custody remains compatible. |
| `src/modules/bussiness/pod-credential/pod-credential.service.spec.ts` | Proves atomic replacement, retired-key removal, provider isolation, no plaintext return/log metadata, pending delivery and one rollout. |
| `src/modules/bussiness/pod-registration/viewer-pod.service.ts` | Adds an exact owner-scoped workspace-to-pod resolver; retains the legacy newest-pod method for unrelated callers. |
| `src/modules/bussiness/pod-registration/viewer-pod.service.spec.ts` | Proves foreign, missing-instance, missing-registration and multi-workspace selection behavior. |
| `src/modules/platform/exceptions/errors/channel/{invalid-channel-credential-set.ts,channel-delivery-failed.ts,index.ts}` | Object-metadata domain exceptions with no secret value in message or metadata. |
| `src/modules/platform/exceptions/errors/index.ts` | Exports the new channel exceptions through the canonical exception barrel if required by the measured family. |

#### Existing compatibility and flow proof

| Path | Responsibility / shape evidence |
|---|---|
| `src/features/core/api/core/graphql/mutations/agent-workspace/connect-channel/connect-channel.service.ts` | Stops claiming connected without delivery; marks the credential-less legacy row disconnected/pending-safe. No public input expansion. |
| `src/features/core/api/core/graphql/mutations/agent-workspace/connect-channel/connect-channel.service.spec.ts` | Locks the non-lying legacy status. |
| `src/features/core/api/core/graphql/mutations/agent-workspace/reconnect-channel/reconnect-channel.service.ts` | Refuses to promote a channel without delivered provider credentials; delegates status truth to the shared capability. |
| `src/features/core/api/core/graphql/mutations/agent-workspace/reconnect-channel/reconnect-channel.service.spec.ts` | Locks the delivered-credential precondition. |
| `src/tests/e2e/controlplane/agentos-channel-center.e2e-spec.ts` | Real Nest/PostgreSQL/schema flow: ownership, encryption, six provider recipes, rotation, idempotency, pending/error truth, disconnect and secret-free wire response. Kubernetes calls are bounded fakes here. |
| `src/tests/live/agentos-channel-center.live-spec.ts` | Opt-in dev-cluster proof against one disposable workspace: GraphQL → PostgreSQL → live `app-secrets` → rollout → OpenClaw readiness; uses supplied test credentials only and cleans them after proof. |
| `src/tests/probe/agentos-chart.probe-spec.ts` | Extends the chart probe to assert both rollable workloads consume `app-secrets`; no chart source mutation is planned. |

### TEST MATRIX

| Case | Expected proof |
|---|---|
| Query empty workspace | Returns all six provider cards as disconnected; no secret fields exist in compiled GraphQL schema. |
| Configure each provider | Exact required recipe accepted, encrypted rows stored, one Secret sync and one rollout; response contains status/hints only. |
| Invalid recipe | Unknown key, duplicate key, missing pair, cross-provider key and oversized value fail before writes. |
| Multi-workspace owner | Input workspace A can only resolve pod A; the former newest-workspace behavior is not used. |
| Foreign workspace | Same non-oracular workspace-not-found result; no row, Secret patch, rollout or event. |
| Rotation | Complete provider set replaces prior values; retired alternative-mode keys are removed from DB and live Secret. |
| Kubernetes unavailable | Rows remain encrypted with `syncedAt = null`, aggregate status is error/pending-safe, and retry converges without duplicates. |
| Disconnect | Removes only selected provider keys from DB and Secret, rolls once and is idempotent. |
| Realtime | One workspace event follows successful configure/disconnect; no secret/key hint enters Kafka or Socket.IO. |
| Live flow | Test account opens workspace, configures one supplied provider, observes Network/Console/FE+BE terminal, waits for rollout Ready, then disconnects and verifies cleanup. |

### ASSUMPTIONS AND EXCLUSIONS

| Item | Decision |
|---|---|
| OpenClaw runtime support | This revision configures the six env-based providers already present in the bounded allowlist. A provider needing an OAuth browser dance or OpenClaw plugin installation must receive a separate measured feature. |
| Sidecar | No new sidecar. Existing `nivo-sidecar` is rolled only because it already consumes `app-secrets`; it does not own configuration. |
| Chart | No chart edit is proposed because `envFrom: app-secrets` already exists. Apply must prove this against `D:\Repositories\nivo-charts`. |
| Frontend | FE implementation is a later Design Review/Apply boundary: add `channels` tab/block and provider overlays using `StatusActionCard`; this backend Plan writes no FE source. |
| Legacy APIs | They remain registered for compatibility but may no longer claim runtime success without delivered credentials. Removal/deprecation is separate. |
| Credentials | No real token is required to implement deterministic source tests. Live test remains OWED until the user supplies test-provider credentials through the approved write-only UI/secret path. |

### OUTPUTS

| Concept | Result |
|---|---|
| Backend boundary | Frozen as one owner-scoped query plus atomic configure/disconnect mutations and a shared provider-recipe delivery seam. |
| Secret custody | Browser writes only; PostgreSQL stores ciphertext; Kubernetes receives provider keys; responses/events carry status only. |
| Runtime truth | `CONNECTED` is allowed only after Secret reconciliation and rollout; cluster failure remains visible as undelivered/error. |
| FE handoff | Add a workspace `channels` section after backend Apply, reusing existing composites rather than embedding configuration in the OpenClaw popup. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\openclaw-channel-center.md` | `added` — Backend Feature Plan r1 only. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Review the frozen backend boundary? | Run `starci-be-feature-review` for `nivo-openclaw-channel-center-r1`; no source Apply is authorized by this Plan. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend and charts worktrees contain substantial existing uncommitted work, including the Academy contracts and OpenClaw launch bridge. | Review/Apply must preserve all unrelated changes and re-measure overlaps before editing shared registration files. |
| Existing `connectChannel` and `reconnectChannel` can report connected without delivery. | The new UI must not consume those semantics; compatibility corrections are included in the proposed boundary. |
| Chart only exposes generic `app-secrets`; provider runtime behavior still depends on the installed OpenClaw build/plugins. | Live proof must verify one supplied channel end to end before claiming provider-ready production status. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| One free-form key/value form | Closed provider recipes | Arbitrary env names can overwrite platform credentials consumed by OpenClaw/sidecar. |
| Reuse `findPodIdForViewer` | Resolve pod from exact owned `agentWorkspaceId` | Newest-workspace selection misroutes credentials for multi-workspace owners. |
| Save and roll once per field | Atomic provider-set save, one sync, one rollout | Multi-key providers otherwise expose partial state and restart repeatedly. |
| Store credentials in a new sidecar | Nivo Core custody plus existing Kubernetes Secret | Avoids a second secret owner and unnecessary network/runtime component. |
| Return saved credentials so FE can refill forms | Return configured/hint/syncedAt only | Stored secrets remain write-only. |
| Mark connected after DB save | Mark connected only after runtime delivery | Prevents UI from lying while OpenClaw still runs old values. |

### OWED

| Owed | Cleared by |
|---|---|
| Backend design challenge and exact revision approval | Run `starci-be-feature-review`, revise if needed, then explicitly approve one revision. |
| Backend implementation and proof | Run `starci-be-feature-apply` only after Review approval. |
| Workspace channel UI | Run `starci-fe-design-review` against the existing control-center direction, then `starci-fe-design-apply`. |
| Credentialed provider proof | Supply test credentials after code completion; run browser, Network, Console, FE/BE terminal and live cluster rollout proof without recording secrets. |

## review — nivo-openclaw-channel-center-r2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Charts | D:\Repositories\nivo-charts |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | Backend `main` at `bbee1cec6d6466585e99dc0cc7bddb857006c93e`; frontend `main` at `7bc2ff4ca8a756d866ead66486dd2781ba3fa933`; charts `main` at `4a3aabb9d4db60f0f9e7332195b46276368b5295`; Source `mtp` at `5a5a544434171eb176af0c6d09e33c4d77731753` |
| Database | Primary PostgreSQL `POSTGRESQL_PRIMARY`; existing tables only |
| Purpose | Challenge Plan r1 against runtime truth, provider support, realtime semantics and the exact production boundary. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\openclaw-channel-center.md |
| Language | vi |
| Phase | review |
| Touching | This workflow only. No production source is changed before explicit approval. |

### REVIEW FINDINGS

| Finding | Revision |
|---|---|
| Writing a Secret and rolling a workload proves delivery, not that Telegram/Zalo/etc. authenticated successfully. | Replace aggregate `CONNECTED` with `NOT_CONFIGURED | PENDING | APPLIED | ERROR`. UI copy must say “đã áp dụng cấu hình”, never “kênh đang online”, until OpenClaw/provider health telemetry exists. |
| The allowlist proves what customers may write, not that the installed OpenClaw build has every channel adapter enabled. | Keep all six forms because the product already owns those keys, but make provider-by-provider live adapter proof an acceptance gate. An unproved provider remains `APPLIED`, not `ONLINE`. |
| `AgentOpsEventsService` persists an audit row and does not publish Socket.IO. | Mutation response updates the active card immediately. Realtime refetch is driven only by the existing K8s runtime watcher emitting `workspace.runtime` after rollout; no fake Kafka/Socket event is added. |
| r1 proposed a non-existent `src/tests/live` family. | Move the opt-in proof to the measured sibling path `src/tests/e2e/nivo/agentos-channel-center.live-spec.ts`. |
| A disconnect patch that merely omits keys leaves old values in Kubernetes. | Shared service must send explicit null removals for exactly the selected recipe's retired keys, while preserving platform and other-provider keys. |
| A generic credential list could still accept valid allowlist keys from the wrong provider. | Validate exact provider ownership, duplicates and required/alternative sets before transaction start; GraphQL decorators alone are not sufficient. |

### APPROVED CANDIDATE ARCHITECTURE

1. One owner-scoped query returns all six provider configurations and per-key write-only status for the exact `agentWorkspaceId`.
2. One configure mutation validates a closed provider recipe, transactionally replaces that provider's PostgreSQL credential set, reconciles exact additions/removals into `app-secrets`, rolls both measured consumers once, then reports `APPLIED` only after delivery timestamps persist.
3. One disconnect mutation transactionally removes the provider set, explicitly removes those keys from Kubernetes, rolls once and returns `NOT_CONFIGURED`; repeating it is a no-op success.
4. Cluster failure returns `ERROR` while preserving encrypted input with null `syncedAt`, allowing an idempotent retry. It never upgrades the semantic to provider-connected.
5. `ChannelConnectionEntity` remains safe metadata/audit compatibility. The new operations do not populate its legacy ciphertext columns; `PodCredentialEntity` is the only credential custody path used by this UI.
6. No chart mutation and no new sidecar. The chart probe must prove both current consumers still mount `app-secrets`.
7. The existing runtime watcher supplies `workspace.runtime` after rollout. Agent ops audit text may be recorded, but is not represented as Kafka/Socket delivery.

### EXACT PRODUCTION TOUCHING — R2

| Tree | Files / responsibility |
|---|---|
| New query | `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-channel-settings/**` — full module/query/handler/service/resolver/types/twin-spec family from Plan r1. |
| New mutations | `src/features/core/api/core/graphql/mutations/agent-workspace/configure-agent-workspace-channel/**`; `src/features/core/api/core/graphql/mutations/agent-workspace/disconnect-agent-workspace-channel/**` — full command verticals and twin specs from Plan r1. |
| Registration | `src/features/core/api/core/graphql/queries/index.ts`; `src/features/core/api/core/graphql/mutations/index.ts`. |
| Provider custody | `src/modules/bussiness/pod-credential/channel-provider.ts`; `channel-credential-keys.ts`; `pod-credential.service.ts`; `pod-credential.service.spec.ts`. |
| Exact workspace resolution | `src/modules/bussiness/pod-registration/viewer-pod.service.ts`; `viewer-pod.service.spec.ts`. |
| Exceptions | `src/modules/platform/exceptions/errors/channel/invalid-channel-credential-set.ts`; `channel-delivery-failed.ts`; local/canonical exception barrels only where imports require them. |
| Legacy truth correction | Existing `connect-channel.service.ts/.spec.ts` and `reconnect-channel.service.ts/.spec.ts`; they may no longer claim connected without delivered credentials. |
| Flow proof | `src/tests/e2e/controlplane/agentos-channel-center.e2e-spec.ts`; `src/tests/e2e/nivo/agentos-channel-center.live-spec.ts`; `src/tests/probe/agentos-chart.probe-spec.ts`. |
| Explicitly excluded | Frontend source, chart source, migrations, new entities, sidecar/controlplane routes, provider OAuth callbacks, credentials and unrelated dirty files. |

### ACCEPTANCE GATES

| Gate | Required verdict |
|---|---|
| Twin specs | Query/configure/disconnect decisions, provider recipes, exact workspace ownership and custody service all pass. |
| Schema | New query and two mutations appear through HTTP GraphQL envelopes; no plaintext/ciphertext field is expressible. |
| Lint/build | Backend lint zero errors; Core, controlplane, Academy and CLI frozen builds pass. |
| Flow E2E | Real PostgreSQL/Nest app proves encryption, six recipes, rotation, pending/error truth, provider isolation and idempotent disconnect. |
| Chart probe | Current chart mounts `app-secrets` into the two workloads the custody service rolls. |
| Live cluster | One disposable test workspace proves save → Secret patch → rollout Ready → status `APPLIED` → disconnect cleanup. Provider authentication/traffic is reported separately for each credential set supplied. |
| Browser proof after FE Apply | Test account configures via UI; UI, Network, Console and FE/BE terminal evidence is written to the workflow without secrets. |

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate revision | `nivo-openclaw-channel-center-r2`. |
| Capability | Workspace-scoped OpenClaw channel configuration for Telegram, Zalo, Messenger, WhatsApp, Slack and Discord. |
| Architecture | Core-owned write-only credential custody → exact pod Secret reconciliation → one rollout; no new sidecar. |
| Truth model | `APPLIED` means delivered to the running workload, not externally authenticated or online. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\openclaw-channel-center.md` | `modified` — appended Review r2 candidate; no product source changed. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve the exact r2 production boundary for Apply? | **Duyệt `nivo-openclaw-channel-center-r2`**; or provide one bounded revision request. |

### WARNINGS

| Warning | Impact |
|---|---|
| No source evidence proves all six adapters are enabled in the current OpenClaw image. | Apply can prove configuration delivery for all recipes; provider-online claims require supplied credentials and adapter-specific live traffic. |
| Existing backend/charts dirty work overlaps shared registrations and runtime launch files. | Apply must preserve and re-measure those edits; it cannot create a clean baseline commit by sweeping unrelated work. |
| Kubernetes and PostgreSQL cannot share one transaction. | The explicit `PENDING/ERROR` state and idempotent reconciliation are mandatory; rollback must not pretend external deletion succeeded. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `CONNECTED` after rollout | `APPLIED` after rollout | Delivery is not provider authentication. |
| Synthetic Socket.IO event from an audit write | Existing runtime watcher event | `AgentOpsEventsService` is not a realtime publisher. |
| New sidecar or chart route | Existing Core custody and `app-secrets` | Configuration does not need another network component. |
| Provider-generic key acceptance | Exact closed recipe per provider | Prevents cross-provider and platform-key injection. |
| Live proof in a new test folder | Existing `src/tests/e2e/nivo` family | Keeps test entry consistent with repository evidence. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit r2 approval | User states `Duyệt nivo-openclaw-channel-center-r2`. |
| Backend implementation | Run `starci-be-feature-apply` after approval. |
| FE channel tab/forms | Separate FE Design Review/Apply after backend contracts compile. |
| Per-provider online proof | Supply test credentials after source completion; exercise only providers with enabled runtime adapters. |

## review approval — nivo-openclaw-channel-center-r2

Approved revision: `nivo-openclaw-channel-center-r2`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Charts | D:\Repositories\nivo-charts |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | Backend `main`; frontend `main`; charts `main`; Source `mtp` |
| Database | Primary PostgreSQL `POSTGRESQL_PRIMARY`; existing tables only |
| Purpose | Record owner approval of the exact r2 production boundary. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\openclaw-channel-center.md |
| Language | vi |
| Phase | review |
| Touching | Exact production boundary in `### EXACT PRODUCTION TOUCHING — R2`; preserve unrelated dirty work. |

### APPROVAL EVIDENCE

| Evidence | Consequence |
|---|---|
| User stated `Duyệt nivo-openclaw-channel-center-r2.` | Repo/branch and exact Touching are confirmed for `starci-be-feature-apply`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `nivo-openclaw-channel-center-r2`. |
| Next phase | Backend Apply may begin on the frozen boundary. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\openclaw-channel-center.md` | `modified` — recorded explicit r2 approval. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Exact Apply boundary is approved. |

### WARNINGS

| Warning | Impact |
|---|---|
| Apply remains incomplete until all frozen gates pass. | No partial completion claim. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | Approved r2 | User confirmed the reviewed boundary. |

### OWED

| Owed | Cleared by |
|---|---|
| Backend source and proof | Continue `starci-be-feature-apply`. |

## apply — nivo-openclaw-channel-center-r2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Charts | D:\Repositories\nivo-charts |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | Backend `main` from baseline `bbee1cec6d6466585e99dc0cc7bddb857006c93e`; Source `mtp` |
| Database | Primary PostgreSQL `POSTGRESQL_PRIMARY`; existing entities only |
| Purpose | Apply the approved AgentOS/OpenClaw channel-center backend contracts. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\openclaw-channel-center.md |
| Language | vi |
| Phase | apply |
| Touching | Exact r2 query, mutations, custody, ownership resolution, legacy truth correction and proof files; unrelated dirty work preserved. |

Applied revision: `nivo-openclaw-channel-center-r2`

### OUTPUTS

| Concept | Result |
|---|---|
| Product boundary | AgentOS/OpenClaw, not Academy. |
| GraphQL | Added `myAgentWorkspaceChannelSettings`, `configureAgentWorkspaceChannel` and `disconnectAgentWorkspaceChannel`. |
| Providers | Closed recipes for Telegram, Zalo, Messenger, WhatsApp, Slack and Discord. |
| Secret safety | Plaintext is accepted write-only, encrypted in PostgreSQL, omitted from GraphQL output and reconciled to the workspace `app-secrets`. |
| Truth model | `NOT_CONFIGURED | PENDING | APPLIED | ERROR`; `APPLIED` means delivered, not provider-online. |
| Runtime rollout | Reconciles one provider set and rolls the measured single AgentOS Deployment once; disconnect explicitly removes retired keys. |

### CHANGES

| Tree | Details |
|---|---|
| Query vertical | Added the complete owner-scoped workspace channel-settings query family and registration. |
| Mutation verticals | Added configure/disconnect command, handler, service, resolver, GraphQL types, module and twin specs. |
| Credential custody | Added closed provider recipes, transactional provider replace/remove, safe status reads, Secret merge-patch removal and one AgentOS rollout. |
| Ownership and compatibility | Added exact workspace lookup; corrected legacy connect/reconnect so they cannot claim connected before delivered credentials. |
| Proof | Added custody/ownership specs, real-app PostgreSQL E2E, opt-in live-cluster spec and AgentOS chart probe. |

### PROOF

| Gate | Evidence | Verdict |
|---|---|---|
| Target lint | ESLint over all r2 production and proof paths after `--fix` | PASS — 0 errors, 0 warnings |
| Twin/unit specs | 7 suites, 30 tests | PASS |
| Flow E2E | Real Nest app + PostgreSQL; schema safety, encryption, ownership, all six recipes and repeated disconnect | PASS — 8 tests |
| Chart probe | Helm render proves quota/limits/legacy stores and one AgentOS Deployment whose OpenClaw/controlplane containers consume `app-secrets` | PASS — 2 tests |
| Builds | `build`, `build:controlplane`, `build:academy`, `build:cli` | PASS |
| Diff hygiene | `git diff --check` | PASS; only Git line-ending notices from the pre-existing dirty worktree |
| Live schema | HTTP POST to `http://localhost:3067/graphql` introspection | PASS — query and both mutations registered; HTTP 200 |
| Live provider rollout | Opt-in live spec without credential environment | OWED — suite correctly skips instead of parsing missing input |

### LIVE FLOW PROOF

| Surface | Evidence | Verdict |
|---|---|---|
| Backend runtime | Core booted on port 3067 and registered all three channel-center fields. | PASS |
| Database flow | E2E writes encrypted rows, observes safe status and removes provider rows against real PostgreSQL. | PASS |
| Kubernetes/provider | No test provider credential was supplied for this Apply pass. No secret value was written to the workflow. | OWED |
| Browser/FE | FE source is explicitly excluded from backend r2. | OWED — run FE Review/Apply after live backend credential proof or in the next approved phase. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Credentialed dev-cluster proof | Supply one disposable provider credential out of band plus the target AgentOS workspace ID; Telegram is the smallest proof. Do not paste production credentials into the workflow. |

### WARNINGS

| Warning | Impact |
|---|---|
| Provider adapters are not proven online by Secret delivery alone. | The UI must say `APPLIED`, not online/connected, until adapter-specific health exists. |
| Boot logs still contain pre-existing Qdrant version and knowledge-mount warnings. | They did not fail this feature's build/E2E; they are outside the approved r2 source boundary and remain visible rather than suppressed. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Payment/fulfillment in E2E arrangement | Direct owned `InstanceEntity` + `AgentWorkspaceEntity` fixture | Channel E2E must not depend on an external catalog fulfillment gateway. |
| New sidecar or chart mutation | Existing Core custody and `app-secrets` | Approved architecture needs no additional runtime service. |
| Claim Apply fully complete without credentials | Record live cluster as OWED | Deterministic proof cannot substitute for a real K8s Secret rollout. |

### OWED

| Owed | Cleared by |
|---|---|
| Save → Secret patch → rollout Ready → `APPLIED` → disconnect cleanup on one dev workspace | Run `agentos-channel-center.live-spec.ts` with the four required `NIVO_CHANNEL_LIVE_*` values supplied out of band. |
| Provider authentication/traffic | Exercise only the supplied provider adapter and record its external result separately from delivery state. |
| AgentOS channel-center UI | Run the approved FE lifecycle after backend live proof; Academy Integration Center remains a separate feature. |
