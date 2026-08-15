<!-- starci-workflow: v2 -->

## plan r1

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
| Database | Không thay đổi database; app `core` truyền image contract vào Helm. |
| Repo / branch | D:\Repositories\nivo-backend @ `main` (`6d4e68322bab900cfef17029dcc3a9fabd40a420`); chart evidence D:\Repositories\nivo-charts @ `main` (`598d4b44aea19c4213c4682f876393acf4ab0`) read-only. |
| Purpose | Thiết kế đường build/publish image AgentOS công khai và buộc provisioning dùng image có thể pull trên worker Tino mới mà không cần pull secret. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-public-image-delivery.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-public-image-delivery.md; không ghi product source trong Plan. |

### SCHEMA EVIDENCE

Live introspection `POST http://localhost:3067/graphql` trả đủ 113 mutation. Luồng giữ nguyên cửa `orderCatalogItem` -> `payInvoice`; không thêm mutation image/registry. `nivo-charts/charts/agentos` đã nhận `image.*`, `global.imagePullSecrets` và `image.pullPolicy`, nên backend chỉ cần truyền image reference đã publish; chart repo không cần sửa trong revision này.

Runtime hiện tại xác nhận pod dùng `nivo/agentos-controlplane:0.1.0` và hook dùng `nivo/agentos-cli:0.1.0`; hai image này chỉ có local. `ghcr.io/openclaw/openclaw:latest`, `docker.n8n.io/n8nio/n8n:1.64.3` và `mcp/qdrant:latest` là nguồn public hiện hữu. Repo backend private; `gh` đang đăng nhập nhưng token chưa có package scopes.

### PROPOSED CAPABILITY

Revision đề xuất: `nivo-agentos-public-images-r1`.

- `.github/workflows/deploy.yml` build và push `agentos-controlplane` cùng `agentos-cli` lên `ghcr.io/starci-lab`, dùng cùng immutable commit-SHA tag với core; `latest` chỉ là convenience tag, provisioning không dùng nó.
- Deploy inject `AGENTOS_IMAGE_REGISTRY=ghcr.io/starci-lab` và `AGENTOS_IMAGE_TAG=<commit sha>` vào core runtime.
- `envConfig().agentosProvision` giữ repository từng component và tag; `InstallChartStep` truyền contract này vào `buildAgentosChartValues`.
- Helm values render full public references cho controlplane/cli, giữ upstream public references cho OpenClaw/n8n/MCP, `IfNotPresent`, và `global.imagePullSecrets=[]`.
- Apply phải đổi visibility của đúng hai GHCR packages sang public, sau đó chứng minh pull ẩn danh bằng manifest request và pod `imagePullPolicy: Always` trên worker Tino.
- Không chạm `nivo-charts`: chart hiện đã có đủ knobs. Không publish expert-academy images trong capability AgentOS này.

### PROPOSED FILE TREE

| Tree | Details | Shape evidence |
|---|---|---|
| `D:\Repositories\nivo-backend\.github\workflows\deploy.yml` | modified — build/push hai image AgentOS và inject immutable tag vào core deploy. | Existing core GHCR build/push job. |
| `D:\Repositories\nivo-backend\.env.example` | modified — document public registry/repository/tag keys. | Existing `AGENTOS_PROVISION_*` configuration family. |
| `D:\Repositories\nivo-backend\src\modules\platform\env\config.ts` | modified — typed AgentOS image config. | Existing `agentosProvision` owner. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\agentos-provision\types\chart.ts` | modified — named image contract passed to chart builder. | Existing `BuildAgentosChartValuesParams`. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\agentos-provision\chart\build-agentos-chart-values.ts` | modified — render exact repositories/tags and empty pull-secret list. | Existing pure chart-values mapper. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\agentos-provision\chart\build-agentos-chart-values.spec.ts` | modified — twin proof for all image refs/policies. | Existing mapper twin. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\agentos-provision\steps\install-chart.step.ts` | modified — pass runtime image contract. | Existing Helm-install Saga step. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\agentos-provision\steps\install-chart.step.spec.ts` | added — exact Helm request proof. | Sibling step twins in the same folder. |
| `D:\Repositories\nivo-backend\src\tests\e2e\nivo\agentos-public-image-pull.live-spec.ts` | added — opt-in public pull proof on Tino k3s. | Existing Nivo live-spec family and real Kubernetes boundary. |

### TEST MATRIX

| Case | Expected proof |
|---|---|
| CI build from one SHA | Controlplane and CLI both publish the same immutable SHA tag. |
| Local/default config | Produces explicit repositories/tag; no private pull secret. |
| Chart values | Controlplane and CLI use `ghcr.io/starci-lab/...:<sha>`; OpenClaw/n8n/MCP remain their public upstream refs. |
| Empty/unknown image tag | Refuse before invoking Helm; no half-installed release. |
| Unauthenticated registry read | Exact two SHA manifests resolve without an Authorization header. |
| Cache-independent cluster pull | Temporary pods scheduled to `nivo-worker-357725` with `imagePullPolicy: Always` reach completion/readiness. |
| Provisioning flow | One authenticated AgentOS purchase reaches Helm with public refs; existing Kafka/Socket status path remains unchanged. |
| Rollback | An older approved SHA can be supplied and pulled without rebuilding. |

### OUTPUTS

| Concept | Result |
|---|---|
| Public AgentOS image delivery brief | `nivo-agentos-public-images-r1`: GHCR public, immutable SHA deployment, no pull secret. |
| Chart ownership | Existing chart contract is sufficient; no `nivo-charts` production write proposed. |
| Autoscale safety | New workers prove network pull instead of relying on side-loaded local cache. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-public-image-delivery.md` | added — schema evidence, proposed boundary and test matrix. |

### NEED APPROVALS

| Question | Options |
|---|---|
| GHCR public package authority | Recommended: authorize exactly `ghcr.io/starci-lab/nivo-agentos-controlplane` and `ghcr.io/starci-lab/nivo-agentos-cli` as public packages; current local `gh` token lacks package scopes. Alternative: provide a public Docker Hub namespace/token and revise repository names before Review approval. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend GitHub repository is private. | GHCR packages are not proven public merely because Actions pushed them; visibility must be explicitly changed and anonymously verified. |
| `nivo-charts` has unrelated dirty worktree changes. | Revision avoids writing that repository and preserves those changes. |
| Public images expose application layers to anyone. | No credential enters Docker context; `.dockerignore` exclusions and secret scan remain mandatory proof. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Private registry and `imagePullSecret` now | Temporary public GHCR images | Owner explicitly chose public first and private later when budget permits. |
| Side-load images onto every new worker | Registry pull by immutable SHA | Autoscale must not require an operator to import images node by node. |

### OWED

| Owed | Cleared by |
|---|---|
| Review approval | `$starci-be-feature-review` approves one exact registry namespace, visibility mutation and file boundary. |
| Package permission | GHCR package scope/owner action allowing publish and public visibility for exactly two packages. |
| Apply/live proof | `$starci-be-feature-apply`, anonymous manifest checks and Tino-worker Always-pull proof. |

## review r1.1

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
| Database | Không thay đổi database. |
| Repo / branch | D:\Repositories\nivo-backend @ `main` (`6d4e68322bab900cfef17029dcc3a9fabd40a420`) |
| Purpose | Challenge registry visibility, immutable tag propagation, chart compatibility và live-pull proof trước Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-public-image-delivery.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; production boundary dưới đây chưa được ghi cho tới khi owner duyệt. |

Candidate revision: `nivo-agentos-public-images-r1.1`.

Approved revision: `nivo-agentos-public-images-r1.1` — owner approved all three r1.1 revisions with “ok” on 2026-08-15, including exactly the two named GHCR package mutations.

### REVIEW FINDINGS

| Finding | Revision |
|---|---|
| `global.imageRegistry` sẽ prefix cả upstream OpenClaw/n8n/MCP và tạo ref sai. | Không set global registry; truyền full repository riêng cho từng image và giữ `global.imagePullSecrets=[]`. |
| `agentos.cliImage` không đọc global registry. | Full CLI repository `ghcr.io/starci-lab/nivo-agentos-cli` giải quyết đúng cả hook/CronJob/controlplane env. |
| Repo source private nên push thành công không chứng minh package public. | Apply phải đổi visibility đúng hai package và kiểm tra manifest không auth trước khi rollout. |
| Tạo AgentOS mới có thể kích hoạt thêm Tino capacity. | Live image proof rollout release dev hiện hữu hoặc temporary Always-pull pods; không tạo workspace/VPS trong gate registry. UI creation được tách sang proof sau khi capacity authority rõ. |

### FROZEN CANDIDATE BOUNDARY

Production files đúng danh sách Plan r1; không chạm `D:\Repositories\nivo-charts`. Image names cố định là `ghcr.io/starci-lab/nivo-agentos-controlplane` và `ghcr.io/starci-lab/nivo-agentos-cli`; provisioning dùng commit SHA, không dùng `latest`. Apply được phép publish/đổi public visibility đúng hai package này, không package khác.

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate revision | `nivo-agentos-public-images-r1.1` ready for explicit approval. |
| Registry contract | Per-image full repositories, immutable SHA, no pull secret/global prefix. |
| Live safety | Prove pull on retained worker without purchasing capacity. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-public-image-delivery.md` | modified — appended Review findings and frozen candidate boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve image revision and package mutation | Recommended: approve `nivo-agentos-public-images-r1.1`, including publish + public visibility for exactly two named GHCR packages. Current `gh` token must be refreshed with package authority during Apply. |

### WARNINGS

| Warning | Impact |
|---|---|
| Public visibility is irreversible with respect to already downloaded layers. | Secret scan and Docker context proof must pass before first publish. |
| Existing release rollout changes dev workload image refs. | Apply keeps rollback SHA and waits all containers Ready before accepting it. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `global.imageRegistry=ghcr.io/starci-lab` | Full repository per Nivo image | Global prefix would corrupt upstream public image references. |
| Create a fresh paid-backed workspace for registry proof | Roll existing dev release/Always-pull probe | Registry proof must not trigger Tino spend. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval | Owner approves `nivo-agentos-public-images-r1.1` and exact two-package external mutation. |
| Apply | Baseline commit, frozen edits, image publish/public proof and rollback-safe live pull. |

## apply

### CONTEXT

| Field | Value |
|---|---|
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| App | nivo |
| Applied revision | `nivo-agentos-public-images-r1.1` |
| Baseline commit | `511e9bf` |
| Image source commit/tag | `0ecdf00` |
| Test harness follow-up | `57d144e` |

### OUTPUTS

| Capability | Result |
|---|---|
| Public controlplane image | `ghcr.io/starci-lab/nivo-agentos-controlplane:0ecdf00`, digest `sha256:c4f165e8495696033b543f723c57c245e3a164d2a744a770e41548957372111e`. |
| Public CLI image | `ghcr.io/starci-lab/nivo-agentos-cli:0ecdf00`, digest `sha256:ca5689d9ff2787c53c9c6f12aa41d2ae7831b393487d4d5d6271099eb6adc145`. |
| Provisioning contract | Full per-image repositories, immutable tag, no global registry prefix and empty pull secrets. |
| Anonymous proof | Both manifests resolve after local GHCR logout. |
| Worker proof | Two temporary `imagePullPolicy: Always` probes passed on `nivo-worker-357725`; proof namespace self-deleted. |

### CHANGES

| Path | Change |
|---|---|
| `D:\Repositories\nivo-backend\.github\workflows\deploy.yml` | Build/push both AgentOS images and inject immutable runtime tag. |
| `D:\Repositories\nivo-backend\.env.example` | Documented image repositories and tag. |
| `D:\Repositories\nivo-backend\src\modules\platform\env\config.ts` | Added typed image delivery configuration. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\agentos-provision\types\chart.ts` | Added explicit image contract. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\agentos-provision\chart\build-agentos-chart-values.ts` | Rendered public immutable image references without pull secret. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\agentos-provision\chart\build-agentos-chart-values.spec.ts` | Proved exact values and refusal branches. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\agentos-provision\steps\install-chart.step.ts` | Passed runtime image contract into Helm values. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\agentos-provision\steps\install-chart.step.spec.ts` | Proved exact Helm invocation. |
| `D:\Repositories\nivo-backend\src\tests\e2e\nivo\agentos-public-image-pull.live-spec.ts` | Added anonymous manifest and retained-worker pull proof. |

### NEED APPROVALS

| Item | State |
|---|---|
| Additional registry/package mutation | None; exactly the two approved packages were made public. |

### WARNINGS

| Warning | Evidence / disposition |
|---|---|
| First live harness run imported `execa` as a named export although installed v5 exposes a default export. | Test-only import corrected in `57d144e`; rerun passed 2/2. Product image source remains `0ecdf00`. |
| Images are public by the approved temporary delivery policy. | No credentials entered the Docker contexts; private-registry migration remains future work. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Side-load cached images | Anonymous immutable GHCR pull | Proves a new autoscaled worker can retrieve the workload. |
| Create a workspace/VPS for registry proof | Temporary Always-pull pods | Registry gate did not spend capacity or mutate customer workspaces. |

### OWED

| Owed | State |
|---|---|
| Public image delivery proof | Cleared: lint 0 errors; build PASS; focused and full unit PASS; anonymous manifest PASS; retained-worker Always-pull 2/2 PASS. |
| Private registry migration | Deferred by owner; public images are the approved temporary strategy. |
