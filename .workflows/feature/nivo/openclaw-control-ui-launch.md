<!-- starci-workflow: v2 -->

## plan — nivo-openclaw-control-ui-launch-r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Charts | D:\Repositories\nivo-charts |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo — `apps/core` owns viewer authorization and launch leases; `apps/agentos-controlplane` owns the public popup callback and authenticated HTTP/WebSocket proxy; `apps/agentos-cli` writes OpenClaw runtime config |
| Repo / branch | Backend `main` at `a367f25849125cf46f4b44b4cf9cd613620810c1`; frontend `session/surface-branch-and-dead-vocabulary` at `51dead3cd84b21c3fca0b6325274c4e205da4b39`; charts `main` at `598d4b44aea19c4213c4682f876393398acf4ab0` |
| Database | No new SQL entity. One-time grants and renewable launch leases use shared Redis through `CacheService`; workspace ownership remains PostgreSQL primary `POSTGRESQL_PRIMARY` |
| Purpose | Open the real OpenClaw Control UI from Nivo in an auxiliary window without sending the reusable gateway credential to the browser, and disconnect it when the Nivo launch lease ends. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\openclaw-control-ui-launch.md |
| Language | vi |
| Phase | plan |
| Touching | This phase writes only this workflow. No backend, frontend or chart source is changed. |

### OBJECTIVE

Từ workspace đang active, customer bấm OpenClaw và nhận một popup mở đúng **OpenClaw Control UI thật** được container OpenClaw phục vụ tại port `18789`. Nivo cấp một code dùng một lần, controlplane đổi code thành launch lease, proxy HTTP + raw WebSocket vào loopback OpenClaw và xác thực bằng trusted-proxy identity. Browser không nhận, lưu hoặc gửi `OPENCLAW_GATEWAY_TOKEN`/`OPENCLAW_GATEWAY_PASSWORD`. Khi cửa sổ Nivo dừng renew hoặc user revoke/logout, proxy đóng WebSocket trong deadline hữu hạn và UI OpenClaw chuyển sang disconnected.

### LIVE EVIDENCE

| Evidence | Finding |
|---|---|
| Unfiltered live schema at `http://localhost:3067/graphql` | Schema already has `myAgentWorkspaceControlCenter` but no issue/renew/revoke app-launch mutations. All existing query and mutation names were read before naming new operations. |
| `my-agent-workspace-control-center/` | Existing owner-scoped query already returns app capability but incorrectly labels active OpenClaw `NIVO_CONSOLE`; this capability changes it to `EXTERNAL_LAUNCH`. |
| `issue-pod-access-tokens/` and agent-workspace mutation siblings | A new GraphQL operation must carry its full CQRS folder and be explicitly added to `MUTATION_MODULES`; importing a provider without registration is not enough. |
| Live pod `nivo-084b824e-f1f0-49f7-87c2-655af8fa847e-agentos` | OpenClaw listens at `18789` in the same pod as controlplane; controlplane already reaches it at `ws://127.0.0.1:18789`. |
| `GET http://127.0.0.1:18790/` through live port-forward | HTTP 200, title `OpenClaw Control`, Vite/Lit Control UI assets and raw WebSocket client are present. This disproves the earlier workflow claim that OpenClaw is not a browser application. |
| Live OpenClaw response headers | `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`; iframe embedding is invalid. An auxiliary top-level window is the supported shape. |
| Live Control UI bundle | Token mode persists a gateway token per gateway in browser storage and accepts token URL input. Supplying the reusable token through query/fragment would leak the credential into the browser and is rejected. |
| `docs/OPENCLAW-GATEWAY-PROTOCOL.md` | Gateway is raw WebSocket protocol v4, not Socket.IO. Shared-secret auth belongs in the first `connect` frame; locality determines unpaired scope behavior. |
| Official OpenClaw Control UI / trusted-proxy docs, checked 2026-08-15 | Control UI supports `gateway.controlUi.basePath`; trusted-proxy is intended for Kubernetes/reverse-proxy deployments and authenticates HTTP/WS with proxy identity headers. Token and trusted-proxy modes are mutually exclusive; a loopback password remains supported for internal callers. |
| AgentOS chart `service.yaml` / `ingress.yaml` | The existing public Service and Ingress already terminate at controlplane. OpenClaw intentionally has no Service because direct ClusterIP access loses locality-derived operator scopes. |
| Worktrees | Backend has unrelated untracked `apps/agentos-mcp/`; charts have existing modified `deployment.yaml`, `values.yaml` and untracked quota templates; frontend contains the rejected fake Nivo console implementation. Apply must preserve unrelated work and classify overlapping edits before baseline. |

### ARCHITECTURE

1. FE calls `issueAgentWorkspaceAppLaunch(workspaceId, OPENCLAW)`. Core verifies exact viewer ownership, AgentOS product, active workspace/instance and capability, then stores a 256-bit opaque grant in shared Redis for 60 seconds. GraphQL returns `launchId`, clean workspace-host callback URL and expiry; no OpenClaw credential is returned.
2. FE synchronously creates a named popup to avoid popup blocking, then navigates it to `https://<workspace-host>/access/openclaw/callback?code=<opaque>`. Failure closes the blank popup and renders the bounded Nivo error.
3. Controlplane callback signs its existing pod assertion and calls core `POST /pods/self/workspace-app-launches/redeem`. Core atomically `GETDEL`s the grant, binds it to the calling pod/workspace and creates a renewable Redis launch lease. Replay, wrong pod, wrong app, expired and foreign codes share one non-oracular refusal.
4. Controlplane sets a host-only `Secure; HttpOnly; SameSite=Lax` signed session cookie containing only launch/session identifiers and expiry, then `303` redirects to `/openclaw/`; the code disappears from URL/history immediately.
5. Controlplane owns `/openclaw/*`, validates the lease through its signed backend channel, strips every client-supplied identity/forwarding header, writes fixed trusted-proxy identity headers, and reverse-proxies HTTP plus WebSocket to `127.0.0.1:18789`.
6. OpenClaw runs with `gateway.controlUi.basePath=/openclaw`, explicit public `allowedOrigins`, `gateway.auth.mode=trusted-proxy`, loopback proxy allowlist, exact fixed `allowUsers`, session-only `identityScopes`, and no gateway token. The existing internal relay and health probe migrate to loopback `OPENCLAW_GATEWAY_PASSWORD` fallback; that password remains in the Kubernetes Secret and never crosses controlplane's public response.
7. The Nivo main window renews the launch lease every 20 seconds while authenticated and mounted. Lease TTL is 45 seconds. Controlplane revalidates at most every 10 seconds and closes active proxied WebSockets when invalid, so logout/tab loss disconnects OpenClaw within 55 seconds without retaining an unsafe cross-origin `window.opener` channel.
8. Explicit close/logout calls `revokeAgentWorkspaceAppLaunch`. TTL is the reliability fallback when unload delivery is lost. n8n remains `SECURITY_UPGRADE_REQUIRED` and is not exposed by this capability.

### PUBLIC CONTRACT

| Surface | Contract |
|---|---|
| `issueAgentWorkspaceAppLaunch(input)` | Authenticated GraphQL mutation. Input: UUID `workspaceId`, enum `app`; output: opaque `launchId`, callback `redirectUrl`, `expiresAt`. No gateway secret or local session cookie. |
| `renewAgentWorkspaceAppLaunch(input)` | Authenticated owner-only GraphQL mutation. Extends only a redeemed, non-revoked lease bound to the same owner/workspace; returns `expiresAt`. |
| `revokeAgentWorkspaceAppLaunch(input)` | Authenticated owner-only GraphQL mutation. Idempotently revokes launch id and returns revoked state. |
| `POST /pods/self/workspace-app-launches/redeem` | Machine-registration door guarded by `PodClientAssertionGuard`; atomically consumes code and returns bounded session claims only to the exact pod. |
| `POST /pods/self/workspace-app-launches/validate` | Signed pod door used by controlplane for bounded cached lease validation; no browser credential accepted. |
| `GET /access/openclaw/callback` | Browser callback on workspace host; redeem → HttpOnly cookie → clean `303 /openclaw/`. |
| `/openclaw/*` HTTP + WebSocket | Real OpenClaw Control UI through an authenticated controlplane reverse proxy. Browser identity headers are always discarded and replaced. |

### PROPOSED FILE TREE

#### Core GraphQL operations

| Path | Responsibility / shape evidence |
|---|---|
| `src/features/core/api/core/graphql/mutations/agent-workspace/issue-agent-workspace-app-launch/{index.ts,issue-agent-workspace-app-launch.module-definition.ts,issue-agent-workspace-app-launch.module.ts,issue-agent-workspace-app-launch.command.ts,issue-agent-workspace-app-launch.handler.ts,issue-agent-workspace-app-launch.service.ts,issue-agent-workspace-app-launch.resolver.ts,issue-agent-workspace-app-launch.handler.spec.ts}` | Complete CQRS mutation vertical mirroring agent-workspace siblings; handler owns ownership/lifecycle decisions and has its twin spec. |
| `src/features/core/api/core/graphql/mutations/agent-workspace/issue-agent-workspace-app-launch/graphql-types/{index.ts,input.ts,response.ts}` | Validated UUID/app input and credential-free launch response. |
| `src/features/core/api/core/graphql/mutations/agent-workspace/renew-agent-workspace-app-launch/{index.ts,renew-agent-workspace-app-launch.module-definition.ts,renew-agent-workspace-app-launch.module.ts,renew-agent-workspace-app-launch.command.ts,renew-agent-workspace-app-launch.handler.ts,renew-agent-workspace-app-launch.service.ts,renew-agent-workspace-app-launch.resolver.ts,renew-agent-workspace-app-launch.handler.spec.ts}` | Complete owner-authenticated lease renewal operation. |
| `src/features/core/api/core/graphql/mutations/agent-workspace/renew-agent-workspace-app-launch/graphql-types/{index.ts,input.ts,response.ts}` | Validated launch UUID and new expiry. |
| `src/features/core/api/core/graphql/mutations/agent-workspace/revoke-agent-workspace-app-launch/{index.ts,revoke-agent-workspace-app-launch.module-definition.ts,revoke-agent-workspace-app-launch.module.ts,revoke-agent-workspace-app-launch.command.ts,revoke-agent-workspace-app-launch.handler.ts,revoke-agent-workspace-app-launch.service.ts,revoke-agent-workspace-app-launch.resolver.ts,revoke-agent-workspace-app-launch.handler.spec.ts}` | Complete idempotent owner-authenticated revoke operation. |
| `src/features/core/api/core/graphql/mutations/agent-workspace/revoke-agent-workspace-app-launch/graphql-types/{index.ts,input.ts,response.ts}` | Validated launch UUID and revoked result. |
| `src/features/core/api/core/graphql/mutations/index.ts` | Registers all three modules in `MUTATION_MODULES`; schema presence is tested, not inferred. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/{graphql-types/response.ts,my-agent-workspace-control-center.handler.ts,my-agent-workspace-control-center.handler.spec.ts}` | Changes OpenClaw capability from rejected `NIVO_CONSOLE` to measured `EXTERNAL_LAUNCH`; preserves n8n fail-closed state. |

#### Shared launch capability, atomic Redis and pod doors

| Path | Responsibility / shape evidence |
|---|---|
| `src/modules/bussiness/workspace-app-launch/{workspace-app-launch.module-definition.ts,workspace-app-launch.module.ts,workspace-app-launch.service.ts,workspace-app-launch.types.ts,workspace-app-launch.service.spec.ts}` | Shared issue/redeem/renew/revoke/validate capability; Redis keys hold no reusable OpenClaw credential. |
| `src/modules/integrations/cache/cache.service.ts` | Adds canonical atomic `take` seam so feature code does not reach raw Redis. |
| `src/modules/integrations/cache/stores.ts` | Implements delete-on-read atomically for Redis and synchronously equivalent Map behavior. |
| `src/modules/integrations/cache/stores.spec.ts` | Proves one winner under concurrent take, expiry and absence. |
| `src/modules/bussiness/pod-registration/dto/{redeem-workspace-app-launch.dto.ts,validate-workspace-app-launch.dto.ts}` | Decorated bounded machine request bodies. |
| `src/modules/bussiness/pod-registration/pod-registration.types.ts` | Adds public-safe redeem/validate transport shapes. |
| `src/modules/bussiness/pod-registration/pod-registration.module.ts` | Imports the launch capability explicitly; prevents unresolved/unregistered providers. |
| `src/features/core/api/core/http/pod-registration/pod-registration.controller.ts` | Adds the two signed machine routes; pod identity comes only from the assertion. |
| `apps/core/src/app.module.ts` | Registers `WorkspaceAppLaunchModule` exactly once at composition root. |
| `src/modules/platform/exceptions/errors/agent-workspace/{app-launch-unavailable.ts,app-launch-invalid.ts,app-launch-session-ended.ts,index.ts}` | Object-argument domain exceptions with one non-oracular invalid-code identity. |

#### AgentOS controlplane real UI proxy

| Path | Responsibility / shape evidence |
|---|---|
| `apps/agentos-controlplane/src/openclaw-access/{openclaw-access.module.ts,openclaw-access.controller.ts,openclaw-access-session.service.ts,openclaw-access-proxy.service.ts,openclaw-access.types.ts}` | Callback, signed cookie, HTTP proxy, raw WS upgrade and trusted identity-header boundary. |
| `apps/agentos-controlplane/src/openclaw-access/{openclaw-access.controller.spec.ts,openclaw-access-session.service.spec.ts,openclaw-access-proxy.service.spec.ts}` | Cookie/redirect/replay/header stripping/path/WS close/lease expiry decisions. |
| `apps/agentos-controlplane/src/backend/backend-client.service.ts` | Adds signed redeem and validate calls with terminal errors propagated to callback/proxy. |
| `apps/agentos-controlplane/src/backend/types/backend-client.ts` | Exact request/answer transport types. |
| `apps/agentos-controlplane/src/config.ts` | Parses launch cookie/validation and loopback gateway password settings; no permissive defaults. |
| `apps/agentos-controlplane/src/app.module.ts` | Registers `OpenclawAccessModule` once beside the existing relay. |
| `apps/agentos-controlplane/src/main.ts` | Attaches the one raw HTTP upgrade listener required by `ws`; delegates only `/openclaw` and leaves Socket.IO/GraphQL routes untouched. |
| `apps/agentos-controlplane/src/openclaw-relay/{openclaw-relay.connection.ts,openclaw-relay.types.ts,openclaw-relay.service.ts}` | Migrates internal loopback relay auth from token to password fallback while retaining measured protocol/scopes. |

#### CLI configuration, credential chain and Helm

| Path | Responsibility / shape evidence |
|---|---|
| `apps/agentos-cli/src/soul/openclaw-config.service.ts` | Reconciles trusted-proxy mode, `/openclaw` base path, exact origin, fixed proxy identity grants and local password fallback; removes token config because OpenClaw rejects mixed mode. |
| `apps/agentos-cli/src/config.ts` | Reads `OPENCLAW_GATEWAY_PASSWORD` and public workspace origin. |
| `src/modules/bussiness/pod-registration/pod-access-token.service.ts` | Issues/rotates the existing pod-owned OpenClaw secret under password semantics. |
| `src/modules/bussiness/pod-credential/channel-credential-keys.ts` | Replaces the token key vocabulary with the password key in the bounded credential set. |
| `src/modules/bussiness/pod-openclaw/pod-openclaw.client.ts` | Uses password bearer fallback for loopback/direct health proof under trusted-proxy mode. |
| `src/tests/e2e/controlplane/pod-gateway-token-chain.e2e-spec.ts` | Renamed to `pod-gateway-password-chain.e2e-spec.ts` in Apply and rewritten to prove the new chain end-to-end; the old token file is deleted in the same boundary. |
| `src/tests/e2e/controlplane/pod-access-credentials.e2e-spec.ts` | Updates exact credential key-set assertions and proves token absence. |
| `charts/agentos/Chart.yaml` | Bumps chart patch version for the auth/route contract. |
| `charts/agentos/values.yaml` | Adds explicit OpenClaw Control UI base path/origin/trusted-proxy settings; no secret value. |
| `charts/agentos/templates/secret.yaml` | Stores `OPENCLAW_GATEWAY_PASSWORD`, never a browser launch code. |
| `charts/agentos/templates/deployment.yaml` | Passes password and public origin to controlplane/CLI/OpenClaw; keeps gateway port non-public. |
| `charts/agentos/templates/ingress.yaml` | Documents and proves `/openclaw` HTTP/WS remains behind the existing controlplane service and long-lived timeout policy. |
| `charts/agentos/templates/service.yaml` | Comment/contract update only: existing Service remains the sole public backend; no direct OpenClaw Service is introduced. |

#### Frontend consumer and removal of rejected console

| Path | Responsibility / shape evidence |
|---|---|
| `apps/app/src/modules/api/console.ts` | Adds typed issue/renew/revoke mutations; removes fake-console-only thread API additions if no other caller owns them. |
| `apps/app/src/modules/window/workspace-app-launch.ts` | Synchronously opens named popup, navigates after mutation, renews bounded lease and revokes on explicit close/logout; contains no token/key handling. |
| `apps/app/src/components/blocks/agentos/AgentOSWorkspaceApplications/index.tsx` | OpenClaw CTA launches the real external Control UI and renders opening/blocked/expired states. |
| `apps/app/src/components/pages/AgentOSWorkspacePage/{index.tsx,component.tsx}` | Owns launch lifecycle and tears lease down without inventing OpenClaw UI. |
| `apps/app/src/messages/{en.json,vi.json}` | Replaces “Manage in Nivo”/fake-console copy with real OpenClaw launch/disconnect copy. |
| `apps/app/src/app/[locale]/agentos/workspaces/[workspaceId]/console/page.tsx`; `apps/app/src/components/pages/AgentOSConsolePage/**`; `apps/app/src/components/blocks/agentos/AgentOSConsoleConnection/**`; `apps/app/src/components/blocks/agentos/AgentOSConsoleThreads/**`; `apps/app/src/modules/realtime/agent-tasks.ts`; `apps/app/src/modules/window/agent-console.ts` | Delete the rejected Nivo-made console implementation after preserving any independently reusable code; it is not the product requested. |

#### Flow proof

| Path | Responsibility / shape evidence |
|---|---|
| `src/tests/e2e/nivo/agentos-openclaw-control-ui-launch.e2e-spec.ts` | Real GraphQL issue/renew/revoke + signed pod redeem/validate + Redis one-winner flow through production doors. |
| `src/tests/e2e/controlplane/openclaw-control-ui-launch.e2e-spec.ts` | Real callback cookie/303 and HTTP/raw-WS proxy against a protocol-faithful local gateway fixture. |
| `D:\Repositories\starci-academy-backend\.workflows\fidel\nivo\agentos-application-launch-20260815.md` | Append correction evidence during FE Apply; never rewrite the earlier rejected direction. |

### TEST MATRIX

| Area | Cases fixed before implementation |
|---|---|
| Issue | Own active AgentOS; provisioning/suspended/failed; instance inactive; non-AgentOS; absent and foreign indistinguishable; OPENCLAW accepted; N8N refused; Redis unavailable fails closed. |
| One-time code | 59/60/61-second boundary; random 256-bit shape; two concurrent redeemers yield exactly one winner; replay/wrong pod/wrong app/malformed/expired share one public refusal; code never logged. |
| Lease | Redeemed before renew; owner mismatch; 44/45/46-second expiry; renew extends from now; revoke twice is idempotent; validate after revoke/expiry fails; stale issue id cannot create a replacement implicitly. |
| Cookie/callback | Secure/HttpOnly/SameSite=Lax/host-only/path; clean 303; no code in redirect; no cookie on refusal; tamper/expiry/wrong workspace rejected. |
| Proxy security | Strip incoming `x-forwarded-*`, `x-real-ip`, trusted user, required assertion and scope headers; inject exact fixed values; reject without live lease before dialing; path traversal refused; hop-by-hop headers removed; response CSP/frame policy preserved. |
| Raw WebSocket | `/openclaw` only; real Upgrade forwarded; identity headers on upgrade; text/binary/close propagation; max payload; gateway unavailable; lease revoke closes active pair within 10 seconds; no Socket.IO assumption. |
| OpenClaw config | `basePath=/openclaw`; exact origin; trusted proxy loopback only; exact allowUser; session-only identity scopes; password fallback exists; token key/env absent; config reconcile is idempotent. |
| Existing relay | Password handshake reaches measured protocol v4, subscribes and receives event; no regression in reconnect/sequence-gap behavior. |
| Helm | `helm lint`; rendered Service exposes only controlplane; no OpenClaw Service/Ingress backend; Secret contains password key, not token; deployment env complete; upgrade preserves PVC and reaches Ready. |
| FE popup | Popup blocker; mutation failure; one named popup reused; redirect only after issue success; renewal cadence; explicit revoke; expiry/disconnected UX; no key/token in URL, storage, GraphQL payload, console or Network response. |
| Full live flow | Logged-in Nivo test owner → workspace → Open OpenClaw → popup title/content is actual `OpenClaw Control` → no key prompt → chat/control request over proxied raw WS → stop renew/logout → popup reports disconnected within 55 seconds. Check UI, Network, Console and FE/BE/controlplane/K8s terminal. |

### ASSUMPTIONS AND EXCLUSIONS

| Item | Decision |
|---|---|
| Public route | Reuse the workspace hostname and `/openclaw/`; OpenClaw officially supports `gateway.controlUi.basePath`. No second DNS name or certificate is required. |
| Public Service | Reuse existing controlplane Service. A direct OpenClaw Service is excluded because it bypasses Nivo authorization and loses the proven loopback trust boundary. |
| Browser credential | Neither reusable password/token nor one derived from it may reach browser JS, URL, storage, GraphQL, Socket.IO or logs. |
| Popup coupling | No cross-origin `window.opener` heartbeat because OpenClaw serves arbitrary canvas/UI content on the same origin; renewable server lease provides bounded disconnect without reverse-tabnabbing authority. |
| Scope | Fixed proxy identity receives `operator.read`, `operator.write`, `operator.approvals`, `operator.admin` as session-only identity scopes so the full owner Control UI works. It receives no persistent device grant and no device auto-approval. |
| n8n | Not part of this revision; remains unavailable until its separately reviewed security upgrade. |
| Provisioning/Saga | Unchanged. This capability starts only after an AgentOS workspace is active and does not add Kafka events. |

### OUTPUTS

| Concept | Result |
|---|---|
| Capability brief | `nivo-openclaw-control-ui-launch-r1` |
| Architecture concept | One-time Nivo launch grant → renewable server lease → existing controlplane Service → trusted-proxy HTTP/raw-WS → real OpenClaw Control UI at `/openclaw/`. |
| Security result | Reusable gateway credential remains inside the pod; browser receives only a host-only HttpOnly launch session. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\openclaw-control-ui-launch.md` | `created` — plan evidence, exact proposed boundary and test matrix only. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve r1 architecture and boundary | Recommended: approve `nivo-openclaw-control-ui-launch-r1` for `$starci-be-feature-review`; alternative: revise route/lease/scope decisions before any source write. |
| Full OpenClaw authority | Recommended: session-only read/write/approvals/admin for the exact workspace owner so the real Control UI is complete; alternative: omit admin, accepting that configuration/admin screens will fail scope checks. |

### WARNINGS

| Warning | Impact |
|---|---|
| Trusted-proxy makes controlplane the authentication boundary; OpenClaw itself flags this mode security-sensitive. | Apply must prove header overwrite, exact loopback allowlist, exact allowed origin, TLS/secure cookie and no bypass path before live approval. |
| Migrating token to password touches the existing pod credential chain and OpenClaw health/relay consumers. | Partial migration makes OpenClaw fail startup or leaves probes falsely red; twin and full chain E2E are mandatory. |
| Chart and frontend worktrees already contain overlapping uncommitted changes. | Review/Apply must classify and preserve them; no blind baseline commit or overwrite is allowed. |
| Disconnect is bounded, not instantaneous, when the browser vanishes without sending revoke. | Frozen bound is 55 seconds from 45-second lease plus 10-second controlplane validation; explicit logout/revoke is immediate. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Nivo-made “OpenClaw console” page | Actual OpenClaw Control UI served by the OpenClaw container | User explicitly corrected the product, and live port-forward proves the UI exists. |
| Token/key in query, fragment, localStorage or FE config | Trusted-proxy identity after one-time Nivo launch | The UI bundle persists token credentials and the reusable key would enter the browser. |
| iframe | Top-level auxiliary popup | OpenClaw sends `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`. |
| Direct public Service/Ingress to OpenClaw | Existing public controlplane Service proxies loopback | Direct exposure bypasses Nivo lease authorization and contradicts measured locality behavior. |
| Cross-origin opener heartbeat | Server-side renewable lease | Keeping `window.opener` gives the OpenClaw origin authority to navigate the Nivo window and is not needed for bounded disconnect. |
| Device auto-approval | Session-only `identityScopes` | Avoids persistent browser device grants and manual pairing while keeping authority tied to a live Nivo lease. |

### OWED

| Owed | Cleared by |
|---|---|
| Review of exact operation names, file boundary, trusted-proxy scopes and existing dirty overlaps | Run `$starci-be-feature-review` after explicit r1 approval. |
| Backend/controlplane/CLI implementation | Run `$starci-be-feature-apply` only after Review approves one exact revision. |
| Helm and FE implementation | Route through the matching reviewed chart/FE Apply boundaries after backend contract is frozen; append live UI proof to the open fidelity workflow. |
| Live Tino Helm upgrade and browser proof | Apply against the single approved dev workspace, verify rollback safety, then run the full Nivo → popup → OpenClaw → disconnect flow. |

## review — nivo-openclaw-control-ui-launch-r2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Charts | D:\Repositories\nivo-charts |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo — core, AgentOS controlplane and AgentOS CLI |
| Repo / branch | Backend `main` at `a367f25849125cf46f4b44b4cf9cd613620810c1`; FE `session/surface-branch-and-dead-vocabulary` at `51dead3cd84b21c3fca0b6325274c4e205da4b39`; charts `main` at `598d4b44aea19c4213c4682f876393398acf4ab0` |
| Purpose | Launch the real OpenClaw Control UI in a separate window through a short-lived Nivo session without exposing a reusable gateway credential. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\openclaw-control-ui-launch.md |
| Language | vi |
| Review input | `nivo-openclaw-control-ui-launch-r1` |
| Reviewed source | Backend `a367f25849125cf46f4b44b4cf9cd613620810c1`; FE `51dead3cd84b21c3fca0b6325274c4e205da4b39`; charts `598d4b44aea19c4213c4682f876393398acf4ab0`, with the dirty overlaps recorded in Plan preserved |
| Phase | review |
| Touching | This phase appends this workflow only. No backend, frontend or chart source is changed. |

### REVIEW FINDINGS

| Check | Verdict | Evidence / correction |
|---|---|---|
| Product surface | Pass | Live port-forward proves OpenClaw serves its own Control UI and raw WebSocket gateway. The fake Nivo console remains rejected. |
| Browser security | Pass with frozen proxy boundary | OpenClaw's token UI persists a reusable token in browser storage. r2 keeps the one-time Nivo grant, HttpOnly launch cookie and trusted-proxy identity; no gateway password/token reaches browser JS, URL, GraphQL, Socket.IO or logs. |
| Schema/operation family | Pass | Three owner-authenticated mutations mirror the complete existing agent-workspace CQRS family and must be registered in `MUTATION_MODULES`; redeem/validate stay signed pod HTTP doors. |
| Redis concurrency | Pass with mandatory primitive | Redeem must use an atomic cache `take`/Redis `GETDEL`; a read followed by delete is rejected because two callbacks can win. |
| r1 OpenClaw migration order | **Fail; revised in r2** | `ProvisionCommand` does not inject/call `OpenclawConfigService`, and `job-provision.yaml` mounts no state PVC. A post-install/post-upgrade hook therefore cannot prepare `openclaw.json` before the new trusted-proxy gateway starts. |
| Canon: no initContainer | Pass after revision | `biz.md` explicitly locks three containers and no initContainer. r2 does not add one. A bounded configuration gate is owned by the existing controlplane, which already owns driving OpenClaw and continuous chores. |
| New install and upgrade ordering | Pass after revision | Controlplane mounts only OpenClaw's PVC subpath, reconciles the Nivo-owned fields atomically, then writes a gate containing the current Kubernetes Pod UID. OpenClaw's existing container waits for that exact UID before `exec`ing the gateway. A stale marker from another pod cannot release a rollout. |
| Same-pod container restart | Pass with watcher | Controlplane watches/debounces `openclaw.json` and restores only Nivo-owned access fields if the UI changes them. Therefore an OpenClaw-only restart in the same pod cannot come back in token/untrusted mode while retaining the old Pod UID gate. Customer-owned channels, MCP entries and other settings remain untouched. |
| Public network | Pass | Existing Service/Ingress continue to target controlplane only. No OpenClaw Service, NodePort or direct Ingress backend is added. |
| n8n | Excluded | n8n remains `SECURITY_UPGRADE_REQUIRED`; this revision exposes no n8n route or credential. |

### APPROVED ARCHITECTURE CANDIDATE

1. Nivo FE synchronously opens a named auxiliary window and issues an owner-scoped `OPENCLAW` launch grant.
2. The workspace controlplane redeems the one-use code over its existing signed pod channel, sets a host-only HttpOnly launch cookie, then redirects to clean `/openclaw/`.
3. Core stores only short-lived grant/lease state in Redis. Grant TTL is 60 seconds; lease TTL is 45 seconds; FE renews every 20 seconds; controlplane validation cache is at most 10 seconds.
4. Controlplane reverse-proxies `/openclaw/*` HTTP and raw WebSocket to `127.0.0.1:18789`, strips all client identity/forwarding headers and injects the one frozen trusted identity and session-only OpenClaw scopes.
5. Before the gateway starts, the same controlplane reconciles only Nivo-owned fields in the persistent OpenClaw config: trusted-proxy auth, `/openclaw` base path, exact public origin, loopback proxy allowlist, fixed allowed user, session-only scopes and loopback password fallback. It removes the incompatible token field.
6. Both containers receive `metadata.uid` through the Downward API. Controlplane atomically writes that UID to `.nivo-openclaw-access-ready`; OpenClaw waits boundedly for the exact current UID and then starts. No initContainer or extra long-running container is created.
7. Controlplane watches the config file and idempotently repairs only those managed access fields. Failure removes/refuses the gate and fails readiness loudly; it never silently starts a public gateway under fallback auth.
8. Explicit revoke/logout terminates the lease; missed unload expires naturally. Active proxied WebSockets close no later than the frozen 55-second bound.

### FROZEN PUBLIC CONTRACT

| Surface | Exact contract |
|---|---|
| `issueAgentWorkspaceAppLaunch(input)` | Authenticated GraphQL mutation; `{ workspaceId: UUID!, app: AgentWorkspaceApp! }` → `{ launchId: UUID!, redirectUrl: String!, expiresAt: DateTime! }`; only `OPENCLAW` is accepted in r2. |
| `renewAgentWorkspaceAppLaunch(input)` | Authenticated owner-only mutation; `{ launchId: UUID! }` → `{ launchId, expiresAt }`; only an already redeemed live lease can renew. |
| `revokeAgentWorkspaceAppLaunch(input)` | Authenticated owner-only mutation; `{ launchId: UUID! }` → `{ launchId, revoked: Boolean! }`; repeated revoke is successful and idempotent. |
| `POST /pods/self/workspace-app-launches/redeem` | `PodClientAssertionGuard`; atomically consumes `{ code, app }`, binds the lease to the asserted pod/workspace and returns bounded session claims only. |
| `POST /pods/self/workspace-app-launches/validate` | `PodClientAssertionGuard`; validates `{ launchId, sessionId }` for the asserted pod and returns active/expiry/owner identity required by the proxy. |
| `GET /access/openclaw/callback?code=...` | Redeem, set signed `Secure; HttpOnly; SameSite=Lax; Path=/` host-only cookie, `303 /openclaw/`; refusal sets no cookie and never reflects the code. |
| `/openclaw/*` | Authenticated HTTP/raw-WS reverse proxy to loopback OpenClaw. No generic upstream selector and no client-controlled identity header. |

### EXACT PRODUCTION TOUCHING BOUNDARY

#### Backend core and shared capability

| Paths | Action |
|---|---|
| `src/features/core/api/core/graphql/mutations/agent-workspace/{issue-agent-workspace-app-launch,renew-agent-workspace-app-launch,revoke-agent-workspace-app-launch}/**` | Add the three complete CQRS verticals and twin handler specs exactly as enumerated in Plan r1. |
| `src/features/core/api/core/graphql/mutations/index.ts` | Register all three operation modules in `MUTATION_MODULES`. |
| `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/{graphql-types/response.ts,my-agent-workspace-control-center.handler.ts,my-agent-workspace-control-center.handler.spec.ts}` | Change active OpenClaw capability to `EXTERNAL_LAUNCH`; keep n8n fail-closed. |
| `src/modules/bussiness/workspace-app-launch/**` | Add shared issue/redeem/renew/revoke/validate capability and its unit spec. |
| `src/modules/integrations/cache/{cache.service.ts,stores.ts,stores.spec.ts}` | Add and prove atomic `take`; no raw Redis access from feature code. |
| `src/modules/bussiness/pod-registration/dto/{redeem-workspace-app-launch.dto.ts,validate-workspace-app-launch.dto.ts}`; `pod-registration.types.ts`; `pod-registration.module.ts` | Add decorated machine DTOs/types and explicit module registration. |
| `src/features/core/api/core/http/pod-registration/pod-registration.controller.ts`; `apps/core/src/app.module.ts` | Add signed pod routes and compose the launch module once. |
| `src/modules/platform/exceptions/errors/agent-workspace/{app-launch-unavailable.ts,app-launch-invalid.ts,app-launch-session-ended.ts,index.ts}` | Add object-argument domain exceptions; no positional constructor contract and no raw/framework exception. |

#### Controlplane proxy and runtime config gate

| Paths | Action |
|---|---|
| `apps/agentos-controlplane/src/openclaw-access/**` | Add callback/session/proxy/runtime-gate module, services, types and twin specs. Runtime gate owns Pod UID marker and bounded config watcher. |
| `apps/agentos-controlplane/src/backend/{backend-client.service.ts,types/backend-client.ts}` | Add signed redeem/validate calls. |
| `apps/agentos-controlplane/src/{config.ts,app.module.ts,main.ts}` | Parse strict launch/config values, register the module once and delegate only `/openclaw` raw upgrades. |
| `apps/agentos-controlplane/src/openclaw-relay/{openclaw-relay.connection.ts,openclaw-relay.types.ts,openclaw-relay.service.ts}` | Migrate loopback relay handshake from token to password fallback. |
| `src/modules/bussiness/openclaw-runtime-config/{index.ts,openclaw-runtime-config.module.ts,openclaw-runtime-config.service.ts,openclaw-runtime-config.types.ts,openclaw-runtime-config.service.spec.ts}` | New shared, parameter-driven, atomic JSON reconciler. It owns only Nivo access fields and preserves all customer-owned config. |
| `apps/agentos-cli/src/soul/{openclaw-config.service.ts,soul.module.ts}` | Delete the dead app-local config service and remove its provider/export; `SoulService` remains. No cross-app import is introduced. |
| `apps/agentos-cli/src/config.ts` | Remove token-only dead config vocabulary made obsolete by the shared reconciler; retain values still consumed by CLI jobs. |

#### Credential chain and tests

| Paths | Action |
|---|---|
| `src/modules/bussiness/pod-registration/pod-access-token.service.ts`; `src/modules/bussiness/pod-credential/channel-credential-keys.ts`; `src/modules/bussiness/pod-openclaw/pod-openclaw.client.ts` | Rename the bounded OpenClaw secret to password semantics and update the internal health client. |
| `src/tests/e2e/controlplane/pod-gateway-token-chain.e2e-spec.ts` → `pod-gateway-password-chain.e2e-spec.ts` | Rename and rewrite the full credential/config/relay chain proof; delete the old token-named file. |
| `src/tests/e2e/controlplane/{pod-access-credentials.e2e-spec.ts,openclaw-control-ui-launch.e2e-spec.ts}` | Update exact credential assertions and add real callback/proxy fixture proof. |
| `src/tests/e2e/nivo/agentos-openclaw-control-ui-launch.e2e-spec.ts` | Add GraphQL → signed pod redeem/validate → Redis one-winner flow E2E. |

#### Helm chart

| Paths | Action |
|---|---|
| `charts/agentos/{Chart.yaml,values.yaml}` | Patch bump; add non-secret path/origin/timeout settings. |
| `charts/agentos/templates/{secret.yaml,deployment.yaml,ingress.yaml,service.yaml}` | Password key; controlplane OpenClaw-subpath mount; Pod UID env in controlplane/OpenClaw; bounded UID gate before gateway; trusted-proxy args; existing controlplane-only Service/Ingress. No initContainer and no public OpenClaw Service. |

#### Frontend follow-on boundary

| Paths | Action |
|---|---|
| `apps/app/src/modules/api/console.ts`; `apps/app/src/modules/window/workspace-app-launch.ts`; `apps/app/src/components/blocks/agentos/AgentOSWorkspaceApplications/index.tsx`; `apps/app/src/components/pages/AgentOSWorkspacePage/{index.tsx,component.tsx}`; `apps/app/src/messages/{en.json,vi.json}` | Consume the frozen API, synchronously open/reuse popup, renew/revoke lease and render blocked/expired/disconnected states. |
| Rejected console paths listed in Plan r1 | Delete the fake Nivo console implementation after overlap classification. |

### FROZEN TEST AND LIVE PROOF

| Gate | Required proof |
|---|---|
| Twin specs | Every new handler/service/proxy/config reconciler has the branch matrix from Plan r1; Redis has a concurrent one-winner test. |
| Schema | Live introspection contains all three mutations with exact input/output fields and no secret field. |
| Build quality | Backend lint zero errors, frozen typecheck/build/tests pass; chart `helm lint` and rendered assertions pass; FE lint/typecheck/build pass after its follow-on Apply. |
| Helm ordering | Fresh install and upgrade both show controlplane writes the current Pod UID gate before OpenClaw starts; stale UID and config failure keep gateway unavailable; no initContainer renders. |
| Proxy | Real OpenClaw HTML/assets and raw WS pass through `/openclaw`; spoofed headers are overwritten; absent/revoked lease is rejected before upstream dial; active WS closes by deadline. |
| Live UI | Signed-in test owner opens workspace → Applications → Open OpenClaw; a separate top-level window shows actual `OpenClaw Control`, no key prompt; Network/Console contain no reusable secret; logout/revoke causes disconnected within 55 seconds. |
| Runtime evidence | Record FE/BE/controlplane logs, K8s pod/events, GraphQL/HTTP status and Socket.IO unaffected. Append under `### LIVE FLOW PROOF`; never record password, token, cookie or launch code. |

### OUTPUTS

| Concept | Result |
|---|---|
| Reviewed revision | `nivo-openclaw-control-ui-launch-r2` |
| Main correction | Replaced the impossible post-upgrade CLI/PVC migration with an in-pod, controlplane-owned, Pod-UID configuration gate that preserves the canonical three-container/no-initContainer shape. |
| Production status | Candidate only. No product source may be written until the exact r2 boundary is explicitly approved. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\openclaw-control-ui-launch.md` | `modified` — appended Review r2; no target source write. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve exact production boundary | Approve `nivo-openclaw-control-ui-launch-r2` for backend/chart Apply, followed by the frozen FE consumer boundary and live proof. |
| OpenClaw authority | Approve session-only `operator.read`, `operator.write`, `operator.approvals`, `operator.admin` for the exact workspace owner; no persistent device grant. |

### WARNINGS

| Warning | Impact |
|---|---|
| Controlplane becomes the trusted identity boundary for OpenClaw. | Header stripping/overwrite, loopback-only upstream, exact origin/user and no bypass Service are release gates. |
| OpenClaw config is customer-persistent but has Nivo-owned access fields. | Reconciler may alter only the frozen access paths; every unrelated JSON branch must survive byte-equivalent semantic round-trip tests. |
| FE, chart and backend worktrees contain unrelated/overlapping edits. | Apply must baseline/classify each overlap and preserve user work; no reset or blanket replacement. |
| Full admin scope is powerful. | It is lease-bound and session-only. If this approval is withheld, admin/config screens are intentionally unsupported and the test matrix must change before Apply. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| r1: migrate auth through the existing provision hook/CLI service | Controlplane-owned shared reconciler plus current-Pod-UID gate | The hook has no state PVC mount, the command never calls the service, and post-install runs too late to gate gateway startup. |
| Add an initContainer for config | Existing controlplane performs the bounded gate | `biz.md` explicitly freezes no initContainer and exactly three application containers. |
| Mount a read-only ConfigMap as `openclaw.json` | Atomic narrow reconciliation on the writable state PVC | OpenClaw owns and mutates the rest of this customer-persistent file. |
| Start trusted-proxy gateway and repair config later | Refuse startup until the current Pod UID gate exists | Starting first creates an auth downgrade/race during install and upgrade. |
| Direct OpenClaw route, iframe or browser token | Existing controlplane proxy + auxiliary window + HttpOnly lease | Each alternative either bypasses Nivo authorization, violates frame policy or exposes a reusable credential. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of one exact Review revision | User says `Duyệt nivo-openclaw-control-ui-launch-r2`. |
| Backend/controlplane/shared config implementation | `$starci-be-feature-apply` against only the approved r2 backend boundary. |
| Chart implementation and rendered install/upgrade proof | Apply the approved chart slice while preserving current overlaps; prove no initContainer/direct OpenClaw Service. |
| FE popup consumer and deletion of fake console | Continue the open FE fidelity/apply workflow against the frozen API after backend schema is live. |
| Single dev workspace live upgrade and UI/Network/Console/terminal proof | Run only after all frozen static gates pass; append sanitized `### LIVE FLOW PROOF`. |
