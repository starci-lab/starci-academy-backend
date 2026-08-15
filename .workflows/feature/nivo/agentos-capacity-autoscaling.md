<!-- starci-workflow: v2 -->

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Infrastructure / charts | D:\Repositories\nivo-charts (AgentOS); D:\Repositories\nivo (Expert transition source) |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo — production composition app core |
| Database | primary PostgreSQL via `InjectPrimaryEntityManager` |
| Repo / branch | D:\Repositories\nivo-backend @ main; dirty user worktree must be preserved |
| Purpose | Durable TypeScript AgentOS provisioning, capacity reservation, Tino-backed node scale-out, safe scale-in gates, and a three-concurrent-AgentOS proof. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-capacity-autoscaling.md |
| Language | vi |
| Phase | plan |
| Touching | This workflow only. No backend/chart/product source is written in Plan. |

### CAPABILITY BRIEF

The customer flow remains the existing paid catalog flow, not a new provisioning mutation:

`orderCatalogItem -> payInvoice -> create Instance/AgentWorkspace -> durable BullMQ job -> reserve cluster capacity -> scale node pool if required -> helm upgrade --install AgentOS -> K8s rollout watch -> persist terminal state -> workspace.status Socket.IO -> management page`.

Three simultaneous paid AgentOS orders are three independent instance jobs but one serialized capacity decision. A PostgreSQL lock and durable reservations must prevent all three workers from observing the same free RAM and each independently ordering a VPS.

Autoscaling is node scaling, not pod horizontal scaling. AgentOS remains one singleton app Deployment per tenant because OpenClaw sessions and n8n schedules cannot safely run two active mains. Kubernetes schedules each tenant stack; Nivo adds or retires worker VPS nodes around that scheduler.

### LIVE SCHEMA EVIDENCE

| Evidence | Result |
|---|---|
| Live endpoint | `http://localhost:3067/graphql` introspection succeeded. |
| Existing customer doors | `orderCatalogItem`, `payInvoice`, `myInstances`, `myAgentWorkspace`, `myCatalogOrders`. |
| Existing realtime transport | No GraphQL subscription. Provisioning is delivered by Socket.IO `/provisioning`. |
| Existing AgentOS surface | `createAgent`, `saveAgent`, `manageAgentWorkspace`, `myAgentWorkspace`; provisioning itself is not a separate GraphQL operation. |
| Schema verdict | Add no GraphQL provisioning mutation. The paid catalog flow is the production boundary and must be the E2E entry. |

### SOURCE EVIDENCE

| Exact source | Finding |
|---|---|
| `src/modules/bussiness/catalog-fulfillment/mock-agent-workspace-fulfillment.service.ts` | AgentOS currently creates a row, mints access credentials in a detached task and flips it active without installing a chart. |
| `src/modules/bussiness/catalog-fulfillment/catalog-fulfillment.dispatcher.ts` | Creates `InstanceEntity`, invokes the mock driver, then marks the instance active immediately. Comments explicitly say AgentOS has no chart lane. |
| `src/modules/platform/databases/postgresql/primary/entities/provisionable-app.entity.ts` | Already models `chartRef`, ordered `pipelineSteps`, `stepConfig`, `secretSpecs` and `isProvisionable`; AgentOS is seeded false with an empty pipeline. |
| `src/modules/platform/databases/postgresql/primary/enums/job-action-type.ts` | Already declares `ProvisionAgentWorkspace`. |
| `src/modules/integrations/bullmq/enums/queue-name.ts` | Already declares the isolated `provision-agent-workspace` queue. |
| `src/modules/bussiness/expert-provision/expert-provision.dispatcher.ts` | Correct sibling: transaction creates durable job/deployment state, enqueue occurs after commit, BullMQ job id equals ledger id. |
| `src/modules/bussiness/expert-provision/provision-expert-site.worker.ts` | Correct sibling worker: configurable concurrency, real queue boundary, fencing token and durable failure. |
| `src/modules/bussiness/expert-provision/chart/expert-chart-installer.service.ts` | Helm is already invoked directly from TypeScript with stdin values and no shell; the old JS apply indirection is retired in this path. |
| `src/modules/bussiness/expert-deploy/expert-deploy-k8s-watcher.service.ts` | Existing in-process Kubernetes read/watch seam polls Deployments, Pods and Ingress and maps a terminal rollout. |
| `src/modules/bussiness/instance-lifecycle/instance-release-destroyer.service.ts` | Expert uninstall is already direct TypeScript -> Helm plus typed PVC deletion; stale comments/tests still name the old JS tool. |
| `D:/Repositories/nivo-charts/charts/agentos` | Real AgentOS chart exists with bundled PostgreSQL 18.8.6, MinIO 17.0.21 and Qdrant 1.18.2 dependencies. |
| `D:/Repositories/nivo/tools/provision-expert.mjs` | Transitional tool remains on disk but current Expert install/uninstall production services no longer need it. Delete only after all references and parity proofs are migrated. |

### CHART AND CAPACITY FINDINGS

| Finding | Measured result | Design consequence |
|---|---|---|
| AgentOS steady memory requests | `1.875Gi` aggregate before the provision/backup Job. | Does not fit the approved Small reservation `1.5Gi`; chart request values must be tuned and mechanically summed in a spec. |
| AgentOS steady memory limits | `8.5Gi` aggregate. | Violates Small `3Gi` and Large `6Gi`; backend plan values and chart limits must become one reviewed profile. |
| Transient CLI Job | `128Mi` request / `512Mi` limit. | Capacity reservation must include rollout surge, not only steady pods. |
| Persistent storage | PostgreSQL `8Gi` + MinIO `20Gi` + Qdrant `8Gi` + app state `2Gi` = `38Gi` per instance. | Three AgentOS instances request `114Gi` PVC capacity. Storage capacity is a first-class admission check. |
| Default storage class | `global.storageClass: ""`; k3s normally selects `local-path`. | A node with local PVCs cannot be safely drained/deleted. Automatic scale-in must refuse until a relocatable CSI class is configured. |
| Database images | AgentOS already pins `bitnamilegacy/postgresql`, `bitnamilegacy/minio` and helper images. | Preserve these pins. Database image choice is not the autoscaler. |
| Singleton app | Chart hardcodes one app replica. | Scale nodes, never HPA the AgentOS app Deployment. |

### RESOURCE PROFILE DECISION TO REVIEW

| Profile | Durable capacity reservation | Namespace memory limit | Chart rule |
|---|---:|---:|---|
| Small | `1.5Gi` RAM request plus rollout surge; CPU from purchased plan | `3Gi` aggregate steady limit | Sum of steady container requests must be `<= 1.5Gi`; sum of limits must be `<= 3Gi`. |
| Large | `3Gi` RAM request plus rollout surge; CPU from purchased plan | `6Gi` aggregate steady limit | Sum of steady container requests must be `<= 3Gi`; sum of limits must be `<= 6Gi`. |

`ResourceQuota.requests.memory` is a ceiling, not a guaranteed minimum. Therefore the capacity ledger reserves the purchased envelope independently of the pod sum; Kubernetes still schedules from real per-container requests. A `ResourceQuota`/`LimitRange` prevents chart drift from exceeding the bought envelope, while the reservation prevents another tenant from consuming the unexpressed headroom.

### CAPACITY ALGORITHM

1. The AgentOS dispatcher creates the workspace, job ledger and one unique capacity reservation in the same primary-PostgreSQL transaction; enqueue occurs after commit.
2. The first worker step obtains a database advisory lock for the cluster pool and reads: node allocatable resources, non-terminal pod requests, DaemonSet/system reserve, PVC/storage capacity and every in-flight reservation.
3. The calculator reserves the three requests together. If the pool fits them, no provider action is created.
4. If short, it computes the minimum worker-node count using node allocatable minus system reserve and a configured headroom. One durable scale action owns the provider idempotency key; concurrent jobs attach to that action rather than ordering again.
5. The provider boundary orders/activates VPS capacity. The bootstrap boundary joins each VPS as a labeled/tainted k3s worker and waits for the exact node to become `Ready` with expected allocatable resources.
6. Reservations become schedulable only after node readiness is persisted. AgentOS Helm install then targets the managed tenant worker pool.
7. K8s rollout observation persists each distinct transition before emitting `workspace.status`. `active` is written only when all required workloads and the ingress are ready.
8. A periodic reconciler may propose scale-in only after a cooldown and sustained spare reserved capacity. It chooses Nivo-managed workers only, cordons, proves no local/non-relocatable PVC, drains, removes the k3s node, and only then calls the provider release operation.
9. Any failed gate leaves the node running and records a refused scale-in; capacity correctness wins over cost reduction.

### TINO CONTRACT EVIDENCE AND GAP

| Official documented operation | Endpoint | Usable fact |
|---|---|---|
| Authenticate | `POST https://api.tino.vn/login` | JWT/basic auth is documented. |
| Order service | `POST /order/@product_id` | Can create a paid service order and returns order/invoice/item identifiers. |
| List VMs | `GET /service/@id/vms` | Can inspect VMs under an existing service. |
| Service resources | `GET /service/@id/resources` | Can inspect available/used resources. |
| Upgrade service | `POST /service/@id/upgrade` | Can estimate or submit a resource/package upgrade. |
| Terminate/delete VPS | Not present in the published API documentation read in this Plan. | Automatic scale-in cannot honestly be implemented against an invented endpoint. |
| Cloud-init / SSH key / k3s join input on order | Not present in the published `POST /order/@product_id` contract. | Node bootstrap must be separately proven against the real product configuration response before production writes. |

The Tino adapter is therefore conditional: Review must freeze a verified create/activate/cancel contract, product id/config and billing cap. Until then, the internal provider port and deterministic fake-provider E2E can be implemented, but live automatic Tino create/delete cannot be called complete.

### EXACT PRODUCTION FILE TREE

All paths are prospective Apply files. Review may narrow them but must not silently widen them.

| Area | Exact path | Action | Responsibility |
|---|---|---|---|
| dependencies | `D:/Repositories/nivo-backend/package.json`; `package-lock.json` | MODIFY | Add `execa` only for direct Helm binary execution with `shell: false`; HTTP uses native fetch and node bootstrap uses existing `ssh2`. |
| persistence | `src/modules/platform/databases/postgresql/primary/entities/cluster-node.entity.ts` | ADD | Durable provider service id, k8s node name, managed labels and lifecycle. |
| persistence | `src/modules/platform/databases/postgresql/primary/entities/cluster-capacity-action.entity.ts` | ADD | Idempotent scale-out/scale-in action, desired delta, provider reference, phase and failure. |
| persistence | `src/modules/platform/databases/postgresql/primary/entities/instance-capacity-reservation.entity.ts` | ADD | Unique instance envelope, rollout surge, storage request and release state. |
| persistence | `src/modules/platform/databases/postgresql/primary/entities/index.ts`; `src/modules/platform/databases/postgresql/primary/primary.module.ts` | MODIFY | Register the three entities. |
| persistence | `src/modules/platform/databases/postgresql/primary/migrations/1787702400000-cluster-capacity.ts` | ADD | Tables, unique idempotency/instance constraints and indexes; re-check timestamp in Review. |
| env | `src/modules/platform/env/config.ts` | MODIFY | Chart root, capacity headroom/cooldown, worker pool labels, Tino endpoint/product/config, SSH/k3s file pointers; no credential literal. |
| infra secret manifest | `D:/Repositories/nivo-backend/.stacks/k8s/infra/KEYS.md` | MODIFY | Name Tino auth, k3s join and worker SSH secret files without exposing values. |
| Helm integration | `src/modules/integrations/helm/helm-release.service.ts`; `helm-release.service.spec.ts`; `helm.module.ts`; `helm.module-definition.ts`; `types/helm-release.ts` | ADD | `upgrade --install`, uninstall, timeout, stdin values, output scrubbing and no shell. |
| Tino integration | `src/modules/integrations/tino/tino-capacity-provider.service.ts`; `tino-capacity-provider.service.spec.ts`; `tino.module.ts`; `tino.module-definition.ts`; `types/tino-auth.ts`; `types/tino-order.ts`; `types/tino-service.ts`; `types/tino-provider.ts` | ADD | External provider adapter only; no capacity policy. Exact destructive endpoint stays refused until verified. |
| capacity types | `src/modules/bussiness/cluster-capacity/types/capacity.ts`; `capacity-provider.ts`; `capacity-reservation.ts`; `cluster-node.ts`; `index.ts` | ADD | Named types and discriminated lifecycle unions. |
| capacity calculator | `src/modules/bussiness/cluster-capacity/calculate-capacity-plan.ts`; `calculate-capacity-plan.spec.ts` | ADD | Pure arithmetic for three concurrent reservations, headroom, rollout surge and node count. |
| capacity probe | `src/modules/bussiness/cluster-capacity/cluster-capacity-probe.service.ts`; `cluster-capacity-probe.service.spec.ts` | ADD | Typed Kubernetes reads for nodes, pod requests, Pending/Unschedulable reasons, PVC/PV/storage class and optional Metrics API. |
| reservations | `src/modules/bussiness/cluster-capacity/cluster-capacity-reservation.service.ts`; `cluster-capacity-reservation.service.spec.ts` | ADD | Primary-DB transaction/advisory lock, unique reservation and action coalescing. |
| scale out | `src/modules/bussiness/cluster-capacity/cluster-node-bootstrap.service.ts`; `cluster-node-bootstrap.service.spec.ts`; `cluster-scale-out.service.ts`; `cluster-scale-out.service.spec.ts` | ADD | Provider request, SSH/k3s join, managed labels/taints and exact Ready wait. |
| scale in | `src/modules/bussiness/cluster-capacity/cluster-scale-in.service.ts`; `cluster-scale-in.service.spec.ts` | ADD | Cooldown, managed-node selection, local-PVC refusal, cordon/drain/remove/provider-release order. |
| reconciler | `src/modules/bussiness/cluster-capacity/cluster-capacity-reconciler.service.ts`; `cluster-capacity-reconciler.service.spec.ts` | ADD | Durable periodic and reactive reconciliation; Metrics API is advisory, requests/reservations are authoritative. |
| capacity module | `src/modules/bussiness/cluster-capacity/cluster-capacity.module.ts`; `cluster-capacity.module-definition.ts` | ADD | Capability wiring/export only. |
| AgentOS dispatch | `src/modules/bussiness/agentos-provision/agentos-provision.dispatcher.ts`; `agentos-provision.dispatcher.spec.ts` | ADD | Transactional job/reservation creation and post-commit enqueue. |
| AgentOS worker | `src/modules/bussiness/agentos-provision/provision-agentos.worker.ts`; `provision-agentos.worker.spec.ts`; `provision-step-map.service.ts`; `provision-step-map.service.spec.ts` | ADD | Drain existing AgentOS queue with fencing/retry, mirroring Expert. |
| AgentOS chart | `src/modules/bussiness/agentos-provision/chart/build-agentos-chart-values.ts`; `build-agentos-chart-values.spec.ts`; `agentos-chart-source.service.ts`; `agentos-chart-source.service.spec.ts` | ADD | Build public config/resource/storage/scheduling values and resolve `nivo-charts/charts/agentos`. |
| AgentOS steps | `src/modules/bussiness/agentos-provision/steps/reserve-capacity.step.ts`; `mint-bootstrap.step.ts`; `install-chart.step.ts`; `record-outcome.step.ts` plus one twin `*.spec.ts` beside each | ADD | Ordered append-only pipeline: reserve -> mint -> install -> watch/persist/emit. |
| AgentOS types | `src/modules/bussiness/agentos-provision/types/dispatch.ts`; `payload.ts`; `chart.ts`; `profile.ts`; `index.ts` | ADD | Job payload, loaded state, profile and chart contracts. |
| AgentOS module | `src/modules/bussiness/agentos-provision/agentos-provision.module.ts`; `agentos-provision.module-definition.ts` | ADD | Capability wiring/export only. |
| fulfillment bridge | `src/modules/bussiness/catalog-fulfillment/real-agent-workspace-fulfillment.service.ts`; `real-agent-workspace-fulfillment.service.spec.ts` | ADD | Create provisioning workspace and dispatch durable AgentOS job; never mark ready. |
| fulfillment bridge | `src/modules/bussiness/catalog-fulfillment/catalog-fulfillment.module.ts`; `catalog-fulfillment.module-definition.ts`; `catalog-fulfillment.dispatcher.ts`; `catalog-fulfillment.dispatcher.spec.ts` | MODIFY | Bind real driver; paid order returns `InProgress`; terminal worker owns activation/failure. |
| registry | `src/modules/platform/databases/postgresql/primary/provisionable-app-seeder.service.ts`; `provisionable-app-seeder.service.spec.ts` | MODIFY/ADD | AgentOS `chartRef`, pipeline, resource profile config and `isProvisionable: true` only after proofs. |
| job/runtime config | `src/modules/platform/databases/postgresql/primary/enums/job-action-type.ts`; `src/modules/integrations/bullmq/enums/queue-name.ts` | VERIFY / MODIFY only if reconciler gets its own queue | Preserve existing AgentOS queue/action; add capacity queue/action only if Review approves durable separate reconciliation. |
| realtime | `src/modules/bussiness/provisioning-events/types.ts`; `src/modules/platform/socketio/gateways/provisioning/types/message.ts`; `provisioning.gateway.ts`; `provisioning.gateway.spec.ts` | VERIFY / MODIFY | Persist-before-emit `workspace.status`; add capacity-safe public phases only if existing payload cannot represent them. |
| composition | `apps/core/src/app.module.ts` | MODIFY | Register AgentOS provision, capacity, Helm and Tino capabilities at composition root; no sideways module imports. |
| exceptions | `src/modules/platform/exceptions/errors/cluster-capacity/capacity-unavailable.ts`; `capacity-reservation-conflict.ts`; `cluster-scale-failed.ts`; `cluster-scale-in-unsafe.ts`; `cluster-node-join-timeout.ts`; `provider-capability-unavailable.ts` | ADD | Named `AbstractException` failures with metadata objects. |
| exceptions | `src/modules/platform/exceptions/errors/agentos-provision/agentos-rollout-not-ready.ts`; `agentos-chart-source-unresolved.ts`; `agentos-provision-already-running.ts` | ADD | AgentOS-specific refusals/failures. |
| Expert migration | `src/modules/bussiness/expert-provision/chart/expert-chart-installer.service.ts`; `src/modules/bussiness/instance-lifecycle/instance-release-destroyer.service.ts` and their twins | MODIFY | Reuse generic Helm service while preserving byte-equivalent release/namespace/value behavior. |
| chart source | `D:/Repositories/nivo-charts/charts/agentos/values.yaml`; `templates/deployment.yaml`; `templates/job-provision.yaml`; `templates/cronjob-backup.yaml` | MODIFY | Small/Large resource values, transient surge and managed-worker scheduling. |
| chart guard | `D:/Repositories/nivo-charts/charts/agentos/templates/resourcequota.yaml`; `templates/limitrange.yaml` | ADD | Enforce namespace aggregate memory envelope and default container constraints. |
| storage | `D:/Repositories/nivo-charts/charts/agentos/values.yaml`; `templates/pvc.yaml` | MODIFY | Require production relocatable CSI storage class; keep Bitnami legacy images and all PVC identities. |
| composition test | `src/tests/probe/agentos-chart.probe-spec.ts`; `tino-capacity-contract.probe-spec.ts` | ADD | Helm render/resource/PVC assertions; read-only Tino contract probe with mutation opt-in. |
| flow E2E | `src/tests/e2e/nivo/three-agentos-capacity.e2e-spec.ts` | ADD | Authenticated GraphQL payments x3, real Redis/BullMQ/Postgres/Socket, fake provider external result only. |
| live E2E | `src/tests/e2e/nivo/three-agentos-capacity.live-spec.ts` | ADD | Real Helm/K8s/Socket; live Tino mutation requires explicit cost flag and verified cleanup. |
| local cluster fixture | `scripts/create-capacity-e2e-cluster.mjs` | ADD | Kind cluster with active and cordoned standby workers; fake provider activates standby while scheduler/K8s remain real. |
| transitional cleanup | `D:/Repositories/nivo/tools/provision-expert.mjs`; stale Dockerfile/docs/test references named by `rg provision-expert.mjs` | DELETE/MODIFY last | Remove only after generic Helm parity, Expert live proof and zero production references. |

### TEST MATRIX

| Case | Lane / entry | Required consequence |
|---|---|---|
| Small profile arithmetic | Unit | Steady request sum `<= 1.5Gi`, steady limit sum `<= 3Gi`, rollout surge explicitly reserved. |
| Large profile arithmetic | Unit | Steady request sum `<= 3Gi`, steady limit sum `<= 6Gi`, rollout surge explicitly reserved. |
| Three simultaneous reservations fit | Unit | Three unique reservations, zero provider action, no double-count. |
| Three simultaneous reservations exceed pool | Unit with real DB concurrency | Exactly one scale action/idempotency key; minimum node delta; all three jobs attach and continue after Ready. |
| Worker retry | Unit/integration | Existing reservation/action reused; no duplicate Tino order, bootstrap token or Helm release. |
| Tino auth/order decode | Unit | Unknown payload narrows or throws a domain exception; no `any`/double cast. |
| Tino undocumented release | Unit | Typed `ProviderCapabilityUnavailableException`; node is not removed first. |
| Node join timeout | Unit | Scale action failed with provider/node ids; reservations remain waiting, never ready. |
| K8s Pending Insufficient memory | Integration | Reactive reconcile requests capacity once; unrelated Pending reason does not. |
| Metrics API absent | Unit/integration | Scale-out still works from allocatable/requests; scale-in is conservative, not failed open. |
| Local PVC on candidate node | Unit + real K8s fixture | Scale-in refused before cordon/delete/provider call. |
| Relocatable CSI volume | Real K8s fixture | Cordon -> drain -> node removal -> provider release in order after volume health/readiness proof. |
| AgentOS install | Integration | Real Helm creates the same release/namespace once, on managed worker pool, with quota and expected 38Gi PVC set. |
| Rollout failure | Integration | Workspace + instance remain non-active, persisted public reason emitted once per distinct transition. |
| Three paid AgentOS flow | E2E through GraphQL | Three orders/invoices paid concurrently; three instances/workspaces/jobs exist; every matching owner socket reaches terminal ready; no direct worker call. |
| Owner isolation | E2E | A second user receives no workspace status and cannot read any of the three instances. |
| Local scale proof | Live local kind | One active worker is insufficient by configured capacity; fake provider activates minimum standby workers; all three real releases become schedulable. |
| Tino scale proof | Opt-in live | At most the approved paid-node cap is ordered; node joins Ready; three releases settle; cleanup is proven or scale-in remains OWED. |
| Expert parity | Unit/live | Expert install/uninstall rendered args, values, release, namespace and terminal watcher result remain equivalent before JS tool deletion. |

### THREE-AGENTOS PROOF STATUS IN PLAN

| Check attempted now | Result |
|---|---|
| AgentOS chart discovery | PASS — real chart is `D:\Repositories\nivo-charts\charts\agentos`. |
| `helm lint` with non-secret test values | PASS; one upstream MinIO merge warning, zero lint failures. |
| Local kind cluster | Reachable, one `Ready` node with about 32Gi allocatable RAM; Metrics API absent. Three tenants would fit and therefore cannot prove scale-out. |
| Existing local namespace | Expert release exists but app images are `ImagePullBackOff`; unrelated to AgentOS scale proof. |
| Tino kubeconfig | Encrypted file decrypts to `clusters: null`, `contexts: null`, `users: null`; plaintext removed immediately. |
| Real Tino create/delete | NOT RUN — no usable cluster identity, no verified product/config, no documented delete contract and no explicit monetary cap. |
| Honest verdict | The current product cannot provision three real AgentOS instances: fulfillment is mock and AgentOS is seeded non-provisionable. The run belongs to Apply after Review, not to Plan. |

### ASSUMPTIONS AND EXCLUSIONS

| Item | Decision |
|---|---|
| Public door | Reuse order/payment. No `provisionAgentos` GraphQL mutation. |
| Capacity truth | Kubernetes allocatable + pod requests + durable reservations. Metrics are advisory only. |
| Node provider | Tino is behind a provider port; no Tino payload leaks into business policy. |
| Helm | TypeScript owns Helm directly. `execa` uses argv/stdin with `shell: false`; no command-string shell. |
| Databases | Preserve Bitnami legacy image pins. This plan does not convert PostgreSQL/MinIO/Qdrant engines. |
| Storage | Recommend Longhorn or another relocatable CSI class. Installing/operating the CSI platform itself is a separate infrastructure approval, but scale-in is refused without it. |
| Scale in | Never based on instantaneous CPU/RAM drop. Requires sustained spare reservations, cooldown, managed node, relocatable volumes and successful drain. |
| Costs | No paid Tino order or cancellation in Plan. Live mutation requires explicit cap and cleanup contract. |
| Existing lifecycle workflow | `instance-lifecycle-operations.md` remains partial. This feature reuses its snapshot/event foundation but does not claim the missing customer operations are complete. |
| MMO / other template apps | Registry/pipeline shape should remain reusable, but no MMO product behavior or chart is invented here. |
| Dirty worktrees | Preserve every unrelated user change; baseline and commits in Apply must isolate exact approved paths. |

### OUTPUTS

| Concept | Result |
|---|---|
| Backend owner | AgentOS provisioning becomes a durable TypeScript CQRS/queue capability; mock activation is retired. |
| Capacity owner | One serialized capacity ledger coordinates all concurrent instance jobs and external node actions. |
| Scaling model | Vertical tenant envelope + singleton tenant pod, horizontal k3s worker-node pool. |
| Three-instance verdict | Not runnable honestly today; exact deterministic and live proofs are specified. |
| Script retirement | Expert/AgentOS Helm goes through one TypeScript integration; old JS tool is removed only after parity. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-capacity-autoscaling.md` | Added this Plan only; no production source or cluster resource changed. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Storage foundation | **Require Longhorn/relocatable CSI before enabling automatic scale-in**; alternatively allow scale-out only and retain nodes permanently. Never delete a node holding `local-path` PVCs. |
| Tino contract | **Provide/verify a Tino product id, config fields, activation correlation and official cancel/terminate operation**; alternatively keep Tino provider in read-only/fake mode and operate nodes manually. |
| Paid live proof | **Cap the proof at one newly ordered VPS and require verified cleanup before calling it PASS**; alternatively run local standby-node proof only. |
| Reconciler durability | **Use a dedicated BullMQ capacity queue plus DB idempotency/advisory lock**; alternatively run reconciliation inside AgentOS workers only (simpler but no durable scale-in scheduler). |
| Chart repository transition | **Use `nivo-charts` as AgentOS source now and migrate Expert to the generic Helm service before deleting `provision-expert.mjs`**; alternatively leave Expert cleanup for a linked later workflow. |

### WARNINGS

| Warning | Impact |
|---|---|
| Tino public docs expose order/list/resource/upgrade but no terminate/delete VPS endpoint. | Automatic VPS deletion is blocked; inventing an endpoint could delete the wrong service or continue billing. |
| Tino kubeconfig ciphertext currently contains an empty kubeconfig. | No live cluster/node measurement or Helm proof can use it. |
| AgentOS chart currently exceeds both approved memory envelopes. | Marking AgentOS provisionable before resource repair would make Small plans unschedulable or unenforced. |
| Default k3s `local-path` plus 38Gi PVC per tenant is not movable. | Node deletion risks permanent tenant data loss or an unattachable reschedule. |
| Local kind has one large node and no Metrics API. | Three successful schedules there do not prove autoscaling. |
| Backend and prior Apply worktrees are heavily dirty/partial. | Apply must not stage or commit unrelated source. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Three workers each call Tino after seeing low RAM | Serialized DB reservations and one coalesced scale action | Prevents over-ordering and race-driven cost. |
| HPA AgentOS app pods | Add k3s worker nodes | OpenClaw/n8n are singleton stateful mains; duplicate replicas can duplicate sessions/schedules. |
| Use namespace quota as guaranteed allocation | Durable capacity reservation plus quota guard | ResourceQuota caps usage; it does not reserve node RAM. |
| Delete a VPS as soon as CPU/RAM drops | Cooldown + request/reservation accounting + safe drain gates | Instant metrics are noisy and say nothing about local PVC safety. |
| Drain/delete a node with local-path PVCs | Relocatable CSI or retain the node | Stateful tenant data cannot follow the pod. |
| Call a worker/handler directly in E2E | GraphQL payment -> real queue -> real Socket.IO | Direct calls skip auth, serialization, retries, locks and competing consumers. |
| Mock capacity policy in E2E | Fake only the external provider result | Internal coalescing, reservation and scheduling policy must remain real. |
| Keep AgentOS mock and call the run “provisioned” | Real chart install and rollout terminal state | A row and token are not a running tenant stack. |
| Delete `provision-expert.mjs` immediately | Generic Helm parity, zero references, then delete | Existing docs/live tests and transitional recovery references still name it. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit Review revision | Run `$starci-be-feature-review` and approve storage, Tino, paid-cap and queue choices. |
| Exact Tino destructive/API contract | Authenticated read-only discovery plus provider documentation/support confirmation; record no secret. |
| Usable Tino kubeconfig | Replace encrypted empty value with a valid cluster kubeconfig, decrypt only for the proof, remove plaintext after. |
| Backend/chart implementation | `$starci-be-feature-apply` after Review freezes exact files. |
| Three-AgentOS deterministic proof | Multi-node kind fixture, three authenticated paid flows, real queue/Helm/K8s/Socket, fake external provider only. |
| Three-AgentOS live scale proof | Explicitly cost-approved Tino run with node Ready evidence and verified cleanup. |
| Automatic scale-in | Relocatable CSI proof plus verified Tino release endpoint. Until both exist, scale-in must remain refused. |

Invite: `$starci-be-feature-review`

## review

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo — core |
| Repo / branch | D:\Repositories\nivo-backend @ main; D:\Repositories\nivo-charts @ main |
| Purpose | Khóa revision triển khai AgentOS durable provisioning và bằng chứng scale ba instance mà không giả định contract Tino/CSI chưa tồn tại. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-capacity-autoscaling.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; không viết backend, chart, cluster hay gọi API tính phí. |

### REVIEW FINDINGS

| Finding | Review verdict |
|---|---|
| Public operation | Không thêm mutation mới. `orderCatalogItem -> payInvoice` là production boundary; worker hoàn thành bất đồng bộ. |
| CQRS/queue family | Mirror `ExpertProvisionDispatcher` + `ProvisionExpertSiteWorker`: transaction tạo ledger trước, enqueue sau commit, BullMQ job id bằng `jobs.id`, worker có fencing/retry. |
| AgentOS chart | Chart thật đã tồn tại ở `D:\Repositories\nivo-charts\charts\agentos`; seeder/comment hiện nói không có chart là stale và phải sửa trong Apply. |
| Realtime | `ProvisioningTransitionEmitter -> ProvisioningGateway -> workspace.status` đã đủ contract; r1 REUSE gateway, không thêm event song song. FE hiện coi mọi status khác `active/ready/failed` là `preparing`, nên các phase chi tiết vẫn backward-compatible. |
| Async payment semantics | Sau khi queue được chấp nhận, invoice giữ `paid`, order giữ `in_progress`. Lỗi rollout không tự hoàn tiền; workspace/instance ghi `failed`, retry/recovery hoặc refund là operation riêng. |
| Activation owner | Chỉ terminal worker được ghi `Instance=active`, `AgentWorkspace=active`, `CatalogOrder=active/activatedAt`. `PayInvoiceService` không được set `activatedAt` cho `InProgress`. |
| Capacity concurrency | Ba job có ba reservation nhưng dùng một advisory-lock scope; một `ClusterCapacityAction` duy nhất coalesce shortfall. |
| Capacity source | Node allocatable, pod requests, system reserve và durable reservation là authoritative. Metrics API không phải điều kiện scale-out. |
| R1 provider | Production provider mặc định là typed-unavailable khi thiếu capacity. E2E override duy nhất external provider bằng standby-kind provider; K8s scheduler/probe/Helm/queue vẫn thật. |
| Tino | Loại khỏi r1 production mutation vì chưa có create-to-active correlation, cloud-init/join input và terminate contract được xác minh. Không tạo skeleton giả hoàn chỉnh. |
| Scale-in | Loại khỏi r1. Không cordon/drain/delete VPS cho tới khi production PVC dùng relocatable CSI và provider release contract được xác minh. |
| JS cleanup | Loại khỏi r1. `provision-expert.mjs` chỉ xóa trong linked cleanup sau Expert install/uninstall parity; AgentOS không được gọi nó. |
| Shell boundary | AgentOS Helm dùng `execa` với argv/stdin và `shell: false`, không ghép command string. K8s reads/waits dùng `@kubernetes/client-node`. |
| Database | Ba entity capacity mới dùng primary PostgreSQL; không repository injection, không datasource mặc định. |
| Resource envelope | Small reservation `1.5Gi`, limit `3Gi`; Large reservation `3Gi`, limit `6Gi`. Chart spec phải cộng toàn bộ steady containers và transient hook. |
| Storage proof | Production defaults vẫn giữ 38Gi PVC và Bitnami legacy pins. Local E2E được giảm PVC bằng explicit test overlay; không được dùng overlay làm bằng chứng production storage. |

### APPROVED R1 FLOW

1. `payInvoice` persist invoice paid và order `in_progress`; không ghi `activatedAt`.
2. `CatalogFulfillmentDispatcher` tạo `Instance(provisioning)`; real fulfillment driver tạo `AgentWorkspace(provisioning)` và dispatch durable job/reservation.
3. Worker phase `reserve-capacity` ghi `waiting_capacity`, serializes pool calculation và coalesces shortfall.
4. Nếu cluster hiện tại đủ capacity, phase tiếp tục mà không gọi provider. Nếu thiếu, capacity provider nhận một idempotency key; production default từ chối typed, local E2E provider uncordon số standby kind worker tối thiểu.
5. Worker đợi exact node Ready, chạy `helm upgrade --install` cho release/namespace `nivo-<workspaceId>`, rồi ghi `installing`/`starting`.
6. K8s watcher chỉ kết luận ready khi required Deployments/StatefulSets/Pods/Ingress đã settle.
7. Một transaction terminal ghi instance/workspace/order active và `activatedAt`; sau commit emit `workspace.status(active)`.
8. Failure ghi workspace/instance failed trước khi emit; reservation được release/terminal hóa nhưng không giả refund.

### PUBLIC STATUS CONTRACT

| Entity/event | Approved states in r1 | Rule |
|---|---|---|
| `AgentWorkspaceEntity.status` / `workspace.status` | `provisioning`, `waiting_capacity`, `installing`, `starting`, `active`, `failed`, existing `suspended` | Persist before emit; FE maps intermediate values to preparing. |
| `InstanceEntity.status` | existing states plus `failed` | `active` only after K8s terminal ready. |
| `CatalogOrderStatus` | `in_progress` during async work; `active` on terminal success | No new enum member/migration. Failure detail is workspace/job state. |
| Capacity action | `planned`, `applying`, `waiting_node`, `ready`, `failed` | Discriminated varchar union, provider idempotency key unique. |
| Reservation | `reserved`, `waiting_capacity`, `schedulable`, `released`, `failed` | Unique by instance; retries reuse the row. |

### EXACT R1 PRODUCTION TOUCHING BOUNDARY

No wildcard authorizes extra files. Any additional production owner returns to Review.

| Area | Exact files |
|---|---|
| Dependencies | `D:\Repositories\nivo-backend\package.json`; `D:\Repositories\nivo-backend\package-lock.json` |
| Capacity persistence | `src/modules/platform/databases/postgresql/primary/entities/cluster-node.entity.ts`; `cluster-capacity-action.entity.ts`; `instance-capacity-reservation.entity.ts`; `entities/index.ts`; `primary.module.ts`; `migrations/1787702400000-cluster-capacity.ts` |
| Existing lifecycle entities | `src/modules/platform/databases/postgresql/primary/entities/agent-workspace.entity.ts`; `instance.entity.ts` |
| Env | `src/modules/platform/env/config.ts` |
| Helm integration | `src/modules/integrations/helm/types/helm-release.ts`; `helm-release.service.ts`; `helm-release.service.spec.ts`; `helm.module.ts`; `helm.module-definition.ts` |
| Capacity types | `src/modules/bussiness/cluster-capacity/types/capacity.ts`; `capacity-provider.ts`; `capacity-reservation.ts`; `cluster-node.ts`; `index.ts` |
| Capacity calculation | `src/modules/bussiness/cluster-capacity/calculate-capacity-plan.ts`; `calculate-capacity-plan.spec.ts` |
| Capacity probe | `src/modules/bussiness/cluster-capacity/cluster-capacity-probe.service.ts`; `cluster-capacity-probe.service.spec.ts` |
| Capacity reservation | `src/modules/bussiness/cluster-capacity/cluster-capacity-reservation.service.ts`; `cluster-capacity-reservation.service.spec.ts` |
| Capacity scale-out | `src/modules/bussiness/cluster-capacity/cluster-scale-out.service.ts`; `cluster-scale-out.service.spec.ts`; `unavailable-capacity-provider.service.ts`; `unavailable-capacity-provider.service.spec.ts` |
| Capacity module | `src/modules/bussiness/cluster-capacity/cluster-capacity.module.ts`; `cluster-capacity.module-definition.ts` |
| AgentOS dispatch/worker | `src/modules/bussiness/agentos-provision/agentos-provision.dispatcher.ts`; `agentos-provision.dispatcher.spec.ts`; `provision-agentos.worker.ts`; `provision-agentos.worker.spec.ts`; `provision-step-map.service.ts`; `provision-step-map.service.spec.ts` |
| AgentOS chart builder/source | `src/modules/bussiness/agentos-provision/chart/build-agentos-chart-values.ts`; `build-agentos-chart-values.spec.ts`; `agentos-chart-source.service.ts`; `agentos-chart-source.service.spec.ts` |
| AgentOS steps | `src/modules/bussiness/agentos-provision/steps/reserve-capacity.step.ts`; `reserve-capacity.step.spec.ts`; `mint-bootstrap.step.ts`; `mint-bootstrap.step.spec.ts`; `install-chart.step.ts`; `install-chart.step.spec.ts`; `record-outcome.step.ts`; `record-outcome.step.spec.ts` |
| AgentOS types/module | `src/modules/bussiness/agentos-provision/types/dispatch.ts`; `payload.ts`; `chart.ts`; `profile.ts`; `index.ts`; `agentos-provision.module.ts`; `agentos-provision.module-definition.ts` |
| Fulfillment bridge | `src/modules/bussiness/catalog-fulfillment/real-agent-workspace-fulfillment.service.ts`; `real-agent-workspace-fulfillment.service.spec.ts`; `catalog-fulfillment.dispatcher.ts`; `catalog-fulfillment.dispatcher.spec.ts`; `catalog-fulfillment.module.ts` |
| Payment terminal timing | `src/features/core/api/core/graphql/mutations/invoices/pay-invoice/pay-invoice.service.ts`; `pay-invoice.service.spec.ts` |
| Registry | `src/modules/platform/databases/postgresql/primary/provisionable-app-seeder.service.ts`; `provisionable-app-seeder.service.spec.ts` |
| Composition | `apps/core/src/app.module.ts` |
| Exceptions | `src/modules/platform/exceptions/errors/cluster-capacity/capacity-unavailable.ts`; `capacity-reservation-conflict.ts`; `cluster-scale-failed.ts`; `provider-capability-unavailable.ts`; `src/modules/platform/exceptions/errors/agentos-provision/agentos-rollout-not-ready.ts`; `agentos-chart-source-unresolved.ts`; `agentos-provision-already-running.ts` |
| AgentOS chart values/templates | `D:\Repositories\nivo-charts\charts\agentos\values.yaml`; `templates/deployment.yaml`; `templates/job-provision.yaml`; `templates/cronjob-backup.yaml`; `templates/pvc.yaml`; `templates/resourcequota.yaml`; `templates/limitrange.yaml` |
| Backend chart probe | `src/tests/probe/agentos-chart.probe-spec.ts` |
| Flow E2E | `src/tests/e2e/nivo/three-agentos-capacity.e2e-spec.ts`; `src/tests/e2e/nivo/three-agentos-capacity.live-spec.ts` |
| E2E provider/helper | `src/tests/helpers/capacity/standby-kind-capacity-provider.ts`; `src/tests/helpers/capacity/three-agentos-world.ts`; `scripts/create-capacity-e2e-cluster.mjs` |

### REUSED WITHOUT EDIT IN R1

| Existing owner | Why no edit is predicted |
|---|---|
| `ProvisioningTransitionEmitter` | Already carries workspace status/reason/updatedAt after persistence. |
| `ProvisioningGateway` and message/enums | Already relays `AgentWorkspace` to exact owner room as `workspace.status`; intermediate status is a string. |
| `JobActionType.ProvisionAgentWorkspace` | Exact durable verb already exists. |
| `BullQueueName.ProvisionAgentWorkspace` | Exact isolated queue already exists. |
| `PodAccessTokenService` | Existing credential mint/delivery owner; new mint step calls it rather than duplicating credentials. |
| Expert provisioning/install/uninstall | Outside r1; no parity risk introduced by AgentOS Apply. |
| `D:\Repositories\nivo\tools\provision-expert.mjs` | Kept until a separate cleanup revision proves zero references. |

### ACCEPTANCE EVIDENCE

| Proof | Required result |
|---|---|
| Build/lint | Backend build and canonical BE lint pass on exact touched files; AgentOS chart lint/template pass. |
| Twin specs | Every new handler/service/step decision branch passes; no test consists only of call assertions. |
| Resource proof | Mechanical Helm render sum proves Small/Large steady requests and limits, plus transient hook surge, fit approved envelopes. |
| DB concurrency | Three parallel reservation transactions create three rows and exactly one capacity action when short. |
| Queue flow | E2E enters through authenticated GraphQL order/payment and lets the real BullMQ worker process; no direct dispatcher/worker/handler call. |
| Realtime | Real `/provisioning` Socket.IO receives matching status for each workspace; unrelated user and workspace ids receive nothing. |
| Local scale | Multi-node kind starts with standby workers cordoned; fake external provider activates only the minimum workers; K8s scheduling and all Helm releases are real. |
| Re-entry | Re-query during every intermediate/terminal status reconstructs the same state without requiring the prior socket event. |
| Failure | Image/rollout failure persists workspace+instance failed, emits public-safe reason, keeps invoice paid/order in progress and creates no duplicate release/action on retry. |
| Live Tino | Explicitly OWED in r1; no PASS claim permitted. |

Approved revision: `nivo-agentos-durable-capacity-local-scale-r1`

### OUTPUTS

| Concept | Result |
|---|---|
| Approved capability | Durable AgentOS provisioning with serialized capacity reservation and real Helm/K8s readiness ownership. |
| Approved architecture | Existing GraphQL payment -> real AgentOS BullMQ worker -> reservation/coalesced capacity -> Helm -> K8s watch -> persisted terminal state -> `workspace.status`. |
| Approved scaling proof | Three concurrent AgentOS jobs against real multi-node kind scheduling, overriding only the external provider with standby-node activation. |
| Approved revision | `nivo-agentos-durable-capacity-local-scale-r1`. |
| Deferred production scaling | Tino node mutation and automatic scale-in require their own verified follow-up revision. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-capacity-autoscaling.md` | `modified` — appended approved Review r1; no product source changed. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User explicitly approved the narrowed direction with “chốt”; r1 production boundary is frozen above. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend worktree contains extensive unrelated changes and prior partial Apply work. | Apply baseline/staging must isolate the approved files and must not absorb unrelated user work. |
| Migration name `1787702400000` is based on the current observed tail. | Apply must re-check the tail before writing; a collision returns to Review. |
| Local kind standby activation is not VPS creation or k3s join. | It proves Nivo concurrency/capacity policy and real scheduling only; Tino infrastructure remains OWED. |
| Production AgentOS defaults request 38Gi persistent storage. | Three-instance local E2E must use an explicit small-storage overlay and cannot be cited as production storage capacity evidence. |
| `ProvisioningGateway` currently contains an unrelated double cast in the partial instance-operation branch. | R1 does not touch or rely on that branch; canonical lint may still report pre-existing debt outside boundary. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Include Tino create/delete implementation in r1 | Typed unavailable provider in production + standby-kind external provider in E2E | Published contract lacks activation/bootstrap/terminate facts; implementation would invent destructive behavior. |
| Include automatic scale-in in r1 | Refuse scale-in; open linked revision after CSI and provider release proof | Current `local-path` PVCs make node deletion unsafe. |
| Migrate Expert Helm and delete `provision-expert.mjs` in r1 | Keep Expert untouched; linked cleanup after parity | Prevents AgentOS delivery from widening into a second product/runtime migration. |
| Add a `provisionAgentos` GraphQL mutation | Reuse paid catalog flow | Avoids two public owners and proves the real customer journey. |
| Mark order active when the job is merely queued | Keep order `in_progress`; terminal worker activates it | Queue acceptance and a ready tenant stack are different facts. |
| Auto-refund any asynchronous rollout failure | Persist failed state and preserve paid invoice for retry/recovery policy | External side effects may already exist; refund is a separate reconciliation decision. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply baseline and exact source implementation | Run `$starci-be-feature-apply` for approved revision `nivo-agentos-durable-capacity-local-scale-r1`. |
| Three-AgentOS local scale proof | Approved E2E/live specs on the generated multi-node kind fixture. |
| Tino create/join proof | Linked BE Feature Plan after verified product/config/activation contract and valid cluster identity. |
| Safe automatic scale-in | Linked BE Feature Plan after relocatable CSI proof and documented provider release endpoint. |
| Expert JS tool retirement | Linked cleanup/feature revision after direct Helm parity and zero production/test references. |

Invite: `$starci-be-feature-apply`

## apply

### CONTEXT

| Field | Value |
|---|---|
| Source / workflow | `D:\Repositories\starci-academy-backend` / `.workflows/feature/nivo/agentos-capacity-autoscaling.md` |
| Backend | `D:\Repositories\nivo-backend` @ `main` |
| Charts | `D:\Repositories\nivo-charts` @ `main` |
| Frontend proof surface | `D:\Repositories\nivo-fe`, `http://localhost:3066/en/agentos` |
| Approved revision | `nivo-agentos-durable-capacity-local-scale-r1` |
| Apply status | Implemented and unit/build/chart-proved; terminal Helm readiness, deterministic standby activation and Socket terminal event remain OWED. |

### BASELINE

| Tree | Clean baseline commit |
|---|---|
| Backend | `e58eb909a1cfe9b30c031d7e074704111edaf969` |
| Charts | `598d4b44aea19c4213c4682f876393398acf4ab0` |

Both commits are empty baselines because each repository had no staged files. The backend worktree already contained extensive unrelated tracked and untracked user work; Apply did not reset or overwrite it and has not staged a mixed implementation commit.

### IMPLEMENTED

| Boundary | Result |
|---|---|
| Durable dispatch | `ProvisionAgentWorkspace` ledger is committed before BullMQ enqueue; worker uses the existing fenced step runner. |
| Capacity | Primary-Postgres reservation/action/node entities, advisory-lock reservation, K8s allocatable/request probe, coalesced scale action and typed unavailable production provider. |
| K8s correctness | Probe now excludes cordoned, NotReady and `NoSchedule`/`NoExecute` nodes, including the Kind control-plane. |
| Helm | `execa` argv/stdin with `shell:false`; per-workspace release/namespace; `--wait --wait-for-jobs --atomic`; real chart source and encrypted bootstrap value handoff. |
| Terminal ownership | Worker alone activates instance/workspace/order after terminal success; failure persists instance/workspace failed, releases reservation and emits a public-safe reason. |
| Composition | `JobsModule`, `BullMqModule`, `HelmModule`, `ClusterCapacityModule` and `AgentosProvisionModule` are all pulled through explicit `.register({ isGlobal: true })` at `AppModule`. |
| Retry identity | Instance creation reuses the deterministic full-order-id hostname row left by a compensated retry, avoiding `uq_instances_hostname` collisions. |
| Chart envelope | Small steady request/limit `1.5Gi/3Gi`; Large `3Gi/6Gi`; ResourceQuota/LimitRange rendered; production PVC defaults remain 38Gi with Bitnami legacy pins. |

### PROOF

| Proof | Result |
|---|---|
| Backend build | PASS — `npm run build`. |
| Focused unit | PASS — capacity probe + catalog fulfillment: 2 suites, 28 tests. Earlier full R1 focused run: 16 suites, 23 tests; payment/catalog regression: 2 suites, 35 tests; chart probe: 1 test. |
| Canonical lint on latest critical files | 0 errors; warnings remain, including formatting/JSDoc. This is not claimed as strict-clean. Current lint has no rule rejecting a bare import of a configurable module; explicit `.register(...)` was corrected manually. |
| Helm chart | PASS — dependency build, lint and template. One upstream MinIO merge warning remains. |
| Multi-node fixture | PASS — Kind `nivo-capacity-e2e`: one active worker and two Ready cordoned standby workers; control-plane taint excluded from allocatable pool. |
| Three concurrent payments | PASS — three newest real AgentOS invoices for the signed-in local test account settled concurrently through `PayInvoiceService`; three distinct BullMQ jobs were enqueued. |
| Concurrency defect found | First run exposed duplicate `uq_instances_hostname` on compensated retries; deterministic instance reuse fixed it. A non-HTTP Nest context also exposed uninitialized Socket namespace, so live proof now boots a real Nest HTTP/WebSocket app before payment. |
| Real Helm/K8s | PARTIAL — real namespaces, PostgreSQL, MinIO and Qdrant pods reached Running; AgentOS main pod first failed image pull because local images were absent from Kind. Images were loaded on the active worker and replacement pods reached `ContainerCreating`; terminal Ready is not yet proved. |

### LIVE FLOW PROOF

| Field | Evidence |
|---|---|
| Persona | Existing signed-in local Nivo test account; no password, token, cookie or secret recorded. |
| Steps | Browser request -> real invoice -> three concurrent payments through the production payment service -> real BullMQ -> worker -> capacity reservation -> Helm -> Kind. |
| UI | PASS through intermediate state: all three paid workspaces render `Building`; selected order renders Request/Payment/Create workspace Done, Build infrastructure Current, heading `Kubernetes is building`. |
| Network / realtime | Existing `/provisioning` Socket.IO gateway booted and the page subscribed to the exact workspace. Terminal `workspace.status(active|failed)` reception is still OWED because rollout has not reached a terminal state. |
| Terminal | Backend 3067 booted the new binary, registered GraphQL and `ProvisioningGateway`, enqueued three job IDs, and invoked Helm against real workspace namespaces. |
| Kubernetes | Four-node Kind fixture Ready; two standby workers remain cordoned. Real chart dependencies run. Main four-container AgentOS pod is currently blocked in image/container startup rather than capacity scheduling. |
| Verdict | PARTIAL, not final PASS. Payment/queue/intermediate UI are proved; terminal rollout, minimum standby activation and cross-user Socket isolation remain OWED. |

### OWED

| Owed | Exact clearing proof |
|---|---|
| Terminal AgentOS readiness | All required Deployment/StatefulSet/Pods settle for three fresh orders; worker writes all three entities/order active and UI reaches Manage. |
| Deterministic scale-out | Run the approved standby-kind provider override with an induced shortfall; prove three reservations, exactly one coalesced capacity action and only the minimum standby nodes uncordoned. The current active worker has about 32Gi allocatable, so three Small requests legitimately do not trigger scale. |
| Socket terminal/isolation | Capture matching terminal event for all three workspaces and prove unrelated owner/workspace receives none. |
| Strict lint | Repair exact touched-file warnings or route a canonical lint-rule change through FE/BE trust-tree workflow; do not call the present 0-error/104-warning focused run clean. |
| Authenticated public E2E | Current concurrent settlement uses the production service in a real HTTP/WebSocket Nest app because Wallet has no payment action. Add the Wallet payment CTA/client mutation, then rerun browser/GraphQL public-boundary proof. |
| Tino / scale-in | Still excluded by approved r1: no verified create/join/terminate contract and no relocatable CSI proof. |

## apply

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | D:\Repositories\nivo-backend @ main |
| Purpose | Kiểm tra trực tiếp hạ tầng Tino hiện có và dọn container test local không còn sử dụng mà không ảnh hưởng workload thuộc project. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-capacity-autoscaling.md |
| Language | vi |
| Phase | apply |
| Touching | Chỉ workflow này; không sửa source backend/chart và không cài runtime lên VPS đang có workload. |

Applied revision: `nivo-agentos-durable-capacity-local-scale-r1`

Baseline commit: `e58eb909a1cfe9b30c031d7e074704111edaf969`

Tracked diff: `e58eb909a1cfe9b30c031d7e074704111edaf969..worktree`

### TINO LIVE PROOF

| Probe | Result |
|---|---|
| SSH identity | PASS — kết nối `root` tới host đã duyệt bằng exact ED25519 fingerprint; không ghi password vào workflow. |
| Host shape | AlmaLinux 9.7, khoảng `3.6Gi` RAM, không swap, khoảng `49Gi` root disk. |
| Existing workload | `nginx`, `php-fpm`, `mariadb`, `memcached`, `openvpn`, `domain-whois-agent` và các dịch vụ hệ thống đang chạy. Ports `80`, `443`, `3306`, `1194`, `22` đang listen. |
| Kubernetes runtime | Không có `k3s`, `kubectl`, `/etc/rancher`, `/var/lib/rancher`, `/etc/kubernetes` hoặc `/var/lib/kubelet`. |
| Container runtime | Không có Docker trên VPS. |
| Capacity verdict | Host không phải node trống và chỉ còn khoảng `1.8Gi` available RAM tại thời điểm probe; không đủ để chứng minh ba AgentOS Small và không an toàn để cài k3s cạnh workload hiện hữu. |
| Provider API credential | Workspace chỉ có SSH host/user/password; không có Tino JWT/Basic API credential hoặc kubeconfig cluster hợp lệ để tạo/join node mới. |
| Mutation verdict | Không cài k3s, không dừng dịch vụ, không đổi firewall và không gọi paid VPS API. Tino scale-out vẫn OWED. |

### LOCAL CONTAINER CLEANUP

| Scope | Result |
|---|---|
| Removed earlier | Kind clusters `nivo-capacity-e2e`, `nivo-e2e` và Swarm stack `nivo-local`; canonical Nivo Compose, StarCi, Miamia và Agency containers được giữ. |
| Removed now | 12 exited containers có label `org.testcontainers=true`, không thuộc Compose project nào. |
| Preserved | Các init container thuộc Compose, `tedo-postgres`, mọi container đang chạy, volumes và project-owned data. |
| Verification | `docker ps -aq --filter label=org.testcontainers=true` trả về `0`. |
| Recovery | 12 container test đã xoá không được giữ lại; chúng là runtime tạm và có thể được test suite tạo lại. Không volume nào bị xoá. |

### OUTPUTS

| Concept | Result |
|---|---|
| Tino live eligibility | VPS SSH hiện tại được xác nhận là máy đang chạy workload truyền thống, không phải worker Kubernetes trống. |
| Three-AgentOS production scale proof | Chưa thể chạy an toàn bằng credential hiện có; không báo PASS giả. |
| Local runtime cleanup | Đã loại bỏ toàn bộ container Testcontainers đã thoát và các Kind/Swarm fixture của Nivo, giữ data/project runtime. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-capacity-autoscaling.md` | `modified` — appended Tino live probe and local cleanup evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Cấp production-scale target | Mặc định: cấp Tino API credential có quyền create/read/delete VPS và một node/control-plane target riêng; hoặc cấp SSH tới ba VPS trống đã mua sẵn. Không dùng host `ote.tino.page` hiện tại. |

### WARNINGS

| Warning | Impact |
|---|---|
| Host Tino hiện tại đang chạy web/database/VPN và MariaDB mở cổng `3306`. | Cài k3s hoặc ép ba AgentOS lên máy này có thể gây tranh tài nguyên và gián đoạn dịch vụ hiện hữu. |
| Chưa có Tino API credential hoặc exact product/price. | Không thể chứng minh create/join/coalesced scale-out hay cleanup VPS thật; mọi paid mutation bị từ chối an toàn. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Cài k3s trực tiếp lên `ote.tino.page` | Giữ nguyên host và yêu cầu node Tino riêng | Probe chứng minh host đang phục vụ workload thật và không đủ RAM cho ba AgentOS Small. |
| Xoá mọi exited container không phân biệt owner | Chỉ xoá 12 Testcontainers không thuộc Compose | Giữ init container và database thuộc project để không phá runtime/data của người dùng. |

### OWED

| Owed | Cleared by |
|---|---|
| Ba AgentOS scale-out thật trên Tino | Tino API credential + exact VPS product/price + cluster target riêng, hoặc ba VPS trống có SSH; sau đó chạy production payment/BullMQ/capacity/Helm/K8s/Socket flow và teardown có kiểm soát. |
| Provider create/join/delete implementation | Linked BE Feature Plan/Review vì approved r1 chỉ cho typed unavailable production provider. |
| Safe automatic scale-in | Relocatable CSI proof, node/PVC evacuation proof và verified provider delete contract. |

## apply continuation 2026-08-15

### LIVE FLOW PROOF

| Field | Evidence |
|---|---|
| Persona | Dedicated local Nivo live-test account created from the already-approved encrypted credential. No email, password, token or cookie is recorded here. |
| Keycloak runtime | PASS - local `nivo-keycloak` on `localhost:8147`, realm `nivo`, client `nivo-web`. |
| Account bootstrap | PASS - account created, enabled and email marked verified; password set as non-temporary through the Keycloak Admin API. |
| Authentication | PASS - OAuth direct password grant returned an access token and `/userinfo` returned a subject. Token was not printed or persisted. |
| Browser / UI | OWED for this continuation - account is ready, but a complete signed-in Nivo product journey has not yet been rerun with this account. |
| Network | PASS for Keycloak token and userinfo endpoints; backend product mutations were not invoked in this account-bootstrap step. |
| Console / terminal | Keycloak account mutation completed without browser-console evidence. Local terminal reported only sanitized status fields. |
| Verdict | Account bootstrap PASS; full authenticated AgentOS UI flow remains OWED. |

### TINO CLUSTER PROOF

| Probe | Result |
|---|---|
| Portal authentication | PASS - two-factor login completed by the user; service inventory is visible in the authenticated ClientArea. |
| Service inventory | PASS - active services `357471`, `357218`, `356716`, and `356715` are present. |
| New control plane | PASS from the earlier continuation - k3s `v1.36.3+k3s1` is Ready on `357471`; encrypted kubeconfig round-trip and live Kubernetes reads passed. |
| Old control-plane candidate | `356716` is running Ubuntu 26.04 with 4 vCPU, 4096 MB RAM and 50 GB disk. Portal exposes VNC, SSH keys, backups, reboot and rebuild controls. |
| SSH identity | User approved the rotated ED25519 fingerprint observed after provider reset/reboot. |
| SSH authentication | BLOCKED - host identity matches the newly approved fingerprint, but the encrypted root password currently stored for `356716` is rejected. No host-key bypass or password guessing was attempted. |
| Destructive actions | None in this continuation: no rebuild, shutdown, Kubernetes mutation or data deletion was performed on `356716`. |

### OWED

| Owed | Cleared by |
|---|---|
| Synchronize `356716` root credential | Store the current provider-issued root credential directly into the encrypted node secret without printing plaintext, then prove SSH with the approved fingerprint. |
| Inspect old cluster | After SSH succeeds, collect read-only node, pod, namespace, storage and ingress evidence before deciding whether any old dev node is rebuilt or joined to the new cluster. |
| Authenticated Nivo journey | Sign into FE with the new live-test account and capture UI, Network, Console, backend terminal and Socket.IO terminal-state evidence. |

## apply live rebuild and UI/UX proof 2026-08-15

### CONTEXT

| Field | Resolution |
|---|---|
| Source | `D:\Repositories\starci-academy-backend` |
| Project | `nivo` |
| Frontend | `D:\Repositories\nivo-fe` |
| Backend | `D:\Repositories\nivo-backend` |
| Cluster | Tino dev k3s: control-plane `357471`, worker `356716` |
| Production boundary | Live local FE/BE/Keycloak/Postgres/Redis plus the real Tino dev Kubernetes cluster. No production customer environment. |

### LIVE FLOW PROOF

| Field | Evidence |
|---|---|
| VPS rebuild | PASS - exact Tino service `356716` / VM `40025` rebuilt with its existing Ubuntu 26.04 template. Provider returned `running`, `built=true`, `power=true`. |
| SSH and secret handling | PASS - the provider-issued root credential was piped directly into the encrypted `.stacks` secret. SSH succeeded against the exact post-rebuild ED25519 fingerprint; no password/token/cookie is recorded here. |
| Cluster join | PASS - `nivo-worker-356716` joined `nivo-cp-357471`; both nodes report `Ready` on k3s `v1.36.3+k3s1`. |
| Browser persona | PASS - Google login redirected through Keycloak and returned to `/en/overview`; authenticated wallet and product data loaded. |
| AgentOS request | PASS - order `ac89e470-6677-4313-aff5-dea8dc714024` and invoice `cc402fd6-3542-41ee-91f8-9ffafb2efc54` were created. The public `payInvoice` GraphQL mutation returned `paid`. |
| AgentOS scheduling | PASS - workspace `347eded6-2bbd-4d4e-a4d2-8995b50337c5` created a namespace, PVCs and workloads. PostgreSQL/MinIO used `bitnamilegacy` images successfully; pods scheduled across both Tino nodes. |
| AgentOS terminal | FAIL as expected from runtime - Docker Hub refused `nivo/agentos-controlplane:0.1.0` and `nivo/openclaw:latest` with `ErrImagePull` / insufficient scope. The database workspace status became `failed`. |
| AgentOS Socket.IO | FAIL - the already-open provisioning tab stayed on `Kubernetes is building` after the database reached `failed`. Only a reload exposed the failed state. |
| AgentOS journey state | FAIL - after reload the card and panel said failed, but the journey incorrectly rendered `Build infrastructure: Done` and `Manage: Current`. Before reload, the list said `Not provisioned` while the detail said build was current. |
| Wallet UX | FAIL - the unpaid invoice was visible but there was no Pay/Settle CTA, so a user cannot continue the provision journey from Wallet without an out-of-band API call. |
| Template App request | PASS - `Học viện AI` created site `adfa55c1-14d5-40c4-9a20-4e292d6b25ea` and deployment `aad6d5b6-8471-498d-ae7e-07bf4663b25e`, then dispatched durable job `7850e1a8-89dc-431d-8d7e-8e6e2c5c7b32`. |
| Template App scheduling | PASS - the chart created DB, Redis, MinIO, Qdrant, Keycloak, FE and BE resources and distributed them across both Tino nodes. |
| Template App terminal | FAIL as expected from runtime - `nivo/nivo-expert-web:latest` and `nivo/nivo-expert-api:latest` hit `ImagePullBackOff`; the job/deployment became `failed` after Keycloak readiness timed out. |
| Template App Socket.IO | FAIL - the open tab remained `Kubernetes is building` after the durable job and deployment were `failed`; reload was required to show `Provisioning needs attention`. |
| Template App failure UX | FAIL - after reload the journey stayed at build/current and showed no backend failure detail and no retry CTA, only `Back to Apps`. |
| Apps information architecture | FAIL - `/en/apps` rendered paid AgentOS catalog orders as Template Apps named `Cơ bản` / `nivo AI Agent` with `Building`, mixing the standalone AgentOS product into the TemplateApp list. |
| Browser console | PASS for observed pages - no browser warning/error entries were captured during the two live journeys. |
| Backend terminal | MIXED - Nest booted with both workers and Socket.IO gateway. Runtime warnings remain for missing SePay credentials, Qdrant client/server version drift, and unavailable knowledge seed/embedding endpoint. |

### BUILD AND STATIC GATES

| Gate | Result |
|---|---|
| FE typecheck | PASS - 4/4 packages. |
| FE production build | PASS - app, expert and landing builds; all new AgentOS and Template App routes emitted. |
| FE canonical lint | PASS after the canonical `plugins/eslint-canon` mirror was synced with `--write`; no rule was suppressed or weakened. |

### ROOT CAUSES / OWED

| Priority | Root cause | Required follow-up |
|---|---|---|
| P0 | Required Nivo workload images are absent/private and no registry pull secret is present in `.stacks`. | Publish versioned AgentOS/Expert images, store the registry credential encrypted, render `imagePullSecrets`, and prove pulls from both nodes. |
| P0 | Provisioning terminal transitions are persisted but not reaching the subscribed browser. | Trace `ProvisioningTransitionEmitter -> ProvisioningGateway -> provisioning.status/workspace.status -> FE reducer` for both resource kinds with a real socket integration test. |
| P0 | Remote pods receive backend URL `http://host.docker.internal:3067`, which is not reachable from the Tino cluster. | Configure a cluster-reachable TLS backend URL before a ready-state proof. |
| P1 | AgentOS failure is mapped to a completed build/manage-current journey. | Derive journey steps from terminal resource status; failed must never advance Manage. |
| P1 | Wallet displays unpaid invoices without a payment action. | Add Pay/checkout CTA and return-to-provisioning behavior. |
| P1 | Apps page includes AgentOS orders. | Filter TemplateAppEntity-backed products from standalone AgentOS orders at the query/view-model boundary. |
| P1 | Expert pipeline waits for Keycloak before it runs the K8s phase mapper, delaying an already-known `ImagePullBackOff` by up to five minutes. | Detect terminal K8s pod failures concurrently or before Keycloak bootstrap. |
| P1 | Expert failure UI hides `last_error` and offers no retry. | Render a safe failure reason and a guarded retry action. |
| P2 | Helm reports `--atomic` deprecated. | Migrate to `--rollback-on-failure` after verifying Helm-version compatibility. |
| P2 | Chart ingress assumptions need alignment with the k3s Traefik ingress controller. | Render/verify the selected ingress class and live routes after images are available. |

### VERDICT

The infrastructure rebuild and two-node scheduling proof PASS. Both product journeys can request, create and reach real Kubernetes, but full provisioning is NOT approved: private images are unavailable and both live Socket.IO terminal updates fail. The visible UI also has blocking product-boundary, payment and failure-state defects listed above.

### TEST CLEANUP

| Scope | Result |
|---|---|
| Kubernetes | Removed only the two namespaces created by this live run: AgentOS `nivo-347eded6-2bbd-4d4e-a4d2-8995b50337c5` and Template App `nivo-adfa55c1-14d5-40c4-9a20-4e292d6b25ea`. Namespace deletion completed and neither remains. |
| Preserved | The earlier `nivo-fc913bd6-1851-496f-bdeb-e719cb8debf6` test namespace and all non-test/system namespaces were not touched. Both Tino nodes remain joined and Ready. |
| Plaintext credential cleanup | Removed the temporary decrypted Tino kubeconfig after cluster proof. Its encrypted `.enc` source remains. `scripts/secrets-guard.mjs --all` passed. |
| Recovery | Deleted namespaces contained only workloads/PVCs created by these two failed live-test provisions; their persisted Nivo job/order/site/deployment rows remain as failure evidence. |

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Infrastructure / charts | D:\Repositories\nivo-charts |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | Nivo Nest app core |
| Database | Primary PostgreSQL through `InjectPrimaryEntityManager` |
| Repo / branch | D:\Repositories\nivo-backend @ main (`6d4e68322bab900cfef17029dcc3a9fabd40a420`); preserve the existing dirty worktree |
| Purpose | Complete real Tino scale-out for five concurrent paid AgentOS requests: durable provider order, activation, secure k3s join, exact Node Ready wait, Saga resume, and race/idempotency repair. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-capacity-autoscaling.md |
| Language | vi |
| Phase | plan |
| Touching | This workflow only. No backend, frontend, chart, cluster, or paid-provider mutation is allowed in Plan. |

### CAPABILITY BRIEF

The public door remains the existing paid flow: `orderCatalogItem -> payInvoice`. Five rapid payments create five independent AgentOS instances, jobs, Sagas, and capacity reservations. They do **not** directly call Tino and do not imply five VPS orders.

The capacity controller serializes admission under the existing PostgreSQL advisory lock, calculates CPU/RAM/storage shortfall against one consistent snapshot, and coalesces the five reservations into the minimum durable scale action. A separate BullMQ capacity worker owns Tino quote/order/poll/bootstrap. AgentOS jobs that lack capacity stay durably queued as `waiting_capacity`; they are enqueued only after the exact new Kubernetes nodes are Ready, so waiting for Tino consumes neither the AgentOS retry budget nor its compensation budget.

### LIVE SCHEMA AND FAMILY EVIDENCE

| Evidence | Finding |
|---|---|
| Unfiltered live GraphQL mutation dump | Existing customer operations include `orderCatalogItem`, `payInvoice`, `retryProvisioningSaga`, and `cancelProvisioningSaga`; no new public autoscale mutation is needed. |
| Unfiltered live GraphQL query dump | Existing reads include `myCatalogOrders`, `myAgentWorkspace`, and `myProvisioningSaga`; capacity remains an internal fulfillment concern. |
| Sibling queue family | `expert-provision.dispatcher.ts` and its worker establish transaction -> durable `jobs` row -> enqueue-after-commit -> fenced worker. The capacity worker mirrors this family. |
| Saga family | `provisioning-saga-runner.service.ts` currently turns retryable step failures into BullMQ retries and eventually compensation. External capacity wait must happen before AgentOS enqueue, not as a thrown retryable Saga failure. |
| Capacity family | `cluster-capacity-reservation.service.ts` already owns the advisory lock and coalesced action, but invokes the provider synchronously and marks reservations schedulable immediately after `activate`. |
| Composition | `apps/core/src/app.module.ts` already calls `JobsModule.register`, `BullMqModule.register`, `KafkaModule.register`, `ProvisioningSagaModule.register`, `ClusterCapacityModule.register`, and `AgentosProvisionModule.register`. Tino must also be registered at this root; no bare configurable-module import is accepted. |

### VERIFIED TINO CONTRACT

| Contract | Evidence / decision |
|---|---|
| API | Official base is `https://api.tino.vn`; auth supports JWT/Basic. Credentials remain encrypted and are loaded only through `_FILE` pointers. |
| Tenant host | Published examples name `my.tino.vn`, but the current account exposes product `1319` only with `X-Forwarded-Host: tino.vn`. The host is mandatory configuration, not a hidden constant. |
| Quote/order | `GET /order/1319` exposes configurable CPU/RAM/disk/OS/SSH-key choices; `POST /order/1319` creates an order and returns order/invoice identifiers. |
| Activation | `GET /services/active`, `GET /service/:id`, and `GET /service/:id/vms` expose Active state and VM identity. The worker polls these endpoints with bounded backoff. |
| Cancellation | The live service-method contract exposes `POST /service/:id/cancel`; automatic use is excluded until storage evacuation and a controlled cancel proof pass. |
| Existing cluster | Tino dev k3s currently has control plane service `357471` and worker service `356716`, both Ready. Services `357218` and `356715` are not auto-adopted without an ownership/emptiness proof. |
| Upstream idempotency | The published order contract documents no idempotency key. Nivo must never blindly repeat an order after an unknown response. |

### ROOT CAUSES TO REPAIR BEFORE A PAID TEST

| Root cause | Required correction |
|---|---|
| Current reservation is included in `snapshot()` and then added again by the calculator. | Snapshot/accounting receives the candidate reservation identity and excludes it before adding the requested envelope. |
| Active reservation envelopes and their live pod requests are both counted. | Persist each reservation namespace and replace that namespace's observed requests with `max(reserved envelope, observed pod requests)` per resource. |
| Node shape equals the requesting tenant shape. | Capacity policy uses the quoted/configured Tino node's allocatable CPU/RAM/storage, after system reserve and headroom. |
| Storage is absent from `CapacityAmount`. | Add `storageMi` to node, reservation, shortfall, and calculator contracts. Current AgentOS PVC envelope is `38Gi` (`8 + 20 + 8 + 2Gi`). |
| Provider is constructed with `new configured.provider()`. | Bind an exported provider token with Nest `useExisting`, so Tino HTTP/config/secret dependencies are injected. |
| Scale action can be saved twice around provider failure, causing the observed unique idempotency-key violation. | Lock/load the existing action and transition it by conditional update; never insert an action during resume/error handling. |
| `activate()` means both provider order and Node Ready. | Split durable child phases: quote, order, payment/activation wait, VM discovery, bootstrap, Node Ready. Parent becomes Ready only when every child is Ready. |
| Saga retries while infrastructure is merely pending. | Create Saga/job/reservation transactionally, emit `waiting_capacity`, and delay AgentOS enqueue until capacity action completion. |

### DURABLE FLOW AND IDEMPOTENCY

1. Paid fulfillment transaction creates/reuses the instance, AgentOS job, Saga journals, and unique namespace-backed reservation.
2. Under `pg_advisory_xact_lock`, admission recomputes the effective pool and either returns `schedulable` or attaches the reservation to one active capacity action.
3. A new capacity job is inserted once and enqueued after commit. Five concurrent callers may attach to one action; the unique active-action/idempotency constraints settle the second writer.
4. Each required provider node gets one `cluster_capacity_action_items` row and deterministic correlation key before any HTTP mutation.
5. The worker fetches a current quote, checks product availability, node shape, monthly total, and approved cap. It then attempts `POST /order/:productId` at most once per item.
6. If the HTTP result is unknown (timeout/reset after dispatch), the item becomes `reconciliation_required`; automatic retry is forbidden until Tino reads prove the same correlation. If a response is received, order/invoice IDs are persisted before polling.
7. The worker waits for payment/activation. It never guesses a payment method or silently pays outside the approved contract.
8. Once Active, it discovers the VM/IP, connects with the dedicated SSH key, runs the reviewed k3s-agent bootstrap without `shell: true`, labels the node with Nivo/provider/action/service identity, and watches the exact Kubernetes Node until Ready and expected allocatable resources are observed.
9. After all child items are Ready, the controller marks attached reservations schedulable and enqueues each still-queued AgentOS job exactly once. Existing Kafka/outbox/Socket.IO then renders capacity/build transitions.
10. Restart/retry always resumes from persisted child phase. An already Active service or Ready node is reconciled, never re-ordered or re-joined.

### STORAGE AND NODE-COUNT RULE

Five Small AgentOS reservations represent up to `15Gi` memory envelope but also `190Gi` persistent storage. Product `1319` defaults to 4 vCPU, 4Gi RAM, and 50Gi disk. With a 20% disk reserve, one default node has about 40Gi usable—barely one 38Gi AgentOS envelope. Therefore the minimum may be five workers under current `local-path`, even when RAM arithmetic suggests fewer.

The calculator returns `max(cpuNodes, memoryNodes, storageNodes)`. It must not promise consolidation that Kubernetes/local-path cannot safely provide. Scale-out can proceed; automatic scale-in remains disabled while tenant PVCs are local and non-relocatable. Longhorn or another relocatable CSI is a separate prerequisite for safe drain/delete, not an implicit side effect of this feature.

### EXACT PRODUCTION FILE TREE

| Exact path | Action | Responsibility / shape evidence |
|---|---|---|
| `src/modules/platform/databases/postgresql/primary/entities/cluster-capacity-action.entity.ts` | MODIFY | Parent action phases, quote/cost/cap fields, conditional version, and no duplicate insert on resume. |
| `src/modules/platform/databases/postgresql/primary/entities/cluster-capacity-action-item.entity.ts` | ADD | One durable Tino node order per required node: correlation, order, invoice, service, VM, IP, phase, attempt/outcome. |
| `src/modules/platform/databases/postgresql/primary/entities/instance-capacity-reservation.entity.ts` | MODIFY | Add namespace, storage envelope, attached action, and waiting/schedulable lifecycle. |
| `src/modules/platform/databases/postgresql/primary/entities/cluster-node.entity.ts` | MODIFY | Persist provider service/VM IDs, node name, storage, lifecycle, and managed ownership. |
| `src/modules/platform/databases/postgresql/primary/entities/index.ts`; `primary.module.ts` | MODIFY | Register the child entity on primary PostgreSQL. |
| `src/modules/platform/databases/postgresql/primary/migrations/1787875200000-tino-capacity-actions.ts` | ADD | Add columns/table/FKs/indexes and partial uniqueness for one active action/correlation. |
| `src/modules/platform/databases/postgresql/primary/enums/job-action-type.ts` | MODIFY | Add `ScaleClusterCapacity`; enumerate in tests and GraphQL description. |
| `src/modules/integrations/bullmq/enums/queue-name.ts` | MODIFY | Add isolated `scale-cluster-capacity` queue. |
| `src/modules/platform/env/config.ts`; `.env.example` | MODIFY | Typed Tino host/product/config/cost cap/polling, dedicated SSH key and k3s join `_FILE` settings; no literals. |
| `src/modules/integrations/tino/tino.module-definition.ts`; `tino.module.ts` | ADD | Configurable integration registration/export, mirroring existing integration modules. |
| `src/modules/integrations/tino/tino-client.service.ts`; `tino-client.service.spec.ts` | ADD | Typed authenticated HTTP, host header, timeout, redaction, quote/order/service/VM reads and cancel refusal by default. |
| `src/modules/integrations/tino/tino-capacity-provider.service.ts`; `tino-capacity-provider.service.spec.ts` | ADD | Implement the provider port from durable child state; classify definite rejection versus unknown mutation outcome. |
| `src/modules/integrations/tino/types/auth.ts`; `order.ts`; `product.ts`; `service.ts`; `vm.ts`; `index.ts` | ADD | Named external DTOs and guards; no `any` or inferred response contract. |
| `src/modules/bussiness/cluster-capacity/types/capacity-provider.ts`; `capacity.ts`; `capacity-reservation.ts`; `cluster-node.ts`; `index.ts` | MODIFY | Quote/activate/reconcile contracts and CPU/RAM/storage discriminated phases. |
| `src/modules/bussiness/cluster-capacity/calculate-capacity-plan.ts`; `calculate-capacity-plan.spec.ts` | MODIFY | Pure max-of-resource node arithmetic, headroom, boundary tests, and no double count. |
| `src/modules/bussiness/cluster-capacity/cluster-capacity-probe.service.ts`; `cluster-capacity-probe.service.spec.ts` | MODIFY | Namespace-aware pod accounting and persisted provider storage ledger. Metrics remain advisory. |
| `src/modules/bussiness/cluster-capacity/cluster-capacity-reservation.service.ts`; `cluster-capacity-reservation.service.spec.ts` | MODIFY | Transactional reservation/action coalescing only; no synchronous provider call; safe second writer. |
| `src/modules/bussiness/cluster-capacity/cluster-capacity-action.dispatcher.ts`; `cluster-capacity-action.dispatcher.spec.ts` | ADD | Create capacity job and enqueue after commit, mirroring Expert/AgentOS dispatcher. |
| `src/modules/bussiness/cluster-capacity/provision-cluster-capacity.worker.ts`; `provision-cluster-capacity.worker.spec.ts` | ADD | Dedicated BullMQ consumer, concurrency/fencing, durable phase resume and bounded polling. |
| `src/modules/bussiness/cluster-capacity/cluster-scale-out.service.ts`; `cluster-scale-out.service.spec.ts` | MODIFY | Orchestrate child items and conditional action transitions; never mark Ready at order response. |
| `src/modules/bussiness/cluster-capacity/cluster-node-bootstrap.service.ts`; `cluster-node-bootstrap.service.spec.ts` | ADD | Dedicated-key SSH/k3s join, safe argument construction, labels/taints, secret scrubbing. |
| `src/modules/bussiness/cluster-capacity/cluster-node-ready-watcher.service.ts`; `cluster-node-ready-watcher.service.spec.ts` | ADD | Watch exact Node UID/name to Ready with expected allocatable shape and timeout. |
| `src/modules/bussiness/cluster-capacity/cluster-capacity-resume.service.ts`; `cluster-capacity-resume.service.spec.ts` | ADD | Mark attached reservations schedulable and enqueue still-queued AgentOS jobs once. |
| `src/modules/bussiness/cluster-capacity/cluster-capacity.module-definition.ts`; `cluster-capacity.module.ts` | MODIFY | Replace constructor `new` with injectable `useExisting`; register/export dispatcher, worker, bootstrap, watcher, resume. |
| `src/modules/bussiness/agentos-provision/agentos-provision.dispatcher.ts`; `agentos-provision.dispatcher.spec.ts` | MODIFY | Persist namespace/reservation and enqueue AgentOS only when admission says schedulable. |
| `src/modules/bussiness/agentos-provision/steps/reserve-capacity.step.ts`; `reserve-capacity.step.spec.ts` | MODIFY | Be a resume assertion/idempotent guard; never invoke provider or consume retries while waiting. |
| `src/modules/platform/databases/postgresql/primary/enums/provisioning-saga-status.ts` | MODIFY | Add public `waiting_capacity` status used by persisted transitions/queries. |
| `src/modules/bussiness/provisioning-events/types.ts`; `src/modules/platform/socketio/gateways/provisioning/types/message.ts` | MODIFY | Carry safe capacity phases through existing Kafka/outbox/Socket pipeline without provider secrets/cost internals. |
| `apps/core/src/app.module.ts` | MODIFY | Register `TinoModule.register(...)`, then bind its exported provider token into `ClusterCapacityModule.register(...)`. |
| `src/modules/platform/exceptions/errors/cluster-capacity/tino-order-reconciliation-required.ts`; `tino-cost-cap-exceeded.ts`; `tino-product-unavailable.ts`; `tino-activation-timeout.ts`; `cluster-node-join-timeout.ts` | ADD | Named metadata-bearing domain exceptions. |
| `src/tests/probe/tino-capacity-contract.probe-spec.ts` | ADD | Read-only live quote/config/service contract; mutations require explicit opt-in and approved cap. |
| `src/tests/e2e/nivo/five-agentos-capacity.e2e-spec.ts` | ADD | Public GraphQL x5, real Postgres/Redis/BullMQ/Kafka/Socket/K8s, deterministic fake Tino only. |
| `src/tests/e2e/nivo/five-agentos-capacity.live-spec.ts` | ADD | Opt-in real Tino mutation and cluster proof; refuses to start without cap, key, host trust, product and cleanup policy. |
| `D:/Repositories/nivo-charts/charts/agentos/values.yaml`; `templates/resourcequota.yaml`; `templates/limitrange.yaml` | VERIFY / MODIFY only if measured render differs | Preserve 3Gi/6Gi namespace envelopes, 38Gi PVC total and Bitnami legacy images; no storage-class migration in this revision. |

`execa` and `ssh2` are already dependencies; Apply must not edit `package.json` for them. `ssh2` owns credential-safe remote execution. Any local executable call uses argument arrays and `shell: false`.

### TEST MATRIX

| Case | Required proof |
|---|---|
| Empty pool / one request | Correct CPU, RAM, and storage shortfall; exact minimum child count. |
| Exact boundary / one unit below / one unit above | 0 / 1 / 1 additional node respectively for each resource dimension. |
| Five concurrent writers | Five unique reservations, one active parent action, exact child count, one capacity job. |
| Same instance/request repeated | Reuses reservation/job/Saga; no second Tino item or AgentOS enqueue. |
| Existing active action | New reservation attaches and action desired count grows safely or a follow-up action is created after the locked recalculation; no lost shortfall. |
| Provider definite rejection | Child/action fail with named reason; no blind retry and no AgentOS compensation. |
| Provider timeout after POST | `reconciliation_required`; zero automatic second POST. |
| Crash after persisted order ID | Restart polls the same invoice/service and never creates another order. |
| Already Active service | Skips order/activation and proceeds to VM/bootstrap reconciliation. |
| Already joined Ready node | Verifies labels/shape and completes without rerunning join. |
| SSH host mismatch / auth failure | Refuses bootstrap, scrubs secrets, leaves service running for recovery. |
| Node NotReady / wrong allocatable / timeout | Action remains non-ready; AgentOS jobs remain waiting and retry budget stays unchanged. |
| Capacity Ready | Attached queued jobs enqueue exactly once; duplicate ready event is a no-op. |
| Namespace accounting | Active tenant pods and reservation envelope are not added twice; candidate reservation is not counted twice. |
| Storage pressure | Five 38Gi envelopes on 50Gi nodes produce storage-driven count with configured reserve. |
| Every new enum member | Action/item/job/Saga status switches and serializers cover all values. |
| Unauthorized customer | Public order/payment ownership rules remain unchanged; no capacity/provider transport is exposed. |
| Socket isolation | Five owners/resources receive only their own persisted capacity/build transitions. |
| Full deterministic flow | Authenticated GraphQL order/pay x5 -> five durable Sagas -> one coalesced capacity action -> fake Tino nodes -> real K8s Node Ready -> five AgentOS jobs -> terminal Socket/UI evidence. |
| Live opt-in flow | Same production transport with real Tino; assert billed quote/cap, provider IDs, exact Ready nodes, workload scheduling, terminal events, and approved cleanup. |

### ASSUMPTIONS AND EXCLUSIONS

| Item | Boundary |
|---|---|
| AgentOS count | Five API requests are five tenant provisions. VPS count is calculated from shortfall; it is not hardcoded to five. |
| Template apps | Expert/MMO remain `TemplateAppEntity` products and do not enter this AgentOS-specific admission flow in r2. The shared controller may support them in a later reviewed revision. |
| Tino payment | No undocumented automatic payment or guessed `pay_method`. |
| Scale-in | Excluded while `local-path` PVCs exist. No Tino cancel/delete is called in Apply r2. |
| Existing services | `357218` and `356715` are excluded from the managed pool until ownership and empty-host proofs are approved. |
| Longhorn | Recommended follow-up for HA/relocatable storage; not silently installed by this feature. |
| FE | Existing provisioning UI consumes new safe status values. Any visual redesign or payment CTA follows FE Plan/Review/Apply separately. |

### OUTPUTS

| Concept | Result |
|---|---|
| Capability | Durable Tino scale-out controller for five concurrent paid AgentOS admissions, with secure k3s join and exact Node Ready gating. |
| Architecture | Paid GraphQL flow -> transactional reservations -> one capacity BullMQ worker -> Tino provider -> SSH/k3s -> K8s watch -> enqueue waiting AgentOS Sagas -> Kafka/Socket UI. |
| Correctness | Namespace-aware CPU/RAM/storage accounting, injectable provider registration, conditional action transitions, no blind mutation retry, and no Saga retry-budget consumption while waiting. |
| Safety | Cost cap, dedicated SSH identity, encrypted `_FILE` secrets, scale-out only under local-path, and explicit reconciliation for unknown Tino outcomes. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-capacity-autoscaling.md` | Appended Tino autoscale r2 evidence, exact production boundary, tests, decisions, and approval gates. No product source changed. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Paid live-test cap | Approve at most **one** real new Tino service initially and **1,100,000 VND/month** maximum after runtime quote. After one-node create/join/idempotency proof passes, approve the calculated remainder for the five-request run. Do not authorize five recurring VPS implicitly. |
| Payment contract | Provider creates the order and waits for invoice/service activation. If account credit does not settle it automatically, stop at `awaiting_payment`; thầy supplies the exact documented `pay_method`/payment action rather than code guessing. |
| SSH bootstrap identity | Add/select a dedicated Nivo SSH public key in Tino and approve its key ID plus a provider-backed host trust mechanism. Dev-only TOFU (`accept-new`) is an alternative requiring separate explicit approval and is never the production default. |
| Storage strategy | Recommended r2: scale-out-only using current local-path and storage-driven admission; no delete. Alternative: run a separate Longhorn/CSI feature before approving automatic scale-in. |
| Existing Tino services | Recommended: do not adopt `357218`/`356715`. Alternative: approve them only after read-only SSH/K8s ownership and emptiness proof. |
| Revision | Approve `nivo-tino-capacity-scale-out-r2` and the exact file tree above for `$starci-be-feature-review`; Apply cannot begin before Review approval. |

### WARNINGS

| Warning | Impact |
|---|---|
| Five AgentOS instances reserve `190Gi` PVC capacity. | Default 50Gi VPS disk can make storage—not RAM—the dominant scale factor and recurring cost. |
| Tino documents no idempotency key for order creation. | Network-unknown mutations must pause for reconciliation; pretending exactly-once would risk duplicate paid services. |
| Tino documentation host differs from the live account host. | `X-Forwarded-Host` must be explicit and contract-probed before mutation. |
| Current local-path storage is node-local. | Draining/deleting a worker can strand tenant data; automatic scale-in is unsafe. |
| Current live AgentOS images previously failed pull. | Node autoscale can pass while full product readiness still fails unless registry/imagePullSecrets are fixed under their owning workflow. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| One Tino order per incoming customer request | Coalesced minimum-node calculation | Prevents race-driven overbuying and respects shared capacity. |
| Synchronous Tino call inside `reserve()` | Dedicated durable capacity queue/worker | Provider activation and k3s join outlive an HTTP/Saga attempt. |
| Throw retryable Saga errors while waiting | Hold AgentOS job before enqueue and resume on Ready | Waiting is state, not failure, and must not consume retries or compensate. |
| Blindly retry `POST /order` | Persist attempt, then reconcile unknown outcomes | Tino has no documented upstream idempotency key. |
| Mark capacity Ready on order response | Exact Kubernetes Node Ready + allocatable proof | A paid VPS is not schedulable cluster capacity yet. |
| Automatic cancel/delete after load falls | Scale-out only until relocatable CSI/drain proof | Protects local PVC data. |
| Hardcode exactly five VPS | Compute CPU/RAM/storage shortfall | Five customers do not always equal five nodes, though current disk profile may make it so. |

### OWED

| Owed | Cleared by |
|---|---|
| Review approval | `$starci-be-feature-review` approves one exact r2 revision and file boundary. |
| Paid mutation authority | Explicit monthly cap/count, payment behavior, and cleanup decision. |
| Dedicated SSH bootstrap | Tino SSH key ID plus approved host verification and encrypted private-key pointer. |
| Unknown-order reconciliation contract | Read-only or one controlled order proves how order/invoice/service can be correlated after a crash. Until then uncertain calls stop for operator reconciliation. |
| Registry readiness | Versioned AgentOS images and pull secret pass on both existing Tino nodes before full five-workspace terminal PASS can be claimed. |
| Safe scale-in | Relocatable CSI, cordon/drain/no-local-PVC proof, and controlled Tino cancel proof in a separate reviewed capability. |

## review

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | Nivo Nest app core |
| Database | Primary PostgreSQL through `InjectPrimaryEntityManager` |
| Repo / branch | D:\Repositories\nivo-backend @ main (`6d4e68322bab900cfef17029dcc3a9fabd40a420`); preserve unrelated dirty worktree changes |
| Purpose | Challenge and freeze Tino autoscale r2 before implementation or paid provider mutation. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-capacity-autoscaling.md |
| Language | vi |
| Phase | review |
| Touching | This workflow only. No production source, cluster, or Tino mutation in Review. |

Approved revision: `nivo-tino-capacity-scale-out-r2.1`.

Owner approval recorded 2026-08-15: stage 1 may create at most one Tino VPS, the accepted recurring-price ceiling is 1,100,000 VND/month, and the successfully joined VPS is retained as a dev worker after proof. No second VPS is authorized.

### REVIEW VERDICT

The Plan's durable separation is approved in principle: customer/Saga code reserves capacity; a dedicated fenced capacity worker owns Tino and k3s; AgentOS is enqueued only after exact Node Ready. Review rejects three unnecessary or unsafe expansions and narrows the implementation boundary:

1. Do not add `waiting_capacity` to `ProvisioningSagaStatus`. The Saga has not started; it remains `queued`. `AgentWorkspaceEntity.status` already supports `waiting_capacity` and is the customer-visible state.
2. Do not modify generic provisioning-event or Socket message shapes. Their `status: string` contract already carries the persisted workspace status. The dispatcher/resume service must emit through the existing outbox/Kafka/gateway path.
3. Do not edit the AgentOS chart or install Longhorn in this revision. The chart's 38Gi storage envelope is measured by the existing probe; r2 changes admission/provider orchestration only. Scale-in remains disabled.

### FROZEN ARCHITECTURE

`payInvoice -> AgentosProvisionDispatcher transaction(job + Saga + reservation) -> advisory-locked admission -> [schedulable: enqueue AgentOS] OR [waiting_capacity: capacity job] -> Tino child ledger -> quote/cap -> one-shot order -> activation poll -> SSH k3s join -> exact Node Ready -> resume attached jobs exactly once -> existing Saga/Kafka/Socket flow`.

The capacity action is not a Saga step and cannot compensate an AgentOS merely because infrastructure is slow. Provider uncertainty is a durable `reconciliation_required` state. Scale action retry resumes a persisted phase; it cannot insert a new parent action or blindly repeat an order.

### FROZEN PRODUCTION TOUCHING BOUNDARY

| Tree | Details |
|---|---|
| `src/modules/platform/databases/postgresql/primary/entities/cluster-capacity-action.entity.ts` | Modify parent phase/cost/version state. |
| `src/modules/platform/databases/postgresql/primary/entities/cluster-capacity-action-item.entity.ts` | Add per-node Tino mutation/reconciliation ledger. |
| `src/modules/platform/databases/postgresql/primary/entities/instance-capacity-reservation.entity.ts` | Add namespace, storage and action relation. |
| `src/modules/platform/databases/postgresql/primary/entities/cluster-node.entity.ts` | Add provider service/VM/node/storage/ownership state. |
| `src/modules/platform/databases/postgresql/primary/entities/index.ts`; `primary.module.ts` | Register exact new entity. |
| `src/modules/platform/databases/postgresql/primary/migrations/1787875200000-tino-capacity-actions.ts` | Add exact schema/index/FK changes; never edit the already-applied migration. |
| `src/modules/platform/databases/postgresql/primary/enums/job-action-type.ts` | Add `ScaleClusterCapacity`. |
| `src/modules/integrations/bullmq/enums/queue-name.ts` | Add `ScaleClusterCapacity`. |
| `src/modules/platform/env/config.ts`; `.env.example` | Add typed provider/cap/poll/SSH/k3s `_FILE` configuration. |
| `src/modules/integrations/tino/tino.module-definition.ts`; `tino.module.ts` | Add configurable integration module/export. |
| `src/modules/integrations/tino/tino-client.service.ts`; `tino-client.service.spec.ts` | Add typed HTTP and redacted contract boundary. |
| `src/modules/integrations/tino/tino-capacity-provider.service.ts`; `tino-capacity-provider.service.spec.ts` | Add quote/order/reconcile/activation adapter. |
| `src/modules/integrations/tino/types/auth.ts`; `order.ts`; `product.ts`; `service.ts`; `vm.ts`; `index.ts` | Add named guarded DTOs. |
| `src/modules/bussiness/cluster-capacity/types/capacity-provider.ts`; `capacity.ts`; `capacity-reservation.ts`; `cluster-node.ts`; `index.ts` | Extend typed CPU/RAM/storage and provider phases. |
| `src/modules/bussiness/cluster-capacity/calculate-capacity-plan.ts`; `calculate-capacity-plan.spec.ts` | Repair arithmetic and add storage/headroom boundaries. |
| `src/modules/bussiness/cluster-capacity/cluster-capacity-probe.service.ts`; `cluster-capacity-probe.service.spec.ts` | Repair namespace/candidate double counting and storage ledger reads. |
| `src/modules/bussiness/cluster-capacity/cluster-capacity-reservation.service.ts`; `cluster-capacity-reservation.service.spec.ts` | Coalesce only; remove synchronous provider call and duplicate-action save path. |
| `src/modules/bussiness/cluster-capacity/cluster-capacity-action.dispatcher.ts`; `cluster-capacity-action.dispatcher.spec.ts` | Add transactional capacity job + post-commit enqueue. |
| `src/modules/bussiness/cluster-capacity/provision-cluster-capacity.worker.ts`; `provision-cluster-capacity.worker.spec.ts` | Add isolated fenced capacity consumer. |
| `src/modules/bussiness/cluster-capacity/cluster-scale-out.service.ts`; `cluster-scale-out.service.spec.ts` | Resume child phases and conditionally transition one parent. |
| `src/modules/bussiness/cluster-capacity/cluster-node-bootstrap.service.ts`; `cluster-node-bootstrap.service.spec.ts` | Add dedicated-key SSH/k3s join without shell interpolation. |
| `src/modules/bussiness/cluster-capacity/cluster-node-ready-watcher.service.ts`; `cluster-node-ready-watcher.service.spec.ts` | Add exact Node Ready/shape watch. |
| `src/modules/bussiness/cluster-capacity/cluster-capacity-resume.service.ts`; `cluster-capacity-resume.service.spec.ts` | Mark reservations and enqueue attached AgentOS jobs once. |
| `src/modules/bussiness/cluster-capacity/cluster-capacity.module-definition.ts`; `cluster-capacity.module.ts` | Register all services and bind provider by injectable `useExisting`. |
| `src/modules/bussiness/agentos-provision/agentos-provision.dispatcher.ts`; `agentos-provision.dispatcher.spec.ts` | Create admission state transactionally and branch immediate versus delayed enqueue. |
| `src/modules/bussiness/agentos-provision/steps/reserve-capacity.step.ts`; `reserve-capacity.step.spec.ts` | Reduce to idempotent schedulable assertion; provider wait never runs inside Saga. |
| `apps/core/src/app.module.ts` | Register Tino and all configurable modules with explicit `.register(...)`. |
| `src/modules/platform/exceptions/errors/cluster-capacity/tino-order-reconciliation-required.ts`; `tino-cost-cap-exceeded.ts`; `tino-product-unavailable.ts`; `tino-activation-timeout.ts`; `cluster-node-join-timeout.ts` | Add named failures. |
| `src/tests/probe/tino-capacity-contract.probe-spec.ts` | Add read-only default and explicitly gated mutation contract probe. |
| `src/tests/e2e/nivo/five-agentos-capacity.e2e-spec.ts` | Add production-door deterministic five-request flow with fake Tino only. |
| `src/tests/e2e/nivo/five-agentos-capacity.live-spec.ts` | Add opt-in one-node-first real Tino flow and evidence/cleanup gates. |

Explicitly outside Touching: `package.json`, `package-lock.json`, `ProvisioningSagaStatus`, generic Socket/event DTOs, `D:\Repositories\nivo-fe`, and `D:\Repositories\nivo-charts`.

### FROZEN PROOF GATES

| Gate | Required result |
|---|---|
| Twin specs | Every changed service/entity contract has both-path, boundary, duplicate, concurrent-writer, restart and unknown-provider-outcome coverage from the Plan matrix. |
| Focused lint/typecheck/build | Zero errors for frozen files; no suppressions, weakened rules, or unexplained warnings. |
| Deterministic E2E | Five authenticated public GraphQL payments, real Postgres/Redis/BullMQ/Kafka/Socket/K8s, fake external Tino only; one coalesced action and calculated child count. |
| Read-only live probe | Current product/shape/price/host/service methods match before any mutation. |
| Paid live stage 1 | At most one newly billed service under the approved cap; prove order correlation, activation, secure SSH, k3s join, exact Node Ready, and restart idempotency. |
| Paid live stage 2 | Only after stage 1 PASS and separate count/cost approval, run five concurrent customer requests and buy only the calculated shortfall. |
| UI/runtime evidence | Signed-in persona; UI, Network, Console, backend terminal, Kafka/Socket and Kubernetes evidence recorded under `LIVE FLOW PROOF`. Missing runtime/account remains OWED, never PASS. |
| Cleanup | Test workloads are removed only by explicit IDs. A newly billed VPS is not cancelled under local-path; retention/cancellation is an owner decision. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `nivo-tino-capacity-scale-out-r2.1`. |
| Capability | Real Tino scale-out with durable child ledger, secure k3s join, exact Node Ready, and five-request race proof. |
| Narrowing | No Saga enum, generic Socket DTO, frontend, chart, dependency, Longhorn, or scale-in changes. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-capacity-autoscaling.md` | Appended review r2.1, frozen production tree and proof gates only. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve revision and production boundary? | APPROVED — exact `nivo-tino-capacity-scale-out-r2.1`. |
| Approve paid stage-1 limit? | APPROVED — maximum one new Tino service and 1,100,000 VND/month after live quote; no second VPS. |
| Approve bootstrap identity? | Recommended: dedicated Nivo SSH key selected in Tino plus verified host identity. Dev-only TOFU remains unapproved. |
| Decide service retention after proof | Recommended: keep the new Ready worker in the dev cluster; do not cancel while it can hold local-path PVCs. Alternative cancellation requires proving it holds no tenant PV first. |

### WARNINGS

| Warning | Impact |
|---|---|
| Current image-pull defect is outside r2.1. | Autoscale/Node Ready can PASS while five AgentOS workloads cannot reach product Ready. Full product PASS remains blocked by registry work. |
| Five default 50Gi VPS may be required by storage admission. | Stage-2 recurring cost can exceed 3.195m VND/month; it is not authorized by stage-1 approval. |
| Unknown Tino POST outcomes cannot be made exactly-once locally. | They stop in `reconciliation_required`; availability is traded for protection against duplicate billing. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Add `ProvisioningSagaStatus.WaitingCapacity` | Keep Saga queued; use existing workspace `waiting_capacity` | No Saga execution has started. |
| Modify generic Socket/event DTOs | Emit existing workspace status through current transport | DTO already accepts status strings; widening adds no capability. |
| Edit chart/install Longhorn in r2.1 | Verify current 38Gi contract; route CSI separately | Keeps provider/admission change reviewable and avoids hidden infrastructure migration. |
| Buy the entire five-node estimate in one first run | One-node stage-1 proof, then separately approved stage 2 | Limits recurring-cost and idempotency blast radius. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit r2.1 approval | CLEARED — owner approved the exact revision and frozen Touching boundary. |
| Paid stage-1 authority | CLEARED — one VPS maximum and 1,100,000 VND/month ceiling. |
| SSH identity input | Dedicated key ID/private-key file and trusted fingerprint/CA are present without secrets in workflow. |
| Apply | After approval, `$starci-be-feature-apply` implements only the frozen tree and runs all proof gates. |

## apply r2.1 stage-1 live proof 2026-08-15

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Database | Primary PostgreSQL through `InjectPrimaryEntityManager` |
| Repo / branch | D:\Repositories\nivo-backend @ `main` (`6d4e68322bab900cfef17029dcc3a9fabd40a420`) |
| Purpose | Hoàn tất implementation và live proof stage 1 cho một Tino worker được tạo tự động, join k3s và tiếp tục AgentOS Saga. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-capacity-autoscaling.md |
| Language | vi |
| Phase | apply |
| Touching | Frozen production boundary của `nivo-tino-capacity-scale-out-r2.1`; giữ nguyên mọi thay đổi ngoài boundary trong dirty worktree. |

Applied revision: `nivo-tino-capacity-scale-out-r2.1`

Baseline commit: `6d4e68322bab900cfef17029dcc3a9fabd40a420`

Tracked diff: `6d4e68322bab900cfef17029dcc3a9fabd40a420..worktree`

### PROOF COMMANDS

| Gate | Command | Result |
|---|---|---|
| Build | `npm run build` | PASS — `nest build core`, exit 0. |
| Full unit | `npm test -- --runInBand` | PASS — 377 suites, 1,847 tests, 0 failures. |
| Focused lint | `npx eslint` trên Tino client/provider, bootstrap, watcher, scale-out và dispatcher | PASS — exit 0, không warning/error trên file chạm. |
| Focused twin specs | `npx jest --selectProjects unit --runInBand --runTestsByPath ...` | PASS — 5 suites, 17 tests. |
| Backend live | `POST http://localhost:3067/graphql` với `{ __typename }` | PASS — HTTP 200, `Query`. |
| Frontend live | `GET http://localhost:3066/en/agentos` | PASS — HTTP 200; Next terminal ghi render 200. |
| Kubernetes | `kubectl --kubeconfig .stacks/k8s/infra/kubeconfig/tino.kubeconfig get nodes -o wide` | PASS — `nivo-worker-357725` Ready, 4 vCPU, 3910Mi recorded allocatable memory. |
| AgentOS runtime | `kubectl ... get pods -n nivo-72f1e31f-c04d-4ab5-bdeb-0d9a160ad0c2 -o wide` | PASS — AgentOS 4/4, MinIO 1/1, PostgreSQL 1/1, Qdrant 1/1 Running trên worker mới. |
| Durable state | Read-only PostgreSQL queries for action/item/node/job/Saga/instance/reservation | PASS — action/item/node ready; canonical job completed 4/4; Saga completed/ever-ready; instance active. |

### LIVE FLOW PROOF

| Field | Evidence |
|---|---|
| Persona | Nivo test owner đã đăng nhập; credential không được ghi vào workflow. |
| Trigger | Một invoice AgentOS được thanh toán qua production service và tạo admission thiếu capacity. |
| Tino mutation | Đúng một order `99639633`, invoice `1203205`, service `357725`, VM `1453656`; 639.000 VND/tháng, dưới trần 1.100.000 VND/tháng. Không gửi POST tạo VPS thứ hai. |
| Bootstrap | Backend lấy bootstrap credential tạm thời từ VM detail, cài dedicated ED25519 public key, xác minh key login và lưu fingerprint; không persist/log password. |
| Kubernetes | VPS `180.93.136.60` join thành `nivo-worker-357725`; Node Ready và schedulable. |
| Resume | Capacity action `49adfaca-2a05-49c1-8c23-a68313c99bb4` ready; reservation được resume; job `e33a769e-41a3-40dc-b054-770414f432f0` completed 4/4. |
| Saga/Kafka/Socket | Saga `0852052e-6b01-4018-9526-f9a6fb4a89ae` completed với `ever_ready=true`; backend mới đăng ký Kafka consumer `nivo-provisioning-realtime-v1` và Socket gateway `provisioning.subscribe`. |
| Product runtime | Instance `9596c8a4-ce35-42ad-b8a7-92cc2c3a2c14` active; toàn bộ pod product Running trên worker mới. |
| Restart | Build mới restart thành công với Tino kubeconfig; GraphQL, Kafka consumer và Socket gateway lên lại. |
| UI | FE `/en/agentos` trả HTTP 200. Browser automation bị URL policy chặn trước khi có thể đọc DOM/Network/Console, vì vậy interaction proof không được báo PASS. |
| Verdict | PASS cho paid stage 1 và backend/K8s/product runtime; stage 2 năm request và browser interaction vẫn OWED. |

### OUTPUTS

| Concept | Result |
|---|---|
| Tino capacity scale-out stage 1 | Một request AgentOS tự tạo đúng một VPS Tino dưới trần chi phí, bootstrap SSH, join k3s và đợi exact Node Ready. |
| Durable continuation | Capacity ledger/reservation sống qua retry; AgentOS chỉ tiếp tục khi node Ready và canonical Saga hoàn tất. |
| Race protection | Dispatcher dùng transaction advisory lock và tìm job theo workspace ref để không tạo hai canonical jobs cho cùng workspace. |
| Secret handling | Tino root password chỉ tồn tại trong memory của backend để cài key; không gửi FE/Socket, không persist và không ghi workflow. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\nivo-backend\.env.example` | modified — thêm cấu hình provider/cap/poll/SSH/k3s `_FILE`. |
| `D:\Repositories\nivo-backend\apps\core\src\app.module.ts` | modified — register Tino và capacity modules. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\agentos-provision\agentos-provision.dispatcher.ts` | modified — transactional admission, advisory lock và immediate/delayed enqueue. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\agentos-provision\agentos-provision.dispatcher.spec.ts` | modified — duplicate/concurrent dispatch proof. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\agentos-provision\steps\reserve-capacity.step.ts` | modified — idempotent schedulable assertion. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\agentos-provision\steps\reserve-capacity.step.spec.ts` | modified — reservation branch proof. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\agentos-provision\types\profile.ts` | modified — storage-aware capacity profile. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\calculate-capacity-plan.ts` | modified — CPU/RAM/storage headroom arithmetic. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\calculate-capacity-plan.spec.ts` | modified — arithmetic boundaries. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-capacity-probe.service.ts` | modified — storage ledger and no namespace double count. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-capacity-probe.service.spec.ts` | modified — probe boundaries. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-capacity-reservation.service.ts` | modified — coalesced durable reservation only. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-capacity-reservation.service.spec.ts` | modified — coalescing/idempotency proof. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-capacity-action.dispatcher.ts` | added — capacity action/job transaction and enqueue. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-capacity-action.dispatcher.spec.ts` | added — dispatch proof. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\provision-cluster-capacity.worker.ts` | added — fenced capacity consumer. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\provision-cluster-capacity.worker.spec.ts` | added — worker retry/fence proof. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-scale-out.service.ts` | modified — persisted Tino phases, ephemeral credential fallback and resume. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-scale-out.service.spec.ts` | modified — phase/idempotency/bootstrap fallback proof. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-node-bootstrap.service.ts` | added — fingerprint-pinned SSH, key installation and k3s join. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-node-bootstrap.service.spec.ts` | added — transient SSH, fingerprint and credential refusal proof. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-node-ready-watcher.service.ts` | added — exact Ready/node-shape observation and Ki/Mi/Gi conversion. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-node-ready-watcher.service.spec.ts` | added — watcher and memory conversion proof. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-capacity-resume.service.ts` | added — resume attached jobs exactly once. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-capacity-resume.service.spec.ts` | added — resume idempotency proof. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-capacity.module-definition.ts` | modified — module options. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-capacity.module.ts` | modified — register capacity services/provider. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\types\capacity-provider.ts` | modified — provider quote/order/reconcile/bootstrap credential contract. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\types\capacity.ts` | modified — storage-aware capacity. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\types\capacity-reservation.ts` | modified — action/namespace/storage state. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\types\cluster-node.ts` | modified — provider/node lifecycle state. |
| `D:\Repositories\nivo-backend\src\modules\integrations\bullmq\enums\queue-name.ts` | modified — scale-capacity queue. |
| `D:\Repositories\nivo-backend\src\modules\integrations\cluster\load-kube-config.ts` | added — shared explicit kubeconfig loader. |
| `D:\Repositories\nivo-backend\src\modules\integrations\tino\` | added — configurable Tino client/provider, guarded DTOs and twin specs. |
| `D:\Repositories\nivo-backend\src\modules\platform\databases\postgresql\primary\entities\cluster-capacity-action.entity.ts` | modified — durable parent action. |
| `D:\Repositories\nivo-backend\src\modules\platform\databases\postgresql\primary\entities\cluster-capacity-action-item.entity.ts` | added — per-node provider ledger. |
| `D:\Repositories\nivo-backend\src\modules\platform\databases\postgresql\primary\entities\cluster-node.entity.ts` | modified — provider VM/node ownership fields. |
| `D:\Repositories\nivo-backend\src\modules\platform\databases\postgresql\primary\entities\instance-capacity-reservation.entity.ts` | modified — namespace/storage/action relation. |
| `D:\Repositories\nivo-backend\src\modules\platform\databases\postgresql\primary\entities\index.ts` | modified — register entity export. |
| `D:\Repositories\nivo-backend\src\modules\platform\databases\postgresql\primary\primary.module.ts` | modified — register entities. |
| `D:\Repositories\nivo-backend\src\modules\platform\databases\postgresql\primary\migrations\1787875200000-tino-capacity-actions.ts` | added — capacity action/item/node/reservation schema. |
| `D:\Repositories\nivo-backend\src\modules\platform\databases\postgresql\primary\enums\job-action-type.ts` | modified — `ScaleClusterCapacity`. |
| `D:\Repositories\nivo-backend\src\modules\platform\env\config.ts` | modified — typed Tino/SSH/k3s settings. |
| `D:\Repositories\nivo-backend\src\modules\platform\exceptions\errors\cluster-capacity\tino-order-reconciliation-required.ts` | added — uncertain provider mutation exception. |
| `D:\Repositories\nivo-backend\src\modules\platform\exceptions\errors\cluster-capacity\tino-cost-cap-exceeded.ts` | added — cost cap exception. |
| `D:\Repositories\nivo-backend\src\modules\platform\exceptions\errors\cluster-capacity\tino-product-unavailable.ts` | added — unavailable product exception. |
| `D:\Repositories\nivo-backend\src\modules\platform\exceptions\errors\cluster-capacity\tino-activation-timeout.ts` | added — activation timeout exception. |
| `D:\Repositories\nivo-backend\src\modules\platform\exceptions\errors\cluster-capacity\cluster-node-join-timeout.ts` | added — node join timeout exception. |
| `D:\Repositories\nivo-backend\src\tests\probe\tino-capacity-contract.probe-spec.ts` | added — read-only/default and opt-in mutation contract probe. |
| `D:\Repositories\nivo-backend\.stacks\k8s\infra\tino\k3s-agent-token.key.enc` | added — encrypted k3s bootstrap secret. |
| `D:\Repositories\nivo-backend\.stacks\k8s\infra\tino\nivo-capacity-ed25519.key.enc` | added — encrypted dedicated private key. |
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-capacity-autoscaling.md` | modified — appended Apply/live evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| SSH hardening capability | Recommended: mở feature Plan riêng để sau khi key login thành công thì tắt `PasswordAuthentication`/root password SSH; không mở rộng r2.1 trong Apply. |
| Paid stage 2 | Chưa được duyệt; giữ nguyên tối đa một VPS. Chỉ chạy năm request thật sau một phê duyệt count/cost mới. |

### WARNINGS

| Warning | Impact |
|---|---|
| Tino VM detail/API và portal vẫn giữ root password ban đầu. | Password không đi qua Nivo nhưng vẫn có thể dùng SSH cho đến khi capability hardening tắt password auth. |
| Image dev chỉ tồn tại local, đã được import thủ công vào worker mới. | Worker autoscale tiếp theo cần private registry/pull secret; nếu không pod có thể `ImagePullBackOff`. |
| Một dispatch cũ `e47d750c-1460-4e1d-90fa-8c5fb94ae403` đã fail do Helm concurrent operation trước bản advisory-lock mới. | Historical row được giữ nguyên làm evidence; canonical job mới completed. |
| Backend startup báo Milvus client/server version mismatch, negative timeout và knowledge seed thiếu embedding endpoint. | Không làm hỏng API/provisioning nhưng là runtime debt ngoài r2.1. |
| Full repository lint có 0 error nhưng còn 2.043 warning baseline. | Touched-file lint sạch; repo-wide warning debt không được nhận là đã xử lý bởi feature này. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Chạy năm Tino VPS/request trong stage 1 | Chỉ một VPS thật | Owner nói “5 cái khoan đã” và duyệt tối đa một VPS. |
| Lách browser URL policy bằng browser/driver khác | Giữ HTTP/terminal proof và ghi UI interaction OWED | Không được circumvention policy. |

### OWED

| Owed | Cleared by |
|---|---|
| Deterministic five-request E2E files trong frozen boundary chưa được tạo/chạy. | Tiếp tục Apply với `src/tests/e2e/nivo/five-agentos-capacity.e2e-spec.ts`, fake Tino và đúng production door; không tạo thêm paid VPS. |
| Paid stage-2 five-request proof | Phê duyệt mới về số VPS và tổng recurring cost, sau đó chạy opt-in live spec. |
| Signed-in browser UI/Network/Console proof | Browser localhost policy cho phép claim/inspect tab hoặc owner cung cấp một browser surface hợp lệ; sau đó chạy AgentOS management/realtime flow. |
| Automatic image distribution | Feature Plan riêng cho private registry, pull secret và image availability trên node mới. |
| Disable root password SSH after key bootstrap | Feature Plan/Review riêng cho create operator user, validate key, disable password auth và rollback/recovery. |

## apply continuation r2.1 deterministic five-request proof 2026-08-15

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Database | Primary PostgreSQL for live state; isolated throwaway PostgreSQL and Redis Testcontainer for deterministic E2E. |
| Repo / branch | D:\Repositories\nivo-backend @ `main` (`6d4e68322bab900cfef17029dcc3a9fabd40a420`) |
| Purpose | Prove five concurrent AgentOS payments coalesce capacity demand without any paid Tino mutation, and repair the arithmetic/race defects exposed by that proof. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-capacity-autoscaling.md |
| Language | vi |
| Phase | apply |
| Touching | Frozen `nivo-tino-capacity-scale-out-r2.1` boundary only; unrelated dirty-worktree changes remain untouched. |

Applied revision: `nivo-tino-capacity-scale-out-r2.1`

Baseline commit: `6d4e68322bab900cfef17029dcc3a9fabd40a420`

Tracked diff: `6d4e68322bab900cfef17029dcc3a9fabd40a420..worktree`

### PROOF COMMANDS

| Gate | Result |
|---|---|
| Focused lint | PASS — six continuation files, exit 0, zero warning/error. |
| Focused unit | PASS — 3 suites, 12 tests. |
| Deterministic flow E2E | PASS — 1 suite, 2 tests: anonymous refusal plus five concurrent authenticated GraphQL payments. |
| Build | PASS — `npm run build`, exit 0. |
| Full unit | PASS — 377 suites, 1,849 tests, 0 failures. |
| Backend restart | PASS — latest build started; BullMQ modules, Kafka consumer `nivo-provisioning-realtime-v1` and Socket gateway `provisioning.subscribe` registered. |
| Backend live | PASS — `POST http://localhost:3067/graphql` returned HTTP 200 and `Query`. |
| Frontend live | PASS — `GET http://localhost:3066/en/agentos` returned HTTP 200. |
| Kubernetes | PASS — control plane and both workers Ready; AgentOS 4/4, MinIO 1/1, PostgreSQL 1/1 and Qdrant 1/1 Running. |
| Paid-mutation guard | PASS — live DB has one capacity action item and one distinct Tino service, `357725`; deterministic E2E fake provider recorded zero `activate` calls. |

### LIVE FLOW PROOF

| Field | Evidence |
|---|---|
| Entry door | Real Nivo GraphQL order/payment mutations through the booted application. |
| Persona | One authenticated throwaway buyer; anonymous request is rejected before capacity mutation. |
| Concurrency | Five invoices paid concurrently, producing five workspaces and five waiting reservations. |
| Coalescing | Exactly one capacity action/job; demand grows monotonically while required node count remains four. |
| Capacity result | Final storage shortfall is `5 * 38Gi`; calculation includes existing overcommit instead of clamping it away. |
| Provider safety | External `CapacityProvider` alone is replaced by a deterministic fake; `TINO_CAPACITY_WORKER_ENABLED=false`; provider activation count is zero. |
| Isolation | E2E uses throwaway PostgreSQL and a dedicated Redis Testcontainer, so dev queue/database state is not reused. |
| Runtime after test | FE/BE remain live; Tino k3s nodes and product pods remain Ready/Running. |
| Verdict | PASS for deterministic five-request concurrency/coalescing and zero paid mutation. Paid five-request scale-out remains separately unauthorized. |

### OUTPUTS

| Concept | Result |
|---|---|
| Five-request E2E | Added production-door concurrency coverage for five simultaneous AgentOS payments. |
| Capacity arithmetic | Existing requested/reserved overcommit is carried into the next shortfall calculation. |
| Monotonic coalescing | Existing action updates whenever CPU, memory or storage shortfall grows, even when `requiredNodes` is unchanged. |
| Transaction consistency | Probe reads use the reservation transaction manager while the advisory lock is held. |
| Cost safety | No second Tino service was created; retained paid worker remains the only stage-1 capacity item. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\nivo-backend\src\tests\e2e\nivo\five-agentos-capacity.e2e-spec.ts` | Added isolated real-app five-payment concurrency E2E with fake Tino provider. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\calculate-capacity-plan.ts` | Preserve existing overcommit in CPU/RAM/storage shortfall arithmetic. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\calculate-capacity-plan.spec.ts` | Added overcommit regression proof. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-capacity-probe.service.ts` | Accept and use the active transaction entity manager. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-capacity-reservation.service.ts` | Pass transaction manager and grow coalesced shortfalls monotonically. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-capacity-reservation.service.spec.ts` | Added transaction-manager and same-node-count growth proof. |
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-capacity-autoscaling.md` | Appended deterministic five-request Apply evidence and remaining obligations. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Paid five-request scale-out | Not approved. Keep one retained Tino worker; any additional recurring-cost mutation requires a new explicit count and cost ceiling. |

### WARNINGS

| Warning | Impact |
|---|---|
| `CreateWalletTopUpPayLinkInput.gateway` is removed by ValidationPipe whitelist because it lacks a class-validator decorator. | Existing `topUpWallet` test helper reaches an unsupported null/undefined gateway. This is outside r2.1 and requires a separate backend feature/audit boundary. |
| Browser localhost claim remains blocked by browser URL policy. | HTTP and terminal runtime proof pass, but signed-in DOM/Network/Console interaction proof remains OWED. |
| Full workflow-root validator remains red on historical malformed records and older malformed sections. | The new continuation uses canonical headings/tables; historical workflow schema debt was not rewritten during feature Apply. |
| Backend startup retains existing negative-timeout and knowledge/embedding seed warnings. | API, Kafka, Socket and provisioning start successfully; warning debt is outside r2.1. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Create additional Tino VPS for the five-request proof | Isolated fake provider E2E | Owner paused five paid resources; proof must not expand recurring cost. |
| Repair wallet top-up DTO inside this Apply | Record and route separately | It is unrelated to capacity scale-out and outside the frozen revision boundary. |

### OWED

| Owed | Cleared by |
|---|---|
| Deterministic five-request E2E | CLEARED — isolated E2E passes five concurrent payments, one coalesced action/job and zero provider activation. |
| Paid stage-2 five-request proof | New explicit approval for maximum VPS count and total recurring monthly cost. |
| Signed-in browser UI/Network/Console proof | A browser surface that permits localhost inspection, then replay AgentOS management/realtime flow. |
| Automatic image distribution | Separate feature Plan for registry, pull secret and node image availability. |
| Disable root password SSH after key bootstrap | Separate Plan/Review for operator user, key validation, password-auth disable and recovery. |
| Wallet top-up gateway DTO | Separate backend feature/audit fixes validation metadata and proves gateway routing. |
