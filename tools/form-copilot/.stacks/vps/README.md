# Form Copilot — direct VPS deployment

This is a direct-local deployment record, not a validated StarCi workspace route or formal operator PASS.

- Current target: `root@103.173.229.250:22`, explicitly replacing the earlier Tino target. Host identity was verified; credentials remain outside the repository.
- Frontend: https://form.doanhnghieptayson.vn
- API health: https://api.form.doanhnghieptayson.vn/api/health
- Standalone Docker Compose, not Swarm. Existing shared Traefik is retained; app loopback binding is `127.0.0.1:14317`, PostgreSQL has no published port.
- Runtime: `/opt/form-copilot/shared/production.env`; required overlays: `/opt/form-copilot/shared/compose.capacity.yaml` and `/opt/form-copilot/shared/compose.https.yaml`. Preserve all three. Never print their secrets or regenerate the database password.
- Containers: `form-copilot-app-1`, `form-copilot-postgres-1`; persistent volume: `form-copilot_form_copilot_pg`. Do not use `down -v`.
- Source archives/releases: `/opt/form-copilot/archives` and `/opt/form-copilot/releases`; deployment receipts pin the exact image and source hashes. `artifacts/vps/package-manifest.json` describes the latest local package, not proof that it is running.
- TLS covers both domains; renewal uses `form-copilot-renew.timer` and the dedicated `form-copilot-ingress-challenge-1` responder. Shared proxy was not restarted.

## Live execution evidence — 2026-09-04

One real immediate UI request for synthetic row `SYN-V001` created batch `67e5a22d-88d0-4143-8005-03fe7559fd84`. The worker began about 0.7 seconds after creation, traversed 52 answers and attempted final submission. The owner manually confirmed that the response appeared in Google.

The historical job remains `uncertain`: the old detector timed out because this form uses a custom completion message. Owner confirmation is separate evidence, not a rewritten automatic success. The acknowledgment fix recognizes the exact public form message, retains exact URL/empty-field/durable-submit checks, and must not resubmit that row. Previous failed attempts remain in history.

All data is synthetic rehearsal data and must remain separate from genuine research responses. No AI token is needed for this fixed-dataset workflow.

## Limits and recovery

- Do not retry uncertain jobs automatically. They remain reserved to prevent duplicate responses.
- Before restarting or replacing the app, inspect active jobs. Use the exact approved image with `--no-build --no-deps app` and every overlay; preserve PostgreSQL and unrelated services.
- Read-only source/browser/fixture tests are distinct from real Google delivery. Full formal visual/UAT closure and macOS service execution are not claimed.
- Detailed current handoff/evidence: host repository `.worktrees/sessions/20260904-133813-form-copilot-workspace.bind/local-delivery/`.
