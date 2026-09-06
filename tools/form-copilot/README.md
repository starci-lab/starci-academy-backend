# Form Copilot — fixed-form rehearsal

A private Vite + NestJS dashboard for one owner-authorized Google Form. Answers come from the supplied, explicitly synthetic MGT400 workbook. No AI service or API token participates in this flow.

## What it does

- One fixed form and all 637 synthetic source rows; 95 follow its declared early-close path and no destination URL is editable.
- Pick an exact row count, a time window and an IANA timezone, then run now or distribute execution times within the window.
- Answers are never randomized. Only execution times are randomized and persisted once.
- PostgreSQL stores batches, row reservations, progress and outcomes across restarts.
- Pause/resume/cancel pending work. Uncertain submission outcomes require manual verification and are never automatically resent.
- Browser traversal covers applicable sections; success requires the confirmation page, not merely clicking Submit.
- Login, CAPTCHA or schema changes stop execution; platform controls are not bypassed.

These are synthetic rehearsal responses, not real respondents or research findings. Keep them separate from live survey data and operate only against the authorized test form. Development and UAT do not submit to Google.

## Run locally

Requirements: Node.js 22+, PostgreSQL (or Docker), and compatible Chromium.

```bash
npm ci
npm run db:up
npm run check
```

Configure `.env.local` (never ship this file):

```dotenv
DATABASE_URL=postgresql://form_copilot:form_copilot@127.0.0.1:54329/form_copilot
FORM_COPILOT_HOST=127.0.0.1
FORM_COPILOT_PORT=4317
FORM_COPILOT_ENABLE_SUBMISSIONS=false
```

Install the locked browser, or set FORM_COPILOT_BROWSER_EXECUTABLE_PATH to compatible Chrome:

```sh
node node_modules/playwright-core/cli.js install chromium
npm start
```

Open `http://127.0.0.1:4317`. Submissions default to disabled. Schedules can still be saved while disabled but cannot execute; inspect pending plans before enabling execution. Never mix rehearsal responses into real results.

For development, `npm run dev` serves Vite at 5173 and the API at 4317. Old AI source remains for reference but its routes are not mounted by the current module.

## Quality gates

```bash
npm run typecheck
npm test
npm run build
```

PostgreSQL integration tests require an explicitly configured isolated test database. A skipped test is not a database PASS; local fixture confirmation is not proof of a live Google submission.

## Direct VPS deployment

No GitHub repository is required. `npm run package:vps` creates an allowlisted source archive and SHA-256 manifest in `artifacts/vps`. Follow [the VPS runbook](infra/vps/DEPLOY.md) for HTTPS, authentication, private PostgreSQL and rollback. Verify SSH host identity first. Packaging or a local build is not deployment evidence.

## macOS LaunchAgent service

On the target Mac, install Node 22+, PostgreSQL and compatible Chromium, copy the project, then create `.env.local` with a strong FORM_COPILOT_AUTH_PASSWORD (at least 20 characters), DATABASE_URL and FORM_COPILOT_PUBLIC_ORIGINS=http://127.0.0.1:4317,http://localhost:4317 before installing this production-mode service:

```bash
npm ci
npm run build
npm run service:mac:install
```

The installer writes `~/Library/LaunchAgents/com.formcopilot.api.plist` using the exact Node binary that ran it. It does not copy credentials into the plist. Logs go to `~/Library/Logs/FormCopilot/`.

```bash
npm run service:mac:print      # inspect the generated plist
npm run service:mac:uninstall  # stop and remove only the LaunchAgent
```

PostgreSQL must already be running on the Mac. The NestJS production process serves the built Vite app and API together at `http://127.0.0.1:4317`, so the LaunchAgent is the complete local service.

The installer must be verified on a Mac. A Windows build does not prove macOS installation.
