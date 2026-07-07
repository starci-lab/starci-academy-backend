---
name: starci-debug-vps
description: >
  Debug / inspect the StarCi Academy PRODUCTION VPS (103.173.229.250) WITHOUT SSH
  or password — by dispatching the `VPS Ops` GitHub Actions workflow onto the
  self-hosted runner that already lives on the VPS, then reading its log. Use
  whenever the task touches prod: read container/core logs, check why prod
  crashed / crash-loops, read a file on the VPS, run a docker/psql/curl command on
  the server, restart a service, verify a deploy, check tokens, run a full-seed,
  or "đọc file trên vps". Trigger on: "debug vps", "debug prod", "đọc log prod",
  "check prod / production", "prod crash / down / crash-loop", "đọc file trên
  vps", "restart core", "chạy lệnh trên vps", "verify deploy", "seed prod". HARD
  RULE this skill enforces: Claude NEVER authenticates to the VPS with a password
  (plink/ssh -pw is forbidden, even if the user sets it up) — everything goes
  through `gh` + the runner workflow instead.
---

# starci-debug-vps — debug prod VPS via the runner workflow (no SSH / no password)

**Why this exists.** Claude cannot enter a password to authenticate to a server
(hard system rule, holds even with the teacher's permission). But the prod VPS
already runs a **self-hosted GitHub Actions runner**, which is authenticated. So
Claude debugs prod by **dispatching a workflow** (`gh`, OAuth token — not a
password) that runs commands **on the VPS in place**, and reads the result from
the Actions log. Demonstrated live 2026-06-23 (caught + fixed a boot-crash DI bug
on prod, zero password).

## HARD RULES
- **NEVER run `plink -pw …` / `ssh …` with a password to the VPS.** Forbidden even
  if the user installed PuTTY + set `VPS_PASS`. If asked, state the rule and use
  the workflow path below instead.
- Only **read-only** commands by default. **Prod-altering** commands (restart,
  seed, DB writes) are fine ONLY when the user explicitly asked for that change —
  show the command first, then run it, then verify.
- The cmd runs on the **VPS host** as the runner user (root for `/root/academy`).
  Container paths are inside the container; host mount root is `/root/academy/.mount`.

## Mechanism — the only path
The repo ships `.github/workflows/ops.yml` (**"VPS Ops"**): a `workflow_dispatch`
that takes a `cmd` input, runs `bash -lc "$CMD"` on the self-hosted runner, prints
output + `exit_code`. (Sibling: `.github/workflows/check-tokens.yml` = **"Check
Tokens"**, verifies the 3 GitHub token files on the VPS.)

**Both workflows must exist on the DEFAULT branch (`main`)** to be dispatchable.

### Run a command on the VPS (copy this loop)
```bash
# 1) dispatch
gh workflow run "VPS Ops" --ref main -f cmd='docker ps --format "{{.Names}}: {{.Status}}"'

# 2) get the run id (newest VPS Ops run) + poll until completed
sleep 6
RID=$(gh run list --workflow="VPS Ops" --limit 1 --json databaseId -q '.[0].databaseId')
for i in $(seq 1 18); do s=$(gh run view $RID --json status -q .status); [ "$s" = completed ] && break; sleep 8; done

# 3) read output (strip the timestamp prefix + ANSI; grep what you need)
gh run view $RID --log 2>&1 | sed -E 's/^[^Z]*Z //' | grep -iE "<pattern>"
```
Notes:
- The runner is **shared with `Deploy Core VPS`** → a dispatched op may **queue**
  behind an in-flight deploy. Poll patiently.
- Logs carry ANSI color + a `job\tstep\tTIMESTAMP ` prefix → `sed -E 's/^[^Z]*Z //'`
  then `grep` to read cleanly.
- Quote `cmd` carefully. Inside `-f cmd='…'` use double-quotes for docker
  `--format "{{.Names}}"`. The workflow passes the input via env (`$CMD`) so it is
  injection-safe, but YOUR outer shell quoting still matters.

## Recipes
- **Which containers / core status:**
  `docker ps --format "{{.Names}}: {{.Status}}"`
- **Core container name:** `docker ps --format "{{.Names}}" | grep -iE "core|backend" | head -1` (usually `core-core-1`).
- **Core logs (tail):** `C=$(docker ps --format "{{.Names}}" | grep -iE "core|backend" | head -1); docker logs --tail 60 "$C" 2>&1 | tail -60`
- **Is it crash-looping?** `docker inspect -f "{{.RestartCount}} running={{.State.Running}} started={{.State.StartedAt}}" core-core-1` — RestartCount climbing = crash-loop. Look for `Nest application successfully started` to confirm a clean boot.
- **Read a file on the VPS:** `cat /root/academy/.mount/config/seed.yaml` (host) or `docker exec core-core-1 cat /usr/src/app/.mount/...` (in container).
- **Read a key's size (never the value):** `wc -c < /root/academy/.mount/terraform/<x>.key`
- **psql:** `docker exec containers-postgresql-1 psql -U <user> -d starci-academy -c "select …"` (creds via env / mount; do not echo passwords).
- **Restart core (prod-altering — only on request):** `docker restart core-core-1` (or `cd /root/academy && docker compose -f apps/core/vps-compose.yaml up -d`).
- **Full-seed prod:** write `/root/academy/.mount/config/seed.yaml` to the full config (see local `.mount/config/seed.yaml`) then restart core so init re-seeds. Revert `enable`/`seed.enabled` → false after.
- **Token check:** `gh workflow run "Check Tokens" --ref main` → read log (labels: OK / WRONG-TOKEN(401)=sai / NO-SCOPE(403) / NO-ACCESS(404)).

## Debug loop (what we proved works)
1. Reproduce/observe via `VPS Ops` (read logs / inspect state).
2. Diagnose from the log; read the relevant source in the repo.
3. Fix code locally → commit → push `final-mvp` then fast-forward `main`
   (`git push origin final-mvp:main`) → `Deploy Core VPS` rebuilds + restarts.
   (Workflow/doc/scratch-only pushes are `paths-ignore`d → no redeploy.)
4. Re-verify via `VPS Ops` (RestartCount 0 + `successfully started`).

## Map
- VPS: `103.173.229.250`, app root `/root/academy`, mount `/root/academy/.mount` ↔ container `/usr/src/app/.mount`.
- Compose: `apps/core/vps-compose.yaml`. Deploy: `.github/workflows/deploy-core-vps.yml`.
- Secrets map (no values): `.mount/terraform/SECRETS.md`. Token verify: `scratch/check-tokens.ps1`.
- Working rule: secrets via env (user) → script+wiring+local-run via Claude → prod-trigger via workflow. See `.claude/rules/concepts/secrets-env-in-script-out-protocol.md`.
