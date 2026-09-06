# Direct VPS deployment

Deploy this standalone app from the local source archive; no GitHub repository is needed. The intended VPS is 103.173.229.250 and the names are form.doanhnghieptayson.vn and api.form.doanhnghieptayson.vn.

## Preconditions

- Verify the SSH host fingerprint through the authenticated VPS provider console. Never disable StrictHostKeyChecking or discard a mismatching known_hosts entry just to connect.
- Verify both domain A/AAAA records point to this host. Inventory existing ingress, ports, containers and available space without changing them. Never stop another application's proxy to claim 80/443.
- Pass the local typecheck/tests/build and browser review before packaging. Package only the explicit allowlist through `node scripts/package-vps.mjs`; `.env.local`, node_modules, private keys, API tokens, browser profiles and old artifacts are excluded.

## Install

Upload the archive with a verified SSH identity. Verify its SHA256 on the VPS before extraction into a fresh versioned directory such as `/opt/form-copilot/releases/<source-digest>`. Keep production environment configuration outside release folders, readable only by its operator. Generate unique random hexadecimal values for POSTGRES_PASSWORD and FORM_COPILOT_AUTH_PASSWORD; do not use example/local credentials or the old OpenRouter token. The app has no AI execution path.

Set FORM_COPILOT_AUTH_USER, FORM_COPILOT_AUTH_PASSWORD (at least 20 characters), POSTGRES_PASSWORD, FORM_COPILOT_IMAGE and FORM_COPILOT_ENABLE_SUBMISSIONS=false in that environment file. Passwords must not be passed in a command printed to logs. Use a hex database password so the constructed connection URL remains valid.

From the release directory:

```sh
docker compose --env-file /opt/form-copilot/shared/production.env -f infra/vps/compose.yaml build --pull
docker compose --env-file /opt/form-copilot/shared/production.env -f infra/vps/compose.yaml up -d --wait
```

The app binds only 127.0.0.1:14317 on the host, and PostgreSQL has no published port. The named PostgreSQL volume survives app replacement. Do not use `down -v`. Take a database backup before any future schema-changing upgrade; archive rollback alone cannot undo database changes.

The image installs the Chromium version belonging to the locked Playwright dependency and runs the app as the non-root node user. Compose binds the supplied pinned Moby seccomp profile with only the namespace allowances documented in seccomp-provenance.json. Local Docker's default profile failed sandbox startup; the supplied profile passed a no-network, non-root renderer smoke without SYS_ADMIN or sandbox-disabling flags. Final VPS compatibility is still a separate check. Do not use privileged containers, unconfined seccomp or a no-sandbox fallback.

Before enabling submissions, test the final image on the VPS with no credentials or network:

```sh
docker run --rm --init --network none --security-opt seccomp="$(pwd)/infra/vps/seccomp_profile.json" "$FORM_COPILOT_IMAGE" node scripts/smoke-browser.mjs
```

The command must exit zero with localRendererProof=true. It performs no Google requests. The additional --enable-automation browser flag in this diagnostic enables read-only command-line inspection; it does not disable sandboxing.

Merge the supplied Caddy site blocks only if Caddy is already the verified ingress owner. For nginx/Traefik, add equivalent routes through that existing owner; do not replace its full configuration. The TLS proxy forwards both names to 127.0.0.1:14317. Require HTTPS for credential entry. Verify unauthenticated access gets 401, authenticated UI/API work, and GET /api/health returns minimal readiness.

## Enable and operate

The imported dataset is synthetic rehearsal data, not collected survey responses. Use only authorized test data and keep it separate from real research responses. Scheduling may be planned while submission execution is disabled; inspect pending plans before enabling FORM_COPILOT_ENABLE_SUBMISSIONS=true. Verify the fixed Google Form and its branching/confirmation in a controlled test run first. No development test submits to the live form.

The browser stops at login, CAPTCHA or schema changes; it does not bypass them. The ledger marks ambiguous outcomes uncertain rather than automatically resubmitting them. A confirmed response already sent to Google cannot be cancelled by stopping a job. Cancellation stops only pending work. Local UI closure does not stop a running server worker.

## Current deployment proof

An archive or a successful local build is not deployment. Record the verified SSH host identity, uploaded digest, container/image identity, health checks, HTTPS/auth checks, browser-launch result and the final browser state. If host identity, DNS, ingress or runtime checks are unresolved, report them explicitly; do not report a production PASS.

Browser container guidance: https://playwright.dev/docs/docker
