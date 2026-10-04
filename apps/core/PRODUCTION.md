# Academy production on the shared VPS

The authorized destination is `103.142.27.9`, SSH user `nivo`, port `22`.
The deployment root is `/home/nivo/academy`. This migration preserves Docker
Compose on the existing AlmaLinux host. It does not convert the shared host to
Swarm or change the existing development stack declaration.

## Placement and custody

`production-compose.yaml` owns Core, Keycloak, NATS, Judge0 server/workers,
Kafka and Kafka Connect. The separately restored `compose.storage.json` owns
PostgreSQL 17, Judge0 PostgreSQL 16, Redis, Judge0 Redis, MinIO, Qdrant and
Elasticsearch. All stores have persistent Academy volumes. Neither Compose
file publishes database or application ports. The private storage network is
`academy-storage`, subnet `172.31.10.0/24`; the application network is
`academy-application`, subnet `172.31.11.0/24`.

Frontend stays on Vercel and its `mtp` branch stays unchanged. Form, Form
Copilot and Doanh Nghiep Tay Son are excluded. The AI provider remains the
existing remote `qwen.starci.org` service; it is not provisioned on this VPS.

The existing Nivo Traefik owns ports 80/443. The only shared ingress addition
is its watched `dynamic/academy.yml` plus `dynamic/academy-tls/` certificates.
Academy public containers join the existing `nivo-edge` network. Nivo's
applications, volumes, other routes and watchdog are outside this deployment.
The retained domain names are `api.academy.starci.org`, `keycloak.starci.org`,
`minio.starci.org`, `console.minio.starci.org` and `judge0.academy.starci.org`.

Private host configuration lives in `config/core.env`, `keycloak.env`,
`nats-server.conf` and `judge0.conf`, with a private parent directory. Raw
Compose env files preserve literal password characters. The restored `.mount`
is read-only in Core; `.datasources` remains writable and persistent. Secrets
and backups use age custody to the shared public recipient
`age1myd77xz5lhsluc4ejzztsck32pfq3vfpzrva8cegzydk2guhxqesgm3z4j`.
The master identity stays outside Git and outside the VPS. Only ciphertext
may be versioned or transferred as a recovery bundle; decrypted configuration
must never appear in CI output, rendered Compose output, Git or image layers.

## Deployment and rollback

The GitHub environment `core-vps` contains variables `VPS_HOST`, `VPS_USER`
and `VPS_PORT`, plus secrets `VPS_SSH_KEY` and `VPS_KNOWN_HOSTS`. The SSH key
is dedicated to Academy. Strict host-key checking is mandatory. The previous
self-hosted runner is not used by either deployment or VPS Ops.

`Deploy Core VPS` verifies the exact `main` revision before building
`academy/core:<Git SHA>` on a GitHub-hosted runner. It streams the image over
SSH and transfers the release scripts into `releases/<Git SHA>`. Credentials
are read from protected host configuration, not embedded in the image.

Run a provisioned release manually with:

```bash
bash /home/nivo/academy/releases/<Git SHA>/apps/core/deploy-production.sh academy/core:<Git SHA>
```

The deployment lock serializes releases. A Core readiness timeout restores
the previous Core image without deleting data. Judge0's image is rebuilt only
when its three versioned build inputs change. Never run `down -v`,
`--remove-orphans`, a host-wide Docker prune or a Nivo deployment from here.

Judge0 retains API 1.13.1 and its compiler set. Isolate 2.7 is built from
upstream commit `8f185bb37f3f23e29b33b0c7727c91c13429abe3` as a static binary.
The worker has a private cgroup namespace; controller delegation occurs only
inside that container. Obsolete Isolate CPU-timing flags are removed; cgroup
mode uses aggregate CPU accounting. The restored Judge0 configuration limits
the worker count to two to fit the shared host. Verify real submissions,
including timeout and memory limits, before treating it as ready.

## Standby and DNS cutover

Until final cutover, the destination uses the restored snapshot with schema
auto-sync, seed, synchronizer and RAG indexing disabled. Source writes continue.
Do not claim these two databases are continuously synchronized. Debezium must
use a fresh slot and initial snapshot: logical dumps do not preserve WAL or
replication slots, so old Kafka offsets cannot be replayed against restored PG.
Retain the cold CDC archive for recovery separately.

Validate destination routing without changing DNS:

```bash
curl --resolve api.academy.starci.org:443:103.142.27.9 https://api.academy.starci.org/swagger
curl --resolve keycloak.starci.org:443:103.142.27.9 https://keycloak.starci.org/realms/master/.well-known/openid-configuration
curl --resolve minio.starci.org:443:103.142.27.9 https://minio.starci.org/minio/health/ready
```

Before the owner changes DNS, stop Academy writes at the source, take final
logical dumps and object/file deltas, restore and verify them, rebuild CDC from
the final restored database, then repeat auth/API/object/grading checks. Review
background processing before enabling it. Keep source and encrypted backups
until verification and rollback retention are complete. Renew migrated TLS
certificates after DNS points here; the shared resolver currently uses HTTP-01.
Wildcard workspace ingress needs a separately verified workspace runtime and
DNS-01 renewal setup before moving wildcard records.

## Integration research

Read official documentation on 2026-10-04:

- [GitHub Docker builds](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images): hosted runners build the selected repository revision; this deployment transfers images directly and requires repository/environment access, not a registry token.
- [Traefik file routing](https://doc.traefik.io/traefik/v3.6/reference/routing-configuration/other-providers/file/): the existing watched file provider can add independently named routers, services and certificates.
- [Isolate upstream](https://github.com/ioi/isolate/tree/8f185bb37f3f23e29b33b0c7727c91c13429abe3): cgroup v2 delegation, sandbox privilege and aggregate resource accounting require actual execution tests on the destination.

No OAuth registration or public callback hostname changes are needed for the
retained domains. The owner controls DNS cutover. Existing API-provider
credentials are recovered from encrypted custody and verified separately from
local dependency readiness; a present credential is not proof of provider health.
