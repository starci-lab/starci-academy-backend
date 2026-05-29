# Judge0 (self-hosted code-execution sandbox)

This stack runs [Judge0 CE](https://github.com/judge0/judge0) locally so the
coding-practice feature can compile and run untrusted user code in an isolated
sandbox. The NestJS backend talks to it over REST (default
`http://localhost:2358`).

## Host prerequisites

Judge0's `isolate` sandbox requires **cgroup v1** and privileged containers.

- **Linux host:** boot the kernel with cgroup v1 enabled. Add to the kernel
  cmdline (e.g. `/etc/default/grub` → `GRUB_CMDLINE_LINUX`):
  ```
  systemd.unified_cgroup_hierarchy=0 systemd.legacy_systemd_cgroup_controller=yes
  ```
  then `sudo update-grub && sudo reboot`.
- **Windows/macOS (Docker Desktop):** run inside a Linux VM that exposes
  cgroup v1, or run this stack on a Linux server/CI runner. Judge0 does **not**
  run reliably on cgroup v2-only hosts.

See the upstream
[Judge0 deployment docs](https://github.com/judge0/judge0/blob/master/CHANGELOG.md)
for version-specific notes.

## Run

```bash
cd docker/judge0
docker compose up -d
# wait ~10s for the server to migrate its DB, then verify:
curl http://localhost:2358/system_info
curl http://localhost:2358/languages   # confirm language ids match the backend map
```

Stop / reset:

```bash
docker compose down            # stop
docker compose down -v         # stop + wipe Judge0's db/redis volumes
```

## Wiring to the backend

The backend reads these from `envConfig().judge0` (see
`src/modules/env/config.ts`):

| Setting | Env var | Default |
| --- | --- | --- |
| Base URL | `JUDGE0_BASE_URL` | `http://localhost:2358` |
| Poll interval | `JUDGE0_POLL_INTERVAL_MS` | `600ms` |
| Max poll attempts | `JUDGE0_MAX_POLL_ATTEMPTS` | `100` |
| Request timeout | `JUDGE0_REQUEST_TIMEOUT_MS` | `15s` |
| Language id map | `JUDGE0_LANGUAGE_IDS` | `{python:71, javascript:63, typescript:74, java:62, cpp:54}` |

The `language_id` map defaults match **Judge0 CE 1.13.1**. If you pin a
different Judge0 version, run `curl http://localhost:2358/languages` and update
`JUDGE0_LANGUAGE_IDS` accordingly.

## Authentication (optional)

For local dev the API is open. To require auth:

1. Set `AUTHN_TOKEN=<secret>` in `judge0.conf` and restart the stack.
2. Put the same value in `.mount/terraform/judge0-auth-token.key` — the backend
   reads it via `getJudge0AuthToken()` and sends it as the `X-Auth-Token`
   header. A missing file means "no token" (header omitted).
