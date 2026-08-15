<!-- starci-workflow: v2 -->

## plan r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy (owner-declared) |
| Frontend | D:\Repositories\starci-academy |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy / Nest app `core` + Next.js frontend |
| Repo / branch | Backend `mtp`; Frontend `mtp` |
| Purpose | Phase 1 Minimal observability cho StarCi: managed Metrics, Logs, Errors, uptime và SEO ownership, không thêm local telemetry instance. |
| Database | none — không entity, migration, projection hay datastore write |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\observability-minimal-cloud.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; Plan không sửa product source, runtime secret hay cloud account |

### Existing evidence

| Surface | Evidence | Verdict |
|---|---|---|
| GraphQL | Unfiltered live schema dump from `http://localhost:3001/graphql`; public `systemHealthStatus` already exists. | No GraphQL/schema delta. |
| Metrics | Dev stack already runs Prometheus `v2.53.0` + cAdvisor; `PrometheusMetricsService` queries that local Prometheus for the public health page. | Preserve both; add native `remote_write`, not another collector. |
| Logs | Backend already has `winston-loki`; Loki transport reads `LOKI_HOST`, `LOKI_USERNAME`, `LOKI_PASSWORD[_FILE]`. | Send application logs directly to Grafana Cloud Logs; no local Loki. |
| Errors | Backend already initializes Sentry; frontend has no Sentry SDK/config. | Keep Sentry Cloud as error owner; add the missing frontend half and harden backend privacy/sampling. |
| SEO | Frontend already emits canonical metadata, `robots.txt`, dynamic `sitemap.xml`, optional Google verification and consent-gated GA. | Activate and monitor existing surfaces; no Semrush crawler in Minimal. |
| Availability | No public synthetic check is owned in source. | Use Grafana Cloud Synthetic Monitoring public probes; no private probe/agent in Minimal. |
| Runtime secrets | `parseEnvSecret` supports `<KEY>_FILE`; SOPS+age tracks ciphertext twins only. | One write-only Grafana token file; never inline or commit plaintext. |

### Phase 1 frozen candidate

| Signal | Owner | Minimal path | Local instances added |
|---|---|---|---:|
| Container CPU / memory / network | Grafana Cloud Metrics | Existing cAdvisor -> existing Prometheus -> native `remote_write` | 0 |
| Backend structured logs | Grafana Cloud Logs | Existing Winston -> existing `winston-loki` HTTPS push | 0 |
| FE + BE exceptions | Sentry Cloud | Sentry Next.js SDK + existing Nest SDK, two projects | 0 |
| Public uptime | Grafana Cloud Synthetic Monitoring | Managed probes for web, robots, sitemap and public GraphQL health operation | 0 |
| SEO ownership | Google Search Console | Existing verification meta + submit existing sitemap | 0 |
| Product analytics | GA4 | Existing consent-gated `AnalyticsGate` | 0 |
| Alert delivery | Email | Grafana/Sentry built-in email contact points | 0 |

### Credential contract

| Provider | Value owner supplies | Secret? | Minimum permission / use |
|---|---|---:|---|
| Grafana Cloud | Stack URL/slug | no | Open Explore, dashboards and alert verification. |
| Grafana Cloud Metrics | Remote-write URL + Metrics instance/user ID | no | Values shown in stack `Details -> Prometheus`; configure existing Prometheus. |
| Grafana Cloud Logs | Loki push URL + Logs instance/user ID | no | Values shown in stack `Details -> Loki`; configure existing Winston transport. |
| Grafana Cloud | One Access Policy token | yes | Stack realm; only `metrics:write` + `logs:write`. Same token is the Basic Auth password for both paths. |
| Sentry | Backend DSN + frontend DSN | DSNs are client configuration, not authority secrets | Separate `starci-api` and `starci-web` projects so ownership/releases stay legible. |
| Sentry | Organization slug + both project slugs | no | Release/source-map identity. |
| Sentry | Build auth token | yes | Project/release/source-map upload only; CI/deploy secret, never browser runtime. |
| Google Search Console | HTML-tag verification token | no | Existing `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`; no Google account password or OAuth refresh token. |
| GA4 | Measurement ID (`G-...`) | no | Existing consent-gated analytics config. |
| StarCi | Production web origin + public GraphQL URL | no | Synthetic targets, canonical URL and live proof. |

The Grafana Access Policy scopes above follow current Grafana Cloud authorization documentation: `metrics:write` writes Mimir metrics and `logs:write` writes Loki logs. A Grafana service-account/admin token is explicitly not requested in Minimal; dashboard and alert bootstrap stays in the signed-in managed UI. Prometheus supports `basic_auth.password_file`, so the write token remains a mounted file.

### Planned production and runtime tree

| Path / external object | Action | Shape evidence |
|---|---|---|
| `scripts/credentials.mjs` | modify | Add one third-party `APP_CREDENTIALS` row mapping `grafana-cloud-write-token.key` to `LOKI_PASSWORD`; `sync` emits `LOKI_PASSWORD_FILE`, while Prometheus mounts the same file. |
| `.stacks/dev/runtime/files/grafana-cloud-write-token.key.enc` | add through `npm run secret:set` | SOPS ciphertext only; supplied Access Policy token is never written to workflow/stdout/committed plaintext. |
| `.stacks/dev/runtime/env/app.env.enc` | modify through stack secret workflow | Store non-secret `LOKI_HOST`, `LOKI_REQUIRE_AUTH=true`, `LOKI_USERNAME`; preserve all unrelated encrypted values. |
| `.stacks/dev/infra/compose/prometheus.yaml` | modify | Read-only mount of the decrypted Grafana token into `/run/secrets/grafana-cloud-write-token`; no new service/volume/port. |
| `.stacks/dev/infra/compose/prometheus/prometheus.yml` | modify | Add one Grafana endpoint under `remote_write`, Basic Auth username + `password_file`, stable `project=starci-academy` and `environment` external labels; keep current cAdvisor scrape and local retention/query path. |
| `src/modules/platform/winston/winston.providers.ts` | modify | Replace boolean environment label with the existing raw environment name; use bounded stable labels only (`service_name`, `project`, `environment`). |
| `src/modules/platform/winston/winston.providers.spec.ts` | add | Prove Cloud URL/basic auth, file-resolved token, stable labels and absence of token in labels/serialized options. |
| `src/modules/integrations/sentry/instrument.ts` | modify | Environment/release tags, bounded production trace sample rate and `sendDefaultPii: false`; no user secrets in events. |
| `src/modules/integrations/sentry/instrument.spec.ts` | add | Prove DSN/environment/release wiring, privacy off and bounded sampling. |
| `D:\Repositories\starci-academy\package.json` + lockfile | modify | Add official Next.js Sentry SDK; no additional running service. |
| `D:\Repositories\starci-academy\next.config.ts` | modify | Wrap existing Next config for release/source-map upload without widening runtime permissions. |
| `D:\Repositories\starci-academy\sentry.client.config.ts` | add | Browser error capture with environment/release and privacy-safe defaults. |
| `D:\Repositories\starci-academy\sentry.server.config.ts` | add | Server-render/route error capture. |
| `D:\Repositories\starci-academy\sentry.edge.config.ts` | add | Edge runtime error capture. |
| `D:\Repositories\starci-academy\src\app\global-error.tsx` | add | Production Next error boundary reports fatal render failures and retains a usable fallback. |
| `D:\Repositories\starci-academy\src\config\seo.ts` | reuse | Existing site URL, Search Console token and GA measurement ID contract is sufficient. |
| Grafana Cloud Synthetic Monitoring | configure in managed UI | Public GET checks for web `/`, `/robots.txt`, `/sitemap.xml`; public POST check for `systemHealthStatus`; no private probe. |
| Grafana Cloud dashboard + alerts | configure in managed UI | One core dashboard and only actionable alerts: site/API down, sustained container saturation, remote-write failure and log error burst. |
| Sentry projects/alerts | configure in managed UI | `starci-web` and `starci-api`; alert new regression/high error rate to owner email. |
| Google Search Console property | configure in managed UI | Verify existing meta token and submit `/sitemap.xml`. |

### Test matrix

| Case | Expected proof |
|---|---|
| Prometheus config syntax | `promtool check config` passes with `remote_write` and current scrape intact. |
| Token absent/unreadable | Prometheus/app fails closed with a named missing secret; no fallback `admin` credential reaches Cloud. |
| Token supplied | `prometheus_remote_storage_samples_total` increases and Grafana Explore returns StarCi cAdvisor series. |
| Local health consumer | `systemHealthStatus` still returns local cAdvisor resource data after remote-write activation. |
| Loki transport | One synthetic backend log appears in Cloud Logs with bounded project/environment/service labels. |
| Secret hygiene | Token absent from git diff, generated env output shown to user, process logs, Winston labels and Sentry events. |
| Backend Sentry | Deliberate captured test exception appears in `starci-api`; default PII disabled; trace sampling is not 100%. |
| Frontend Sentry | Deliberate client and server test exceptions appear in `starci-web` with uploaded source maps. |
| Web synthetic | `/` returns expected success from at least two managed public locations. |
| SEO synthetics | `/robots.txt` contains sitemap URL; `/sitemap.xml` returns parseable XML and at least one canonical URL. |
| API synthetic | Public GraphQL health operation returns HTTP 200, no GraphQL errors and `success=true`. |
| Search Console | Property verifies and sitemap submission is accepted. |
| GA consent | No analytics request before consent; measurement begins only after analytics consent. |
| Alert smoke | One controlled failure reaches owner email once; recovery resolves the same incident without alert storm. |
| Fullstack gates | Focused tests/lint, BE typecheck/build, FE typecheck/build, then live Cloud evidence all pass. |

### Assumptions and exclusions

| Boundary | Decision |
|---|---|
| Environments | Implement dev wiring first and use supplied production URLs for managed checks; VPS/K8s runtime trees are scaffolding and are not invented in this revision. |
| Retention/spend | Start on Grafana/Sentry plan defaults with billing alerts; do not add high-cardinality user/request labels. |
| Sensitive data | No request bodies, auth headers, cookies, tokens, email or user IDs become Loki labels or Sentry default PII. |
| Phase 2 Full | Alloy, Tempo/traces pipeline, profiling, private synthetics, PagerDuty/Slack, Semrush, long retention, HA collectors and custom SLO automation are explicitly deferred until measured trigger + new Review. |

### OUTPUTS

| Concept | Result |
|---|---|
| StarCi Minimal observability brief | Cloud-first fullstack boundary covering Metrics, Logs, Errors, uptime and SEO with zero added local instances. |
| Credential roster | One narrow Grafana secret, two Sentry projects/build token, public verification/config values and production endpoints. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/observability-minimal-cloud.md` | added — evidence, exact file/cloud boundary, credential contract, tests and exclusions only. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve Plan boundary for Review? | Recommended: review `observability-minimal-cloud-r1`; preserve 0 new local instances and keep Alloy/Tempo/Semrush in Full. |
| Credentials/runtime | Owner supplies the values in `Credential contract`; secret values must enter through hidden `secret:set`/deploy secret fields, not chat or committed env files. |
| Production endpoints | Confirm the canonical web origin and public GraphQL URL before synthetic checks/SEO activation. |

### WARNINGS

| Warning | Impact |
|---|---|
| Grafana Cloud free/paid quotas and endpoint IDs are stack-specific. | Exact URLs/IDs cannot be guessed; Apply remains blocked until owner supplies them. |
| Existing backend Sentry sends default PII and samples traces at 100%. | Keep the current DSN private until the reviewed privacy/sampling patch is applied. |
| Frontend contains substantial unrelated worktree changes. | Apply must freeze and touch only the approved observability files; no unrelated stage/commit. |
| `.stacks/dev/runtime/env/app.env.enc` contains unrelated settings. | Apply must decrypt/merge/re-encrypt without replacing the file wholesale or exposing values. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Local Grafana, Loki, Alertmanager, Tempo or Alloy in Minimal | Grafana Cloud + existing Prometheus/Winston paths | Avoid instance, port, storage, backup and upgrade lifecycle. |
| Replace local Prometheus | Keep it and remote-write | Public `systemHealthStatus` directly depends on its local query API. |
| Grafana admin/service-account token | Signed-in managed UI bootstrap | Avoid broad second credential in Minimal. |
| User/request/email labels | Stable project/environment/service labels | Control privacy and cardinality/cost. |
| Semrush/API crawler now | Search Console + synthetic robots/sitemap checks | Core ownership without another subscription/integration. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge exact files, secret reuse, Sentry boundary and cloud-only objects | `starci-be-feature-review`. |
| Explicit approval of one named revision | Owner approves the Review candidate before Apply. |
| Credentials and public endpoints | Owner supplies minimum values through safe channels after approval. |

## review revision-1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy (owner-declared) |
| Frontend | D:\Repositories\starci-academy |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy / Nest app `core` + Next.js frontend |
| Repo / branch | Backend `mtp`; Frontend `mtp` |
| Purpose | Review and freeze the zero-new-instance Phase 1 Minimal observability boundary. |
| Database | none — no entity, migration, projection or datastore write |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\observability-minimal-cloud.md |
| Language | vi |
| Phase | review |
| Touching | Workflow/review artifact only; no product source, runtime secret or cloud account |

Candidate revision: `observability-minimal-cloud-r1`

Review status: awaiting explicit approval

### Review findings and revisions

| Finding | Revision frozen in candidate |
|---|---|
| Existing live schema already owns health through `systemHealthStatus`. | No resolver, command, query, response type, entity, migration or database delta. Synthetic uses the production GraphQL door already present. |
| Removing local Prometheus breaks a current product read path. | Preserve Prometheus/cAdvisor and their port/volume; remote-write is additive only. |
| A generic Grafana token can accidentally carry read/admin authority. | Accept only a stack-realm Access Policy token with exactly `metrics:write` and `logs:write`; no Grafana API/service-account token. |
| `APP_CREDENTIALS` drives app pointers but not the Prometheus container. | One ciphertext token file remains the authority; app receives `LOKI_PASSWORD_FILE`, Prometheus mounts the same decrypted file read-only and uses `basic_auth.password_file`. |
| Plan omitted the current backend DSN owner. | Add `.stacks/dev/runtime/files/app.yaml.enc` only if the existing `sentryDsn` is not the approved `starci-api` DSN; merge/re-encrypt, never replace unrelated config. |
| Current Next.js manual wiring no longer uses only the old client config convention. | Replace planned `sentry.client.config.ts` with `instrumentation-client.ts`; add `src/instrumentation.ts`, server/edge configs and `src/app/global-error.tsx`, matching the installed Next runtime. |
| A side-effect-only Sentry init file is awkward to test. | Add small pure option builders beside BE/FE config and twin specs; init files consume the proven options rather than duplicating privacy/sampling rules. |
| 100% tracing is spend/noise, not Minimal. | Errors on; traces sample rate defaults to `0.05` in production and `0` outside explicitly enabled test/live proof; Session Replay and profiling remain off. |
| Synthetic checks can create noisy/expensive probing. | Four managed checks only, 5-minute interval, two public locations, owner email, one incident per failure/recovery; no private probe. |
| SEO tools can expand into a second monitoring platform. | Google Search Console ownership + sitemap submission and synthetic robots/sitemap validation only; Semrush remains Full. |
| Runtime deployment target is not yet declared. | Repo Apply wires the existing dev stack and portable app env contracts. Production activation/cloud checks require owner-supplied web/API origins and the actual deploy secret destination; no VPS/K8s tree is invented. |

### Exact approved-candidate Touching

| Repository / cloud | Exact boundary |
|---|---|
| Backend source | `scripts/credentials.mjs`; `.stacks/dev/infra/compose/prometheus.yaml`; `.stacks/dev/infra/compose/prometheus/prometheus.yml`; `src/modules/platform/winston/winston.providers.ts`; new focused Winston spec; `src/modules/integrations/sentry/instrument.ts`; one new pure Sentry-options file + spec. |
| Backend encrypted runtime | Add `.stacks/dev/runtime/files/grafana-cloud-write-token.key.enc`; merge `.stacks/dev/runtime/env/app.env.enc`; conditionally merge `.stacks/dev/runtime/files/app.yaml.enc` only when backend DSN changes. Plaintext twins remain ignored/local. |
| Frontend source | `package.json`, lockfile, `next.config.ts`, new `instrumentation-client.ts`, `src/instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/app/global-error.tsx`, one pure Sentry-options file + focused spec. Existing `src/config/seo.ts`, robots and sitemap are reused unchanged. |
| Deployment config | Set public Sentry DSN, Sentry org/project/release inputs, build auth token, site URL, GSC token and GA ID in the existing deploy provider only after it is identified. No plaintext credential file is added. |
| Grafana Cloud UI | Four synthetics, one core dashboard, owner-email contact point and four actionable alert rules; no API automation token. |
| Sentry UI | Two projects and regression/high-error-rate owner-email alerts. |
| Google UI | Verify property and submit existing sitemap. |

### Frozen proof commands and live evidence

| Layer | Proof |
|---|---|
| Config | Run the exact Prometheus `v2.53.0` image with `promtool check config`; render Compose config; prove zero added services/volumes/ports. |
| BE twin | Focused Winston + Sentry option specs, focused ESLint, `npm run typecheck`, `npm run build`. |
| FE twin | Focused Sentry option/error-boundary specs, focused ESLint, typecheck and production build with source-map upload credential injected only for build. |
| Metrics live | Grafana Explore returns `container_*` series with `project=starci-academy`; local `systemHealthStatus` remains populated. |
| Logs live | One controlled structured log arrives with only stable labels; query by project/environment/service succeeds. |
| Errors live | Controlled BE, FE client and FE server exceptions resolve to source in their separate Sentry projects; no default PII. |
| Availability/SEO live | Four synthetics green; Search Console verifies and accepts sitemap; GA remains silent before consent. |
| Alert live | One controlled outage/error sends one owner email and resolves on recovery. |
| Hygiene | Git diff contains ciphertext/config only, no token/auth header/cookie/email; unrelated worktrees remain untouched. |

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate `observability-minimal-cloud-r1` | One managed operating surface for core signals, Sentry error ownership and Search Console activation with zero new local instances. |
| Credential least privilege | One Grafana write-only token is reused for Metrics/Logs; one Sentry build-only token; no Grafana admin or Google OAuth credential. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/observability-minimal-cloud.md` | modified — append challenged revision, exact Touching, credential authority and frozen proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve `observability-minimal-cloud-r1`? | Recommended: approve exact zero-new-instance boundary on Backend `mtp` + Frontend `mtp`. |
| Grafana values after approval | Supply stack URL, Metrics URL + instance ID, Logs URL + instance ID, then enter one `metrics:write` + `logs:write` token through hidden secret input. |
| Sentry values after approval | Supply two DSNs, organization/project slugs; enter a build token limited to releases/source maps through deploy secret input. |
| Public/SEO values after approval | Supply canonical web origin, public GraphQL URL, Search Console HTML token and GA4 Measurement ID. |
| Deploy target | Name the current production host/deploy provider so Apply writes its secret/env contract in the real owner rather than inventing VPS/K8s config. |

### WARNINGS

| Warning | Impact |
|---|---|
| Secrets pasted into chat become conversation data. | Token values must be entered into hidden `secret:set` or the named deployment secret store after approval. |
| No production deployment owner is visible in the two repositories. | Repo wiring can pass locally, but production telemetry cannot be claimed live until that target is named. |
| Existing backend Sentry privacy/sampling defaults are unsafe for production. | Live Sentry proof waits for this exact patch; no expansion of captured PII is approved. |
| Both repos have unrelated dirty worktrees. | Apply requires path-filtered baseline/diff and may not stage or rewrite unrelated files. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Alloy/Tempo/local Loki/Grafana/Alertmanager | Existing Prometheus + direct Winston + managed Cloud | Adds lifecycle and local instances without a measured Phase 2 trigger. |
| One Sentry project for web and API | Two projects in one Sentry org | Keeps release/error ownership legible without adding infrastructure. |
| Session Replay/profiling/100% traces | Errors + 5% production traces | Minimal privacy, quota and spend boundary. |
| Grafana IaC/admin token | Small signed-in UI bootstrap | A broad second credential costs more than four checks/dashboard/alerts justify. |
| Invent `.stacks/vps` or Kubernetes manifests | Ask for real deploy owner | Empty scaffolding is not evidence of the production path. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of exact candidate and both `mtp` branches | Owner says `approve observability-minimal-cloud-r1`. |
| Production deploy identity | Owner names provider/host and canonical public endpoints. |
| Safe credential intake | After approval, owner enters secrets through hidden local/deploy inputs; non-secret IDs may be supplied normally. |
| Product implementation and cloud proof | `starci-be-feature-apply` after all above are available. |

## credential intake r1

### Grafana Cloud received

| Field | Value |
|---|---|
| Stack URL | `https://cuongnvtse160875.grafana.net/` |
| Hosted Metrics instance | `cuongnvtse160875-prom` |
| Metrics region | AWS Singapore `ap-southeast-1`; Mimir `mimir-prod-37` |
| Metrics remote-write URL | `https://prometheus-prod-37-prod-ap-southeast-1.grafana.net/api/prom/push` |
| Metrics Username / Instance ID | `2965240` |
| Grafana write token | Received through user conversation, encrypted to `.stacks/dev/runtime/files/grafana-cloud-write-token.key.enc`; plaintext removed. Rotate before production because the first value appeared in chat. |

### Grafana Cloud still required

| Field | Status |
|---|---|
| Access Policy realm + scopes | owner confirmation required: stack-only `metrics:write`, `logs:write` |

### Grafana Cloud Logs received

| Field | Value |
|---|---|
| Hosted Logs instance | `cuongnvtse160875-logs` |
| Loki data source name | `grafanacloud-cuongnvtse160875-logs` |
| Loki base URL | `https://logs-prod-020.grafana.net` |
| Loki push endpoint | `https://logs-prod-020.grafana.net/loki/api/v1/push` |
| Loki User / Instance ID | `1478295` |
| Logs region | AWS Singapore `ap-southeast-1`; cell `prod-020` |
| Collector decision | Reuse existing `winston-loki`; do not add Alloy or Promtail in Minimal. |

## review revision-2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy (owner-declared) |
| Frontend | D:\Repositories\starci-academy |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy / Nest app `core` + Next.js frontend |
| Repo / branch | Backend `mtp`; Frontend `mtp` |
| Purpose | Record explicit approval of the zero-new-instance Minimal observability revision. |
| Database | none |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\observability-minimal-cloud.md |
| Language | vi |
| Phase | review |
| Touching | Workflow/review artifact only; no product source or cloud mutation |

Approved revision: `observability-minimal-cloud-r1`

Approval evidence: user replied exactly `approve observability-minimal-cloud-r1` after the exact Backend `mtp` + Frontend `mtp`, zero-new-instance boundary and credential contract were presented.

### OUTPUTS

| Concept | Result |
|---|---|
| Approved Minimal observability | `observability-minimal-cloud-r1` may enter Apply without Alloy, Tempo, Promtail, local Loki/Grafana or broad cloud-admin credentials. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/observability-minimal-cloud.md` | modified — append explicit approval evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None for Grafana Metrics + Logs | Endpoints, instance IDs, encrypted write token and exact revision are available. |
| Remaining Minimal providers | Sentry, production deployment, synthetics and SEO remain credential/runtime-blocked and may not be guessed during Apply. |

### WARNINGS

| Warning | Impact |
|---|---|
| Initial Grafana token appeared in chat. | Use only for controlled activation proof, then rotate before production. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Expand Apply into undeclared deploy/Sentry/SEO values | Complete Grafana slice, leave named provider blockers | Approval freezes architecture, not imaginary credentials. |

### OWED

| Owed | Cleared by |
|---|---|
| Grafana implementation and live proof | `starci-be-feature-apply`. |
| Remaining provider activation | Owner supplies Sentry, production URL/deploy, Search Console and GA4 values. |

## apply r1 — Grafana slice

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy (owner-declared) |
| Frontend | D:\Repositories\starci-academy |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy / Nest app `core` |
| Repo / branch | Backend `mtp`; Frontend `mtp` |
| Purpose | Activate and prove Grafana Cloud Metrics + Logs before waiting for Sentry credentials. |
| Database | none |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\observability-minimal-cloud.md |
| Language | vi |
| Phase | apply |
| Touching | Approved Grafana-only subset: Prometheus compose/config, credential map, encrypted token/env, Winston provider/spec and workflow; no FE/Sentry/SEO files |

Applied revision: `observability-minimal-cloud-r1`

Owner continuation instruction: `test trc đi xem ghi được không, rồi đợi thầy cấp sentry`.

### Commands and results

| Proof | Result |
|---|---|
| Winston focused Jest | PASS — 1 suite, 2/2 cases: authenticated Cloud endpoint/stable labels and no-auth local branch. |
| Focused ESLint | PASS — credential map + Winston provider/spec, zero findings. |
| Full `npm run lint:check` | PASS — zero errors. |
| `npm run typecheck` | PASS after replacing raw level strings in the spec with `WinstonLevel` enum members. |
| `npm run build` | PASS — webpack compiled successfully; existing node builtin package-version warnings only. |
| Prometheus syntax | PASS — exact `prom/prometheus:v2.53.0` image `promtool check config`. |
| Compose render/config | PASS — existing stack renders; zero services, volumes or ports added. |
| Prometheus restart | PASS — only `starci-prometheus` recreated; cAdvisor remained running. |
| Remote-write live | PASS — `96,012` samples and `13,962,682` bytes sent; failed `0`, retried `0`; queue actively draining. |
| Local scrape parity | PASS — `up{job="cadvisor"}=1`; public `systemHealthStatus` returned success, 17 components and metrics for 8 local components. |
| Loki direct ingest | PASS — Grafana Cloud `/loki/api/v1/push` returned HTTP `204`; proves token realm/scope and endpoint accept writes. |
| Winston live canary | PASS — canary `starci-winston-1786794718` sent through production `createLokiTransport`; no transport error. |
| Secret hygiene | PASS — `git grep glc_` outside ciphertext returned no match; token is SOPS ciphertext in git boundary and a gitignored decrypted runtime mount locally. |
| Diff check | PASS — no whitespace errors; line-ending warnings only, including unrelated dirty files. |

### OUTPUTS

| Concept | Result |
|---|---|
| Grafana Cloud Metrics | Existing cAdvisor -> existing Prometheus -> Singapore Mimir remote-write is live, with local health queries preserved. |
| Grafana Cloud Logs | Existing Winston -> Singapore Loki is live with stable `project`, `environment`, `service_name` labels and no new collector. |

### CHANGES

| Tree | Details |
|---|---|
| `scripts/credentials.mjs` | modified — one third-party Grafana token authority mapped to `LOKI_PASSWORD_FILE`. |
| `.stacks/dev/runtime/files/grafana-cloud-write-token.key.enc` | added — SOPS ciphertext for the stack-scoped write token. |
| `.stacks/dev/runtime/env/app.env.enc` | modified — encrypted Loki base URL, auth flag and user ID. |
| `.stacks/dev/infra/compose/prometheus.yaml` | modified — mount the same token read-only; no new service/port/volume. |
| `.stacks/dev/infra/compose/prometheus/prometheus.yml` | modified — Singapore remote-write endpoint, file-backed Basic Auth and bounded external labels. |
| `src/modules/platform/winston/winston.providers.ts` | modified — raw environment name plus bounded project/service labels. |
| `src/modules/platform/winston/winston.providers.spec.ts` | added — auth/local branches and secret-label exclusion. |
| `.workflows/feature/starci-academy/observability-minimal-cloud.md` | modified — approval, credential intake and live Apply evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None for Grafana | Metrics and Logs writes are live. |
| Sentry continuation | Wait for owner to supply Sentry values; do not change Sentry/FE yet. |

### WARNINGS

| Warning | Impact |
|---|---|
| Current Grafana token appeared in chat before encryption. | Rotate before production; updating the one ciphertext file updates both Prometheus and Winston after sync/restart. |
| Apply changes are path-filtered in a dirty backend worktree and remain uncommitted. | Unrelated changes were preserved and not staged. |
| A write-only token cannot query Loki back through the HTTP API. | HTTP 204 proves ingest acceptance; inspect the named Winston canary through the stack's preconfigured Loki data source. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Install Alloy or Promtail from Grafana snippets | Existing Prometheus/Winston direct paths | Owner-approved zero-new-instance boundary. |
| Add `logs:read` just for automated read-back | Keep token write-only | Do not widen production credential for one proof; Grafana UI already owns read access. |
| Begin Sentry without credentials | Stop after Grafana proof | Explicit owner instruction and approved provider boundary. |

### OWED

| Owed | Cleared by |
|---|---|
| Rotate exposed Grafana token | Owner creates replacement under the same policy and enters it through hidden `secret:set`; restart Prometheus/app. |
| Sentry web/API activation | Owner supplies two DSNs, org/project slugs and a build-only release/source-map token. |
| Production synthetics/SEO | Owner supplies production origins, deploy provider, Search Console token and GA4 ID. |

## apply r2 — Sentry API intake

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy (owner-declared) |
| Frontend | D:\Repositories\starci-academy |
| Backend | D:\Repositories\starci-academy-backend |
| App | starci-academy / Nest app `core` |
| Repo / branch | Backend `mtp`; Frontend `mtp` |
| Database | none |
| Phase | apply |
| Touching | Approved backend Sentry subset: encrypted app config, instrument/options/spec and workflow; no FE or public debug endpoint |

Received: backend DSN for the new Sentry project. Organization slug and project slug were not contained in the DSN and remain owner-supplied metadata.

### Commands and results

| Proof | Result |
|---|---|
| Existing integration inventory | PASS — `@sentry/nestjs` already installed; early import, root module and decorated catch-all filter already present. Wizard duplication rejected. |
| Encrypted DSN merge | PASS — new backend DSN merged into `app.yaml.enc`; decrypted runtime twin remains gitignored. |
| Sentry options twin | PASS — 1 suite, 4/4 cases covering production 5% tracing and development/test/staging 0%; default PII false everywhere. |
| Focused ESLint | PASS after removing forbidden raw `process.env` release access and fixing array formatting. |
| Typecheck | PASS — zero TypeScript errors. |
| Live SDK canary | PASS — `starci-api-canary-1786795283`; SDK `flush(10000)` returned true. No public debug route was added. |

### OUTPUTS

| Concept | Result |
|---|---|
| Sentry API error owner | New backend DSN is active through the existing early Nest integration with privacy-safe, quota-bounded options. |

### CHANGES

| Tree | Details |
|---|---|
| `.stacks/dev/runtime/files/app.yaml.enc` | modified — SOPS-encrypted backend DSN replacement. |
| `src/modules/integrations/sentry/instrument.ts` | modified — consume pure bounded options. |
| `src/modules/integrations/sentry/sentry.options.ts` | added — production 5% traces, other environments 0%, default PII false. |
| `src/modules/integrations/sentry/sentry.options.spec.ts` | added — four environment/privacy cases. |
| `.workflows/feature/starci-academy/observability-minimal-cloud.md` | modified — backend Sentry intake and live proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Sentry metadata | Owner supplies organization slug and confirms backend project slug. |
| Frontend continuation | Owner creates `starci-web` Next.js project and supplies its DSN. |

### WARNINGS

| Warning | Impact |
|---|---|
| Release tag is not emitted yet. | Canon forbids raw env reads and production deploy owner is still unknown; add release through the real deploy/env contract, not a one-off bypass. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Reinstall SDK/recreate module/filter | Reuse existing complete Nest integration | Avoid duplicate capture and module wiring. |
| Public `/debug-sentry` endpoint | One-shot SDK canary | No production attack/debug surface. |

### OWED

| Owed | Cleared by |
|---|---|
| Confirm event in Sentry Issues | Search canary ID `starci-api-canary-1786795283`. |
| FE Sentry + source maps | Frontend DSN, org/project slugs and hidden build token. |

### Sentry organization received

| Field | Value |
|---|---|
| Organization slug | `starci-lab-company` |
| Display name | `StarCi Lab Company` |
| Organization ID | `4510097305042944` |
| Data storage region | EU |

## apply r3 — Sentry Web intake

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy (owner-declared) |
| Frontend | D:\Repositories\starci-academy |
| Backend | D:\Repositories\starci-academy-backend |
| App | StarCi Academy Next.js frontend |
| Repo / branch | Backend `mtp`; Frontend `mtp` |
| Database | none |
| Phase | apply |
| Touching | Approved frontend Sentry subset and this workflow; no debug route, deployment mutation or unrelated worktree edits |

Received: frontend DSN for the Sentry Next.js project. The Sentry UI currently identifies the project as `javascript-nextjs`; source-map upload remains disabled until the owner confirms/renames the project slug and provides the narrow build token through the deployment secret store.

### Commands and results

| Proof | Result |
|---|---|
| SDK install | PASS — official `@sentry/nextjs` `10.70.0` installed; no runtime service/instance added. |
| Sentry options twin | PASS — 2/2 cases: production traces `0.05`, non-production `0`, missing DSN disables capture, default PII false. |
| Focused ESLint | PASS — exact Sentry/config/error-boundary files with `--max-warnings=0`. |
| Frontend typecheck | Sentry boundary PASS; one pre-existing unrelated error remains at `src/modules/api/graphql/clients/links/options.ts:8` (`DefaultOptions.Input`). |
| Production build | PASS — Next.js 16 webpack compiled, generated 8/8 static pages and finalized all routes. The first default-heap attempt exhausted memory near 3.7 GB; the bounded retry used `NODE_OPTIONS=--max-old-space-size=8192`. |
| Live SDK canary | PASS — `starci-web-canary-1786797405778`, event ID `3430660de4d240e7afe493e508fd8bf1`; `flush(10000)` returned true. |
| Source-map authority | PASS/fail-closed — upload is disabled unless both `SENTRY_AUTH_TOKEN` and `SENTRY_PROJECT` are present. No token was guessed or stored. |
| Secret hygiene | PASS — frontend DSN is environment-driven and absent from tracked frontend source; build token never enters browser config. |

### OUTPUTS

| Concept | Result |
|---|---|
| Sentry Web error owner | Next browser, Node and Edge runtimes initialize from one privacy-safe policy; router transitions, nested server errors and fatal render errors are captured. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy\package.json` + `package-lock.json` | modified — install official Next.js Sentry SDK. |
| `D:\Repositories\starci-academy\next.config.ts` | modified — preserve Next Intl config, wrap with Sentry, source maps fail closed without build authority. |
| `D:\Repositories\starci-academy\src\config\sentry.ts` + `sentry.spec.mjs` | added — shared runtime policy and focused proof. |
| `D:\Repositories\starci-academy\src\instrumentation-client.ts` | added — browser initialization and router transition hook. |
| `D:\Repositories\starci-academy\src\instrumentation.ts` | added — Node/Edge registration and request-error hook. |
| `D:\Repositories\starci-academy\sentry.server.config.ts` + `sentry.edge.config.ts` | added — runtime initialization. |
| `D:\Repositories\starci-academy\src\app\global-error.tsx` | added — capture fatal render errors and retain retry UI without relying on unavailable locale providers. |
| `.workflows/feature/starci-academy/observability-minimal-cloud.md` | modified — append frontend intake and live evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Sentry project identity | Rename `javascript-nextjs` to `starci-web` (recommended), then confirm the resulting project slug. |
| Source maps | Create/provide a build token limited to release/source-map operations and store it as `SENTRY_AUTH_TOKEN` in the actual deploy provider; also set `SENTRY_PROJECT=starci-web`. |
| Production activation | Name the deploy provider and production web origin so `NEXT_PUBLIC_SENTRY_DSN`, environment and release can be set in the real owner. |

### WARNINGS

| Warning | Impact |
|---|---|
| Frontend has substantial unrelated dirty work and artifacts. | Apply remained path-filtered; no unrelated file was staged, reverted or rewritten. |
| `npm install` reports existing dependency audit/peer warnings. | No forced audit fix was run because it would expand the approved boundary. |
| TypeScript validation is disabled inside the existing Next build config. | Separate `tsc --noEmit` proves the Sentry files but still exposes the unrelated GraphQL-client type error above. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Sentry wizard/example page/public debug endpoint | Manual minimal wiring + one-shot SDK canary | Avoid generated sample surface and broad file churn. |
| Hardcoded DSN or build token | Deployment environment contract | Keep runtime portable and build authority server-only. |
| Replay, profiling or 100% traces | Errors + 5% production traces | Approved Minimal privacy/quota boundary. |

### OWED

| Owed | Cleared by |
|---|---|
| Confirm canary in Sentry Issues | Search `starci-web-canary-1786797405778`. |
| Symbolicated production stack traces | Project slug + build-only token + real deployment owner. |
| Production synthetics/SEO | Production origins, deploy provider, Search Console token and GA4 ID. |

### Sentry project confirmation

| Field | Confirmed value |
|---|---|
| Organization slug | `starci-lab-company` |
| Backend project slug | `starci-backend` |
| Frontend project slug | `starci-web` |
| Backend canary | Visible in project overview as 1 error. |
| Frontend canary | Visible in project overview as 1 error. |
| Legacy project | `node-nestjs`; retained untouched during Minimal. |

Owner screenshot confirms both new projects received their controlled canary events. Runtime ingest is therefore live for both API and Web; source-map/release activation remains the only Sentry build-time item owed.

### Production deploy owner confirmation

| Field | Confirmed value |
|---|---|
| Frontend deploy provider | Vercel |
| Local Vercel project link | Not present (`.vercel/project.json` absent). |
| Required project-level variables | `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_ENVIRONMENT`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`. |
| Environment boundary | Production only for Minimal; token marked Sensitive. |
| Still required | Vercel project identity, production origin and owner-side build-token entry. |

The repository cannot safely infer or mutate the intended Vercel project until it is linked or named. Environment variables must be entered at the selected Vercel project's Settings boundary and take effect on a new deployment.

### Vercel API activation evidence

| Field | Result |
|---|---|
| Vercel project | `starci-academy` (`prj_i8amXK2Icc58MLNODZHte3jHIhSM`) under the owner team. |
| Git owner/repository | `starci-lab/starci-academy`; production branch `main`. |
| Canonical production origin | `https://academy.starci.org`, confirmed from the current READY production target aliases. |
| Production runtime variables | Created: `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_ENVIRONMENT`, `SENTRY_ORG`, `SENTRY_PROJECT`. |
| Production SEO origin | Created: `NEXT_PUBLIC_SITE_URL=https://academy.starci.org`. |
| Source-map authority | Still absent: `SENTRY_AUTH_TOKEN`. |
| Deployment action | Not triggered: Sentry source is on the dirty `mtp` worktree while Vercel deploys `main`; rebuilding the current production revision would not activate the new wiring. |

The owner supplied a Vercel personal access token in chat and explicitly authorized its use for this configuration. It was used in process memory only and was not written to either repository or runtime files. Because it appeared in chat, it must be revoked from Vercel Account Settings -> Tokens after this configuration session.

### Sentry build-token proof

| Field | Result |
|---|---|
| Token validity | PASS — Sentry API authenticated and returned `node-nestjs`, `starci-backend`, and `starci-web`. |
| Actual scopes | `org:read`, `project:read`, `project:write`; source-map capable but broader than the approved `project:releases` preference. |
| Vercel storage | `SENTRY_AUTH_TOKEN` created as Sensitive, Production-only on `starci-academy`. |
| Source-map build | PASS — Next.js production build completed with the Sentry build plugin and dedicated release `starci-web-proof-1786801913`. |
| Release API | PASS — Sentry confirms release creation at `2026-08-15T13:53:59.877633Z`. Modern artifact bundles are not exposed as legacy release files; legacy file count is zero. |
| Production deployment | BLOCKED — Vercel deploys `main`; observability source is on `mtp`, which is 319 commits ahead of `main`. Changing the production branch or merging that history is outside the approved observability boundary. |

The Sentry token was pasted into chat and is therefore temporary proof authority only. Replace it directly in the Vercel Sensitive field with a fresh least-privilege token, then revoke the exposed token before production deployment.

## plan r2 — greenfield frontend source correction

### CONTEXT

| Field | Value |
|---|---|
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy (owner-declared) |
| Frontend | D:\Repositories\starci-academy-fe (owner-corrected new source) |
| Backend | D:\Repositories\starci-academy-backend |
| Frontend repo / branch | `starci-lab/starci-academy-fe`; `main` |
| Purpose | Put Minimal Sentry and SEO code in the greenfield frontend now; defer all cloud/GA activation values. |
| Database | none |
| Phase | plan/review correction |
| Touching | Workflow only until the corrected exact revision is approved. |

Owner correction: `starci-academy-fe` is the new frontend source. Historical Apply evidence against `D:\Repositories\starci-academy` remains evidence only and is not production authority.

### Corrected source evidence

| Surface | Evidence | Revision |
|---|---|---|
| Runtime | Next `16.1.6`, React `19.2.3`, Next Intl `4.13.5`; strict build keeps TypeScript validation enabled. | Use the same official Next Sentry manual wiring, adapted to greenfield tests/lint. |
| Tests | Vitest discovers sibling `src/**/*.test.{ts,tsx}`. | Use Vitest twins, not the old repo's Node test shim. |
| Package authority | `package-lock.json` was updated on 2026-08-15; `pnpm-lock.yaml` last changed on 2026-08-12. | Treat npm/package-lock as active; do not rewrite/remove the unrelated older pnpm lock. |
| Metadata | `[lang]/layout.tsx` only emits translated title/description; no metadata base, verification, OG defaults, robots or sitemap exists. | Add exact SEO primitives and public-course canonical metadata. |
| Public routes | Locale root redirects to dashboard; `/[lang]/courses` and `/[lang]/courses/[displayId]` are the current public indexable family. | Sitemap only routes that exist; do not copy obsolete blog/contact/legal routes from the old app. |
| Analytics consent | No consent owner/banner/store exists in the greenfield source. | Prepare optional GA ID in config/env only; do not load GA before an approved consent surface exists. |
| Dirty worktree | Existing search/ShellNav/ModalShell/message changes do not overlap the candidate files. | Preserve them exactly; path-filter every proof and change. |

### Candidate `observability-minimal-source-r2`

| Area | Exact files / action |
|---|---|
| Sentry package/build | Modify `package.json`, `package-lock.json`, `next.config.ts`; add `sentry.server.config.ts`, `sentry.edge.config.ts`. |
| Sentry runtime | Add `src/instrumentation-client.ts`, `src/instrumentation.ts`, `src/config/sentry.ts`, `src/config/sentry.test.ts`, `src/app/global-error.tsx`, `src/app/global-error.test.tsx`. |
| SEO config | Add `src/config/seo.ts`, `src/config/seo.test.ts`; modify `.env.example` with optional site origin, Search Console token and GA4 ID contracts. |
| Crawl ownership | Add `src/app/robots.ts`, `src/app/robots.test.ts`, `src/app/sitemap.ts`, `src/app/sitemap.test.ts`; sitemap degrades to the localized course catalog when public GraphQL discovery fails. |
| Metadata | Modify `src/app/[lang]/layout.tsx`, `src/app/[lang]/courses/page.tsx`, `src/app/[lang]/courses/[displayId]/page.tsx` for metadata base, verification, OG defaults, exact canonicals and `en`/`vi` alternates. |
| Analytics | No loader yet. `NEXT_PUBLIC_GA_ID` stays optional/unused until a consent owner is separately designed and approved; no request occurs before consent. |
| Cloud | Debt only: no Vercel project creation/repoint, env write, deploy, synthetic or Search Console mutation in r2. |

### Proof matrix

| Gate | Required evidence |
|---|---|
| Focused twins | Sentry policy/global error, SEO config, robots and sitemap cases pass under Vitest. |
| Focused lint | Exact candidate files pass canonical ESLint with zero warnings. |
| Full source gates | `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:rules`, `npm run build`. |
| Privacy | Default PII false; production traces 5%, other environments 0%; no Replay/profiling/GA request. |
| Crawl | robots points at sitemap and blocks private/auth/learn clusters; sitemap exposes only localized catalog/course URLs and survives API failure. |
| Hygiene | No DSN/token/GA ID hardcoded; unrelated dirty files unchanged. |

### Cloud rollback and debt

| Item | Result / debt |
|---|---|
| Old Vercel project writes | Rolled back all six variables created during the mistaken old-source activation: Sentry DSN/environment/org/project/auth token and site URL; verified zero matching keys remain. |
| Vercel source | A new project linked to `starci-lab/starci-academy-fe` is owed after code readiness; do not repoint the old project implicitly. |
| Public values owed | Canonical production origin, public GraphQL URL, Search Console HTML token and GA4 Measurement ID. |
| Secrets owed | Fresh narrow Sentry build token entered directly into the new deploy provider; both chat-exposed Vercel/Sentry tokens must be revoked. |
| Managed checks | Grafana synthetics/dashboard/alerts and Search Console submission remain cloud debt. |

## review revision-3

Candidate revision: `observability-minimal-source-r2`

Review status: awaiting explicit approval of the corrected frontend repository and exact files above.

### Review verdict

| Finding | Verdict |
|---|---|
| Old frontend path is no longer production source. | Reject further product edits/deploys there; port only the approved capability into the owner-corrected greenfield repo. |
| Copying the old sitemap would publish nonexistent routes. | Rebuild from live greenfield routes and existing Courses query evidence. |
| Loading GA when an ID arrives would bypass consent. | Code the configuration contract now, keep loader disabled until consent UX has its own approved boundary. |
| Cloud values were written to the old Vercel project. | Exact rollback completed before review; activation is debt, as owner requested. |
| New source has unrelated active work. | Exact path boundary above avoids every currently dirty path. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve corrected source revision? | Approve `observability-minimal-source-r2` to implement Sentry + SEO code only in `D:\Repositories\starci-academy-fe`; cloud/GA activation remains debt. |

### Approval evidence

Approved revision: `observability-minimal-source-r2`

Owner replied exactly `approve observability-minimal-source-r2`. Apply is authorized only for the corrected greenfield frontend file boundary; cloud activation, deployment and analytics consent remain debt.

## apply r4 — greenfield Sentry + SEO code

### CONTEXT

| Field | Value |
|---|---|
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy (owner-declared) |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Frontend repo / branch | `starci-lab/starci-academy-fe`; `main` |
| Applied revision | `observability-minimal-source-r2` |
| Purpose | Complete Sentry and SEO source readiness without cloud or GA activation. |
| Database | none |
| Phase | apply |
| Touching | Exact approved greenfield Sentry/SEO paths plus this workflow; existing search/navigation/modal/message work preserved. |

### Commands and results

| Proof | Result |
|---|---|
| SDK install | PASS — `@sentry/nextjs@10.70.0`; active npm/package-lock updated, older pnpm lock untouched. |
| Focused twins | PASS — 5 files, 10/10 cases for Sentry policy/global error and SEO config/robots/sitemap. |
| Focused ESLint | PASS — exact candidate files with `--max-warnings=0`. |
| Strict typecheck | PASS — `npm run typecheck`, zero errors. |
| Full lint | PASS — trust-tree mirror verified and ESLint completed with zero findings. |
| Production build | PASS — Next 16.1.6 Turbopack compiled, strict TypeScript passed, 4/4 static routes generated; `/robots.txt` and `/sitemap.xml` registered. |
| Runtime robots | PASS — HTTP 200; allows public root, blocks API, localized auth/dashboard/cart/notifications and every localized course learn cluster. |
| Runtime sitemap | PASS — HTTP 200; catalog plus 5 live course identities discovered from current GraphQL, with `en`/`vi` alternates. |
| Runtime metadata | PASS — catalog HTTP 200 with exact canonical plus `en`, `vi`, and `x-default` alternate links. Search Console meta omitted while token is empty. |
| Secret hygiene | PASS — tracked source contains no pasted Vercel token, Sentry token or frontend DSN. Missing DSN disables Sentry; missing build token disables source-map upload. |
| Full Vitest | PARTIAL — 680/692 pass; 12 failures are outside the approved boundary and match existing dirty source/test drift: Apollo locale-link chain counts, Courses pricing/value selections, dashboard contract selectors, ResizeObserver setup and Next navigation ESM resolution. |
| Canon rule tests | Existing script debt — `npm run test:rules` points to nonexistent `plugins/eslint/*.test.mjs` and executes 0 tests. Direct `plugins/eslint-canon` run passes 86/87; `icon.test.mjs` expects absent `fe/canon/patterns/icon.md`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Sentry source readiness | Browser, Node and Edge initialization; router/request hooks; provider-independent fatal fallback; PII false; production traces 5%, other environments 0%. |
| SEO source readiness | Deployment-aware metadata base, localized catalog/course canonicals, hreflang, OpenGraph defaults, Search Console hook, resilient robots and dynamic course sitemap. |
| Analytics safety | GA4 ID contract documented but no loader exists; zero analytics request can occur before a separate consent owner is approved. |

### CHANGES

| Tree | Details |
|---|---|
| `package.json`, `package-lock.json` | official Sentry Next SDK. |
| `next.config.ts` | Sentry build wrapper; source maps fail closed without project + build token. |
| `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation-client.ts`, `src/instrumentation.ts` | manual current Next runtime integration. |
| `src/config/sentry.ts`, `src/config/sentry.test.ts` | shared privacy/sampling policy and twin. |
| `src/app/global-error.tsx`, `src/app/global-error.test.tsx` | fatal error capture and retry fallback. |
| `src/config/seo.ts`, `src/config/seo.test.ts` | normalized provider-independent SEO config and localized URL helpers. |
| `src/app/robots.ts`, `src/app/robots.test.ts` | crawl policy. |
| `src/app/sitemap.ts`, `src/app/sitemap.test.ts` | resilient live-course discovery and localized sitemap. |
| `src/app/[lang]/layout.tsx` | metadata base, title template, verification and OpenGraph defaults. |
| `src/app/[lang]/courses/page.tsx`, `src/app/[lang]/courses/[displayId]/page.tsx` | exact localized canonical/social metadata. |
| `.env.example` | public SEO/Sentry/GA contracts and build-only Sentry names; no values. |

### CLOUD DEBT

| Debt | Required later |
|---|---|
| Deploy owner | Create/link the real Vercel project to `starci-lab/starci-academy-fe`; do not reuse the old source implicitly. |
| Runtime config | Production site origin, public GraphQL URL and frontend Sentry DSN/environment/release. |
| Build authority | Fresh Sentry token limited to release/source-map work, entered directly as a Sensitive deploy variable; never paste in chat. |
| Search ownership | Google Search Console HTML token, property verification and sitemap submission. |
| Analytics | GA4 Measurement ID plus a separately designed/approved consent owner before mounting any loader. |
| Availability | Grafana managed synthetics/dashboard/alerts against the new production origin and public GraphQL endpoint. |
| Credential cleanup | Revoke both Vercel and Sentry tokens previously exposed in chat. |

### WARNINGS

| Warning | Impact |
|---|---|
| Existing unrelated dirty greenfield work remains. | No unrelated file was reverted, staged or rewritten; full tests cannot be reported all-green until its owners reconcile the named 12 failures. |
| `npm install` reports 3 high audit findings and a jsdom Node-engine warning. | No forced audit fix or dependency expansion was performed outside the approved boundary. |
| Next reports the existing middleware convention as deprecated. | Proxy migration is unrelated debt; build remains green. |
| Runtime ShellNav emitted an existing `ENVIRONMENT_FALLBACK` warning during local smoke. | Robots, sitemap and catalog still returned 200; localization runtime owner should reconcile separately. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Copy obsolete old-app sitemap routes | Current catalog + course detail routes only | Do not advertise nonexistent URLs. |
| Mount GA merely because an ID will exist | Config contract + consent debt | Preserve no-request-before-consent boundary. |
| Configure/deploy the old Vercel project | Exact rollback + cloud debt | Owner identified a different source repository. |
| Repair unrelated failing tests inside observability Apply | Record exact failures | Preserve approved files and current owners' active work. |

### OWED

| Owed | Cleared by |
|---|---|
| Full Vitest green | Owners of the existing dirty query/dashboard/test-runtime changes update their twins/setup. |
| Canon rule runner green | Fix script path and restore/reroute `icon.md` trust resource through the lint-sync lifecycle. |
| Production activation | New Vercel project identity + safe fresh credentials/public values. |
| GA activation | Approved consent UX/owner and GA4 ID. |
